# Site refinement — September 22

The user asked for an ordinary buyer-facing website and explicitly rejected AI/product
jargon such as “evidence”. Applied copywriting and design-consultation guidance using the
existing design system; no new brand, fonts, image generation or backend was introduced.

## What changed

- Rebuilt the homepage around a concrete task: finding Moroccan ceramics workshops for a café.
  Large unboxed craft imagery, a short three-step explanation and one worked café order replace
  the abstract manifesto, technical feature sections and prominent Passport pitch.
- Simplified navigation to Order, Sources, Workshops, Messages, Quote and Profile. Removed
  redundant heading layers, stage numbers, uppercase labels and repeated demo chrome.
- Revised working-page copy to original replies, quoted terms, sources and questions. Technical
  implementation details remain in the optional project explanation rather than the buyer flow.
- Added Try 400 cups beside Try 30 days. Changed quantities retain the reconfirmation behavior.
- Added Save research notes to complete private research, including zero-result runs. The local
  Markdown contains request fields, source URLs/dates/quotations and all confirmation questions.
  Public snippets never remove exact-order questions. Browser-blocked downloads expose full
  selectable notes; unsafe URL schemes and query credentials are not exported.
- Refreshed the social preview to match the homepage. No social post was published.

## Copy decisions

Selected headline: “Find a workshop for your café’s next cups.” It names both the buyer and
the task. “Know what the workshop can commit to” was too abstract as a homepage opening.
The brand line “A market appears when you ask” remains in the footer, not the main promise.
Primary action: Find a workshop. Secondary action: See a café order. The example is explicitly
fictional; the real send/receive test is described plainly as using our own inboxes.

## Validation

Full check:126 tests, formatting, lint, types and build pass. Relevant E2E:11 applicable cases
passed across the complete run and a corrected tab-label rerun;5 intentional skips. The
homepage, request form, quote and workshop directory were checked at1440,1280,768 and390px:
no horizontal overflow, no browser errors, no axe WCAG A/AA violations. Desktop/mobile
screenshots inspected. The new research-note download was tested with controlled component
fixtures and formatter cases; no new paid research run or email was triggered.

Source scan:271 working files and18 pre-release commits, zero high-confidence credential
matches. Private screenshots/tests remain ignored. All assets reuse existing provenance.

## Release boundary

Frontend uploaded to the existing approved development host. No backend change, source
push/public visibility change, social post or final submission. Video intentionally untouched
at the user's request: the old recording is now visually out of date. Next: review the hosted
site, then improve/re-record the video. Eligibility and publication confirmations remain open.
