# Manha

Storefront and admin panel for a Dhaka shop selling perfume, shoes, bags and clothing. Node 22, Express, SQLite (built in), no build step.

## Run

```sh
npm install
npm start          # http://localhost:3000, admin at /admin
```

First boot creates the admin login and prints it (`admin@manha.shop` / `changeme`). Change it in Admin → Settings. To set your own from the start:

```sh
ADMIN_EMAIL=you@shop.com ADMIN_PASSWORD='a long password' npm start
```

Other environment variables: `PORT` (3000), `DB_PATH` (`data/manha.db`), `UPLOADS_DIR` (`uploads`), `SECRET` (cookie signing key; generated and stored on first boot if unset).

## Deploy on Render

`render.yaml` is a Render Blueprint: in the Render dashboard choose New → Blueprint, pick this repository and branch, and set `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` when asked. It creates one web service (Starter plan, Frankfurt, the closest region to the UK) with a 1GB disk at `/data` holding the database and uploaded photos. Free web services on Render have no disk, so orders and photos would vanish on every restart; that is why the blueprint uses Starter. Any other host works the same way: Node 22+, `npm start`, and a persistent folder for `DB_PATH` and `UPLOADS_DIR`.

## What is in it

**Storefront** `/`, `/shop`, `/shop/:category`, `/p/:slug`, `/cart`, `/checkout`, `/order/:id/:token`. Cart lives in a signed cookie, so it works without JavaScript. Checkout collects the UK address, then hands the customer to Stripe's hosted payment page (card, Apple Pay, Google Pay). A flat delivery fee, free over a threshold, both set in admin. Gift option with a written card. Prices are in pounds and stored in pence.

**Admin** `/admin`: dashboard (paid revenue, awaiting payment, new orders, low stock, 14-day bars), orders (filter, status, payment, gift card text; cancelling puts stock back), payments (Stripe references, mark paid or refunded), products (create, edit, delete, photo upload, sizes, featured, hidden), settings (store details, delivery fee and free-over threshold, your login).

## Stripe

1. Create a Stripe account for the UK business and get the secret key from Developers → API keys. Set it as `STRIPE_SECRET_KEY` (use the `sk_test_…` key first; test card 4242 4242 4242 4242).
2. Developers → Webhooks → Add endpoint: `https://<your host>/stripe/webhook`, event `checkout.session.completed`. Set its signing secret as `STRIPE_WEBHOOK_SECRET`.
3. Set `PUBLIC_URL` to the site's public address if the host does not provide one (Render sets `RENDER_EXTERNAL_URL` automatically).

Without `STRIPE_SECRET_KEY` the shop still takes orders; they stay "pending" and the order page says a payment link will follow. The order page also asks Stripe directly when a customer returns before the webhook lands, so a missing webhook delays nothing for the customer. Refunds are done in the Stripe dashboard, then marked refunded in admin.

## Design notes

Direction: the taste-skill's "pinned poster" (the four counters pass between one split sentence). Two deliberate redraws of the dealt sheet, both recorded here: the type slot moved from Hanken Grotesk alone to Bodoni Moda for the voice with Hanken Grotesk for text, because a perfume and fashion house wants the didone of the fashion press (Instrument Serif was tried first and dropped: both the impeccable detector and the taste lint flag it as a face generated pages converge on); and the ground moved from pure white to a warm grey-white. Products are drawn without a background so the page gives them all the same backdrop tone and only the product carries colour. Five type sizes, no ornaments, one accent on the action. Motion follows Emil Kowalski's rules: transform and opacity only, custom ease-out curves, press feedback on every control, staggered entrances, reduced-motion fallbacks, cross-document view transitions.

## Replace the drawings with photographs

The seed products use flat drawings in `public/img/` because this was built without the shop's own pictures. Upload a real photo per product in Admin → Products (portrait 4:5 looks best, same crop for all). The four home-page frames are `public/img/cat-*.svg`; replace them with 3:4 photographs of each counter and keep the file names, or redraw them with `node scripts/draw-images.mjs`.

## Checks

```sh
npm test                                   # boots the app on a temp DB, walks a purchase and the admin
node .claude/skills/taste-skill/scripts/lint.mjs src/views public/store.css
node .claude/skills/taste-skill/scripts/inspect.mjs http://localhost:3000/   # needs Chrome; CHROME_PATH=... if not found
node scripts/shots.mjs                     # screenshots of every page at desktop and phone width (needs Playwright)
```

## Design skills and MCP servers

`.claude/skills/` holds the design skills the site was built with, for Claude Code to use on future changes: Emil Kowalski's `animate`, `emil-design-eng`, `improve-animations`, `review-animations`, `animation-vocabulary`, `animation-performance`, `find-animation-opportunities`, `pick-ui-library`, `break-ui`, `prototype` (github.com/emilkowalski/skill); Leonxlnx's `taste-skill`, `brandkit`, `redesign-skill`, `minimalist-skill`, `soft-skill`, `brutalist-skill`, `output-skill` (github.com/Leonxlnx/taste-skill); and Paul Bakaus's `impeccable` (github.com/pbakaus/impeccable) with its four subagents in `.claude/agents/` and its design-detector hooks in `.claude/settings.json`. Run `/impeccable init` once to write `PRODUCT.md`, then `/impeccable audit`, `critique`, `polish` and friends. Its launcher downloads a small binary on first run; `npx impeccable update` keeps it current. The dealt taste-skill direction sheet is in `.taste-skill/direction.json`.

`.mcp.json` registers two MCP servers for Claude Code in this project:
- **figma** (`https://mcp.figma.com/mcp`): on first use Claude Code opens a browser for Figma's OAuth login. Check it with `/mcp`.
- **playwright** (`@playwright/mcp`): drives a real Chromium so Claude can open pages, click through checkout and take screenshots. Needs `npx playwright install chromium` once on a new machine.
