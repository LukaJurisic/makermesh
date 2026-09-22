# Hackathon log

- **Project:** MakerMesh
- **Event:** Convex All Gas Hackathon sponsored by OpenAI, Firecrawl, and AgentMail
- **What it does:** Compiles a sourcing brief into an evidence-backed maker network, identifies unanswered requirements, and structures buyer-approved supplier replies.
- **Live app:** https://disciplined-ladybug-82.convex.site — custom research plus a labelled captured-email demonstration, on the development deployment
- **Repo:** https://github.com/LukaJurisic/makermesh (public)
- **Submission:** https://vibeapps.dev/s/makermesh (VibeApps, submitted 2026-09-22 ~10:15 ET)
- **Demo video:** https://disciplined-ladybug-82.convex.site/demo.html (90-second Hyperframes MP4; direct file: https://disciplined-ladybug-82.convex.site/media/makermesh-demo.mp4)
- **Frontend:** Convex static hosting
- **Convex deployment:** development — disciplined-ladybug-82 (production not deployed)
- **Components:** @convex-dev/rate-limiter, @convex-dev/workflow, @firecrawl/firecrawl-convex, @agentmail/convex, @convex-dev/static-hosting
- **Convex features:** schema, tables, indexes, queries, mutations, actions, HTTP actions, scheduled functions, crons, realtime queries
- **Auth:** Convex Auth
- **AI models:** gpt-5.6-luna (live Responses API brief compilation exercised)
- **Started:** 2026-08-29T14:07:45.2228690Z
- **Last updated:** 2026-09-22

## Log

### 2026-09-22 — public release

Made the repository public and published the 90-second Hyperframes video on the Convex
static site with music attribution. Verified isolated playback (1920×1080, 90 s). Luma
registration confirmed by the entrant. Feature freeze in effect. Entrant confirmed solo, 18+, Ontario. VibeApps entry submitted
and verified live at https://vibeapps.dev/s/makermesh with the AllGasHackathonSubmission tag.
Only the sponsor-tagged social post remains.

### 2026-09-22 — buyer-facing site refinement

Rebuilt the homepage around a concrete café order and simplified navigation, quoted terms,
source descriptions and questions. Added a 400-cup shortcut to demonstrate why an altered
order needs supplier reconfirmation. Completed private research can now be downloaded as
notes with the buyer's request, source links/dates, original wording and every confirmation
question. Public website statements are never treated as confirmation of the exact order.

Frontend deployed to the existing development site. Full check passes 126 tests; all 11
applicable E2E cases pass across the run and corrected-label rerun, with 5 intentional skips.
Four pages at four viewports pass overflow and automated accessibility checks. No new email
or paid provider request. The prior video needs updating to match this site; video work is
deferred until after the user reviews the site. Submission/publication steps remain pending.

### 2026-09-19 — interactive purchasing decision

Implemented a local scenario over the captured fictional Atlas quote using Luna subagents
for domain logic, UI and regression tests, followed by primary-agent integration/review.
The buyer can tighten the production limit, inspect the exact French sentence, prepare
clarification questions and download a Markdown decision brief. The original 200-cup
quote and 42-day brief remain unchanged; 30–35 days starts after sample approval. A changed
quantity makes price/capacity/timing reconfirmation explicit rather than inventing a quote.
Custom research links to this separate example without attaching Atlas evidence to real leads.

Verification: 119 tests and full check pass; 11 applicable E2E cases pass after correcting
the social-card test's headline expectation, with 5 intentional skips. The decision browser
checks cover export content, invalid quantity recovery, keyboard focus, reduced motion and
four viewport axe checks without violations. No additional email or paid provider call.

### 2026-09-19 — custom requests and release verification

Deployed the buyer-focused workspace and a real custom Moroccan-ceramics research path.
OpenAI compiles a request; the buyer approves the exact reviewed brief; a durable Convex
workflow runs bounded bilingual Firecrawl search and retrieval, then source-span extraction.
Four live requests exercised the flow and improved search relevance. Results are leads
with attributed facts and confirmation questions, never public real-supplier grades.

Added atomic usage allowance, visitor/global rate limits, browser-capability ownership,
48-hour scheduled cleanup, exact citation validation, contact redaction, and explicit
provider-failure states. The captured fictional Atlas reply now explains its contribution
to the comparison; it is never presented as a new email. No additional email was sent.

Verification: 102 tests, formatting/lint/types/build, 11 Playwright passes with 5 intentional
skips, and zero automated axe A/AA violations on four deployed routes. Deployed checks
also verified request-specific revision and denial to a different browser session.
Repository/video/social publication and eligibility/submission remain pending.

Earlier entries below are historical snapshots, not the current release status.

### 2026-09-07 — approved public proof

Published the separately approved sanitized AgentMail reply proof after its fingerprint
matched the reviewed preview. Anonymous public output matched exactly. Live browser checks
verified original-currency quote, four viewport layouts, no private metadata, reactive
ranking weights, and proof persistence after visitor reset. The public banner distinguishes
the captured reply/comparison from fixture market metrics. No further messages were sent.

Recorded a local 2:32 captioned walkthrough of the deployed app at 1440×900 with no browser
errors. It remains a review artifact, not a published demo link; repository, video/social
publication, eligibility confirmation, and final submission still await their gates.

### 2026-09-07 — approved live email exchange

Deployed the reviewed readiness backend/frontend to the existing development site. After
explicit approval of both exact messages, delivered one bilingual RFQ and received the
controlled French reply through AgentMail's signed callback. The send switch was relocked.
OpenAI extraction completed on its third bounded attempt; the earlier two paraphrased
excerpts were correctly rejected. Source-span enums now prevent invented evidence strings.

Added regression-tested transport-footer handling and deterministic bilingual/unit
normalization; reconciled stored evaluations while retaining raw claims. Quote: MOQ 150,
72 MAD/unit, 650 MAD sample, 30–35 days, EXW, shipping excluded. Packaging remains unknown;
the below-35-days preference fails. Verification passes 91 tests plus types/lint/format/build.
The sanitized public proof is prepared but awaits publication approval. Video, public repo,
social post, eligibility confirmation, and final submission remain pending.

### 2026-09-07 — local submission-readiness work (uncommitted)

Reverified competition requirements and reviewed the latest commits. Confirmed public
development access and private GitHub visibility. The cloud controlled draft remains
unapproved and unsent.

Bound v2 approval to sender inbox/email/display-name hashes as well as recipient and
bilingual content. Legacy v1 drafts remain unapproved and cannot pass the new scope checks.
Added an operator-reviewed public reply projection tied to the exact controlled fictional
message, immutable receipt time, parser provenance, and current source evidence. Public
comparison subscribes to the captured Atlas result and excludes unrelated fixture makers;
Outreach, Passport, and System Pulse distinguish it from rehearsal content.

Follow-up reviews caught and resolved parser metadata loss, model-status dependence,
mutable receipt timestamps, and ambiguous fixture history. Regression coverage includes
actual extraction persistence through publication, privacy, sender rotation, stale scope,
withdrawal, and reactive comparison. Verification reached 75 tests and 7 applicable
Playwright cases with canonical viewport captures. These changes remain local: no new
cloud deployment, real email exchange, or public proof publication is claimed.

Prepared submission copy and the 2:56 walkthrough. Video, social publication, public source,
registration/eligibility confirmation, and final submission remain pending.

### 2026-08-29 - 4d51430

Built the public landing page and complete fixture-labelled espresso-cup demo: structured brief, research, maker records, evidence viewer, outreach approval, deterministic comparison, System Pulse, and Mesh Passport. Added an immutable Convex demo baseline with isolated 24-hour visitor overlays, genuine operator authorization, privacy-limited analytics, and responsive static-hosting UI (`src/`, `convex/schema.ts`, `convex/demo.ts`).

Mounted Firecrawl, AgentMail, workflow, rate-limiter, and static-hosting components. Added operator-guarded durable crawl, controlled-email, inbound callback, and OpenAI Responses Structured Output paths with idempotency and provider fixtures (`convex/researchFirecrawl.ts`, `convex/agentMail.ts`, `convex/openaiActions.ts`). Provider credentials are not configured, so no real Firecrawl, OpenAI, or AgentMail execution is claimed.

Hardened every provider boundary after repeated `convex-reviewer` passes: current-brief state guards, exact reply and quote evidence, message-content hashes, scoped leases and attempts, bounded public sessions, controlled-sender quarantine, Firecrawl resume reconciliation, atomic OpenAI execution claims, and monotonic mail delivery state. The final reviewer reports no Critical or Important findings. The public demo also has a transparently labelled captured-fixture fallback if anonymous session capacity is unavailable.

Verification currently passes 37 unit/Convex tests, `convex dev --once`, and the self-contained desktop/mobile Playwright journey plus required viewport captures (`convex/*.test.ts`, `src/domain/comparison.test.ts`, `e2e/`).

### 2026-08-29 - e73cf13

Linked the repository to the Convex cloud project owned by `lukajurisic70`, created and selected the `disciplined-ladybug-82` development deployment, generated deployment-specific Auth and webhook secrets, kept every live-operation flag locked, pushed all functions/components/indexes, and seeded the sanitized demo baseline. Uploaded the fixture frontend through the official static-hosting component to `https://disciplined-ladybug-82.convex.site`.

Browser verification confirmed cloud-backed session creation and brief approval, reactive navigation to research, the captured fixture label, and zero console errors. This is a development deployment only. The Firecrawl credential remains an intentionally disabled placeholder, and no real OpenAI, Firecrawl, or AgentMail operation is claimed.

### 2026-08-29 - d6dec5c

Configured deployment-only OpenAI, Firecrawl, and AgentMail access plus the server-side operator verifier. Patched the pinned official AgentMail component to cross Convex 1.45's typed environment boundary; clean installs reapply the patch, component access succeeds, and unsigned webhook traffic fails closed. No email was sent (`patches/`, `convex/convex.config.ts`, `convex/lib/agentMailClient.ts`).

Ran the first controlled sponsor workflow through authenticated MakerMesh actions. OpenAI `gpt-5.6-luna` compiled and persisted the Harbour Coffee Lab brief, then Firecrawl searched for Moroccan ceramics suppliers and completed a durable five-page crawl without truncation. Convex stored private System Pulse activity and idempotent usage records; all brief, research, and outreach flags returned to `false` after the run (`convex/projects.ts`, `convex/researchFirecrawl.ts`).

Verification passes 38 unit/Convex tests, formatting, lint, strict type checking, and the production build. The Convex reviewer reports no Critical or Important findings. AgentMail outbound delivery and inbound reply parsing remain intentionally unexercised until a controlled recipient address is supplied.

### 2026-08-30 - 78023a4

Moved the public Research surface from bundled content to a bounded Convex projection of the published demo baseline. The query returns the approved brief, neutral maker records, public-safe sources, and only claims whose exact excerpt appears in the returned evidence. It omits private sources, mail/provider identifiers, stored scores, and real-supplier workflow data (`convex/model/publicDemoResearch.ts`, `convex/demo.ts`, `src/app/DemoContext.tsx`, `src/pages/project/ResearchPage.tsx`).

Published normalized baseline version 2 as a separate immutable project and retired version 1 without changing its project or claims. Session commands are scoped to one visitor-session incarnation, retired sessions rebind to the active baseline, and scheduled Convex state—not a client clock—controls expiry. The reviewer reports no Critical or Important findings after the fixes.

Cloud and browser checks confirmed 6 fictional makers, 17 public fixture sources, 39 evidence-backed claims, one preserved conflict, no forbidden provider fields, a reactive Brief → Research replay, and a guarded direct Research route with no console errors. Verification passes 46 unit/Convex tests, formatting, lint, strict type checking, the production build, and all 7 applicable Playwright journeys and viewport captures. The E2E server now waits for Convex function synchronization before starting the frontend. This remains a fixture-labelled development deployment; captured-live replay and AgentMail send/reply are still pending.

### 2026-08-30 - 8827929

Audited the deployed landing and Research surfaces with Lighthouse, the browser accessibility tree, keyboard navigation, native browser issues, and focused DOM checks. The landing accessibility score moved from 96 to 100 after replacing borderline accent combinations with dedicated contrast tokens; desktop and mobile landing plus the Research workspace now score 100 with no accessibility failures, native issues, or orphaned inputs (`src/styles/tokens.css`, `src/styles/landing.css`, `src/components/ui/Button.tsx`).

Added polite live status and progress semantics to research replay. The evidence dialog already moved and trapped focus correctly; it now restores focus to the exact source control after Escape or close, including when opened inside a maker drawer. A regression test covers that behavior (`src/pages/project/ResearchPage.tsx`, `src/components/evidence/EvidenceDialog.tsx`).

Verification passes 47 unit/Convex tests, formatting, lint, strict type checking, the production build, and all 7 applicable Playwright desktop/mobile journeys and viewport captures. Reduced-motion CSS, semantic heading order, page language/title/viewport, and an isolated-browser public access check are verified.

### 2026-08-30 - 9a62cc5

Published baseline version 3 as a captured live research proof attached to the fictional sanitized market replay. The operator-only capture mutation correlates one completed OpenAI brief operation and non-cached usage record with one completed durable Firecrawl run and usage record, stores private provenance IDs, and publishes only two bounded provider events. It rejects wrong projects, manual briefs, partial or cached work, and any AgentMail, outreach, thread, quote, or reply-derived state (`convex/demoCapture.ts`, `convex/schema.ts`).

The public session returns no capture source IDs. It exposes `research_only` and `fictional_fixture` labels plus the two provider events, while the 17-source, 6-maker, 39-claim, one-reply market stays explicitly fixture data. System Pulse and the project banner render the live research proof separately from fictional maker and AgentMail activity. Re-running fixture seed cannot replace a newer captured baseline.

Cloud and browser verification confirmed OpenAI and Firecrawl proof events, the explicit fictional/no-outreach label, fixture metrics unchanged, no private IDs, and zero console errors. Lighthouse remains 100 on the captured Research surface. Verification passes 52 tests plus root and Convex TypeScript checks, formatting, lint, and the production build. The controlled AgentMail send/reply remains pending.

### 2026-08-31 - 3262d70

Ran a fresh authenticated OpenAI brief compilation and bounded five-page Firecrawl crawl for the exact frozen espresso-cup request, then published captured-live research proof version 4 without altering the fictional public market. The public live-operation flags were relocked after each call.

Added a controlled AgentMail approval boundary for the fictional Atlas Clay Studio inbox. MakerMesh verifies the project-owned sender and recipient against short-lived hashed provider attestations, freezes all 17 approved requirements and the bilingual template bytes, quarantines generic or mutated inbound scope, and keeps preparation separate from approval and sending (`convex/controlledOutreach.ts`, `convex/model/controlledOutreach.ts`, `convex/agentMail.ts`). A real provider identity check succeeded and one draft was prepared; it remains unapproved and no email was sent.

Verification passes 64 tests, formatting, lint, root and Convex strict type checks, and the production build. Independent security and Convex reviews report no remaining Critical or Important findings.
