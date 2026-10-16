// Manha storefront. Everything here is an enhancement: the page works without it.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // Section entrances, once.
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0 }); // threshold 0: a clip-path'd element reports ratio 0 even when on screen
  $$('[data-reveal]').forEach((el) => io.observe(el));

  // Email fitted margin to margin.
  const mail = $('.contact__mail');
  if (mail) mail.style.setProperty('--chars', mail.textContent.trim().length);

  // Index: hover, focus or the row nearest the middle makes it active and swaps the picture.
  const index = $('.index');
  if (index) {
    const pic = $('.index__pic img', index), rows = $$('.index__row', index);
    let current = rows[0];
    const activate = (row) => {
      if (row === current) return;
      current?.classList.remove('is-active'); row.classList.add('is-active'); current = row;
      const src = row.dataset.img; if (!src || pic.getAttribute('src') === src) return;
      pic.classList.add('is-fading');
      const next = new Image(); next.src = src;
      next.decode().catch(() => {}).then(() => { pic.src = src; pic.classList.remove('is-fading'); });
    };
    rows.forEach((row) => { row.addEventListener('pointerenter', () => activate(row)); row.addEventListener('focusin', () => activate(row)); });
    const mid = new IntersectionObserver((entries) => { for (const e of entries) if (e.isIntersecting) activate(e.target); }, { rootMargin: '-45% 0px -45% 0px' });
    rows.forEach((row) => mid.observe(row));
  }

  // The gift card: typed here, kept for checkout.
  const giftForm = $('[data-gift]');
  const read = () => { try { return JSON.parse(localStorage.getItem('manha-gift') || '{}'); } catch { return {}; } };
  if (giftForm) {
    const saved = read();
    const cards = Object.fromEntries($$('[data-card]').map((el) => [el.dataset.card, { el, placeholder: el.textContent }]));
    const sync = () => {
      const data = {};
      for (const f of giftForm.elements) if (f.name) data[f.name.replace('gift_', '')] = f.value;
      for (const [k, { el, placeholder }] of Object.entries(cards)) el.textContent = data[k]?.trim() || placeholder;
      try { localStorage.setItem('manha-gift', JSON.stringify(data)); } catch {}
    };
    for (const f of giftForm.elements) if (f.name && saved[f.name.replace('gift_', '')]) f.value = saved[f.name.replace('gift_', '')];
    giftForm.addEventListener('input', sync);
    sync();
  }

  // Checkout: transaction ID only for bKash/Nagad, gift fields on demand, delivery by city.
  const co = $('[data-checkout]');
  if (co) {
    const trx = $('[data-trx]', co), giftToggle = $('[data-gift-toggle]', co), giftFields = $('[data-gift-fields]', co);
    const out = $('[data-delivery-out]', co), total = $('[data-total-out]', co);
    const fmt = (n) => '৳' + new Intl.NumberFormat('en-IN').format(n);
    const update = () => {
      const method = co.elements.payment_method.value;
      trx.hidden = method === 'cod';
      $('input', trx).required = method !== 'cod';
      giftFields.hidden = !giftToggle.checked;
      const city = $('input[name=city]:checked', co);
      const fee = Number(city?.dataset.delivery || 0);
      out.textContent = fmt(fee);
      total.textContent = fmt(Number(total.dataset.subtotal) + fee);
    };
    const saved = read();
    if (saved.message && !co.elements.gift_message.value) { co.elements.gift_message.value = saved.message; co.elements.gift_to.value = saved.to || ''; }
    co.addEventListener('change', update);
    update();
  }
})();
