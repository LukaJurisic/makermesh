# MakerMesh design system

## Visual thesis

A sun-warmed editorial field guide meets a precise sourcing instrument: tactile paper,
clay, ink, and quiet operational density without marketplace kitsch.

## Content plan

1. Landing hero: unmistakable brand, demand-first promise, two actions, one live compilation visual.
2. Support: start with demand, ask only what is missing, preserve the evidence.
3. Detail: command-centre preview showing research, questions, and source-backed claims.
4. Final action: a premium Mesh Passport preview and demo entry.

Application surfaces begin with working context and status—not marketing banners.

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

- Recording target: 1440 × 900.
- Application rail: 232px; project header: 64px; System Pulse: 320px.
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
