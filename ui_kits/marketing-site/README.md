# Marketing Site — Beansmile UI Kit

A click-through recreation of beansmile.com's homepage, built with React + Babel (no build step).

## Components

- `Header.jsx` — sticky top nav with scroll border, language picker, and CTA
- `Hero.jsx` — "Deliver the best." headline, product visual card, stamps row
- `Clients.jsx` — logo wall (15 brands)
- `Capabilities.jsx` — 6-card grid of service pillars with modal detail
- `Team.jsx` — team pillars + stat block + sponsor callouts
- `Contact.jsx` — 3-office contact list + form; footer with dark bg

## Run

Open `index.html` in a browser. All components register themselves on `window` so each file can be loaded independently via `<script type="text/babel">`.

## Source of truth

- **Copy:** lifted verbatim from https://www.beansmile.com/ where possible
- **Colors:** pulled from `../../colors_and_type.css` (bean green #06AA65)
- **Layout:** follows Beansmile's info architecture — Hero → Clients → Capabilities → Team → Stats → Contact → Footer

## Known placeholders

- Client tiles use typeset names instead of real logos (CDN fetch blocked)
- Hero visual uses an abstract mock instead of the real product screenshot
- Capability cards use gradients + labels instead of the real photography

Swap these for real assets when they're available.
