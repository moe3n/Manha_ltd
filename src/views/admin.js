import { esc, money, date, img, head } from './shared.js';
import { CATEGORIES, ORDER_STATUSES, PAYMENT_STATUSES, PAYMENT_METHODS } from '../db.js';

const sel = (name, options, cur, labels = {}) => `<select class="field" name="${name}">${options.map((o) => `<option value="${esc(o)}"${o === cur ? ' selected' : ''}>${esc(labels[o] || o)}</option>`).join('')}</select>`;
const tag = (v) => `<span class="tag tag--${esc(v)}">${esc(v)}</span>`;

export function layout({ title, s, path = '', flash = '', body }) {
  const nav = [['/admin', 'Dashboard'], ['/admin/orders', 'Orders'], ['/admin/payments', 'Payments'], ['/admin/products', 'Products'], ['/admin/settings', 'Settings']];
  return `${head(`${title} · Admin`, 'admin')}
<body class="admin">
<aside class="rail">
  <a href="/admin" class="wordmark">${esc(s.store_name)}</a>
  <nav>${nav.map(([h, l]) => `<a href="${h}"${path === h || (h !== '/admin' && path.startsWith(h)) ? ' aria-current="page"' : ''}>${l}</a>`).join('')}</nav>
  <div class="rail__foot"><a href="/" target="_blank" rel="noopener">View store</a><form method="post" action="/admin/logout"><button type="submit">Log out</button></form></div>
</aside>
<main class="panel">
  ${flash ? `<p class="notice" role="status">${esc(flash)}</p>` : ''}
  ${body}
</main>
</body>
</html>`;
}

export const login = ({ s, error = '' }) => `${head('Log in · Admin', 'admin')}
<body class="admin admin--login">
<form method="post" action="/admin/login" class="login">
  <h1 class="head">${esc(s.store_name)} admin</h1>
  ${error ? `<p class="notice notice--bad" role="alert">${esc(error)}</p>` : ''}
  <label>Email <input class="field" type="email" name="email" required autocomplete="username"></label>
  <label>Password <input class="field" type="password" name="password" required autocomplete="current-password"></label>
  <button class="button" type="submit">Log in</button>
</form>
</body></html>`;

// ---------- dashboard ----------
export function dashboard({ st, s }) {
  const days = [...Array(14)].map((_, i) => { const d = new Date(Date.now() - (13 - i) * 864e5).toISOString().slice(0, 10); const r = st.last14.find((x) => x.d === d); return { d, v: r?.v || 0, n: r?.n || 0 }; });
  const max = Math.max(1, ...days.map((x) => x.v));
  return `
<h1 class="head">Today</h1>
<div class="stats">
  <a class="stat" href="/admin/payments?payment_status=paid"><span class="small">Paid revenue</span><span class="stat__v nums">${money(st.revenue)}</span></a>
  <a class="stat" href="/admin/payments?payment_status=pending"><span class="small">Awaiting payment</span><span class="stat__v nums">${money(st.pendingPayments.v)}</span><span class="small nums">${st.pendingPayments.n} orders</span></a>
  <a class="stat" href="/admin/orders?status=new"><span class="small">New orders</span><span class="stat__v nums">${st.ordersByStatus.new || 0}</span><span class="small nums">${st.ordersTotal} in total</span></a>
  <a class="stat" href="/admin/products"><span class="small">Products</span><span class="stat__v nums">${st.productCount}</span><span class="small nums">${st.lowStock.length} low on stock</span></a>
</div>
<section class="block">
  <h2 class="lead">Last 14 days</h2>
  <div class="bars" role="img" aria-label="Order value per day for the last fourteen days">
    ${days.map((x) => `<div class="bar" style="--h:${Math.round((x.v / max) * 100)}%" title="${x.d}: ${money(x.v)}, ${x.n} orders"><span class="sr-only">${x.d} ${money(x.v)}</span></div>`).join('')}
  </div>
  <p class="small muted">Orders placed, excluding cancelled. Oldest on the left.</p>
</section>
<div class="cols">
  <section class="block">
    <h2 class="lead">Recent orders</h2>
    ${ordersTable(st.recent)}
  </section>
  <section class="block">
    <h2 class="lead">Low stock</h2>
    ${st.lowStock.length ? `<table class="table"><tbody>${st.lowStock.map((p) => `<tr><td><a href="/admin/products/${p.id}">${esc(p.name)}</a></td><td class="nums r">${p.stock}</td></tr>`).join('')}</tbody></table>` : '<p class="muted">Everything is in stock.</p>'}
  </section>
</div>`;
}

function ordersTable(list) {
  if (!list.length) return '<p class="muted">No orders yet.</p>';
  return `<table class="table">
  <thead><tr><th>#</th><th>When</th><th>Customer</th><th class="r">Total</th><th>Payment</th><th>Status</th></tr></thead>
  <tbody>${list.map((o) => `<tr>
    <td class="nums"><a href="/admin/orders/${o.id}">${o.id}</a></td>
    <td class="nums">${date(o.created_at)}</td>
    <td>${esc(o.name)}<br><span class="small muted nums">${esc(o.phone)}</span></td>
    <td class="nums r">${money(o.total)}</td>
    <td>${PAYMENT_METHODS[o.payment_method]} ${tag(o.payment_status)}</td>
    <td>${tag(o.status)}</td>
  </tr>`).join('')}</tbody></table>`;
}

// ---------- orders ----------
export const orders = ({ list, q, status, s }) => `
<h1 class="head">Orders <span class="muted nums">${list.length}</span></h1>
<form class="filters" method="get">
  <input class="field" type="search" name="q" value="${esc(q)}" placeholder="Name, phone, transaction ID or #">
  ${sel('status', ['', ...ORDER_STATUSES], status, { '': 'Any status' })}
  <button class="button" type="submit">Filter</button>
</form>
${ordersTable(list)}`;

export function orderDetail({ o, items, s }) {
  return `
<p><a href="/admin/orders">← Orders</a></p>
<h1 class="head">Order <span class="nums">#${o.id}</span> <span class="muted nums">${date(o.created_at)}</span></h1>
<div class="cols">
  <section class="block">
    <h2 class="lead">Items</h2>
    <table class="table"><tbody>${items.map((it) => `<tr><td>${esc(it.name)}${it.variant ? ` <span class="muted">${esc(it.variant)}</span>` : ''}</td><td class="nums r">${it.qty} × ${money(it.price)}</td><td class="nums r">${money(it.qty * it.price)}</td></tr>`).join('')}
    <tr><td>Delivery</td><td></td><td class="nums r">${money(o.delivery)}</td></tr>
    <tr><th>Total</th><td></td><th class="nums r">${money(o.total)}</th></tr></tbody></table>
    <h2 class="lead">Customer</h2>
    <p>${esc(o.name)}<br><a href="tel:${esc(o.phone)}" class="nums">${esc(o.phone)}</a><br>${esc(o.address)}, ${esc(o.city)}</p>
    ${o.note ? `<p><b>Note:</b> ${esc(o.note)}</p>` : ''}
    ${o.gift ? `<p><b>Gift.</b> Wrap it, leave the price off the slip.<br>Card: “To ${esc(o.gift_to)}, ${esc(o.gift_message)}”</p>` : ''}
  </section>
  <section class="block">
    <form method="post" action="/admin/orders/${o.id}/status" class="stack">
      <h2 class="lead">Status ${tag(o.status)}</h2>
      ${sel('status', ORDER_STATUSES, o.status)}
      <button class="button" type="submit">Save status</button>
    </form>
    <form method="post" action="/admin/orders/${o.id}/payment" class="stack">
      <h2 class="lead">Payment ${tag(o.payment_status)}</h2>
      <p>${PAYMENT_METHODS[o.payment_method]} · <span class="nums">${money(o.total)}</span></p>
      ${sel('payment_status', PAYMENT_STATUSES, o.payment_status)}
      <label>Transaction ID <input class="field nums" name="trx_id" value="${esc(o.trx_id)}"></label>
      <button class="button" type="submit">Save payment</button>
    </form>
  </section>
</div>`;
}

// ---------- payments ----------
export const payments = ({ list, payment_status, s }) => `
<h1 class="head">Payments</h1>
<form class="filters" method="get">
  ${sel('payment_status', ['', ...PAYMENT_STATUSES], payment_status, { '': 'Any' })}
  <button class="button" type="submit">Filter</button>
</form>
${list.length ? `<table class="table">
<thead><tr><th>#</th><th>When</th><th>Customer</th><th>Method</th><th>Transaction ID</th><th class="r">Amount</th><th>Status</th><th></th></tr></thead>
<tbody>${list.map((o) => `<tr>
  <td class="nums"><a href="/admin/orders/${o.id}">${o.id}</a></td>
  <td class="nums">${date(o.created_at)}</td>
  <td>${esc(o.name)}<br><span class="small muted nums">${esc(o.phone)}</span></td>
  <td>${PAYMENT_METHODS[o.payment_method]}</td>
  <td class="nums">${esc(o.trx_id) || '<span class="muted">—</span>'}</td>
  <td class="nums r">${money(o.total)}</td>
  <td>${tag(o.payment_status)}</td>
  <td>${o.payment_status !== 'paid' ? `<form method="post" action="/admin/orders/${o.id}/payment"><input type="hidden" name="payment_status" value="paid"><button class="button button--small" type="submit">Mark paid</button></form>` : ''}</td>
</tr>`).join('')}</tbody></table>` : '<p class="muted">No payments to show.</p>'}`;

// ---------- products ----------
export const products = ({ list, s }) => `
<h1 class="head">Products <span class="muted nums">${list.length}</span> <a class="button button--small" href="/admin/products/new">New product</a></h1>
<table class="table">
<thead><tr><th></th><th>Name</th><th>Category</th><th class="r">Price</th><th class="r">Stock</th><th>Shown</th></tr></thead>
<tbody>${list.map((p) => `<tr>
  <td class="thumb">${img(p.image, '', 'width="40" height="50"')}</td>
  <td><a href="/admin/products/${p.id}">${esc(p.name)}</a>${p.featured ? ' <span class="tag tag--paid">featured</span>' : ''}</td>
  <td>${CATEGORIES[p.category]}</td>
  <td class="nums r">${money(p.price)}</td>
  <td class="nums r${p.stock <= 3 ? ' low' : ''}">${p.stock}</td>
  <td>${p.active ? 'Yes' : '<span class="muted">Hidden</span>'}</td>
</tr>`).join('')}</tbody></table>`;

export function productForm({ p = {}, s, error = '' }) {
  const isNew = !p.id;
  const v = (k, d = '') => esc(p[k] ?? d);
  return `
<p><a href="/admin/products">← Products</a></p>
<h1 class="head">${isNew ? 'New product' : esc(p.name)}</h1>
${error ? `<p class="notice notice--bad" role="alert">${esc(error)}</p>` : ''}
<form method="post" action="${isNew ? '/admin/products' : `/admin/products/${p.id}`}" enctype="multipart/form-data" class="cols">
  <div class="stack">
    <label>Name <input class="field" name="name" required value="${v('name')}"></label>
    <label>Category ${sel('category', Object.keys(CATEGORIES), p.category || 'perfume', CATEGORIES)}</label>
    <div class="cols cols--tight">
      <label>Price (৳) <input class="field nums" type="number" name="price" min="0" required value="${v('price')}"></label>
      <label>Was (৳, optional) <input class="field nums" type="number" name="compare_price" min="0" value="${v('compare_price')}"></label>
      <label>Stock <input class="field nums" type="number" name="stock" min="0" required value="${v('stock', 0)}"></label>
    </div>
    <label>Sizes or variants, comma separated <input class="field" name="variants" value="${v('variants')}" placeholder="S, M, L or 50ml, 100ml"></label>
    <label>Description <textarea class="field" name="description" rows="5">${v('description')}</textarea></label>
    <label class="check"><input type="checkbox" name="featured" value="1"${p.featured ? ' checked' : ''}> Feature on the home page (first three shown)</label>
    <label class="check"><input type="checkbox" name="active" value="1"${p.active ?? 1 ? ' checked' : ''}> Shown in the shop</label>
    <button class="button" type="submit">${isNew ? 'Create product' : 'Save changes'}</button>
  </div>
  <div class="stack">
    <div class="preview">${img(p.image, '', 'width="300" height="375"')}</div>
    <label>Upload a photo (JPG, PNG or WebP, up to 5MB) <input class="field" type="file" name="photo" accept="image/*"></label>
    <label>Or an image URL <input class="field" name="image" value="${v('image')}" placeholder="https://…"></label>
    <p class="small muted">Portrait 4:5 photographs look best. Same crop for every product.</p>
  </div>
</form>
${isNew ? '' : `<form method="post" action="/admin/products/${p.id}/delete" onsubmit="return confirm('Delete this product? Past orders keep their record.')"><button class="button button--danger" type="submit">Delete product</button></form>`}`;
}

// ---------- settings ----------
export function settings({ s, email, error = '' }) {
  const f = (k, label, extra = '') => `<label>${label} <input class="field" name="${k}" value="${esc(s[k])}" ${extra}></label>`;
  return `
<h1 class="head">Settings</h1>
${error ? `<p class="notice notice--bad" role="alert">${esc(error)}</p>` : ''}
<div class="cols">
  <form method="post" action="/admin/settings" class="stack">
    <h2 class="lead">Store</h2>
    ${f('store_name', 'Store name')}
    ${f('tagline', 'Tagline')}
    ${f('email', 'Email', 'type="email"')}
    ${f('phone', 'Phone')}
    ${f('address', 'Address')}
    ${f('hours', 'Opening hours')}
    ${f('facebook', 'Facebook URL')}
    ${f('instagram', 'Instagram URL')}
    <h2 class="lead">Payments and delivery</h2>
    ${f('bkash', 'bKash number', 'inputmode="tel"')}
    ${f('nagad', 'Nagad number', 'inputmode="tel"')}
    ${f('delivery_dhaka', 'Delivery fee in Dhaka (৳)', 'type="number" min="0"')}
    ${f('delivery_outside', 'Delivery fee outside Dhaka (৳)', 'type="number" min="0"')}
    <button class="button" type="submit">Save settings</button>
  </form>
  <form method="post" action="/admin/password" class="stack">
    <h2 class="lead">Your login</h2>
    <label>Email <input class="field" type="email" name="email" value="${esc(email)}" required></label>
    <label>Current password <input class="field" type="password" name="current" required autocomplete="current-password"></label>
    <label>New password <input class="field" type="password" name="password" minlength="8" autocomplete="new-password"></label>
    <button class="button" type="submit">Update login</button>
  </form>
</div>`;
}
