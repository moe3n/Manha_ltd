import { esc, money, variants, img, head, attr } from './shared.js';
import { CATEGORIES, PAYMENT_METHODS } from '../db.js';

const catLink = (c, cur) => `<a href="/shop/${c}" class="link${cur === c ? ' is-current' : ''}">${CATEGORIES[c]}</a>`;

export function layout({ title, s, cartCount = 0, body, ink = 'light' }) {
  return `${head(title ? `${title} · ${s.store_name}` : `${s.store_name}: ${s.tagline}`, 'store')}
<body data-ink="${ink}">
<header class="bar wrap">
  <a href="/" class="wordmark">${esc(s.store_name)}</a>
  <nav class="bar__links">
    <a href="/#gift" class="link">Gifts</a>
    <a href="/#contact" class="link">Contact</a>
    <a href="/cart" class="link">Cart${cartCount ? ` <span class="nums">(${cartCount})</span>` : ''}</a>
  </nav>
  <a href="/shop" class="button button--small">Shop</a>
</header>
<main>
${body}
</main>
<section class="contact" id="contact">
  <p class="contact__ask" data-reveal>Ask about sizes, a scent, or where your order is.</p>
  <a class="contact__mail" href="mailto:${esc(s.email)}" style="--chars:${s.email.length}">${esc(s.email).replace('@', '@<wbr>')}</a>
  <div class="contact__foot">
    <p class="small"><a href="tel:${esc(s.phone.replace(/\s/g, ''))}" class="link">${esc(s.phone)}</a><br>${esc(s.address)}<br>${esc(s.hours)}</p>
    <p class="small contact__social"><a class="link" href="${esc(s.facebook)}">Facebook</a> <a class="link" href="${esc(s.instagram)}">Instagram</a><br>© ${new Date().getFullYear()} ${esc(s.store_name)} Ltd. Prices in Bangladeshi taka.</p>
  </div>
</section>
<script src="/store.js" defer></script>
</body>
</html>`;
}

// ---------- home ----------
export function home({ featured, latest, counts, s }) {
  const reel = Object.keys(CATEGORIES).map((c, i) => `
    <a class="reel__frame" href="/shop/${c}" style="--i:${i}">
      <img src="/img/cat-${c}.svg" alt="${CATEGORIES[c]} at ${esc(s.store_name)}" width="1200" height="1600"${i ? ' loading="lazy"' : ''}>
      <span class="reel__cap small">${CATEGORIES[c]}, <span class="nums">${counts[c] || 0}</span> items</span>
    </a>`).join('');

  const shows = featured.slice(0, 3).map((p, i) => `
    <article class="show" style="--col:${i + 2}">
      <div class="show__bg">${img(p.image, '', 'loading="lazy"')}</div>
      <div class="show__card" data-reveal>
        ${i === 0 ? `<h2 class="show__name">${esc(p.name)}</h2>` : `<h3 class="show__name">${esc(p.name)}</h3>`}
        <p class="small">${esc(CATEGORIES[p.category])}${variants(p).length ? ` · ${esc(variants(p).join(' / '))}` : ''}</p>
        <p class="nums">${money(p.price)}</p>
        <div class="show__thumb">${img(p.image, p.name, 'loading="lazy"')}</div>
        <a class="button" href="/p/${p.slug}">See it</a>
      </div>
    </article>`).join('');

  const rows = latest.map((p, i) => `
    <li class="index__row${i === 0 ? ' is-active' : ''}" data-img="${esc(p.image)}" data-reveal style="--i:${i}">
      <a href="/p/${p.slug}" class="index__name">${esc(p.name)}</a>
      <span class="index__price nums">${money(p.price)}</span>
      <p class="index__desc small">${esc(p.description)}</p>
    </li>`).join('');

  return `
<section class="hero">
  <div class="hero__stage">
    <h1 class="hero__title lines">
      <span class="line hero__a"><span data-line style="--i:0">Scent, step,</span></span>
      <span class="line hero__b"><span data-line style="--i:1">carry, wear.</span></span>
    </h1>
    <p class="hero__lead" data-rise style="--i:2">${esc(s.store_name)} means gift. Four counters in one shop in Dhaka: perfume, shoes, bags and clothing, delivered anywhere in Bangladesh.</p>
  </div>
  <div class="reel">${reel}</div>
</section>

<section class="shows" aria-label="This week's picks">${shows}</section>

<section class="index wrap" id="new">
  <div class="index__pic"><img src="${esc(latest[0]?.image || '/img/empty.svg')}" alt="" width="1200" height="1500" loading="lazy"></div>
  <div class="index__list">
    <h2 class="head" data-reveal>New this week</h2>
    <ul class="index__rows">${rows}</ul>
    <a href="/shop" class="link link-plain">Everything in the shop</a>
  </div>
</section>

<section class="gift wrap" id="gift">
  <div class="gift__text">
    <h2 class="head" data-reveal>${esc(s.store_name)} means gift.</h2>
    <p data-reveal>So every order can leave as one. Write the card here, and we set it in our hand, wrap the box in navy paper and leave the price off the slip. Your words are kept for checkout.</p>
    <form class="gift__form" data-gift data-reveal style="--i:1">
      <label>To <input class="field" name="gift_to" maxlength="40" placeholder="Nusrat"></label>
      <label>Message <textarea class="field" name="gift_message" maxlength="140" rows="3" placeholder="For the first day of the new job."></textarea></label>
      <label>From <input class="field" name="gift_from" maxlength="40" placeholder="Rafi"></label>
    </form>
  </div>
  <div class="card" aria-live="polite" data-reveal style="--i:2">
    <p class="card__to">To <span data-card="to">Nusrat</span>,</p>
    <p class="card__msg"><span data-card="message">For the first day of the new job.</span></p>
    <p class="card__from">From <span data-card="from">Rafi</span></p>
    <p class="card__mark">${esc(s.store_name)}</p>
  </div>
</section>

<section class="faq">
  <div class="faq__text">
    <h2 class="head" data-reveal>Before you order</h2>
    <p data-reveal style="--i:1">${esc(s.address)}<br>${esc(s.hours)}<br>Delivery ${money(s.delivery_dhaka)} in Dhaka, ${money(s.delivery_outside)} outside, one to three days.<br>Pay by bKash, Nagad or cash on delivery.</p>
    <div class="acc" data-reveal style="--i:2">
      <details><summary>Are the perfumes original?</summary><p>Yes. Every bottle is sealed, with the batch code printed on the box and the bottle. Bring any bottle back within seven days if the codes do not match.</p></details>
      <details><summary>What if the shoes do not fit?</summary><p>Exchange them within seven days, unworn, in the box. We pay the courier for the first exchange inside Dhaka.</p></details>
      <details><summary>How do I pay with bKash or Nagad?</summary><p>Send the total to ${esc(s.bkash)} (bKash) or ${esc(s.nagad)} (Nagad) using Send Money, then type the transaction ID at checkout. We confirm by phone within a few hours.</p></details>
      <details><summary>Can I send it as a gift?</summary><p>Yes. Tick the gift box at checkout, write the card, and we wrap it and leave the price off the slip.</p></details>
      <details><summary>Do you deliver outside Dhaka?</summary><p>Everywhere in Bangladesh, in two to four days, by Sundarban or Pathao courier. Cash on delivery works outside Dhaka too.</p></details>
    </div>
    <a href="/shop" class="button">Start shopping</a>
    <a href="tel:${esc(s.phone.replace(/\s/g, ''))}" class="link link-plain">Or call ${esc(s.phone)}</a>
  </div>
  <div class="faq__pics">
    <img class="faq__tall shutter" data-reveal src="/img/faq-tall.svg" alt="A navy gift box tied with a cream ribbon" width="900" height="1200" loading="lazy">
    <img class="faq__square" data-reveal style="--i:3" src="/img/faq-square.svg" alt="The shop's card, blank" width="600" height="600" loading="lazy">
  </div>
</section>`;
}

// ---------- shop ----------
export function shop({ list, category, q, s }) {
  const title = q ? `Results for “${q}”` : category ? CATEGORIES[category] : 'Everything';
  return `
<section class="shop wrap">
  <h1 class="head" data-rise style="--i:0">${esc(title)} <span class="muted nums">${list.length}</span></h1>
  <nav class="shop__nav" data-rise style="--i:1">
    <a href="/shop" class="link${!category && !q ? ' is-current' : ''}">All</a>
    ${Object.keys(CATEGORIES).map((c) => catLink(c, category)).join('')}
    <form action="/shop" class="shop__search" role="search"><input class="field" type="search" name="q" value="${esc(q)}" placeholder="Search" aria-label="Search the shop"></form>
  </nav>
  ${list.length ? `<ul class="grid-shop">${list.map((p, i) => `
    <li data-reveal style="--i:${i % 3}">
      <a href="/p/${p.slug}" class="tile">
        <span class="tile__pic">${img(p.image, p.name, 'loading="lazy"')}</span>
        <span class="tile__name">${esc(p.name)}</span>
        <span class="tile__price nums">${money(p.price)}${p.compare_price ? ` <s class="muted">${money(p.compare_price)}</s>` : ''}${p.stock === 0 ? ' <span class="muted">· sold out</span>' : ''}</span>
      </a>
    </li>`).join('')}</ul>`
    : `<p class="lead">Nothing here yet. <a class="link-plain" href="/shop">See everything</a>.</p>`}
</section>`;
}

// ---------- product ----------
export function product({ p, more, added, s }) {
  const vs = variants(p);
  return `
<section class="product">
  <div class="product__stage shutter" data-reveal>${img(p.image, p.name)}</div>
  <div class="product__info">
    <p><a href="/shop/${p.category}" class="link link-plain">${CATEGORIES[p.category]}</a></p>
    <h1 class="head">${esc(p.name)}</h1>
    <p class="lead nums">${money(p.price)}${p.compare_price ? ` <s class="muted">${money(p.compare_price)}</s>` : ''}</p>
    <p>${esc(p.description)}</p>
    ${p.stock > 0 ? `
    <form method="post" action="/cart/add" class="buy">
      <input type="hidden" name="id" value="${p.id}">
      ${vs.length ? `<fieldset class="chips"><legend class="small">${p.category === 'perfume' ? 'Size' : p.category === 'shoes' ? 'EU size' : 'Size'}</legend>
        ${vs.map((v, i) => `<label class="chip"><input type="radio" name="variant" value="${esc(v)}"${i === 0 ? ' checked' : ''}><span>${esc(v)}</span></label>`).join('')}
      </fieldset>` : ''}
      <label class="qty">Quantity <input class="field nums" type="number" name="qty" value="1" min="1" max="${p.stock}"></label>
      <button class="button" type="submit">Add to cart · ${money(p.price)}</button>
      ${added ? `<p class="notice" role="status">Added. <a class="link-plain" href="/cart">Go to cart</a></p>` : ''}
    </form>
    <p class="small">${p.stock <= 3 ? `Only ${p.stock} left. ` : ''}Delivery ${money(s.delivery_dhaka)} in Dhaka, ${money(s.delivery_outside)} elsewhere. Gift wrap and a written card at checkout.</p>`
    : `<p class="lead">Sold out. <a class="link-plain" href="tel:${esc(s.phone.replace(/\s/g, ''))}">Call us</a> and we will tell you when it is back.</p>`}
  </div>
</section>
${more.length ? `<section class="more wrap">
  <h2 class="head" data-reveal>More ${CATEGORIES[p.category].toLowerCase()}</h2>
  <ul class="row">${more.map((m) => `<li><a href="/p/${m.slug}" class="tile"><span class="tile__pic">${img(m.image, m.name, 'loading="lazy"')}</span><span class="tile__name">${esc(m.name)}</span><span class="tile__price nums">${money(m.price)}</span></a></li>`).join('')}</ul>
</section>` : ''}`;
}

// ---------- cart ----------
export function cart({ items, subtotal, s }) {
  if (!items.length) return `<section class="wrap cart"><h1 class="head">Your cart is empty.</h1><p class="lead"><a class="link-plain" href="/shop">Go and fill it.</a></p></section>`;
  return `
<section class="wrap cart">
  <h1 class="head">Cart <span class="muted nums">${items.length}</span></h1>
  <ul class="cart__rows">${items.map((it) => `
    <li class="cart__row">
      <a href="/p/${it.slug}" class="cart__pic">${img(it.image, it.name, 'width="160" height="200"')}</a>
      <div class="cart__name"><a class="link" href="/p/${it.slug}">${esc(it.name)}</a>${it.variant ? `<br><span class="small muted">${esc(it.variant)}</span>` : ''}</div>
      <form method="post" action="/cart/update" class="cart__qty">
        <input type="hidden" name="key" value="${esc(it.key)}">
        <button class="button button--ghost" name="qty" value="${it.qty - 1}" aria-label="One fewer">−</button>
        <span class="nums">${it.qty}</span>
        <button class="button button--ghost" name="qty" value="${it.qty + 1}" aria-label="One more"${it.qty >= it.stock ? ' disabled' : ''}>+</button>
      </form>
      <p class="cart__line nums">${money(it.price * it.qty)}</p>
    </li>`).join('')}</ul>
  <div class="cart__sum">
    <p class="lead">Subtotal <span class="nums">${money(subtotal)}</span></p>
    <p class="small">Delivery is added at checkout: ${money(s.delivery_dhaka)} in Dhaka, ${money(s.delivery_outside)} elsewhere.</p>
    <a class="button" href="/checkout">Checkout</a>
  </div>
</section>`;
}

// ---------- checkout ----------
export function checkout({ items, subtotal, s, error = '', form = {} }) {
  const v = (k, d = '') => esc(form[k] ?? d);
  const chk = (k, val) => ((form[k] ?? 'cod') === val ? ' checked' : '');
  return `
<section class="wrap checkout">
  <h1 class="head">Checkout</h1>
  ${error ? `<p class="notice notice--bad" role="alert">${esc(error)}</p>` : ''}
  <form method="post" action="/checkout" class="checkout__form" data-checkout>
    <div class="checkout__fields">
      <h2 class="lead">Where to send it</h2>
      <label>Your name <input class="field" name="name" required value="${v('name')}" autocomplete="name"></label>
      <label>Phone <input class="field" name="phone" required value="${v('phone')}" autocomplete="tel" inputmode="tel" placeholder="01XXXXXXXXX"></label>
      <label>Address <textarea class="field" name="address" required rows="3" autocomplete="street-address">${v('address')}</textarea></label>
      <fieldset class="chips"><legend class="small">City</legend>
        <label class="chip"><input type="radio" name="city" value="Dhaka"${chk('city', 'Dhaka')}${!form.city ? ' checked' : ''} data-delivery="${esc(s.delivery_dhaka)}"><span>Dhaka</span></label>
        <label class="chip"><input type="radio" name="city" value="Outside Dhaka"${chk('city', 'Outside Dhaka')} data-delivery="${esc(s.delivery_outside)}"><span>Outside Dhaka</span></label>
      </fieldset>

      <h2 class="lead">How to pay</h2>
      <div class="pay">
        <label class="pay__opt"><input type="radio" name="payment_method" value="cod"${chk('payment_method', 'cod')}><span>Cash on delivery</span><span class="small muted">Pay the courier when the parcel arrives.</span></label>
        <label class="pay__opt"><input type="radio" name="payment_method" value="bkash"${chk('payment_method', 'bkash')}><span>bKash</span><span class="small muted">Send Money to <b class="nums">${esc(s.bkash)}</b>, then enter the transaction ID below.</span></label>
        <label class="pay__opt"><input type="radio" name="payment_method" value="nagad"${chk('payment_method', 'nagad')}><span>Nagad</span><span class="small muted">Send Money to <b class="nums">${esc(s.nagad)}</b>, then enter the transaction ID below.</span></label>
        <label data-trx hidden>Transaction ID <input class="field" name="trx_id" value="${v('trx_id')}" placeholder="e.g. 9A7B3C2D1E" autocapitalize="characters"></label>
      </div>

      <h2 class="lead">A gift?</h2>
      <label class="check"><input type="checkbox" name="gift" value="1"${form.gift ? ' checked' : ''} data-gift-toggle> <span>Wrap it and write a card. The price stays off the slip.</span></label>
      <div data-gift-fields${form.gift ? '' : ' hidden'}>
        <label>To <input class="field" name="gift_to" maxlength="40" value="${v('gift_to')}"></label>
        <label>Card message <textarea class="field" name="gift_message" maxlength="140" rows="3">${v('gift_message')}</textarea></label>
      </div>
      <label>Anything else? <textarea class="field" name="note" rows="2" placeholder="Leave it with the guard, call before coming, …">${v('note')}</textarea></label>
      <button class="button" type="submit">Place order</button>
    </div>
    <aside class="checkout__sum">
      <h2 class="lead">Your order</h2>
      <ul class="sum__rows">${items.map((it) => `<li><span>${esc(it.name)}${it.variant ? ` <span class="muted">${esc(it.variant)}</span>` : ''} × <span class="nums">${it.qty}</span></span><span class="nums">${money(it.price * it.qty)}</span></li>`).join('')}</ul>
      <p class="sum__line">Subtotal <span class="nums">${money(subtotal)}</span></p>
      <p class="sum__line">Delivery <span class="nums" data-delivery-out>${money(s.delivery_dhaka)}</span></p>
      <p class="sum__line lead">Total <span class="nums" data-total-out data-subtotal="${subtotal}">${money(subtotal + Number(s.delivery_dhaka))}</span></p>
    </aside>
  </form>
</section>`;
}

// ---------- order confirmation ----------
export function order({ o, items, s }) {
  const pay = PAYMENT_METHODS[o.payment_method];
  return `
<section class="wrap order">
  <h1 class="head" data-rise style="--i:0">Thank you, ${esc(o.name.split(' ')[0])}.</h1>
  <p class="lead" data-rise style="--i:1">Order <span class="nums">#${o.id}</span> is ${esc(o.status)}. We will call <span class="nums">${esc(o.phone)}</span> to confirm.</p>
  ${o.payment_status === 'pending' && o.payment_method !== 'cod' ? `<p class="notice" data-rise style="--i:2">If you have not sent it yet: Send Money <b class="nums">${money(o.total)}</b> to <b class="nums">${esc(o.payment_method === 'bkash' ? s.bkash : s.nagad)}</b> on ${pay}, reference <b class="nums">#${o.id}</b>. ${o.trx_id ? `We have your transaction ID <span class="nums">${esc(o.trx_id)}</span>.` : ''}</p>` : ''}
  <ul class="sum__rows">${items.map((it) => `<li><span>${esc(it.name)}${it.variant ? ` <span class="muted">${esc(it.variant)}</span>` : ''} × <span class="nums">${it.qty}</span></span><span class="nums">${money(it.price * it.qty)}</span></li>`).join('')}</ul>
  <p class="sum__line">Delivery <span class="nums">${money(o.delivery)}</span></p>
  <p class="sum__line lead">Total <span class="nums">${money(o.total)}</span> · ${pay}${o.payment_status === 'paid' ? ', paid' : ''}</p>
  <p>${esc(o.address)}, ${esc(o.city)}</p>
  ${o.gift ? `<div class="card card--small"><p class="card__to">To <span>${esc(o.gift_to)}</span>,</p><p class="card__msg">${esc(o.gift_message)}</p><p class="card__mark">${esc(s.store_name)}</p></div>` : ''}
  <p><a class="button" href="/shop">Keep shopping</a></p>
</section>`;
}

export const notFound = () => `<section class="wrap order"><h1 class="head">Nothing here.</h1><p class="lead"><a class="link-plain" href="/shop">Back to the shop.</a></p></section>`;
