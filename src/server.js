import express from 'express';
import multer from 'multer';
import { createHmac, randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import { mkdirSync } from 'node:fs';
import { db, SECRET, settings, setSetting, deliveryFor, products, orders, stats, findAdmin, checkPassword, hashPassword, CATEGORIES, ORDER_STATUSES, PAYMENT_STATUSES } from './db.js';
import * as stripe from './stripe.js';
import { toPence } from './views/shared.js';
import * as store from './views/store.js';
import * as admin from './views/admin.js';

export const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1); // Render and most hosts terminate TLS in front of us
const origin = (req) => process.env.PUBLIC_URL || process.env.RENDER_EXTERNAL_URL || `${req.protocol}://${req.get('host')}`;

// Stripe tells us when a payment completed. Raw body first: the signature covers the exact bytes.
app.post('/stripe/webhook', express.raw({ type: '*/*', limit: '256kb' }), (req, res) => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const event = secret && stripe.webhookEvent(req.body.toString(), req.get('stripe-signature'), secret);
  if (!event) return res.status(400).send('bad signature');
  if (event.type === 'checkout.session.completed' && event.data.object.payment_status === 'paid') {
    const id = Number(event.data.object.metadata?.order_id || event.data.object.client_reference_id);
    if (orders.get(id)) orders.setPayment(id, 'paid', event.data.object.payment_intent || event.data.object.id);
  }
  res.json({ received: true });
});

app.use(express.urlencoded({ extended: false, limit: '64kb' }));
app.use(express.static('public', { maxAge: '1h' }));
const UPLOADS = process.env.UPLOADS_DIR || 'uploads';
mkdirSync(UPLOADS, { recursive: true });
app.use('/uploads', express.static(UPLOADS, { maxAge: '7d' }));

// ---------- cookies (signed with HMAC; stdlib only) ----------
const sign = (v) => createHmac('sha256', SECRET).update(v).digest('base64url');
app.use((req, res, next) => {
  req.cookies = Object.fromEntries((req.headers.cookie || '').split(';').map((c) => c.trim().split('=')).filter((c) => c[0]).map(([k, ...v]) => [k, decodeURIComponent(v.join('='))]));
  res.setCookie = (name, value, opts = '') => res.append('Set-Cookie', `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax${opts}`);
  res.setSigned = (name, obj, opts) => { const v = Buffer.from(JSON.stringify(obj)).toString('base64url'); res.setCookie(name, `${v}.${sign(v)}`, opts); };
  req.getSigned = (name) => { const [v, sig] = (req.cookies[name] || '').split('.'); if (!v || sign(v) !== sig) return null; try { return JSON.parse(Buffer.from(v, 'base64url')); } catch { return null; } };
  req.s = settings();
  next();
});

// ---------- cart (signed cookie: [{id, variant, qty}]) ----------
const cartOf = (req) => (req.getSigned('cart') || []).filter((c) => c && c.id && c.qty > 0);
function cartItems(req) {
  const items = [];
  for (const c of cartOf(req)) {
    const p = products.get(c.id);
    if (!p || !p.active) continue;
    items.push({ key: `${p.id}:${c.variant}`, product_id: p.id, slug: p.slug, name: p.name, image: p.image, variant: c.variant, price: p.price, stock: p.stock, qty: Math.min(c.qty, p.stock) });
  }
  return { items: items.filter((i) => i.qty > 0), subtotal: items.reduce((t, i) => t + i.price * i.qty, 0) };
}
const render = (req, res, title, body, extra = {}) => res.send(store.layout({ title, s: req.s, cartCount: cartOf(req).reduce((t, c) => t + c.qty, 0), body, ...extra }));

// ---------- storefront ----------
app.get('/', (req, res) => {
  const counts = Object.fromEntries(db.prepare('select category, count(*) n from products where active = 1 group by category').all().map((r) => [r.category, r.n]));
  let featured = products.all({ featured: true, limit: 3 });
  if (featured.length < 3) featured = featured.concat(products.all({ limit: 3 }).filter((p) => !featured.some((f) => f.id === p.id))).slice(0, 3);
  render(req, res, '', store.home({ featured, latest: products.all({ limit: 7 }), counts, s: req.s }));
});
app.get('/shop{/:category}', (req, res) => {
  const category = req.params.category;
  if (category && !CATEGORIES[category]) return res.status(404).send(store.layout({ title: 'Not found', s: req.s, body: store.notFound() }));
  const q = (req.query.q || '').toString().slice(0, 60);
  render(req, res, category ? CATEGORIES[category] : 'Shop', store.shop({ list: products.all({ category, q }), category, q, s: req.s }));
});
app.get('/p/:slug', (req, res) => {
  const p = products.bySlug(req.params.slug);
  if (!p) return res.status(404).send(store.layout({ title: 'Not found', s: req.s, body: store.notFound() }));
  const more = products.all({ category: p.category, limit: 5 }).filter((m) => m.id !== p.id).slice(0, 4);
  render(req, res, p.name, store.product({ p, more, added: 'added' in req.query, s: req.s }));
});
app.post('/cart/add', (req, res) => {
  const p = products.get(Number(req.body.id));
  if (!p || !p.active || p.stock < 1) return res.redirect('/shop');
  const variant = (req.body.variant || '').toString().slice(0, 30);
  const qty = Math.max(1, Math.min(Number(req.body.qty) || 1, p.stock));
  const cart = cartOf(req);
  const line = cart.find((c) => c.id === p.id && c.variant === variant);
  if (line) line.qty = Math.min(line.qty + qty, p.stock); else cart.push({ id: p.id, variant, qty });
  res.setSigned('cart', cart, '; Max-Age=2592000');
  res.redirect(`/p/${p.slug}?added`);
});
app.post('/cart/update', (req, res) => {
  const [id, variant = ''] = (req.body.key || '').toString().split(':');
  const qty = Number(req.body.qty) || 0;
  const cart = cartOf(req).map((c) => (c.id === Number(id) && c.variant === variant ? { ...c, qty } : c)).filter((c) => c.qty > 0);
  res.setSigned('cart', cart, '; Max-Age=2592000');
  res.redirect('/cart');
});
app.get('/cart', (req, res) => render(req, res, 'Cart', store.cart({ ...cartItems(req), s: req.s })));
app.get('/checkout', (req, res) => {
  const c = cartItems(req);
  if (!c.items.length) return res.redirect('/cart');
  render(req, res, 'Checkout', store.checkout({ ...c, delivery: deliveryFor(req.s, c.subtotal), s: req.s, cancelled: 'cancelled' in req.query }));
});
// Takes the order, then hands the customer to Stripe's hosted payment page.
async function sendToStripe(req, res, o) {
  const session = await stripe.createCheckout({ order: o, items: orders.items(o.id), origin: origin(req), storeName: req.s.store_name });
  orders.setPayment(o.id, 'pending', session.id);
  res.redirect(303, session.url);
}
app.post('/checkout', async (req, res, next) => {
  const c = cartItems(req);
  if (!c.items.length) return res.redirect('/cart');
  const b = req.body, f = (k, max = 200) => (b[k] || '').toString().trim().slice(0, max);
  const form = { name: f('name', 80), email: f('email', 120).toLowerCase(), phone: f('phone', 20), address: f('address', 300), city: f('city', 60), postcode: f('postcode', 10).toUpperCase(), note: f('note', 300), gift: b.gift === '1', gift_to: f('gift_to', 40), gift_message: f('gift_message', 140) };
  let error = '';
  if (!form.name || !form.address || !form.city) error = 'We need your name and full address.';
  else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) error = 'That email address does not look right; we need it for your receipt.';
  else if (!/^(\+44\s?|0)\d{9,10}$/.test(form.phone.replace(/[\s-]/g, ''))) error = 'That phone number does not look like a UK number.';
  else if (!/^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/.test(form.postcode)) error = 'That postcode does not look right.';
  if (error) return res.status(400).send(store.layout({ title: 'Checkout', s: req.s, cartCount: c.items.length, body: store.checkout({ ...c, delivery: deliveryFor(req.s, c.subtotal), s: req.s, error, form }) }));
  const delivery = deliveryFor(req.s, c.subtotal);
  const { id, token } = orders.create({ ...form, payment_method: 'card', subtotal: c.subtotal, delivery, total: c.subtotal + delivery }, c.items);
  res.setSigned('cart', [], '; Max-Age=0');
  if (!stripe.enabled()) return res.redirect(`/order/${id}/${token}`);
  sendToStripe(req, res, orders.get(id)).catch(next);
});
app.post('/order/:id/:token/pay', (req, res, next) => {
  const o = orders.get(Number(req.params.id));
  if (!o || o.token !== req.params.token || o.payment_status === 'paid' || o.status === 'cancelled' || !stripe.enabled()) return res.redirect(`/order/${req.params.id}/${req.params.token}`);
  sendToStripe(req, res, o).catch(next);
});
app.get('/order/:id/:token', async (req, res) => {
  const o = orders.get(Number(req.params.id));
  if (!o || o.token !== req.params.token) return res.status(404).send(store.layout({ title: 'Not found', s: req.s, body: store.notFound() }));
  // Back from Stripe before the webhook landed? Ask Stripe directly.
  if (o.payment_status === 'pending' && o.trx_id.startsWith('cs_') && stripe.enabled()) {
    try { if (await stripe.isPaid(o.trx_id)) { orders.setPayment(o.id, 'paid'); o.payment_status = 'paid'; } } catch (e) { console.error(e); }
  }
  render(req, res, `Order #${o.id}`, store.order({ o, items: orders.items(o.id), s: req.s, stripeOn: stripe.enabled() }));
});

// ---------- admin ----------
const upload = multer({
  storage: multer.diskStorage({ destination: UPLOADS, filename: (req, file, cb) => cb(null, randomUUID() + extname(file.originalname).toLowerCase()) }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, /^image\/(jpeg|png|webp|gif|svg\+xml)$/.test(file.mimetype)),
});
const SESSION_AGE = 60 * 60 * 24 * 7;
const auth = (req, res, next) => {
  const sess = req.getSigned('adm');
  if (!sess || sess.exp < Date.now() / 1000) return res.redirect('/admin/login');
  req.admin = sess;
  next();
};
const page = (req, res, title, body, flash = '') => res.send(admin.layout({ title, s: req.s, path: req.path, flash, body }));
const flashCookie = (res, msg) => res.setCookie('flash', msg, '; Max-Age=10');

app.get('/admin/login', (req, res) => res.send(admin.login({ s: req.s })));
app.post('/admin/login', (req, res) => {
  const a = findAdmin((req.body.email || '').toString());
  if (!a || !checkPassword((req.body.password || '').toString(), a.pass_hash)) return res.status(401).send(admin.login({ s: req.s, error: 'Wrong email or password.' }));
  // ponytail: stateless signed cookie session; SameSite=Strict is the CSRF guard. Add a token if admins must share a browser with untrusted tabs.
  res.setSigned('adm', { id: a.id, email: a.email, exp: Math.floor(Date.now() / 1000) + SESSION_AGE }, `; Max-Age=${SESSION_AGE}; SameSite=Strict`);
  res.redirect('/admin');
});
app.post('/admin/logout', (req, res) => { res.setCookie('adm', '', '; Max-Age=0'); res.redirect('/admin/login'); });

app.use('/admin', auth, (req, res, next) => { req.flash = req.cookies.flash || ''; if (req.flash) res.setCookie('flash', '', '; Max-Age=0'); next(); });
const r = express.Router();
r.get('/', (req, res) => page(req, res, 'Dashboard', admin.dashboard({ st: stats(), s: req.s }), req.flash));

r.get('/orders', (req, res) => {
  const q = (req.query.q || '').toString().slice(0, 60), status = ORDER_STATUSES.includes(req.query.status) ? req.query.status : '';
  page(req, res, 'Orders', admin.orders({ list: orders.all({ q, status }), q, status, s: req.s }), req.flash);
});
r.get('/orders/:id', (req, res) => {
  const o = orders.get(Number(req.params.id));
  if (!o) return res.status(404).send('Not found');
  page(req, res, `Order #${o.id}`, admin.orderDetail({ o, items: orders.items(o.id), s: req.s }), req.flash);
});
r.post('/orders/:id/status', (req, res) => {
  if (ORDER_STATUSES.includes(req.body.status)) orders.setStatus(Number(req.params.id), req.body.status);
  flashCookie(res, 'Status saved.');
  res.redirect(`/admin/orders/${req.params.id}`);
});
r.post('/orders/:id/payment', (req, res) => {
  if (PAYMENT_STATUSES.includes(req.body.payment_status)) orders.setPayment(Number(req.params.id), req.body.payment_status, req.body.trx_id?.toString().trim().slice(0, 60));
  flashCookie(res, 'Payment saved.');
  res.redirect(req.get('referer')?.includes('/admin/payments') ? '/admin/payments' : `/admin/orders/${req.params.id}`);
});
r.get('/payments', (req, res) => {
  const payment_status = PAYMENT_STATUSES.includes(req.query.payment_status) ? req.query.payment_status : '';
  page(req, res, 'Payments', admin.payments({ list: orders.all({ payment_status }), payment_status, s: req.s }), req.flash);
});

r.get('/products', (req, res) => page(req, res, 'Products', admin.products({ list: products.all({ active: false }), s: req.s }), req.flash));
r.get('/products/new', (req, res) => page(req, res, 'New product', admin.productForm({ s: req.s })));
r.get('/products/:id', (req, res) => {
  const p = products.get(Number(req.params.id));
  if (!p) return res.status(404).send('Not found');
  page(req, res, p.name, admin.productForm({ p, s: req.s }), req.flash);
});
function productFromBody(req, existing = {}) {
  const b = req.body, f = (k, max = 200) => (b[k] || '').toString().trim().slice(0, max);
  const p = {
    name: f('name', 120), category: CATEGORIES[b.category] ? b.category : 'perfume',
    price: toPence(b.price), compare_price: toPence(b.compare_price) || null,
    stock: Math.max(0, Math.round(Number(b.stock) || 0)), description: f('description', 2000),
    variants: f('variants', 200).split(',').map((v) => v.trim()).filter(Boolean).join(','),
    featured: b.featured === '1', active: b.active === '1',
    image: req.file ? `/uploads/${req.file.filename}` : (f('image', 500) || existing.image || ''),
  };
  if (!p.name) throw new Error('A product needs a name.');
  return p;
}
r.post('/products', upload.single('photo'), (req, res) => {
  try { const id = products.create(productFromBody(req)); flashCookie(res, 'Product created.'); res.redirect(`/admin/products/${id}`); }
  catch (e) { res.status(400).send(admin.layout({ title: 'New product', s: req.s, path: req.path, body: admin.productForm({ p: req.body, s: req.s, error: e.message }) })); }
});
r.post('/products/:id', upload.single('photo'), (req, res) => {
  const existing = products.get(Number(req.params.id));
  if (!existing) return res.status(404).send('Not found');
  try { products.update(existing.id, productFromBody(req, existing)); flashCookie(res, 'Saved.'); res.redirect(`/admin/products/${existing.id}`); }
  catch (e) { res.status(400).send(admin.layout({ title: existing.name, s: req.s, path: req.path, body: admin.productForm({ p: { ...existing, ...req.body }, s: req.s, error: e.message }) })); }
});
r.post('/products/:id/delete', (req, res) => { products.remove(Number(req.params.id)); flashCookie(res, 'Product deleted.'); res.redirect('/admin/products'); });

r.get('/settings', (req, res) => page(req, res, 'Settings', admin.settings({ s: req.s, email: req.admin.email }), req.flash));
r.post('/settings', (req, res) => {
  for (const k of ['store_name', 'tagline', 'email', 'phone', 'address', 'city', 'hours', 'facebook', 'instagram'])
    if (k in req.body) setSetting(k, req.body[k].toString().trim().slice(0, 300));
  for (const k of ['delivery_fee', 'free_over']) if (k in req.body) setSetting(k, toPence(req.body[k]));
  flashCookie(res, 'Settings saved.');
  res.redirect('/admin/settings');
});
r.post('/password', (req, res) => {
  const a = findAdmin(req.admin.email);
  if (!a || !checkPassword((req.body.current || '').toString(), a.pass_hash)) return res.status(400).send(admin.layout({ title: 'Settings', s: req.s, path: req.path, body: admin.settings({ s: req.s, email: req.admin.email, error: 'Current password is wrong.' }) }));
  const email = (req.body.email || a.email).toString().trim().toLowerCase(), pw = (req.body.password || '').toString();
  db.prepare('update admins set email = ?, pass_hash = ? where id = ?').run(email, pw.length >= 8 ? hashPassword(pw) : a.pass_hash, a.id);
  res.setSigned('adm', { ...req.admin, email }, `; Max-Age=${SESSION_AGE}; SameSite=Strict`);
  flashCookie(res, 'Login updated.');
  res.redirect('/admin/settings');
});
app.use('/admin', r);

app.use((req, res) => res.status(404).send(store.layout({ title: 'Not found', s: req.s, body: store.notFound() })));
app.use((err, req, res, next) => { console.error(err); res.status(err.status || 500).send(store.layout({ title: 'Error', s: req.s, body: `<section class="wrap order"><h1 class="head">Something broke.</h1><p class="lead">${err.code === 'LIMIT_FILE_SIZE' ? 'That image is over 5MB.' : 'Try again in a moment.'}</p></section>` })); });

if (process.argv[1]?.endsWith('server.js')) {
  const port = Number(process.env.PORT) || 3000;
  app.listen(port, () => console.log(`${settings().store_name} is on http://localhost:${port}  (admin: /admin)`));
}
