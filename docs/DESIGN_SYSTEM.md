# MakerMesh design system

> Superseded for tokens, scale and components by the root [DESIGN.md](../DESIGN.md). This file keeps the history and rationale.

## Visual thesis

A sun-warmed editorial field guide meets a precise sourcing instrument: tactile paper,
clay, ink, and quiet operational density without marketplace kitsch.

## Content plan

1. Landing: a clear ceramics task, one large workshop illustration, and a request action.
2. Process: describe the order, explore workshops, and make sense of a reply.
3. Example: the Harbour café order, with price and timing in ordinary buyer language.
4. Final action: start a request. Project/integration details belong in the optional drawer.

Application surfaces begin with working context and status—not marketing banners.

## September 22 refinement

The user explicitly requested a more natural product and rejected technical words such as
“evidence” in customer-facing copy. Use “original wording,” “quoted terms,” “sources,” and
“what to ask” where they accurately describe the task. Keep internal model names unchanged.
Avoid abstract promises, repeated eyebrow labels, feature manifestos and decorative metrics.

The homepage pairs plain copy with an unboxed workshop image, then a short process and one
worked order. Keep Geist and Instrument Serif, the paper/clay/teal palette, and current
licensed/generated imagery. Images are illustrations, not supplier documentation. Desktop
uses two columns; mobile presents the request before the image and stacks the example.
Functional pages show one main heading, readable field labels and a compact original reply.
The example boundary stays explicit; simpler wording must never imply a real supplier offer.

Safe choices: familiar request/action labels, visible quoted terms, current font/color tokens.
Deliberate departures: fewer feature sections and technical explanations; a product-first
homepage rather than a judge-facing integration tour. This gains clarity at the cost of less
immediate technical detail, which remains available in About this demo and the build log.
Preview through the running app; the optional gstack image designer is unavailable.

## September 22 landing redesign

The hero is now the product's artifact: the captured Atlas reply set as a letter, with its
real sentences highlighted and margin notes explaining what each commits to. Headline: "The
quote says 30 days. Read the small print." The quote inbox address sits under the primary
action with a copy button (shown only while the inbox is switched on). Below it, one
"Three ways in" ledger replaces the process list and both closing CTA bands. Highlights sweep
in once on load (staggered 0.5s); reduced motion shows the final state. On phones each note
drops beneath its paragraph inside the letter. Chosen over a says/means ledger hero and an
inbox-first hero after a competitor review of the All Gas entries.

## Interaction thesis

- The landing compilation line assembles once as the visitor enters.
- New supplier and evidence state changes use 180–240ms layout transitions.
- Drawers and the Passport use deliberate depth and focus transitions with no bounce.
- `prefers-reduced-motion` removes nonessential movement.

## Tokens

```css
--canvas: #f3efe7;
--surface: #fbfaf6;
--surface-raised: #ffffff;
--ink: #1d1d1a;
--ink-soft: #45433d;
--muted: #706c63;
--border: #ded8cc;
--border-strong: #c8c0b2;
--terracotta: #b85f43;
--terracotta-contrast: #a64f36;
--terracotta-soft: #f1ded5;
--teal: #246a63;
--teal-soft: #dcebe7;
--teal-on-dark: #8fc9bf;
--ochre: #b28a46;
--ochre-soft: #eee4cf;
--ochre-on-dark: #dfb878;
--success: #35735b;
--warning: #9a6a24;
--danger: #a64c43;
--unknown: #77736b;
--unknown-on-dark: #c9c3b8;
```

Warm neutrals occupy most of every viewport. Terracotta marks primary action, teal marks
confirmed or live system state, and ochre marks attention. Semantic meaning always has a
text or icon companion.

## Typography

- UI/body: Geist Variable, 14–16px.
- Editorial display: Instrument Serif, 40–72px depending on context.
- Data: Geist with tabular numerals.
- Metadata: 12–13px, never below accessible contrast.

Use no more than these two families. Headings use sentence case.

## Layout

September 12 buyer-workspace refinement, following the approved external-reference direction:
the 232px desktop rail is the primary navigation; smaller screens use a single horizontal
stage navigation. Execution details and System Pulse live in the on-demand “About this demo”
drawer. A compact fictional-data disclosure remains visible. Headline fixture metrics no
longer occupy every product screen. The main workspace leads with a task and relevant facts.

- Recording target: 1440 × 900.
- Application rail: 232px; project header: 76px desktop / 64px mobile; System Pulse is on demand.
- Main workspace: disciplined 12-column grid.
- Standard cards: 12px radius; large drawers: 16px; controls: 8–10px.
- Thin rules and surface contrast precede shadows.
- At 768px, the right rail collapses and matrices become structured stacks.
- At 390px, navigation becomes a compact sheet while all core actions remain reachable.

## Component principles

- Cards exist only for discrete interactive records, not as universal layout wrappers.
- Evidence indicators always open a source or message excerpt.
- Unknown is neutral and explicit; it never resembles success.
- Consequential outreach uses a full-height approval drawer with recipient provenance,
  exact questions, bilingual copy, warning, and final approval.
- The Passport feels like a dossier, not a seller listing.

## Imagery

Use original MakerMesh editorial imagery by default. Generated imagery may illustrate the
fictional demo but never serve as evidence or imply a relationship with a real supplier.
Supplier imagery appears only with clear licensing or permission. Record every asset in
`CREDITS.md` and store optimized WebP or AVIF locally.

## Accessibility

- WCAG AA contrast for core text and controls.
- Dedicated contrast tokens preserve the accent palette on dark and small-text surfaces.
- Visible focus rings, semantic headings, named controls, and keyboard-complete drawers.
- `aria-live` progress for crawl, delivery, and extraction state.
- Accessible table markup plus a narrow-screen structured alternative.
- Minimum 44px touch targets where practical.
