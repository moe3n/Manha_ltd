// Draws the seed pictures in code: one flat graphic language, two or three tones per object, in the palette's real colours.
// Product drawings have NO background, so the page gives every product the same backdrop (the Noho trick: only the
// product carries colour). Category frames and the FAQ pictures keep their own flat grounds.
// Run: node scripts/draw-images.mjs   (writes public/img/*.svg). Replace with photographs through the admin.
import { writeFileSync, mkdirSync } from 'node:fs';
mkdirSync('public/img', { recursive: true });

const NAVY = '#1f2b4d', NAVY2 = '#16203b', WHITE = '#ffffff', GREY = '#e4dfd5', BLACK = '#0b0d12', TAN = '#f0891a',
  SAND = '#c9b89a', SAND2 = '#a8956f', OLIVE = '#5c6b4a', OLIVE2 = '#46533a', RUST = '#a3472b', RUST2 = '#7e3520', IVORY = '#f4efe4', IVORY2 = '#d9d2c2', CHALK = '#f7f5f0';

// Every object is drawn in a 1000 × 1000 box, centred.
const flacon = ({ glass, liquid, cap, label }) => `
  <rect x="432" y="118" width="136" height="112" rx="8" fill="${cap}"/>
  <rect x="432" y="206" width="136" height="24" fill="${BLACK}" opacity="0.22"/>
  <rect x="466" y="230" width="68" height="52" fill="${glass}"/>
  <path d="M300 334 L378 282 H622 L700 334 V862 Q700 882 680 882 H320 Q300 882 300 862 Z" fill="${glass}"/>
  <path d="M332 430 H668 V850 Q668 860 658 860 H342 Q332 860 332 850 Z" fill="${liquid}"/>
  <rect x="332" y="340" width="20" height="500" fill="${WHITE}" opacity="0.32"/>
  <rect x="402" y="522" width="196" height="128" fill="${label}"/>
  <rect x="436" y="560" width="128" height="9" fill="${glass}"/>
  <rect x="462" y="584" width="76" height="7" fill="${glass}" opacity="0.6"/>
  <rect x="436" y="612" width="128" height="4" fill="${glass}" opacity="0.4"/>`;

// A penny loafer in profile, toe to the left: long and low, a raised heel, an open throat, the strap across the vamp.
const loafer = ({ upper, sole, trim }) => `
  <path d="M86 690 C72 736 108 756 160 756 H884 C936 756 946 722 926 690 Z" fill="${sole}"/>
  <path d="M96 690 C96 616 170 566 290 552 C390 540 448 508 494 476 C548 438 630 440 700 466 C780 496 846 556 890 616 C912 646 912 684 900 692 Z" fill="${upper}"/>
  <path d="M556 462 C612 436 690 444 748 486 C700 472 636 474 596 492 Z" fill="${BLACK}" opacity="0.6"/>
  <path d="M700 466 C780 496 846 556 890 616 C912 646 912 684 900 692 H836 C830 620 790 540 720 490 Z" fill="${BLACK}" opacity="0.16"/>
  <path d="M290 552 C360 526 440 522 500 548 L488 586 C436 562 360 564 310 590 Z" fill="${trim}"/>
  <path d="M330 566 C400 534 480 534 538 572 L530 604 C478 574 400 574 352 604 Z" fill="${upper}"/>
  <rect x="412" y="560" width="52" height="12" rx="3" fill="${BLACK}" opacity="0.5"/>
  <path d="M96 690 C96 616 170 566 290 552 L284 584 C190 600 128 640 124 690 Z" fill="${WHITE}" opacity="0.16"/>
  <rect x="86" y="690" width="840" height="10" fill="${BLACK}" opacity="0.18"/>`;

const sneaker = ({ upper, sole, trim }) => `
  <path d="M96 700 H904 C946 700 954 762 904 772 H136 C86 772 66 722 96 700 Z" fill="${sole}"/>
  <path d="M110 700 C110 600 200 540 320 520 C420 504 470 450 520 410 C580 370 700 388 760 440 C820 492 870 560 900 700 Z" fill="${upper}"/>
  <path d="M110 700 C110 632 170 582 260 562 L302 700 Z" fill="${trim}"/>
  <path d="M520 410 C560 480 600 560 640 700 L600 700 C560 580 530 500 500 430 Z" fill="${BLACK}" opacity="0.12"/>
  ${[0, 1, 2, 3].map((i) => `<rect x="${430 + i * 42}" y="${468 + i * 26}" width="44" height="12" rx="6" transform="rotate(32 ${452 + i * 42} ${474 + i * 26})" fill="${trim}"/>`).join('')}
  <path d="M760 440 C800 480 830 540 850 620 L880 610 C860 530 830 470 790 430 Z" fill="${trim}"/>
  <rect x="96" y="700" width="808" height="14" fill="${BLACK}" opacity="0.18"/>`;

const sandal = ({ upper, sole, trim }) => `
  <path d="M104 712 C96 760 130 782 190 782 H830 C890 782 920 760 904 716 C880 650 760 640 660 640 H320 C210 640 128 650 104 712 Z" fill="${sole}"/>
  <path d="M120 712 C140 672 220 660 320 660 H660 C760 660 860 668 892 716 Z" fill="${WHITE}" opacity="0.18"/>
  <path d="M300 656 C360 540 500 480 640 520 L612 568 C500 540 392 586 352 660 Z" fill="${upper}"/>
  <path d="M400 660 C470 560 600 530 740 590 L716 636 C600 590 490 612 452 668 Z" fill="${trim}"/>
  <path d="M250 660 C300 600 360 580 420 600 L404 640 C356 626 310 640 286 668 Z" fill="${upper}"/>`;

const tote = ({ body, handle, trim }) => `
  <path d="M332 404 C332 232 468 232 468 404" fill="none" stroke="${handle}" stroke-width="32" stroke-linecap="round"/>
  <path d="M532 404 C532 232 668 232 668 404" fill="none" stroke="${handle}" stroke-width="32" stroke-linecap="round"/>
  <path d="M222 398 H778 L742 842 Q740 862 720 862 H280 Q260 862 258 842 Z" fill="${body}"/>
  <rect x="222" y="398" width="556" height="56" fill="${trim}"/>
  <path d="M258 842 L278 600 H722 L742 842 Q740 862 720 862 H280 Q260 862 258 842 Z" fill="${BLACK}" opacity="0.08"/>
  <rect x="468" y="600" width="64" height="78" rx="4" fill="${trim}"/>`;

const flapBag = ({ body, flap, trim }) => `
  <path d="M312 430 C312 150 688 150 688 430" fill="none" stroke="${trim}" stroke-width="16" stroke-linecap="round"/>
  <rect x="236" y="420" width="528" height="372" rx="26" fill="${body}"/>
  <path d="M236 420 H764 V556 Q764 606 714 606 H286 Q236 606 236 556 Z" fill="${flap}"/>
  <rect x="470" y="574" width="60" height="44" rx="6" fill="${trim}"/>
  <rect x="236" y="760" width="528" height="32" rx="12" fill="${BLACK}" opacity="0.12"/>`;

const duffel = ({ body, ends, trim }) => `
  <path d="M352 420 C352 300 448 300 448 420" fill="none" stroke="${trim}" stroke-width="26" stroke-linecap="round"/>
  <path d="M552 420 C552 300 648 300 648 420" fill="none" stroke="${trim}" stroke-width="26" stroke-linecap="round"/>
  <rect x="140" y="412" width="720" height="350" rx="175" fill="${body}"/>
  <ellipse cx="190" cy="587" rx="70" ry="160" fill="${ends}"/>
  <ellipse cx="810" cy="587" rx="70" ry="160" fill="${ends}"/>
  <rect x="300" y="438" width="400" height="14" rx="7" fill="${trim}"/>
  <rect x="440" y="600" width="120" height="70" rx="6" fill="${trim}"/>`;

const kurta = ({ cloth, trim, button }) => `
  <path d="M300 332 L420 280 Q500 334 580 280 L700 332 L762 482 L690 522 L670 462 V884 H330 V462 L310 522 L238 482 Z" fill="${cloth}"/>
  <path d="M440 282 Q500 318 560 282 L560 314 Q500 350 440 314 Z" fill="${trim}"/>
  <rect x="484" y="314" width="32" height="300" fill="${trim}"/>
  ${[360, 430, 500, 570].map((y) => `<circle cx="500" cy="${y}" r="8" fill="${button}"/>`).join('')}
  <path d="M330 462 L310 522 L238 482 L300 332 L360 350 Z" fill="${BLACK}" opacity="0.08"/>
  <path d="M670 462 L690 522 L762 482 L700 332 L640 350 Z" fill="${BLACK}" opacity="0.08"/>
  <rect x="330" y="860" width="340" height="24" fill="${trim}" opacity="0.5"/>`;

const shirt = ({ cloth, trim, button }) => `
  <path d="M296 344 L430 290 L500 332 L570 290 L704 344 L766 502 L692 542 L670 472 V862 H330 V472 L308 542 L234 502 Z" fill="${cloth}"/>
  <path d="M430 290 L500 384 L570 290 L540 272 L500 322 L460 272 Z" fill="${trim}"/>
  <rect x="486" y="384" width="28" height="330" fill="${BLACK}" opacity="0.10"/>
  ${[430, 510, 590, 670].map((y) => `<circle cx="500" cy="${y}" r="7" fill="${button}"/>`).join('')}
  <path d="M330 472 L308 542 L234 502 L296 344 L360 364 Z" fill="${BLACK}" opacity="0.08"/>
  <path d="M670 472 L692 542 L766 502 L704 344 L640 364 Z" fill="${BLACK}" opacity="0.08"/>`;

const saree = ({ cloth, border, fold }) => `
  <rect x="190" y="660" width="620" height="130" rx="14" fill="${fold}"/>
  <rect x="190" y="760" width="620" height="30" rx="4" fill="${border}"/>
  <rect x="226" y="548" width="580" height="130" rx="14" fill="${cloth}"/>
  <rect x="226" y="648" width="580" height="30" rx="4" fill="${border}"/>
  <rect x="200" y="436" width="560" height="130" rx="14" fill="${fold}"/>
  <rect x="200" y="536" width="560" height="30" rx="4" fill="${border}"/>
  <rect x="240" y="324" width="520" height="130" rx="14" fill="${cloth}"/>
  <rect x="240" y="424" width="520" height="30" rx="4" fill="${border}"/>
  <rect x="240" y="330" width="520" height="8" fill="${WHITE}" opacity="0.25"/>`;

const giftbox = ({ box, lid, ribbon }) => `
  <rect x="214" y="458" width="572" height="378" fill="${box}"/>
  <rect x="184" y="376" width="632" height="96" fill="${lid}"/>
  <rect x="462" y="376" width="76" height="460" fill="${ribbon}"/>
  <path d="M500 376 C440 300 350 290 350 350 C350 400 450 376 500 376 Z" fill="${ribbon}"/>
  <path d="M500 376 C560 300 650 290 650 350 C650 400 550 376 500 376 Z" fill="${ribbon}"/>
  <circle cx="500" cy="372" r="26" fill="${ribbon}"/>
  <path d="M500 376 C440 300 350 290 350 350 C350 400 450 376 500 376 Z M500 376 C560 300 650 290 650 350 C650 400 550 376 500 376 Z" fill="${BLACK}" opacity="0.12"/>`;

const card = ({ paper, ink, ribbon }) => `
  <rect x="200" y="280" width="600" height="440" fill="${paper}"/>
  <rect x="200" y="280" width="600" height="22" fill="${ribbon}"/>
  <rect x="250" y="350" width="180" height="20" fill="${ink}"/>
  <rect x="250" y="412" width="400" height="18" fill="${ink}" opacity="0.75"/>
  <rect x="250" y="452" width="330" height="18" fill="${ink}" opacity="0.75"/>
  <rect x="250" y="660" width="80" height="14" fill="${ink}"/>`;

const svg = (w, h, ground, draw, colours, scale = 1) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
${ground ? `<rect width="${w}" height="${h}" fill="${ground}"/>` : ''}
<g transform="translate(${w / 2} ${h / 2}) scale(${scale}) translate(-500 -500)">${draw(colours)}</g>
</svg>`;

const P = (draw, colours, scale = 1.2) => svg(1200, 1500, null, draw, colours, scale); // products: transparent, 4:5
const files = {
  'perfume-1': P(flacon, { glass: NAVY, liquid: NAVY2, cap: TAN, label: CHALK }),
  'perfume-2': P(flacon, { glass: IVORY2, liquid: SAND, cap: NAVY, label: CHALK }),
  'perfume-3': P(flacon, { glass: BLACK, liquid: '#1c1f28', cap: SAND, label: IVORY }),
  'shoes-1': P(loafer, { upper: SAND, sole: NAVY2, trim: SAND2 }),
  'shoes-2': P(sneaker, { upper: WHITE, sole: IVORY2, trim: NAVY }),
  'shoes-3': P(sandal, { upper: BLACK, sole: SAND2, trim: NAVY }),
  'bags-1': P(tote, { body: NAVY, handle: SAND2, trim: SAND }),
  'bags-2': P(flapBag, { body: SAND, flap: SAND2, trim: NAVY }),
  'bags-3': P(duffel, { body: OLIVE, ends: OLIVE2, trim: SAND }),
  'clothing-1': P(kurta, { cloth: IVORY, trim: IVORY2, button: SAND2 }, 1.25),
  'clothing-2': P(shirt, { cloth: NAVY, trim: NAVY2, button: IVORY }, 1.25),
  'clothing-3': P(saree, { cloth: RUST, fold: RUST2, border: SAND }),
  // category frames, 3:4, each on its own flat ground
  'cat-perfume': svg(1200, 1600, NAVY, flacon, { glass: CHALK, liquid: IVORY2, cap: TAN, label: NAVY }, 1.3),
  'cat-shoes': svg(1200, 1600, GREY, loafer, { upper: NAVY, sole: BLACK, trim: NAVY2 }, 1.25),
  'cat-bags': svg(1200, 1600, SAND, tote, { body: NAVY, handle: BLACK, trim: NAVY2 }, 1.3),
  'cat-clothing': svg(1200, 1600, BLACK, kurta, { cloth: IVORY, trim: IVORY2, button: SAND2 }, 1.35),
  // faq pictures
  'faq-tall': svg(900, 1200, NAVY, giftbox, { box: GREY, lid: IVORY, ribbon: TAN }, 1.1),
  'faq-square': svg(600, 600, CHALK, card, { paper: NAVY, ink: CHALK, ribbon: TAN }, 0.8),
  'empty': svg(1200, 1500, null, () => '', {}),
  'favicon': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="${NAVY}"/><rect x="28" y="10" width="8" height="44" fill="${TAN}"/><path d="M32 10 C24 0 12 2 14 10 C16 16 26 12 32 10 Z M32 10 C40 0 52 2 50 10 C48 16 38 12 32 10 Z" fill="${TAN}"/></svg>`,
};
for (const [name, body] of Object.entries(files)) writeFileSync(`public/img/${name}.svg`, body);
console.log(`drew ${Object.keys(files).length} pictures into public/img/`);
