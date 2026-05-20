# AGENT.md — how AI agents edit this deck

This repo is the **source of truth** for the 爱搭云 GEO Deck. It is deployed to
Cloudflare Pages automatically on every push to `main`.

## Source of truth

- `index.html` — the deck markup. Each `<section>` is one slide.
- `.image-slots.state.json` — sidecar that holds image-slot payloads keyed by
  slot id. `image-slot.js` reads it via `fetch()` at page load and renders the
  picture in the matching `<image-slot id="...">` element.
- `assets/`, `fonts/`, `uploads/` — referenced from `index.html` and from
  `colors_and_type.css` (`@font-face`). Add new files here and reference them
  by relative path.
- `deck-stage.js`, `image-slot.js`, `colors_and_type.css` — runtime; usually
  do not need editing.

## Common edits

**Change slide copy:** edit the matching `<section>` in `index.html`. Each
section has a `data-screen-label` attribute that doubles as a search anchor.

**Replace an image-slot image:** edit `.image-slots.state.json` and replace
the `data:image/...;base64,...` payload for that slot id. Keep the slot id
unchanged. If you have a new file on disk, the easier path is to drop it
into `uploads/` (or `assets/`) and edit the `<img src="...">` directly,
removing the corresponding `image-slot` entry.

**Add a new asset:** save it to `assets/` (logos, brand) or `uploads/`
(content imagery). Reference with a relative path: `<img src="assets/foo.png">`.
Cache headers in [`_headers`](_headers) treat both directories as immutable —
if you replace a file in place, change the filename so the cache busts.

## Never commit

- `*-standalone.html` or `*.bundle-src.html` — these are bundler artifacts.
  Only `index.html` lives in git. (`.gitignore` enforces this.)
- `*.pptx`, source design files — keep them somewhere else (Drive, R2).
- `debug/` screenshots.

## Local preview

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

`image-slot.js:594` detects the missing `window.omelette` runtime and
gracefully degrades to read-only — viewers see the rendered images, but
upload/drop UI is hidden. This is by design and is exactly what visitors
to the Cloudflare-hosted URL get.

## Deploy

Push to `main` → Cloudflare Pages auto-builds (no build step; pure static)
→ live in ~30–60s at `https://<project>.pages.dev`. PRs get a preview
deployment at a unique URL.

## Agent checklist

Before pushing:

1. Open `index.html` in a browser locally — no console errors, all images render.
2. `git status` — make sure no `*-standalone.html` or `*.pptx` slipped in.
3. Commit message references the slide / section changed.
4. Push. Watch the CF Pages deployment finish before sharing the URL.
