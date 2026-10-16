import { DatabaseSync } from 'node:sqlite';
import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto';
import { mkdirSync } from 'node:fs';

mkdirSync('data', { recursive: true });
export const db = new DatabaseSync(process.env.DB_PATH || 'data/manha.db');
db.exec('pragma journal_mode = wal; pragma foreign_keys = on;');

// All money is in pence.
db.exec(`
create table if not exists products (
  id integer primary key,
  name text not null,
  slug text not null unique,
  category text not null check (category in ('perfume','shoes','bags','clothing')),
  price integer not null,
  compare_price integer,
  stock integer not null default 0,
  description text not null default '',
  image text not null default '',
  variants text not null default '',
  featured integer not null default 0,
  active integer not null default 1,
  created_at text not null default (datetime('now'))
);
create table if not exists orders (
  id integer primary key,
  token text not null,
  name text not null,
  email text not null default '',
  phone text not null,
  address text not null,
  city text not null,
  postcode text not null default '',
  note text not null default '',
  gift integer not null default 0,
  gift_to text not null default '',
  gift_message text not null default '',
  subtotal integer not null,
  delivery integer not null,
  total integer not null,
  payment_method text not null,
  payment_status text not null default 'pending',
  trx_id text not null default '',
  status text not null default 'new',
  created_at text not null default (datetime('now'))
);
create table if not exists order_items (
  id integer primary key,
  order_id integer not null references orders(id) on delete cascade,
  product_id integer,
  name text not null,
  variant text not null default '',
  price integer not null,
  qty integer not null
);
create table if not exists admins (
  id integer primary key,
  email text not null unique,
  pass_hash text not null
);
create table if not exists settings (key text primary key, value text not null);
`);

// ---------- settings ----------
export const setting = (k) => db.prepare('select value from settings where key = ?').get(k)?.value;
export const setSetting = (k, v) => db.prepare('insert into settings(key,value) values(?,?) on conflict(key) do update set value=excluded.value').run(k, String(v));
export const settings = () => Object.fromEntries(db.prepare('select key, value from settings').all().map((r) => [r.key, r.value]));

const defaults = {
  store_name: 'Manha',
  tagline: 'Perfume, shoes, bags and clothing.',
  email: 'hello@manha.shop',
  phone: '020 7946 0000',
  address: '12 Brick Lane, London E1 6RF',
  city: 'London',
  hours: 'Monday to Saturday, 10am to 7pm',
  delivery_fee: '395',      // pence, Royal Mail Tracked 48
  free_over: '7500',        // pence; delivery is free at or above this subtotal
  facebook: 'https://facebook.com/',
  instagram: 'https://instagram.com/',
};
for (const [k, v] of Object.entries(defaults)) if (setting(k) === undefined) setSetting(k, v);
if (!setting('secret')) setSetting('secret', randomBytes(32).toString('hex'));
export const SECRET = process.env.SECRET || setting('secret');
export const deliveryFor = (s, subtotal) => (subtotal >= Number(s.free_over) ? 0 : Number(s.delivery_fee) || 0);

// ---------- admins ----------
export function hashPassword(pw) {
  const salt = randomBytes(16).toString('hex');
  return salt + ':' + scryptSync(pw, salt, 64).toString('hex');
}
export function checkPassword(pw, stored) {
  const [salt, hash] = stored.split(':');
  const a = Buffer.from(hash, 'hex');
  const b = scryptSync(pw, salt, 64);
  return a.length === b.length && timingSafeEqual(a, b);
}
export const findAdmin = (email) => db.prepare('select * from admins where email = ?').get(email.trim().toLowerCase());

if (!db.prepare('select count(*) n from admins').get().n) {
  const email = (process.env.ADMIN_EMAIL || 'admin@manha.shop').toLowerCase();
  const pw = process.env.ADMIN_PASSWORD || 'changeme';
  db.prepare('insert into admins(email, pass_hash) values(?,?)').run(email, hashPassword(pw));
  console.log(`Admin created: ${email} / ${pw}  (change it in Admin > Settings)`);
}

// ---------- products ----------
export const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'item';
export const CATEGORIES = { perfume: 'Perfume', shoes: 'Shoes', bags: 'Bags', clothing: 'Clothing' };

export const products = {
  all: (opts = {}) => {
    const where = ['1=1'];
    const args = [];
    if (opts.active !== false) where.push('active = 1');
    if (opts.category) { where.push('category = ?'); args.push(opts.category); }
    if (opts.featured) where.push('featured = 1');
    if (opts.q) { where.push('(name like ? or description like ?)'); args.push(`%${opts.q}%`, `%${opts.q}%`); }
    return db.prepare(`select * from products where ${where.join(' and ')} order by created_at desc, id desc limit ?`).all(...args, opts.limit || 500);
  },
  get: (id) => db.prepare('select * from products where id = ?').get(id),
  bySlug: (slug) => db.prepare('select * from products where slug = ? and active = 1').get(slug),
  create: (p) => db.prepare('insert into products(name,slug,category,price,compare_price,stock,description,image,variants,featured,active) values(?,?,?,?,?,?,?,?,?,?,?)')
    .run(p.name, uniqueSlug(p.name), p.category, p.price, p.compare_price ?? null, p.stock, p.description, p.image, p.variants, p.featured ? 1 : 0, p.active ? 1 : 0).lastInsertRowid,
  update: (id, p) => db.prepare('update products set name=?,category=?,price=?,compare_price=?,stock=?,description=?,image=?,variants=?,featured=?,active=? where id=?')
    .run(p.name, p.category, p.price, p.compare_price ?? null, p.stock, p.description, p.image, p.variants, p.featured ? 1 : 0, p.active ? 1 : 0, id),
  remove: (id) => db.prepare('delete from products where id = ?').run(id),
  adjustStock: (id, delta) => db.prepare('update products set stock = max(stock + ?, 0) where id = ?').run(delta, id),
};
function uniqueSlug(name) {
  const base = slugify(name);
  let slug = base, i = 2;
  while (db.prepare('select 1 from products where slug = ?').get(slug)) slug = `${base}-${i++}`;
  return slug;
}

// ---------- orders ----------
export const orders = {
  create: (o, items) => {
    const token = randomBytes(8).toString('hex');
    const tx = db.prepare('insert into orders(token,name,email,phone,address,city,postcode,note,gift,gift_to,gift_message,subtotal,delivery,total,payment_method) values(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
    const ins = db.prepare('insert into order_items(order_id,product_id,name,variant,price,qty) values(?,?,?,?,?,?)');
    const id = tx.run(token, o.name, o.email, o.phone, o.address, o.city, o.postcode, o.note, o.gift ? 1 : 0, o.gift_to, o.gift_message, o.subtotal, o.delivery, o.total, o.payment_method).lastInsertRowid;
    for (const it of items) { ins.run(id, it.product_id, it.name, it.variant, it.price, it.qty); products.adjustStock(it.product_id, -it.qty); }
    return { id, token };
  },
  get: (id) => db.prepare('select * from orders where id = ?').get(id),
  items: (id) => db.prepare('select * from order_items where order_id = ?').all(id),
  all: (opts = {}) => {
    const where = ['1=1']; const args = [];
    if (opts.status) { where.push('status = ?'); args.push(opts.status); }
    if (opts.payment_status) { where.push('payment_status = ?'); args.push(opts.payment_status); }
    if (opts.q) { where.push('(name like ? or phone like ? or email like ? or postcode like ? or trx_id like ? or cast(id as text) = ?)'); args.push(`%${opts.q}%`, `%${opts.q}%`, `%${opts.q}%`, `%${opts.q}%`, `%${opts.q}%`, opts.q); }
    return db.prepare(`select * from orders where ${where.join(' and ')} order by id desc limit ?`).all(...args, opts.limit || 200);
  },
  // Cancelling puts the stock back; un-cancelling takes it again.
  setStatus: (id, status) => {
    const o = orders.get(id);
    if (!o || o.status === status) return;
    if (status === 'cancelled' || o.status === 'cancelled') for (const it of orders.items(id)) if (it.product_id) products.adjustStock(it.product_id, status === 'cancelled' ? it.qty : -it.qty);
    db.prepare('update orders set status = ? where id = ?').run(status, id);
  },
  setPayment: (id, payment_status, trx_id) => db.prepare('update orders set payment_status = ?, trx_id = coalesce(?, trx_id) where id = ?').run(payment_status, trx_id ?? null, id),
};
export const ORDER_STATUSES = ['new', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled'];
export const PAYMENT_STATUSES = ['pending', 'paid', 'refunded'];
export const PAYMENT_METHODS = { card: 'Card' };

export const stats = () => ({
  revenue: db.prepare("select coalesce(sum(total),0) v from orders where payment_status = 'paid'").get().v,
  pendingPayments: db.prepare("select count(*) n, coalesce(sum(total),0) v from orders where payment_status = 'pending' and status != 'cancelled'").get(),
  ordersByStatus: Object.fromEntries(db.prepare('select status, count(*) n from orders group by status').all().map((r) => [r.status, r.n])),
  ordersTotal: db.prepare('select count(*) n from orders').get().n,
  lowStock: db.prepare('select * from products where active = 1 and stock <= 3 order by stock asc limit 8').all(),
  productCount: db.prepare('select count(*) n from products where active = 1').get().n,
  last14: db.prepare(`select date(created_at) d, coalesce(sum(total),0) v, count(*) n from orders
    where created_at >= date('now','-13 days') and status != 'cancelled' and payment_status = 'paid' group by d`).all(),
  recent: db.prepare('select * from orders order by id desc limit 8').all(),
});

// ---------- seed (sample products; prices in pence) ----------
if (!db.prepare('select count(*) n from products').get().n) {
  const seed = [
    ['Oud Mubakhar, 100ml', 'perfume', 6800, 7800, 12, 'A dense oud opened with saffron and dried rose. Lasts a full day on skin and longer on cloth. Sealed, original, with the batch code on the box.', '/img/perfume-1.svg', '50ml,100ml', 1],
    ['Monsoon, 50ml', 'perfume', 4200, null, 20, 'Wet earth, green tea and a thread of jasmine. The first hour after rain. Light enough for the office, lasts six hours.', '/img/perfume-2.svg', '30ml,50ml', 0],
    ['Amber Santal, 75ml', 'perfume', 5400, null, 9, 'Sandalwood and warm amber with a little vanilla at the base. Soft, close to the skin, unisex.', '/img/perfume-3.svg', '75ml', 0],
    ['Nawab Loafer, tan leather', 'shoes', 9500, 11000, 7, 'Full-grain leather upper, leather lining, a rubber sole you can resole. Breaks in within a week. Ships with a horn shoehorn.', '/img/shoes-1.svg', '6,7,8,9,10,11', 1],
    ['Court Sneaker, white', 'shoes', 6500, null, 15, 'Low-cut white sneaker with a cupsole and a cotton lining. The leather wipes clean. True to size.', '/img/shoes-2.svg', '5,6,7,8,9,10,11', 0],
    ['Chappal, black', 'shoes', 3800, null, 25, 'Hand-stitched leather chappal with a padded footbed. Wears in rather than out.', '/img/shoes-3.svg', '5,6,7,8,9,10', 0],
    ['Baladi Tote, navy canvas', 'bags', 4500, null, 18, 'Heavy 18oz canvas, leather handles, an inside pocket that fits a phone and keys. Carries a laptop and the shopping.', '/img/bags-1.svg', '', 1],
    ['Crossbody, saddle leather', 'bags', 8900, 9800, 6, 'Vegetable-tanned leather that darkens with use. Adjustable strap, brass fittings, two card slots inside.', '/img/bags-2.svg', '', 0],
    ['Weekender, olive', 'bags', 12500, null, 4, 'A 45-litre duffel in waxed cotton with a shoe compartment. Fits the overhead locker on a short-haul flight.', '/img/bags-3.svg', '', 0],
    ['Jamdani Kurta, ivory', 'clothing', 6200, null, 10, 'Handwoven jamdani cotton from Narayanganj, cut long with side slits. Pre-washed, so it will not shrink again.', '/img/clothing-1.svg', 'S,M,L,XL', 1],
    ['Linen Shirt, navy', 'clothing', 5500, null, 14, '100% linen, relaxed cut, corozo buttons. Gets softer with every wash. Made for the three hot weeks of a British summer.', '/img/clothing-2.svg', 'S,M,L,XL,XXL', 0],
    ['Cotton Saree, rust', 'clothing', 7800, 8800, 5, 'Soft Tangail cotton with a thin woven border, blouse piece included. Six and a half yards.', '/img/clothing-3.svg', '', 0],
  ];
  for (const [name, category, price, compare_price, stock, description, image, variants, featured] of seed)
    products.create({ name, category, price, compare_price, stock, description, image, variants, featured, active: 1 });
}
