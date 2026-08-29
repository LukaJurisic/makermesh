# MakerMesh working agreement

MakerMesh is a standalone React, Vite, TypeScript, and Convex application for the
2026 Convex All Gas Hackathon. Do not copy from or modify the parent Webcafe app.

## Product and safety invariants

- The ceramics demo is the frozen initial wedge.
- Atlas Clay Studio is always labelled as a fictional demonstration supplier.
- Identifiable real suppliers may show public facts and unknowns, but never public
  grades, failures, negative rankings, qualification labels, quotes, or passports.
- AI extracts structured data; deterministic TypeScript evaluates requirements and
  ranking. Unknown values never earn points.
- No email is sent without explicit buyer approval. Hackathon sends are restricted to
  controlled allowlisted recipients.
- Never expose secrets, private email addresses, raw provider identifiers, or personal
  contact data in client code, fixtures, screenshots, logs, or public snapshots.
- Privileged functions must enforce operator authorization server-side.

## Design invariants

- Follow `docs/DESIGN_SYSTEM.md` and the CSS tokens in `src/styles/tokens.css`.
- Use Geist for UI, Instrument Serif for editorial headings, and tabular numerals for data.
- No emojis, particle backgrounds, cultural stereotypes, generic dashboard mosaics, or
  unmodified component-library styling.
- Inspect rendered output at all required viewports before calling a screen polished.

## Quality gate

Run `npm run check` and the relevant Playwright flows after meaningful changes. Keep
external integrations behind typed adapters and do not claim they work until exercised.

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->
