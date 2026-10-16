// One runnable check: boots the app on a temp DB, walks a purchase, logs into admin, edits a product and a payment.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHmac } from 'node:crypto';

const dir = mkdtempSync(join(tmpdir(), 'manha-'));
process.env.DB_PATH = join(dir, 'test.db');
process.env.ADMIN_PASSWORD = 'testpass123';
delete process.env.STRIPE_SECRET_KEY; // no network in tests: orders stay pending, the page offers a payment link
const { app } = await import('../src/server.js');
const { webhookEvent } = await import('../src/stripe.js');

let server, base, jar = {};
const req = async (path, { method = 'GET', body, headers = {} } = {}) => {
  const h = { cookie: Object.entries(jar).map(([k, v]) => `${k}=${v}`).join('; '), ...headers };
  if (body) { h['content-type'] = 'application/x-www-form-urlencoded'; body = new URLSearchParams(body).toString(); }
  const res = await fetch(base + path, { method, body, headers: h, redirect: 'manual' });
  for (const c of res.headers.getSetCookie?.() || []) { const [kv] = c.split(';'); const [k, ...v] = kv.split('='); jar[k] = v.join('='); if (/Max-Age=0/.test(c)) delete jar[k]; }
  return Object.assign(res, { text: await res.text() });
};

before(() => new Promise((r) => { server = app.listen(0, () => { base = `http://localhost:${server.address().port}`; r(); }); }));
after(() => { server.close(); rmSync(dir, { recursive: true, force: true }); });

test('storefront renders and a purchase goes through', async () => {
  assert.match((await req('/')).text, /Scent, step,/);
  assert.match((await req('/shop/perfume')).text, /Oud Mubakhar/);
  assert.equal((await req('/p/oud-mubakhar-100ml')).status, 200);
  const add = await req('/cart/add', { method: 'POST', body: { id: 1, variant: '100ml', qty: 2 } });
  assert.equal(add.status, 302);
  assert.match((await req('/cart')).text, /£136\.00/);
  assert.match((await req('/cart')).text, /Delivery is free/); // 136 ≥ 75 free-over
  const bad = await req('/checkout', { method: 'POST', body: { name: 'A', email: 'x', phone: '123', address: 'x', city: 'x', postcode: 'x' } });
  assert.equal(bad.status, 400);
  const ok = await req('/checkout', { method: 'POST', body: { name: 'Nusrat Jahan', email: 'Nusrat@Example.com', phone: '07700 900123', address: '5 Market Street', city: 'Manchester', postcode: 'm1 1ae', gift: '1', gift_to: 'Rafi', gift_message: 'Happy birthday' } });
  assert.equal(ok.status, 302);
  const page = await req(ok.headers.get('location'));
  assert.match(page.text, /not paid yet/);
  assert.match(page.text, /£136\.00/);
  assert.match(page.text, /M1 1AE/);
  assert.match((await req('/cart')).text, /empty/);
  assert.match((await req('/p/oud-mubakhar-100ml')).text, /Add to cart/); // stock 12 → 10
  assert.equal((await req('/order/1/wrongtoken')).status, 404);
  // a small order pays delivery
  await req('/cart/add', { method: 'POST', body: { id: 6, variant: '8', qty: 1 } });
  assert.match((await req('/checkout')).text, /£3\.95/);
});

test('stripe webhook signature', () => {
  const secret = 'whsec_test', body = JSON.stringify({ type: 'checkout.session.completed', data: { object: { payment_status: 'paid', metadata: { order_id: '1' } } } });
  const t = Math.floor(Date.now() / 1000);
  const sig = `t=${t},v1=${createHmac('sha256', secret).update(`${t}.${body}`).digest('hex')}`;
  assert.equal(webhookEvent(body, sig, secret).type, 'checkout.session.completed');
  assert.equal(webhookEvent(body, sig.replace(/.$/, '0'), secret), null);
  assert.equal(webhookEvent(body, `t=${t - 1000},v1=x`, secret), null);
});

test('admin: login, dashboard, product CRUD, payment, cancel restores stock', async () => {
  assert.equal((await req('/admin')).status, 302);
  assert.equal((await req('/admin/login', { method: 'POST', body: { email: 'admin@manha.shop', password: 'nope' } })).status, 401);
  assert.equal((await req('/admin/login', { method: 'POST', body: { email: 'admin@manha.shop', password: 'testpass123' } })).status, 302);
  const dash = await req('/admin');
  assert.match(dash.text, /Awaiting payment/);
  assert.match(dash.text, /£136\.00/);
  // product create in pounds, stored in pence
  const fd = new FormData();
  for (const [k, v] of Object.entries({ name: 'Test Belt', category: 'bags', price: '19.99', stock: '2', variants: ' S , M ', description: 'd', active: '1' })) fd.append(k, v);
  const created = await fetch(base + '/admin/products', { method: 'POST', body: fd, headers: { cookie: `adm=${jar.adm}` }, redirect: 'manual' });
  assert.equal(created.status, 302);
  const id = created.headers.get('location').split('/').pop();
  assert.match((await req(`/admin/products/${id}`)).text, /value="S,M"/);
  assert.match((await req('/shop/bags')).text, /£19\.99/);
  // payment + status
  await req('/admin/orders/1/payment', { method: 'POST', body: { payment_status: 'paid', trx_id: 'pi_123' } });
  await req('/admin/orders/1/status', { method: 'POST', body: { status: 'shipped' } });
  const o = await req('/admin/orders/1');
  assert.match(o.text, /tag--paid/);
  assert.match(o.text, /tag--shipped/);
  assert.match((await req('/admin/payments?payment_status=paid')).text, /pi_123/);
  // cancelling gives the two bottles back: 10 → 12
  await req('/admin/orders/1/status', { method: 'POST', body: { status: 'cancelled' } });
  assert.match((await req('/admin/products/1')).text, /name="stock" min="0" required value="12"/);
  // delete + settings
  await req(`/admin/products/${id}/delete`, { method: 'POST' });
  assert.doesNotMatch((await req('/shop/bags')).text, /Test Belt/);
  await req('/admin/settings', { method: 'POST', body: { store_name: 'Manha Test', delivery_fee: '4.50' } });
  assert.match((await req('/')).text, /Manha Test/);
  assert.match((await req('/')).text, /£4\.50/);
  assert.equal((await req('/admin/logout', { method: 'POST' })).status, 302);
  assert.equal((await req('/admin')).status, 302);
});
