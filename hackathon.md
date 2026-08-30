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
- **AI models:** gpt-5.6-luna (configured; live API call not yet exercised)
- **Started:** 2026-08-29T14:07:45.2228690Z
- **Last updated:** 2026-08-30T00:01:54Z

## Log

### 2026-08-29 - 4d51430

Built the public landing page and complete fixture-labelled espresso-cup demo: structured brief, research, maker records, evidence viewer, outreach approval, deterministic comparison, System Pulse, and Mesh Passport. Added an immutable Convex demo baseline with isolated 24-hour visitor overlays, genuine operator authorization, privacy-limited analytics, and responsive static-hosting UI (`src/`, `convex/schema.ts`, `convex/demo.ts`).

Mounted Firecrawl, AgentMail, workflow, rate-limiter, and static-hosting components. Added operator-guarded durable crawl, controlled-email, inbound callback, and OpenAI Responses Structured Output paths with idempotency and provider fixtures (`convex/researchFirecrawl.ts`, `convex/agentMail.ts`, `convex/openaiActions.ts`). Provider credentials are not configured, so no real Firecrawl, OpenAI, or AgentMail execution is claimed.

Hardened every provider boundary after repeated `convex-reviewer` passes: current-brief state guards, exact reply and quote evidence, message-content hashes, scoped leases and attempts, bounded public sessions, controlled-sender quarantine, Firecrawl resume reconciliation, atomic OpenAI execution claims, and monotonic mail delivery state. The final reviewer reports no Critical or Important findings. The public demo also has a transparently labelled captured-fixture fallback if anonymous session capacity is unavailable.

Verification currently passes 37 unit/Convex tests, `convex dev --once`, and the self-contained desktop/mobile Playwright journey plus required viewport captures (`convex/*.test.ts`, `src/domain/comparison.test.ts`, `e2e/`).

### 2026-08-29 - e73cf13

Linked the repository to the Convex cloud project owned by `lukajurisic70`, created and selected the `disciplined-ladybug-82` development deployment, generated deployment-specific Auth and webhook secrets, kept every live-operation flag locked, pushed all functions/components/indexes, and seeded the sanitized demo baseline. Uploaded the fixture frontend through the official static-hosting component to `https://disciplined-ladybug-82.convex.site`.

Browser verification confirmed cloud-backed session creation and brief approval, reactive navigation to research, the captured fixture label, and zero console errors. This is a development deployment only. The Firecrawl credential remains an intentionally disabled placeholder, and no real OpenAI, Firecrawl, or AgentMail operation is claimed.
