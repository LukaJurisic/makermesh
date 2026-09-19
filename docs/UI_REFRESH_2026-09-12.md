# Buyer workspace UI refresh

Implemented following the approved Attio/Omnea reference direction. Existing paper, clay,
teal, Geist, and Instrument Serif identity is preserved. This refresh is local and has not
been uploaded to the public development site.

## What changed

- One primary navigation per viewport. The desktop rail contains project context; mobile
  uses stage links. Completed states come from actual visitor state, not the page visited.
- Compact fictional-maker disclosure with detailed provenance and System Pulse in “About
  this demo.” A contextual next step replaces persistent headline fixture metrics.
- Searchable maker directory with working location and quote-availability filters, clear
  empty states, and consistent production facts.
- Maker dossiers group requirements, capabilities, evidence, quote terms, and messages.
  Captured Atlas uses the published reply; evidence links open exact excerpts without
  exposing mailbox addresses or producing empty source URLs.
- Comparison leads with commercial facts and requirements; weights are compact, methodology
  expands on demand, and full reply evidence opens in a drawer. Mobile uses labelled records.
- Captured replies lead the Outreach page. Fixture approval rehearsal remains explicitly
  separate and cannot send email.
- Request composer saves editable drafts on the device and restores them after reload.
  It no longer silently replaces arbitrary input with the café example. Live sourcing for
  new requests is not enabled, and this limitation is visible.
- Landing copy emphasizes the buyer's task; the fixture metric strip is replaced by a quiet
  example-project introduction. Removed nonfunctional edit/retry controls in touched views.
- Drawers respect reduced motion and restore focus to the initiating control.

## Validation

- `npm run check`: formatting, lint, frontend/backend types, 91 tests, production build.
- `npm run test:e2e`: 11 passed, 5 intentional duplicate visual/social skips. Covers the
  existing story plus draft persistence and maker filtering on desktop and mobile.
- Captured-reply local browser checks at 1440×900, 1280×800, 768×1024, and 390×844:
  no page overflow or browser errors; original message accessible; drawer focus restored.
- Review screenshots in ignored `artifacts/redesign.local/`; no third-party reference
  imagery was added to application assets.

## Boundaries and follow-up

No backend functions, permissions, provider flags, emails, or public publication were changed
for this UI pass. Local preview uses the already published sanitized Convex data and normal
visitor overlays. The current public site still has the preceding UI. After accepting this
design, upload the frontend and repeat the public journey check. The existing 2:32 video
shows the previous UI and should be replaced before final submission.
