// Draws the seed pictures in code, in the palette's real colours: one flat graphic language for every object.
// Run: node scripts/draw-images.mjs   (writes public/img/*.svg). Replace with photographs through the admin.
import { writeFileSync, mkdirSync } from 'node:fs';
mkdirSync('public/img', { recursive: true });

const NAVY = '#1f2b4d', WHITE = '#ffffff', GREY = '#e3e1dc', BLACK = '#05070a', TAN = '#f7941d', SAND = '#c9b89a', OLIVE = '#5c6b4a', RUST = '#a3472b', IVORY = '#f4f0e6', SURF = '#f4f4f2';

// Each object is drawn in a 1000 × 1000 box, centred, in two inks (fill, line).
const perfume = (f, l) => `
  <rect x="440" y="150" width="120" height="70" fill="${l}"/>
  <rect x="455" y="220" width="90" height="60" fill="${f}"/>
  <path d="M330 300 h340 a40 40 0 0 1 40 40 v440 a40 40 0 0 1 -40 40 h-340 a40 40 0 0 1 -40 -40 v-440 a40 40 0 0 1 40 -40z" fill="${f}"/>
  <rect x="360" y="400" width="280" height="200" fill="${l}" opacity="0.9"/>
  <rect x="330" y="640" width="340" height="180" fill="${l}" opacity="0.18"/>`;
const shoe = (f, l) => `
  <path d="M150 640 C150 560 230 540 330 520 C400 505 440 450 470 380 C500 330 560 330 600 360 C640 400 700 470 790 520 C860 560 880 600 870 660 Z" fill="${f}"/>
  <path d="M150 640 H870 V700 a30 30 0 0 1 -30 30 H180 a30 30 0 0 1 -30 -30 Z" fill="${l}"/>
  <path d="M470 380 C520 420 560 470 600 520" stroke="${l}" stroke-width="14" fill="none" stroke-linecap="round"/>
  <circle cx="540" cy="455" r="12" fill="${l}"/><circle cx="580" cy="500" r="12" fill="${l}"/>`;
const bag = (f, l) => `
  <path d="M380 330 a120 120 0 0 1 240 0 v60 h-50 v-60 a70 70 0 0 0 -140 0 v60 h-50z" fill="${l}"/>
  <rect x="200" y="380" width="600" height="440" fill="${f}"/>
  <rect x="200" y="380" width="600" height="60" fill="${l}" opacity="0.35"/>
  <rect x="460" y="560" width="80" height="80" fill="${l}"/>`;
const garment = (f, l) => `
  <path d="M380 220 L480 180 Q500 240 520 180 L620 220 L740 300 L690 420 L640 390 V820 H360 V390 L310 420 L260 300 Z" fill="${f}"/>
  <path d="M480 180 Q500 240 520 180 L560 215 L500 300 L440 215 Z" fill="${l}"/>
  <rect x="360" y="700" width="280" height="30" fill="${l}" opacity="0.5"/>`;
const giftbox = (f, l) => `
  <rect x="180" y="420" width="640" height="400" fill="${f}"/>
  <rect x="150" y="330" width="700" height="110" fill="${f}"/>
  <rect x="460" y="330" width="80" height="490" fill="${l}"/>
  <path d="M500 330 C440 250 360 240 350 290 C340 340 440 330 500 330 C560 330 660 340 650 290 C640 240 560 250 500 330z" fill="none" stroke="${l}" stroke-width="40"/>`;
const card = (f, l) => `
  <rect x="200" y="280" width="600" height="440" fill="${f}"/>
  <rect x="250" y="340" width="220" height="24" fill="${l}"/>
  <rect x="250" y="400" width="420" height="24" fill="${l}" opacity="0.7"/>
  <rect x="250" y="450" width="360" height="24" fill="${l}" opacity="0.7"/>
  <rect x="250" y="660" width="90" height="18" fill="${l}"/>`;

const svg = (w, h, ground, draw, f, l, scale = 1) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
<rect width="${w}" height="${h}" fill="${ground}"/>
<g transform="translate(${w / 2} ${h / 2}) scale(${scale}) translate(-500 -500)">${draw(f, l)}</g>
</svg>`;

const files = {
  // products, 4:5
  'perfume-1': svg(1200, 1500, GREY, perfume, NAVY, TAN, 1.25),
  'perfume-2': svg(1200, 1500, NAVY, perfume, SURF, NAVY, 1.25),
  'perfume-3': svg(1200, 1500, SAND, perfume, BLACK, IVORY, 1.25),
  'shoes-1': svg(1200, 1500, SURF, shoe, SAND, NAVY, 1.2),
  'shoes-2': svg(1200, 1500, NAVY, shoe, WHITE, GREY, 1.2),
  'shoes-3': svg(1200, 1500, GREY, shoe, BLACK, SAND, 1.2),
  'bags-1': svg(1200, 1500, IVORY, bag, NAVY, SAND, 1.25),
  'bags-2': svg(1200, 1500, NAVY, bag, SAND, BLACK, 1.25),
  'bags-3': svg(1200, 1500, GREY, bag, OLIVE, BLACK, 1.25),
  'clothing-1': svg(1200, 1500, NAVY, garment, IVORY, SAND, 1.3),
  'clothing-2': svg(1200, 1500, SURF, garment, NAVY, GREY, 1.3),
  'clothing-3': svg(1200, 1500, IVORY, garment, RUST, SAND, 1.3),
  // category frames, 3:4
  'cat-perfume': svg(1200, 1600, NAVY, perfume, SURF, TAN, 1.3),
  'cat-shoes': svg(1200, 1600, GREY, shoe, NAVY, SAND, 1.25),
  'cat-bags': svg(1200, 1600, SAND, bag, NAVY, BLACK, 1.3),
  'cat-clothing': svg(1200, 1600, BLACK, garment, IVORY, SAND, 1.35),
  // faq pictures
  'faq-tall': svg(900, 1200, NAVY, giftbox, GREY, IVORY, 1.1),
  'faq-square': svg(600, 600, WHITE, card, NAVY, GREY, 0.8),
  'empty': svg(1200, 1500, SURF, () => '', '', ''),
  'favicon': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="${NAVY}"/><rect x="28" y="12" width="8" height="40" fill="${TAN}"/><rect x="12" y="28" width="40" height="8" fill="${TAN}"/></svg>`,
};
for (const [name, body] of Object.entries(files)) writeFileSync(`public/img/${name}.svg`, body);
console.log(`drew ${Object.keys(files).length} pictures into public/img/`);
