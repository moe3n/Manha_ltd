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

`render.yaml` is a Render Blueprint: in the Render dashboard choose New → Blueprint, pick this repository and branch, and set `ADMIN_EMAIL` and `ADMIN_PASSWORD` when asked. It creates one web service (Starter plan, Singapore) with a 1GB disk at `/data` holding the database and uploaded photos. Free web services on Render have no disk, so orders and photos would vanish on every restart; that is why the blueprint uses Starter. Any other host works the same way: Node 22+, `npm start`, and a persistent folder for `DB_PATH` and `UPLOADS_DIR`.

## What is in it

**Storefront** `/`, `/shop`, `/shop/:category`, `/p/:slug`, `/cart`, `/checkout`, `/order/:id/:token`. Cart lives in a signed cookie, so it works without JavaScript. Checkout takes cash on delivery, bKash or Nagad (Send Money + transaction ID), a gift option with a written card, and delivery fees by city.

**Admin** `/admin`: dashboard (paid revenue, awaiting payment, new orders, low stock, 14-day bars), orders (filter, status, payment, gift card text), payments (verify bKash/Nagad transaction IDs, mark paid or refunded), products (create, edit, delete, photo upload, variants, featured, hidden), settings (store details, payment numbers, delivery fees, your login).

## Replace the drawings with photographs

The seed products use flat drawings in `public/img/` because this was built without the shop's own pictures. Upload a real photo per product in Admin → Products (portrait 4:5 looks best, same crop for all). The four home-page frames are `public/img/cat-*.svg`; replace them with 3:4 photographs of each counter and keep the file names, or redraw them with `node scripts/draw-images.mjs`.

## Checks

```sh
npm test                                   # boots the app on a temp DB, walks a purchase and the admin
node .claude/skills/taste-skill/scripts/lint.mjs src/views public/store.css
node .claude/skills/taste-skill/scripts/inspect.mjs http://localhost:3000/   # needs Chrome; CHROME_PATH=... if not found
node scripts/shots.mjs                     # screenshots of every page at desktop and phone width (needs Playwright)
```

## Design skills

`.claude/skills/` holds the design skills the site was built with, for Claude Code to use on future changes: Emil Kowalski's `animate`, `emil-design-eng`, `improve-animations`, `review-animations`, `animation-vocabulary`, `animation-performance`, `find-animation-opportunities`, `pick-ui-library`, `break-ui`, `prototype` (github.com/emilkowalski/skill) and Leonxlnx's `taste-skill`, `brandkit`, `redesign-skill`, `minimalist-skill`, `soft-skill`, `brutalist-skill`, `output-skill` (github.com/Leonxlnx/taste-skill). The dealt direction sheet is in `.taste-skill/direction.json`.
