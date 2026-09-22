# Design System — MakerMesh

## Product Context

- **What this is:** MakerMesh reads a ceramics workshop's quote sentence by sentence and shows a
  café buyer what it actually commits to, what it leaves out, and what to ask before paying.
- **Who it's for:** café owners and buyers ordering custom handmade ceramics from small workshops.
- **Space:** sourcing and quote review. Peers in the All Gas Hackathon: Quote Arena, Bidzy,
  ReliefGrid, Get It in Writing.
- **Project type:** hybrid. A marketing landing page plus working app pages (café order, quote
  result, research).
- **The one thing to remember:** warm, crafted, trustworthy. Every decision below is tested
  against it.

## Aesthetic Direction

- **Direction:** editorial field guide. Paper, clay and ink; a well-made printed guide for people
  who buy handmade things, not a SaaS dashboard.
- **Decoration:** minimal. Typography, hairline rules and highlights do the work. No gradients,
  blobs, icon circles or drop shadows on content.
- **Signature:** annotation. Supplier words appear verbatim, highlighted in clay, with a margin
  note in MakerMesh's voice (see Components).
- **Reference preview:** `~/.gstack/projects/LukaJurisic-makermesh/designs/design-system-20260922/preview.html`

## Typography

- **Display:** Newsreader Variable ~380, optical sizing on (`--font-serif`, loaded in
  `src/main.tsx`). Landing hero 42–64px, line-height 1.04, tracking −2.5%, ink only (no italic
  accent line). Headings use `text-wrap: balance`.
- **Section headings:** Newsreader ~380, 34–52px, line-height 1.06, tracking −2.5%.
- **Voice:** Newsreader italic in clay, 16px and up only. Used for MakerMesh's plain-English
  reading of a supplier sentence (margin notes, "what it means"). Never for supplier text.
- **Body:** Geist Variable 400, 16–18px, line-height 1.65.
- **UI and labels:** Geist 550–600. Caps labels 12px, tracking +10%.
- **Figures:** Geist 550 with `font-variant-numeric: tabular-nums` for prices, quantities, days.
- **Minimum size:** 12px anywhere; 13px for metadata and captions.
- **Loading:** self-hosted `@fontsource-variable/geist` and `@fontsource-variable/newsreader`
  (see `src/main.tsx`).

## Color

- **Approach:** restrained. Warm neutrals fill the page; color is rare and means something.
- **Canvas** `#f3efe7` · **Surface** `#fbfaf6` · **Paper** `#fffdf8` (letters, quoted text)
- **Ink** `#1d1d1a` · **Ink soft** `#45433d` · **Muted** `#706c63`
- **Border** `#ded8cc` · **Border strong** `#c8c0b2`
- **Clay** `#a64f36` — primary action, highlights, annotation voice. **Clay soft** `#f1ded5`.
- **Highlight** clay at 24% (`rgb(184 95 67 / 0.24)`) — only on verbatim supplier words.
- **Teal** `#246a63` — only "confirmed" or "fits" states, and focus rings.
- **Semantic:** success `#35735b`, warning `#8b5d1e`, danger `#a64c43`, unknown `#67635c`.
- **Dark mode:** none. The paper metaphor is the product; the app rail is the only dark surface.

Tokens live in `src/styles/tokens.css`.

## Spacing

- **Base unit:** 8px. **Density:** comfortable.
- **Scale:** 4, 8, 16, 24, 32, 48, 64, 96.

## Layout

- **Approach:** hybrid. Editorial asymmetry on the landing page (copy left, artifact right);
  calm single-column reading on app pages.
- **Max content width:** 1440px for full-bleed bands, 1280px for content, 960px for reading.
- **Radius:** `--radius-sm` 4px (buttons, controls), `--radius-md` 8px (fields, small panels),
  `--radius-lg` 12px (cards), full for status pills. Nothing else.
- **Depth:** flat. Hairline 1px rules, 2px ink rule to open a list. Drop shadows only on
  overlays (drawers, dialogs, the Passport modal).

## Motion

- **Approach:** intentional, one vocabulary called "ink".
- **Highlight sweep:** background-size 0 → 100%, 0.8s, `cubic-bezier(0.2, 0.7, 0.2, 1)`,
  staggered 0.5s, once per page load.
- **Note in:** opacity and 6px slide, 0.45s ease-out, after its highlight.
- **UI transitions:** 180–240ms ease-out; no bounce.
- **Reduced motion:** show the final state, no animation.

## Components

- **Annotated letter** (`.quote-letter`, `src/styles/annotation.css`): a paper column of verbatim
  text with `<mark>` highlights; each row can carry a margin note (`.quote-note`: caps label +
  voice line). On phones the note drops beneath its paragraph inside the paper.
- **Inbox address:** bordered field with the address as a mailto link and an attached Copy button.
- **Ways-in ledger:** 2px ink rule, numbered rows, serif row titles, underlined clay actions.

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-09-22 | Codified v2 system in root DESIGN.md | /design-consultation after the landing redesign; supersedes the token list in docs/DESIGN_SYSTEM.md |
| 2026-09-22 | Annotation is the signature component | Verbatim supplier words + margin note is the product's trust signal; used on landing and quote pages |
| 2026-09-22 | Clay italic serif as MakerMesh's voice | Separates the supplier's words from MakerMesh's reading at a glance |
| 2026-09-22 | Radius scale 4/8/12, 12px text minimum, shadows only on overlays | Audit found 11 radii, 9–11px text and content drop shadows; all eroded "crafted, trustworthy" |
| 2026-09-22 | Landing display face → Newsreader; hero headline ink-only | User flagged Instrument Serif + clay italic accent line as AI-slop; Newsreader reads as a printed guide. Scoped to the landing so app pages are untouched |
| 2026-09-22 | Below-hero sections share the hero's 1440/5%/0.9–1.1 grid; photos become captioned plates | Left edges jumped between 1440 and 1280 frames; gradient-overlay captions and floating crops read as stock |
| 2026-09-22 | Newsreader everywhere; example sources shown as "example source n" / "Example record"; numbered lists use plain numerals | App-page deslop pass: one display face site-wide, no build-time fixture names or .invalid domains in the UI, no tinted number circles, no content shadow on the Profile card |
| 2026-09-22 | Homepage is the v3 "Thrown" page (`src/pages/v3/`); v2 kept at `/v2` | A scroll-driven three.js cup is thrown and fired while the French reply is read sentence by sentence; motion stays in the ink vocabulary (highlight sweep, drawn ink band, drawn route line). Reduced motion stops the wheel |
| 2026-09-22 | Skipped paper grain texture | Least trust gain for the most risk this close to the deadline; revisit later |
