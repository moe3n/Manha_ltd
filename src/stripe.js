// Stripe Checkout over the REST API with fetch. No SDK: three calls is all the shop needs.
import { createHmac, timingSafeEqual } from 'node:crypto';

const KEY = process.env.STRIPE_SECRET_KEY || '';
export const enabled = () => Boolean(KEY);

// Stripe takes form-encoded bodies; nested keys become line_items[0][price_data][currency].
function encode(obj, prefix = '', out = new URLSearchParams()) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}[${k}]` : k;
    if (v && typeof v === 'object') encode(v, key, out); else if (v !== undefined) out.append(key, String(v));
  }
  return out;
}
async function call(path, body) {
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { Authorization: `Bearer ${KEY}`, ...(body ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}) },
    body: body ? encode(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || `Stripe ${res.status}`);
  return json;
}

/** Creates a hosted Checkout page for an order. Amounts are in pence. Returns { id, url }. */
export function createCheckout({ order, items, origin, storeName }) {
  const line_items = items.map((it) => ({ quantity: it.qty, price_data: { currency: 'gbp', unit_amount: it.price, product_data: { name: it.variant ? `${it.name} (${it.variant})` : it.name } } }));
  if (order.delivery > 0) line_items.push({ quantity: 1, price_data: { currency: 'gbp', unit_amount: order.delivery, product_data: { name: 'Delivery' } } });
  return call('/checkout/sessions', {
    mode: 'payment',
    line_items,
    client_reference_id: String(order.id),
    customer_email: order.email || undefined,
    metadata: { order_id: order.id, store: storeName },
    success_url: `${origin}/order/${order.id}/${order.token}?paid=1`,
    cancel_url: `${origin}/checkout?cancelled=1`,
  });
}

/** True once Stripe says the session is paid. */
export const isPaid = async (sessionId) => (await call(`/checkout/sessions/${sessionId}`)).payment_status === 'paid';

/** Verifies a Stripe-Signature header against the raw body; returns the event or null. */
export function webhookEvent(rawBody, sigHeader, secret) {
  const parts = Object.fromEntries((sigHeader || '').split(',').map((p) => p.split('=')));
  if (!parts.t || !parts.v1 || Math.abs(Date.now() / 1000 - Number(parts.t)) > 300) return null;
  const expected = createHmac('sha256', secret).update(`${parts.t}.${rawBody}`).digest('hex');
  const a = Buffer.from(expected), b = Buffer.from(parts.v1);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return JSON.parse(rawBody);
}
