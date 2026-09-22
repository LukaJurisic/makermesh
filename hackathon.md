# MakerMesh

**Know what a ceramics workshop actually committed to before you order.**

- **Live app:** https://disciplined-ladybug-82.convex.site (no sign-up needed)
- **Demo video (1:45):** https://disciplined-ladybug-82.convex.site/demo.html
- **Repo:** https://github.com/LukaJurisic/makermesh
- **Submission:** https://vibeapps.dev/s/makermesh · **Post:** https://x.com/LukaJurisic_bw/status/2102402306956308834

## The problem

A café wants 200 custom espresso cups from a small workshop in Morocco. The quote comes back
in French: 72 MAD a cup, EXW, and "La production prend 30 à 35 jours après validation de
l'échantillon." The price looks fine. What's easy to miss is that the 30–35 days only start
_after_ the sample is approved, that shipping is excluded, and that packaging is still "à
confirmer". It's easy to order on those assumptions and only find out when the cups are late
or the invoice is bigger.

MakerMesh finds workshops, reads what they actually say, emails them once you approve the message, and shows the buyer
exactly which promises are backed by a sentence, which aren't, and what to ask next.

## Try it with your own quote

Email any supplier quote to **makermesh@agentmail.to** (paste or forward it into the body).
Within about a minute, MakerMesh replies from that inbox with what the quote actually commits
to, each point quoted word for word from the email, what it never states (shipping, payment
terms, how long it's valid…), and the questions to send back. The reply links to a private page
that updates live through a Convex query. Text only for now; attachments aren't read.

## Or try the café example in 60 seconds

1. Open the app and click **See a café order**. The quote is a real email that went through
   AgentMail and back. The café and workshop are fictional: we wrote the workshop's reply
   ourselves and sent it between our own inboxes, then MakerMesh processed it like any other.
2. Click **Try 30 days**. The requirement fails, and MakerMesh shows the exact
   French sentence that explains why ("after sample approval").
3. Click **Try 400 cups**. MakerMesh won't invent a new price: a changed order needs the workshop
   to confirm again, so it drafts that question instead.
4. Click **Copy questions** or **Save order notes** to take away a Markdown brief with the
   quote in its original currency, the exclusions and the open questions.
5. Optional: click **Start a request** and describe your own order. OpenAI turns it into a
   brief you approve, then Firecrawl searches real public workshop sites in English and French.
   Each finding links to the exact source sentence. Runs are limited per visitor and per day to
   protect API budgets.

## What each sponsor does in the product

| Sponsor       | Real work it does                                                                                                                                                                                                                                                                                                                               |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Convex**    | The whole backend. Durable research workflow, reactive queries that update every screen as results land, mutations with state guards, HTTP actions for the signed AgentMail webhook, scheduled functions and crons (48-hour cleanup of private research), Convex Auth, per-visitor and global rate limits, and static hosting for the frontend. |
| **OpenAI**    | Turns a plain-language request into a structured sourcing brief (Responses API, strict structured output). Extracts the quote from the workshop's French reply. Every extracted fact must quote a sentence that actually appears in the source, or it is rejected.                                                                              |
| **Firecrawl** | Searches and reads real public workshop websites in two languages inside a durable Convex workflow, so the buyer sees what each workshop says about itself, with links and dates.                                                                                                                                                               |
| **AgentMail** | Gives the project its own inbox, in both directions. Anyone can email a quote to makermesh@agentmail.to: the signed webhook hands it to Convex, OpenAI reads it, and AgentMail replies on the same thread. It also sent the bilingual request for quote in the café example and received the French reply that comparison runs on.              |

**What visitors can and can't send:** anyone can email a quote _to_ MakerMesh and get one reply
back. MakerMesh never emails a supplier on a visitor's behalf: outbound requests for quote only
go after the buyer approves the exact recipient, sender and wording, tied together by hashes, and
that path is switched off on the public demo. The quote reader replies only to the sender, once
per thread, never to auto-replies or bounces, with limits of 3 an hour per sender and 40 a day
overall. It can be switched off without a redeploy.

## Convex depth

- **Components:** @convex-dev/workflow, @convex-dev/rate-limiter, @firecrawl/firecrawl-convex,
  @agentmail/convex, @convex-dev/static-hosting
- **Features:** schema and indexes, queries, mutations, actions, HTTP actions, scheduled
  functions, crons, realtime subscriptions, Convex Auth
- **Quote inbox:** webhook → mutation (dedupe, loop guards, rate limits) → scheduled action
  (OpenAI with sentence-index citations) → mutation that saves and queues the AgentMail reply
  → reactive query behind an unguessable token. Deleted by a cron after 48 hours.
- **Design choices:** research results are private to the browser that asked for them and expire
  after 48 hours. Usage allowance is decremented atomically. Workflow steps are idempotent and
  resume after failure.

## Honest limits

- The café, the Atlas workshop and its quote are fictional; we wrote the reply. The email
  round trip through AgentMail was real, between our own test inboxes. Real workshops found by research are shown as leads with their own words,
  never scored or ranked publicly.
- This runs on a Convex development deployment (`disciplined-ladybug-82`).
- Research is Moroccan ceramics only for now; the approach generalises to any sourcing request.

## Quality

138 unit, Convex and UI tests; Playwright end-to-end tests (11 pass, 5 intentionally skipped);
no automated WCAG A/AA violations on four routes; layouts checked at four viewport sizes.

## Stack

React, Vite and TypeScript on Convex static hosting. Convex backend. OpenAI `gpt-5.6-luna` via
the Responses API. Firecrawl and AgentMail through their official Convex components.

- **Started:** 2026-08-29 (first commit; hackathon kicked off 2026-08-25)
- **Last updated:** 2026-09-22

## Build log

Dated entries, newest first. Early entries record the build as it happened; where they say a
provider was not yet configured or a step was pending, later entries supersede them.

### 2026-09-22 — email-a-quote inbox

Added a quote reader to the existing AgentMail inbox (the plan's three-inbox limit ruled out a
new one). New conversations that are not replies on a supplier thread are deduplicated, checked
for auto-replies and our own inboxes, rate limited, stored with a hashed sender, and read by
OpenAI using numbered sentences so every excerpt is verbatim. One reply goes back on the same
thread with a private link. Verified live with a real email from the entrant's own mailbox:
five terms extracted with exact excerpts, shipping and validity reported as not stated, reply
sent. 12 new tests; 138 total pass.

### 2026-09-22 — public release

Made the repository public and published the 90-second Hyperframes video on the Convex
static site with music attribution. Verified isolated playback (1920×1080, 90 s). Luma
registration and eligibility confirmed (solo, 18+, Ontario). VibeApps entry submitted
and verified live at https://vibeapps.dev/s/makermesh with the AllGasHackathonSubmission tag.
Sponsor-tagged X post published and linked from the entry: https://x.com/LukaJurisic_bw/status/2102402306956308834.

### 2026-09-22 — buyer-facing site refinement

Rebuilt the homepage around a concrete café order and simplified navigation, quoted terms,
source descriptions and questions. Added a 400-cup shortcut to demonstrate why an altered
order needs supplier reconfirmation. Completed private research can now be downloaded as
notes with the buyer's request, source links/dates, original wording and every confirmation
question. Public website statements are never treated as confirmation of the exact order.

Frontend deployed to the existing development site. Full check passes 126 tests; all 11
applicable E2E cases pass across the run and corrected-label rerun, with 5 intentional skips.
Four pages at four viewports pass overflow and automated accessibility checks. No new email
or paid provider request.

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
