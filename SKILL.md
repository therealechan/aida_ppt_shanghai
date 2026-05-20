---
name: beansmile-design
description: Use this skill to generate well-branded interfaces and assets for Beansmile, either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Quickstart

1. Start from `colors_and_type.css` — it defines every color, type, spacing, radius, shadow, and motion token. Import it into your HTML.
2. Review `README.md` for voice/tone, visual foundations, iconography rules, and substitution flags.
3. For a full reference implementation, see `ui_kits/marketing-site/index.html`.
4. For component previews, browse `preview/*.html`.

## Essentials

- **Primary brand color:** `#06AA65` (bean green) — use `var(--bean-500)`.
- **Type:** Inter for Latin, Noto Sans SC for Chinese, Input Mono for code.
- **Voice:** confident, outcome-oriented, "we/you". No emoji. No hype words.
- **Imagery:** warm daylight photography of team/work. No AI slop gradients.
- **Icons:** Lucide via CDN, or the hexagon/bean brand mark from `assets/`.
