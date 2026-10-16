import { esc, money, variants, img, head, attr } from './shared.js';
import { CATEGORIES } from '../db.js';

const catLink = (c, cur) => `<a href="/shop/${c}" class="link${cur === c ? ' is-current' : ''}">${CATEGORIES[c]}</a>`;

export function layout({ title, s, cartCount = 0, body, description = '' }) {
  return `${head(title ? `${title} · ${s.store_name}` : `${s.store_name}: ${s.tagline}`, 'store', description || `${s.store_name} means gift. Perfume, shoes, bags and clothing from ${s.city}, delivered anywhere in the UK, wrapped with a written card.`)}
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="bar wrap">
  <a href="/" class="wordmark">${esc(s.store_name)}</a>
  <nav class="bar__links">
    <a href="/#gift" class="link">Gifts</a>
    <a href="/#contact" class="link">Contact</a>
    <a href="/cart" class="link">Cart${cartCount ? ` <span class="nums">(${cartCount})</span>` : ''}</a>
  </nav>
  <a href="/shop" class="button button--small">Shop</a>
</header>
<main id="main">
${body}
</main>
<section class="contact" id="contact">
  <p class="contact__ask" data-reveal>Ask about sizes, a scent, or where your order is.</p>
  <a class="contact__mail" href="mailto:${esc(s.email)}" style="--chars:${s.email.length}">${esc(s.email).replace('@', '@<wbr>')}</a>
  <div class="contact__foot">
    <p class="small"><a href="tel:${esc(s.phone.replace(/\s/g, ''))}" class="link">${esc(s.phone)}</a><br>${esc(s.address)}<br>${esc(s.hours)}</p>
    <p class="small contact__social"><a class="link" href="${esc(s.facebook)}">Facebook</a> <a class="link" href="${esc(s.instagram)}">Instagram</a><br><a class="link" href="/help#delivery">Delivery and returns</a> <a class="link" href="/help#privacy">Privacy</a> <a class="link" href="/help#terms">Terms</a><br>© ${new Date().getFullYear()} ${esc(s.store_name)} Ltd. Prices include VAT.</p>
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
    <p class="hero__lead" data-rise style="--i:2">${esc(s.store_name)} means gift. Four counters in one shop in ${esc(s.city)}: perfume, shoes, bags and clothing, delivered anywhere in the UK.</p>
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

<section class="gift" id="gift">
  <h2 class="head gift__head" data-reveal>${esc(s.store_name)} means gift.</h2>
  <p class="gift__lead lead" data-reveal style="--i:1">So every order can leave as one. Write the card here; we set it by hand and leave the price off the slip.</p>
  <div class="card" aria-live="polite" data-reveal style="--i:2">
    <p class="card__to">To <span data-card="to">Nusrat</span>,</p>
    <p class="card__msg"><span data-card="message">For the first day of the new job.</span></p>
    <p class="card__from">From <span data-card="from">Rafi</span></p>
    <p class="card__mark">${esc(s.store_name)}</p>
  </div>
  <form class="gift__form" data-gift data-reveal style="--i:3">
    <label>To <input class="field" name="gift_to" maxlength="40" placeholder="Nusrat"></label>
    <label>Message <textarea class="field" name="gift_message" maxlength="140" rows="2" placeholder="For the first day of the new job."></textarea></label>
    <label>From <input class="field" name="gift_from" maxlength="40" placeholder="Rafi"></label>
  </form>
</section>

<section class="faq">
  <div class="faq__text">
    <h2 class="head" data-reveal>Before you order</h2>
    <p data-reveal style="--i:1">${esc(s.address)}<br>${esc(s.hours)}<br>Delivery ${money(s.delivery_fee)} by Royal Mail Tracked 48, free on orders over ${money(s.free_over)}.<br>Pay by card, Apple Pay or Google Pay.</p>
    <div class="acc" data-reveal style="--i:2">
      <details><summary>Are the perfumes original?</summary><p>Yes. Every bottle is sealed, with the batch code printed on the box and the bottle. Send any bottle back within 14 days if the codes do not match and we refund it in full.</p></details>
      <details><summary>What if the shoes do not fit?</summary><p>Return or exchange them within 14 days, unworn, in the box. We send a prepaid Royal Mail label for the first exchange.</p></details>
      <details><summary>How do I pay?</summary><p>By card, Apple Pay or Google Pay on the payment page. Payments are handled by Stripe; we never see your card number. Your receipt arrives by email.</p></details>
      <details><summary>Can I send it as a gift?</summary><p>Yes. Tick the gift box at checkout, write the card, and we wrap it and leave the price off the slip.</p></details>
      <details><summary>Do you deliver outside the UK?</summary><p>Not yet. Everywhere in the UK, including Northern Ireland and the islands, in two to three working days. Email us for anywhere else and we will quote the postage.</p></details>
    </div>
    <a href="/shop" class="button">Start shopping</a>
    <a href="/help" class="link link-plain">Delivery, returns and the small print</a>
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
const MATERIAL = { perfume: 'Eau de parfum, sealed with the batch code on box and bottle', shoes: 'Full-grain leather, resoleable', bags: 'Canvas or vegetable-tanned leather, brass fittings', clothing: 'Natural fibres, pre-washed' };
export function product({ p, more, pair, added, s }) {
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
      ${vs.length ? `<fieldset class="chips"><legend class="small">${p.category === 'shoes' ? 'UK size' : 'Size'}</legend>
        ${vs.map((v, i) => `<label class="chip"><input type="radio" name="variant" value="${esc(v)}"${i === 0 ? ' checked' : ''}><span>${esc(v)}</span></label>`).join('')}
      </fieldset>` : ''}
      <label class="qty">Quantity <input class="field nums" type="number" name="qty" value="1" min="1" max="${p.stock}"></label>
      <button class="button" type="submit">Add to cart · ${money(p.price)}</button>
      ${added ? `<p class="notice notice--enter" role="status">Added. <a class="link-plain" href="/cart">Go to cart</a></p>` : ''}
    </form>
    ${p.stock <= 3 ? `<p class="small">Only ${p.stock} left.</p>` : ''}`
    : `<p class="lead">Sold out. <a class="link-plain" href="mailto:${esc(s.email)}">Email us</a> and we will tell you when it is back.</p>`}
    <dl class="facts">
      <dt>Material</dt><dd>${MATERIAL[p.category]}</dd>
      <dt>Delivery</dt><dd>${money(s.delivery_fee)} by Royal Mail Tracked 48, free over ${money(s.free_over)}. Two to three working days.</dd>
      <dt>Returns</dt><dd>14 days, unworn, in the box. Prepaid label for the first exchange.</dd>
      <dt>As a gift</dt><dd>Tick the box at checkout: navy paper, a card in our hand, no price on the slip.</dd>
    </dl>
  </div>
</section>
${pair.length ? `<section class="more wrap">
  <h2 class="head" data-reveal>Complete the gift</h2>
  <ul class="row">${pair.map((m, i) => `<li data-reveal style="--i:${i}"><a href="/p/${m.slug}" class="tile"><span class="tile__pic">${img(m.image, m.name, 'loading="lazy"')}</span><span class="tile__name">${esc(m.name)}</span><span class="tile__price nums">${money(m.price)}</span></a></li>`).join('')}</ul>
</section>` : ''}
${more.length ? `<section class="more wrap">
  <h2 class="head" data-reveal>More ${CATEGORIES[p.category].toLowerCase()}</h2>
  <ul class="row">${more.map((m, i) => `<li data-reveal style="--i:${i}"><a href="/p/${m.slug}" class="tile"><span class="tile__pic">${img(m.image, m.name, 'loading="lazy"')}</span><span class="tile__name">${esc(m.name)}</span><span class="tile__price nums">${money(m.price)}</span></a></li>`).join('')}</ul>
</section>` : ''}`;
}

// ---------- help: delivery, returns, privacy, terms ----------
export const help = ({ s }) => `
<section class="wrap help">
  <h1 class="head" data-rise style="--i:0">The small print</h1>
  <div class="help__cols">
    <article id="delivery" data-reveal>
      <h2 class="lead">Delivery and returns</h2>
      <p>Orders go by Royal Mail Tracked 48 for ${money(s.delivery_fee)}, free when the subtotal is ${money(s.free_over)} or more. Allow two to three working days anywhere in the UK, including Northern Ireland and the islands. We email the tracking number when it leaves.</p>
      <p>Return anything within 14 days of delivery, unworn and in its packaging, for a full refund to the card you paid with. Email ${esc(s.email)} with your order number and we send a prepaid Royal Mail label for the first exchange; further returns cost the postage. Sealed perfume can be returned only unopened. This sits on top of your rights under the Consumer Contracts Regulations 2013 and the Consumer Rights Act 2015.</p>
    </article>
    <article id="privacy" data-reveal style="--i:1">
      <h2 class="lead">Privacy</h2>
      <p>We keep your name, address, email and phone number to deliver the order and answer questions about it, and the gift card text so we can write it. Card payments are handled by Stripe; we never see or store your card number. We do not sell or share your details with anyone except the courier and Stripe, and we do not send marketing unless you ask for it.</p>
      <p>Orders are kept for six years for tax records. Email ${esc(s.email)} to see or delete what we hold. The site sets one cookie for your cart and one for the gift card you are writing; neither tracks you anywhere else.</p>
    </article>
    <article id="terms" data-reveal style="--i:2">
      <h2 class="lead">Terms</h2>
      <p>${esc(s.store_name)} Ltd, ${esc(s.address)}. Prices are in pounds and include VAT. An order is accepted when we email to say it has shipped; until then we can cancel and refund it, for example if the last one sold in the shop first. Sizes are UK sizes. Colours on screen can differ a little from the thing in your hand.</p>
      <p class="small muted">Sample wording. Have your accountant or solicitor confirm the company details and anything specific to your business before launch.</p>
    </article>
  </div>
</section>`;

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
    <p class="small">${subtotal >= Number(s.free_over) ? 'Delivery is free on this order.' : `Delivery ${money(s.delivery_fee)}, or free over ${money(s.free_over)}.`}</p>
    <a class="button" href="/checkout">Checkout</a>
  </div>
</section>`;
}

// ---------- checkout ----------
export function checkout({ items, subtotal, delivery, s, error = '', form = {}, cancelled = false }) {
  const v = (k, d = '') => esc(form[k] ?? d);
  return `
<section class="wrap checkout">
  <h1 class="head">Checkout</h1>
  ${error ? `<p class="notice notice--bad" role="alert">${esc(error)}</p>` : ''}
  ${cancelled ? `<p class="notice" role="status">Payment was not completed. Nothing has been charged; your cart is still here.</p>` : ''}
  <form method="post" action="/checkout" class="checkout__form" data-checkout>
    <div class="checkout__fields">
      <h2 class="lead">Where to send it</h2>
      <label>Your name <input class="field" name="name" required value="${v('name')}" autocomplete="name"></label>
      <label>Email, for the receipt <input class="field" type="email" name="email" required value="${v('email')}" autocomplete="email"></label>
      <label>Phone, for the courier <input class="field" name="phone" required value="${v('phone')}" autocomplete="tel" inputmode="tel" placeholder="07700 900123"></label>
      <label>Address <textarea class="field" name="address" required rows="2" autocomplete="street-address">${v('address')}</textarea></label>
      <div class="cols2">
        <label>Town or city <input class="field" name="city" required value="${v('city')}" autocomplete="address-level2"></label>
        <label>Postcode <input class="field" name="postcode" required value="${v('postcode')}" autocomplete="postal-code" autocapitalize="characters"></label>
      </div>

      <h2 class="lead">A gift?</h2>
      <label class="check"><input type="checkbox" name="gift" value="1"${form.gift ? ' checked' : ''} data-gift-toggle> <span>Wrap it and write a card. The price stays off the slip.</span></label>
      <div data-gift-fields${form.gift ? '' : ' hidden'}>
        <label>To <input class="field" name="gift_to" maxlength="40" value="${v('gift_to')}"></label>
        <label>Card message <textarea class="field" name="gift_message" maxlength="140" rows="3">${v('gift_message')}</textarea></label>
      </div>
      <label>Anything else? <textarea class="field" name="note" rows="2" placeholder="Leave with a neighbour, safe place, …">${v('note')}</textarea></label>
      <button class="button" type="submit">Continue to payment</button>
      <p class="small">You pay on the next page by card, Apple Pay or Google Pay. Payments are handled by Stripe; we never see your card number.</p>
    </div>
    <aside class="checkout__sum">
      <h2 class="lead">Your order</h2>
      <ul class="sum__rows">${items.map((it) => `<li><span>${esc(it.name)}${it.variant ? ` <span class="muted">${esc(it.variant)}</span>` : ''} × <span class="nums">${it.qty}</span></span><span class="nums">${money(it.price * it.qty)}</span></li>`).join('')}</ul>
      <p class="sum__line">Subtotal <span class="nums">${money(subtotal)}</span></p>
      <p class="sum__line">Delivery <span class="nums">${delivery ? money(delivery) : 'Free'}</span></p>
      <p class="sum__line lead">Total <span class="nums">${money(subtotal + delivery)}</span></p>
      <p class="small muted">Includes VAT. Royal Mail Tracked 48, two to three working days.</p>
    </aside>
  </form>
</section>`;
}

// ---------- order confirmation ----------
export function order({ o, items, s, stripeOn }) {
  const paid = o.payment_status === 'paid';
  return `
<section class="wrap order">
  <h1 class="head" data-rise style="--i:0">${paid ? `Thank you, ${esc(o.name.split(' ')[0])}.` : 'One more step.'}</h1>
  <p class="lead" data-rise style="--i:1">${paid
    ? `Order <span class="nums">#${o.id}</span> is paid. Your receipt is on its way to ${esc(o.email)}, and we will email again when it ships.`
    : `Order <span class="nums">#${o.id}</span> is saved but not paid yet.`}</p>
  ${!paid && o.status !== 'cancelled' ? (stripeOn
    ? `<form method="post" action="/order/${o.id}/${o.token}/pay" data-rise style="--i:2"><button class="button" type="submit">Pay ${money(o.total)} by card</button></form>`
    : `<p class="notice" data-rise style="--i:2">Online payment is not switched on yet. We will email you a payment link for <b class="nums">${money(o.total)}</b>.</p>`) : ''}
  <ul class="sum__rows">${items.map((it) => `<li><span>${esc(it.name)}${it.variant ? ` <span class="muted">${esc(it.variant)}</span>` : ''} × <span class="nums">${it.qty}</span></span><span class="nums">${money(it.price * it.qty)}</span></li>`).join('')}</ul>
  <p class="sum__line">Delivery <span class="nums">${o.delivery ? money(o.delivery) : 'Free'}</span></p>
  <p class="sum__line lead">Total <span class="nums">${money(o.total)}</span>${paid ? ' · paid' : ''}</p>
  <p>${esc(o.address)}, ${esc(o.city)}, ${esc(o.postcode)}</p>
  ${o.gift ? `<div class="card card--small"><p class="card__to">To <span>${esc(o.gift_to)}</span>,</p><p class="card__msg">${esc(o.gift_message)}</p><p class="card__mark">${esc(s.store_name)}</p></div>` : ''}
  <p><a class="button" href="/shop">Keep shopping</a></p>
</section>`;
}

export const notFound = () => `<section class="wrap order"><h1 class="head">Nothing here.</h1><p class="lead"><a class="link-plain" href="/shop">Back to the shop.</a></p></section>`;
