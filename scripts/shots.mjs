// Screenshots of every page at desktop and phone width, for looking at. Needs a running server and Playwright.
// node scripts/shots.mjs [base] [outDir]
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const base = process.argv[2] || 'http://localhost:3000';
const out = process.argv[3] || 'shots';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, args: ['--no-sandbox'] });

async function shoot(ctx, name, path, { scrolls = [0], full = false } = {}) {
  const page = await ctx.newPage();
  await page.goto(base + path, { waitUntil: 'networkidle' });
  for (const y of scrolls) {
    await page.evaluate((y) => window.scrollTo(0, y), y);
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${out}/${name}${y ? '-' + y : ''}.png`, fullPage: full });
  }
  await page.close();
}

for (const [w, h, tag] of [[1440, 900, 'd'], [390, 844, 'm']]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await shoot(ctx, `${tag}-home`, '/', { scrolls: [0, 900, 1800, 2700] });
  await shoot(ctx, `${tag}-shop`, '/shop');
  await shoot(ctx, `${tag}-product`, '/p/nawab-loafer-tan-leather', { scrolls: [0, 700] });
  // add to cart then cart + checkout
  const page = await ctx.newPage();
  await page.goto(base + '/p/nawab-loafer-tan-leather');
  await page.click('.buy button');
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${out}/${tag}-added.png` });
  await page.goto(base + '/cart'); await page.waitForTimeout(400); await page.screenshot({ path: `${out}/${tag}-cart.png` });
  await page.goto(base + '/checkout'); await page.waitForTimeout(400); await page.screenshot({ path: `${out}/${tag}-checkout.png`, fullPage: true });
  // admin
  await page.goto(base + '/admin/login');
  await page.fill('input[name=email]', 'admin@manha.shop'); await page.fill('input[name=password]', process.env.ADMIN_PASSWORD || 'changeme');
  await page.click('button[type=submit]'); await page.waitForTimeout(400);
  await page.screenshot({ path: `${out}/${tag}-admin.png` });
  for (const p of ['orders', 'payments', 'products', 'products/4', 'settings']) { await page.goto(base + '/admin/' + p); await page.waitForTimeout(300); await page.screenshot({ path: `${out}/${tag}-admin-${p.replace('/', '-')}.png` }); }
  await page.close();
  await ctx.close();
}
await browser.close();
console.log('shots in', out);
