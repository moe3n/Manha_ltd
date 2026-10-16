// ponytail: template literals, no view engine. esc() everything that came from a user or the DB.
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const money = (n) => '৳' + new Intl.NumberFormat('en-IN').format(Number(n) || 0);
export const date = (s) => new Date(s.replace(' ', 'T') + 'Z').toLocaleString('en-GB', { timeZone: 'Asia/Dhaka', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
export const variants = (p) => p.variants.split(',').map((v) => v.trim()).filter(Boolean);
export const img = (src, alt, attrs = '') => `<img src="${esc(src || '/img/empty.svg')}" alt="${esc(alt)}" width="1200" height="1500" ${attrs}>`;
export const attr = (cond, name) => (cond ? ` ${name}` : '');

export const head = (title, css) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/${css}.css">
<link rel="icon" href="/img/favicon.svg">
<script>document.documentElement.classList.add('js')</script>
</head>`;
