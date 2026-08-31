# Hackathon log

- **Project:** MakerMesh
- **Event:** Convex All Gas Hackathon sponsored by OpenAI, Firecrawl, and AgentMail
- **What it does:** Compiles a sourcing brief into an evidence-backed maker network, identifies unanswered requirements, and structures buyer-approved supplier replies.
- **Live app:** development fixture — https://disciplined-ladybug-82.convex.site (production not deployed)
- **Repo:** none
- **Frontend:** Convex static hosting
- **Convex deployment:** development — disciplined-ladybug-82 (production not deployed)
- **Components:** @convex-dev/rate-limiter, @convex-dev/workflow, @firecrawl/firecrawl-convex, @agentmail/convex, @convex-dev/static-hosting
- **Convex features:** schema, tables, indexes, queries, mutations, actions, HTTP actions, scheduled functions, crons, realtime queries
- **Auth:** Convex Auth
- **AI models:** gpt-5.6-luna (live Responses API brief compilation exercised)
- **Started:** 2026-08-29T14:07:45.2228690Z
- **Last updated:** 2026-08-31T03:56:32Z

## Log

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
