// One runnable check: boots the app on a temp DB, walks a purchase, logs into admin, edits a product and a payment.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const dir = mkdtempSync(join(tmpdir(), 'manha-'));
process.env.DB_PATH = join(dir, 'test.db');
process.env.ADMIN_PASSWORD = 'testpass123';
const { app } = await import('../src/server.js');

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
  const p = await req('/p/oud-mubakhar-100ml');
  assert.equal(p.status, 200);
  const add = await req('/cart/add', { method: 'POST', body: { id: 1, variant: '100ml', qty: 2 } });
  assert.equal(add.status, 302);
  assert.match((await req('/cart')).text, /৳8,400/);
  const bad = await req('/checkout', { method: 'POST', body: { name: 'A', phone: '123', address: 'x', city: 'Dhaka', payment_method: 'cod' } });
  assert.equal(bad.status, 400);
  const ok = await req('/checkout', { method: 'POST', body: { name: 'Nusrat Jahan', phone: '01711111111', address: 'House 5, Road 2, Banani', city: 'Outside Dhaka', payment_method: 'bkash', trx_id: 'abc123xyz', gift: '1', gift_to: 'Rafi', gift_message: 'Happy birthday' } });
  assert.equal(ok.status, 302);
  const page = await req(ok.headers.get('location'));
  assert.match(page.text, /Thank you, Nusrat/);
  assert.match(page.text, /৳8,550/); // 8400 + 150 outside Dhaka
  assert.match(page.text, /ABC123XYZ/);
  assert.match((await req('/cart')).text, /empty/);
  assert.match((await req('/p/oud-mubakhar-100ml')).text, /Only 10 left|Add to cart/); // stock went 12 → 10
  assert.equal((await req('/order/1/wrongtoken')).status, 404);
});

test('admin: login, dashboard, product CRUD, payment and status', async () => {
  assert.equal((await req('/admin')).status, 302);
  assert.equal((await req('/admin/login', { method: 'POST', body: { email: 'admin@manha.shop', password: 'nope' } })).status, 401);
  assert.equal((await req('/admin/login', { method: 'POST', body: { email: 'admin@manha.shop', password: 'testpass123' } })).status, 302);
  const dash = await req('/admin');
  assert.match(dash.text, /Awaiting payment/);
  assert.match(dash.text, /৳8,550/);
  // product create (multipart, no file)
  const fd = new FormData();
  for (const [k, v] of Object.entries({ name: 'Test Belt', category: 'bags', price: '999', stock: '2', variants: ' S , M ', description: 'd', active: '1' })) fd.append(k, v);
  const created = await fetch(base + '/admin/products', { method: 'POST', body: fd, headers: { cookie: `adm=${jar.adm}` }, redirect: 'manual' });
  assert.equal(created.status, 302);
  const id = created.headers.get('location').split('/').pop();
  assert.match((await req(`/admin/products/${id}`)).text, /value="S,M"/);
  assert.match((await req('/shop/bags')).text, /Test Belt/);
  // payment + status
  await req('/admin/orders/1/payment', { method: 'POST', body: { payment_status: 'paid' } });
  await req('/admin/orders/1/status', { method: 'POST', body: { status: 'shipped' } });
  const o = await req('/admin/orders/1');
  assert.match(o.text, /tag--paid/);
  assert.match(o.text, /tag--shipped/);
  assert.match((await req('/admin/payments?payment_status=paid')).text, /ABC123XYZ/);
  // delete
  await req(`/admin/products/${id}/delete`, { method: 'POST' });
  assert.doesNotMatch((await req('/shop/bags')).text, /Test Belt/);
  // settings
  await req('/admin/settings', { method: 'POST', body: { store_name: 'Manha Test', delivery_dhaka: '90' } });
  assert.match((await req('/')).text, /Manha Test/);
  assert.equal((await req('/admin/logout', { method: 'POST' })).status, 302);
  assert.equal((await req('/admin')).status, 302);
});
