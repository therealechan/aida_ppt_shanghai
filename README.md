# Beansmile Design System

A design system reconstruction for **Beansmile** — a Guangzhou-based software studio specializing in tech solutions for the Chinese market (WeChat mini-programs, Web, iOS/Android, and AI-driven projects).

> "Deliver the best." — Beansmile's tagline from [beansmile.com](https://www.beansmile.com/)

---

## Company context

Beansmile has 10+ years of experience, 200+ projects, 100+ clients, across 10+ countries. Core pillars from their site:

1. **Beansmile E-commerce Engine** — proprietary stack integrating APP + WeChat mini-program + Web for brands like NBA, Mead Johnson, Dettol, Durex.
2. **Overseas E-commerce Projects** — cross-cultural, locally compliant global rollouts.
3. **Shopify Solutions** — certified partner, theme customization, app ecosystem integration.
4. **Pioneer of the AI Era** — smart tools & products like **LOOKyahAI**.
5. **Full-Industry Solutions** — social, finance, education, transportation, auctions.
6. **WeChatHub** — overseas ticketing for Chinese tourists.

Offices in **Guangzhou (Tianhe)**, **Hong Kong (Tsim Sha Tsui)**, and **Tokyo (Shibuya)**. They sponsor **Ruby Conference** and the **Vue.js community**.

Key clients: Google, NBA, WeChat, Douyin, Zeiss, Visa, Sixt, Mead Johnson, Durex, Three Squirrels, Calvin Klein, Dettol, VW, Flexform, Global Express.

## Sources used to build this system

| Source | Where it lives |
|---|---|
| Uploaded logo PNG | `uploads/beansmile.png` → `assets/beansmile-wordmark.png` |
| beansmile.com (homepage) | https://www.beansmile.com/ (text fetched for copy/tone) |
| Brand green extracted from logo | `#06AA65` (sampled from wordmark fill pixels) |

> **Note for the reader:** The project did not have direct access to Beansmile's Figma files, production codebase, or raw photography assets. The remote CDN (`beansmile.com/assets/...`) could not be fetched from this sandbox, so imagery is represented as **placeholders** styled to match the site's visual language. Replace any `assets/placeholder-*` file with the real asset when available.

---

## Index

```
/
├── README.md                   ← you are here
├── SKILL.md                    ← Agent Skills manifest
├── colors_and_type.css         ← CSS variables (colors, type, spacing, shadow, motion)
├── assets/                     ← logos, wordmark variants, generic imagery
├── preview/                    ← Design System tab cards (Type / Colors / Spacing / Components / Brand)
└── ui_kits/
    └── marketing-site/         ← Beansmile.com-style clickable UI kit
        ├── index.html
        ├── *.jsx               ← components (Header, Hero, Capabilities, Footer, ...)
        └── README.md
```

---

## Content fundamentals

**Voice & tone.** Confident, outcome-oriented, pragmatic. Beansmile writes like an experienced partner pitching a capability: direct claims backed by numbers ("200+ Projects Completed"), no filler adjectives, no startup-speak. Slight formality — this is B2B enterprise copy aimed at brand marketing leads.

**Pronouns.** First-person plural — **"we"** throughout ("we have the full-industry solutions", "we offer comprehensive WeChat services"). The reader is addressed as **"you"** ("what we can do for you"). Never "I".

**Casing.** Sentence case for most headings. Title Case only on short labels ("Let's Talk", "Learn More", section eyebrows like "Publication", "Portfolio"). All caps only for tags/eyebrows (never body).

**Cadence.** Short, punchy hero lines. Body paragraphs are 1–3 sentences, scannable. Feature lists use 2–4 word noun phrases, not full sentences:
- "Modularity and Customization"
- "Scalability and Performance"
- "Cross-Cultural Composition and Communication"

**Specificity.** Real client names, real numbers, real office addresses. This is a trust-through-proof brand, not a hype brand.

**Emoji.** Not used. Not on the site, not in marketing materials. Avoid them entirely.

**Punctuation in display copy.** **Drop the trailing period on display-level text** (h1 / h-big / display / h-1 / h-2 / h-3, and any oversized hero/section headline). Keep question marks and exclamation points where intentional — they carry meaning that periods don’t. Applies to both Chinese (。) and English (.).

- ✅ 让 AI 主动推荐你的品牌
- ❌ 让 AI 主动推荐你的品牌。
- ✅ GEO 是什么？  *(keep the question mark)*
- ✅ Deliver the best

Body copy, footnotes, captions, and bullet items keep normal sentence punctuation — this rule is for *display* type only.

**Chinese + English.** The site is bilingual; Chinese copy uses the same tone, set in **Noto Sans SC** (a Google Fonts substitute — see *Font substitutions* below). WeChat-related terms stay as "WeChat" (never "微信公众号" in English contexts unless a direct reference).

**Example hero copy from the site:**
> "Deliver the best! — Specializes in tech solutions for entering the Chinese market, including WeChat Mini-program, Web, Mobile Apps, and AI-driven projects."

**Example CTA labels:** "Let's Talk", "Learn More", "Contact Us". No "Get Started Free", no "Book a Demo Now →".

---

## Visual foundations

### Color

- **Single dominant brand color: `#06AA65` (bean green).** Everything else is neutral. The site does not use a second vibrant accent; the green is the show.
- **Neutrals are slightly cool-warm** — near-black forest `#0C1316` for ink on dark, off-white `#F7F9F8` for subtle bg.
- **Status colors** (amber/coral/sky) exist in the system but are used rarely — mostly in product UIs, not marketing.
- **Gradients:** avoided. The site is flat with occasional soft radial glows behind the hero.

### Type

- **Inter** for all Latin UI/display text (Beansmile's site uses a similar geometric sans).
- **Noto Sans SC** for Simplified Chinese — matches Inter's proportions.
- **JetBrains Mono** for code and technical callouts (engineering studio signal).
- Display weights are **700–800** (bold/black), body is **400**, UI emphasis is **500–600**.
- Tight letter-spacing on headings (`-0.02em` to `-0.03em`), normal on body.
- Generous line-height on body (1.55), tight on headings (1.1–1.2).

**Display headline rhythm.** Heading line-heights in the token set (`0.98` for display, `1.02` for h-big, `1.05` for h-1) are tuned for **one to two lines**. When a display headline wraps to three or more lines, **loosen line-height to `≥1.10`** before reaching for a smaller font size — the cramped feeling almost always comes from leading, not type scale. Pull font size down only after line-height is already breathing.

**Inline highlight pills.** When wrapping a word in a tinted/colored pill inside a heading (e.g. `<em class="underline">` with a background + padding + border-radius), the pill's box extends past the cap-height of its line. With tight heading leading (≤1.05), that box visually **overlaps the line above** — looking like a stray highlight stuck on the previous word.

Rules for any inline element with a background fill inside a display heading:

- The host heading must use **`line-height ≥ 1.15`** — not the default display `0.98`.
- Size the pill in **em units**, not px (`padding: 0.08em 0.18em; border-radius: 0.14em`). It scales with the headline and doesn't need re-tuning per slide.
- Set `display: inline-block; line-height: 1` on the pill so its box matches the glyphs, not the line-box.
- Add `box-decoration-break: clone` (and the `-webkit-` prefix) so a wrapping highlight repaints per line instead of opening a gap.
- If the pill must sit inside a tight heading you can't loosen (rare), drop the background entirely and use color + weight as the accent instead.

### Backgrounds

- Mostly **pure white** or `--ink-50`. Long-form pages sit on white with wide margins.
- One hero-level accent: a **soft radial glow** of `--bean-100` fading into white, positioned top-right.
- Full-bleed imagery reserved for **capability cards** and the **world map** in the footer.
- No repeating textures, no grain, no hand-drawn illustrations. Imagery = photographs of team/work + branded diagrams.

### Borders, radii, shadows

- Card corners: **16px (`--radius-lg`)**. Smaller chips: **8–12px**. Buttons: **pill (`--radius-pill`)** or **12px**.
- Hexagon motif (from logo) can be referenced in decorative clip-paths — use sparingly.
- Borders are 1px, `--ink-200`. Used on inputs, cards-without-shadow, dividers.
- Shadow system is **subtle to medium** — no heavy drops. Key elevations:
  - `--shadow-sm` — cards on hover
  - `--shadow-md` — overlays, dropdowns
  - `--shadow-brand` — the green CTA ("Let's Talk")

### Motion

- **Easing:** `cubic-bezier(0.22, 1, 0.36, 1)` for entrance, `cubic-bezier(0.65, 0, 0.35, 1)` for two-way.
- **Durations:** 120ms micro, 200ms base, 360ms feature (hero reveal, modal).
- **No bounce, no spring.** No parallax. Entrances are simple fade + 8–12px translate.
- Hover: **opacity drop to 0.9** or **background tint one step darker**. No scale animations on buttons.
- Press: **background one step darker**, no shrink.

### Layout

- **Max content width:** 1200px, with 24–32px side gutters on desktop.
- **Vertical rhythm:** section spacing = 96–128px on desktop, 64–80px on tablet.
- **Grid:** 12-col, 24px gutter.
- Fixed top nav: 72px tall, white with a 1px `--ink-200` bottom border on scroll.

### Transparency & blur

- Used **only on the sticky nav** once scrolled — `backdrop-filter: blur(12px)` with 80% white background.
- Not used on cards or overlays.

### Imagery vibe

- Warm daylight. Team photos, cityscape shots (Guangzhou, HK, Tokyo).
- Subtle green color grade when overlaid on brand sections.
- No black-and-white, no grain.

---

## Iconography

Beansmile's site doesn't ship a custom icon font. The iconography signal is: **sparse, utilitarian, not decorative**.

**This system uses:**
- **Lucide** (https://lucide.dev) via CDN — clean 2px-stroke outline icons. Matches the geometric sans feel of the wordmark. Example CDN tag:
  ```html
  <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
  ```
- **Brand assets** as raster/vector files in `assets/` — the only "icons" Beansmile itself uses extensively are **client logos**, displayed in a grid on the homepage.
- **Hexagon-bean mark** (`assets/logo-mark.png`) — decorative brand anchor, not a functional icon.

**Not used:** emoji (🚀, 💡, etc.), Unicode glyph icons (★, ✓), hand-drawn SVGs, colored gradient icons. If a checkmark is needed, use Lucide's `check` icon in `--bean-500`.

> ⚠️ **Substitution flag:** client-logo imagery and capability photography could not be downloaded from beansmile.com's CDN during system generation. `assets/clients/` contains **placeholder tiles** with the brand name typeset — swap them when you have the real logos.

---

## Font substitutions

| Beansmile uses | This system uses | Reason |
|---|---|---|
| A rounded geometric sans on the wordmark | **Inter** (local variable font, `fonts/InterVariable.ttf`) | User-provided; closest match to the wordmark's proportions |
| A CJK font for Chinese | **Noto Sans SC** (Google Fonts) | Matches Inter's weights; ships all CJK weights. Replace with local file if preferred. |
| Monospace | **Input Mono** (local, `fonts/Input-*.ttf`) | User-provided; warm, readable code face |
| Optional condensed display | **Khand** (Google Fonts) | Added by request — use for poster-style headlines, big stats, numeric callouts. Available as `var(--font-display-condensed)`. |

**Fonts folder:**
```
fonts/
├── InterVariable.ttf          ← primary sans (variable weight 100–900)
├── InterVariable-Italic.ttf
├── Inter.ttc                  ← static fallback collection
├── Input-Regular.ttf          ← monospace
├── Input-Italic.ttf
├── Input-Bold.ttf
└── Input-BoldItalic.ttf
```

All wired via `@font-face` at the top of `colors_and_type.css`. Noto Sans SC still pulled from Google Fonts CDN for Chinese coverage — drop a local file in `fonts/` and add an `@font-face` block if you want to go fully offline.

---

## Using this system

**In an HTML artifact:**
```html
<link rel="stylesheet" href="colors_and_type.css" />
<style>
  .btn-primary {
    background: var(--bean-500);
    color: var(--fg-on-brand);
    padding: 12px 24px;
    border-radius: var(--radius-pill);
    box-shadow: var(--shadow-brand);
  }
</style>
```

**In a design prototype:** see `ui_kits/marketing-site/index.html` for a reference implementation.

---

## UI kits

- **`ui_kits/marketing-site/`** — Beansmile.com-style marketing page (header, hero, client logo wall, capabilities grid, team section, stats, footer). Click-through interactive.

Additional kits (product dashboards, WeChat mini-program, mobile app) can be added when source code or Figma access becomes available.
