# AGENT.md — how AI agents (and the /edit UI) edit this deck

This repo is the **source of truth** for the 爱搭云 GEO Deck. It is deployed to
Cloudflare Pages automatically on every push to `main`.

Two ways to edit:

1. **`/edit` web UI** (password-gated, recommended for PMs) — open
   `https://<project>.pages.dev/edit`, chat with OpenAI, save → auto-commits
   to this repo. See "/edit feature" section below.
2. **Direct git** (for engineers / coding agents) — clone, edit files
   below, `git push`. CF Pages redeploys in ~30–60s.

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

---

## /edit feature

`edit.html` + `edit-app.js` (frontend) + `worker.js` (Cloudflare Worker main
entry, routes `/api/*` to handlers in `functions/`) provide a password-gated
chat editor. Architecture in
[plan](../.claude/plans/review-repo-goofy-dongarra.md).

**Deployment mode**: this is a **Cloudflare Worker with Static Assets** (not
classic Pages Functions). `wrangler.jsonc` declares:
- `main: "./worker.js"` — server-side request handler
- `assets.directory: "."` + `.assetsignore` — everything else served as static
- `assets.run_worker_first: ["/api/*"]` — `/api/*` always hits the Worker first

When you add new server code, import it from `worker.js`. When you add new
static files (images, HTML, CSS), they're auto-deployed unless listed in
`.assetsignore`.

### Required CF Pages environment variables

Set in CF Dashboard → Workers & Pages → this project → Settings → Environment
variables (both Production and Preview):

- `EDIT_PASSWORD` — the shared password PMs use to unlock /edit
- `AUTH_SECRET` — random hex string (`openssl rand -hex 32`) for HMAC cookie
- `OPENAI_API_KEY` — `sk-...`
- `GITHUB_TOKEN` — fine-grained PAT scoped to this repo, with
  `Contents: Read & Write` + `Metadata: Read`
- `GITHUB_REPO` — `therealechan/aida_ppt_shanghai`
- `GITHUB_BRANCH` — `main`
- `DEFAULT_MODEL` *(optional)* — defaults to `gpt-4o`

### How saves work

Every Save in /edit becomes a **single git commit** via the GitHub Git Data
API, atomically updating `index.html` + `.image-slots.state.json` + any new
`uploads/<hash>.<ext>` images. This avoids double CF Pages rebuilds.

### Model selection

UI defaults to `gpt-4o`. `o1` / `gpt-5` / etc. are pickable but slow — they
will time out on CF Pages **Free** (30s CPU limit). Upgrade to **Paid** ($5/mo)
to bump CPU to 5 minutes before using reasoning models.

### What an editing agent should know

- Don't bypass `/api/save` validation: it preserves `<image-slot>` ids and
  rejects duplicate `data-screen-label`. If you're committing via git
  directly instead of through /edit, the same invariants still apply or you'll
  orphan image-slot state entries.
- `pending_uploads` in the save body must each include the full base64 image
  bytes (the upload endpoint does NOT write to git on its own — it only
  validates and hashes). All bytes ride along with the save call.
- AI output is structured JSON: `{ operations: [...], explanation: string }`
  with `op ∈ {replace, insert_after, insert_before, delete}`.
