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

Hosted on **Vercel**. Push to `main` → Vercel auto-builds (no build step; static
files + Edge functions in `api/`) → live in ~30–60s at `https://<project>.vercel.app`.
PRs get a preview deployment at a unique URL.

## Agent checklist

Before pushing:

1. Open `index.html` in a browser locally — no console errors, all images render.
2. `git status` — make sure no `*-standalone.html` or `*.pptx` slipped in.
3. Commit message references the slide / section changed.
4. Push. Watch the Vercel deployment finish before sharing the URL.

---

## /edit feature

`edit.html` + `edit-app.js` (frontend) + `api/*.js` (Vercel Edge functions)
provide a password-gated chat editor. Architecture in
[plan](../.claude/plans/review-repo-goofy-dongarra.md).

**Deployment mode**: **Vercel** static hosting + **Edge functions**.
- `api/*.js` — thin Edge entry points (`export const config = { runtime: "edge" }`).
  Each injects `process.env`, runs `requireAuth` (except `api/auth.js`), then
  delegates to the shared handler in `functions/api/*.js`.
- `functions/api/*` + `functions/lib/*` — the actual request logic (Web-standard
  `Request`/`Response`, reused verbatim from the original implementation).
- `vercel.json` — `cleanUrls: true` (so `/edit` serves `edit.html`) + cache headers.

When you add a new endpoint, create `api/<name>.js` (Edge entry) and put the
logic in `functions/api/<name>.js`. Static files (images, HTML, CSS) auto-deploy.

### Required Vercel environment variables

Set in Vercel Dashboard → this project → Settings → Environment Variables
(Production + Preview):

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
`uploads/<hash>.<ext>` images. This avoids double Vercel rebuilds.

### Model selection

UI defaults to `gpt-4o`. `o1` / `gpt-5` / etc. are pickable but slow. On Vercel
**Hobby**, Edge functions must respond within ~25s — fine for `gpt-4o` editing a
single slide, risky for reasoning models on large slides. Upgrade to **Pro** for
longer-running functions before relying on `o1`/`gpt-5`.

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
