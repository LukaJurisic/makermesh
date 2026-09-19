# MakerMesh

**A market appears when you ask.**

MakerMesh turns a custom-production request into a temporary, evidence-backed maker
network. It discovers fragmented public supplier footprints, preserves source evidence,
finds the questions the web cannot answer, prepares buyer-approved outreach, and turns
ordinary email replies into comparable capability claims.

The hackathon wedge is custom Moroccan ceramics for cafés, boutique hotels, interior
designers, and independent retailers. The controlled scenario sources 200 custom
eight-ounce espresso cups for the fictional Harbour Coffee Lab in Toronto.

## Why it is different

Try the quote example from the landing page: change the maximum production time to 30 days
and inspect why the captured 30–35-day commitment does not meet it. The clock starts after
sample approval. Prepare a clarification and download a decision brief with the quoted
terms, exact evidence and exclusions. Changed quantities require supplier reconfirmation;
the calculated cost is illustrative, and the captured supplier is explicitly fictional.

Conventional marketplaces wait for suppliers to onboard and maintain catalogues.
MakerMesh starts with buyer demand. Unknown information is retained as unknown and drives
focused questions. AI performs extraction and explanation; transparent TypeScript rules
perform eligibility, evidence coverage, commercial completeness, and ranking.

## Architecture

```text
React + Vite on Convex static hosting
              │
       Convex reactive client
              │
┌─────────────▼─────────────────────────────────────┐
│ Convex: database, functions, HTTP actions, files, │
│ schedules, rate limits, workflows, live state     │
└───────────┬────────────────┬────────────────┬─────┘
            │                │                │
      Firecrawl         OpenAI Responses   AgentMail
      search/crawl      strict extraction  approved email
```

Convex is the sole backend and system of record. The official Firecrawl and AgentMail
components are mounted and their guarded application wrappers are implemented. A live
OpenAI Responses structured-brief call and a durable five-page Firecrawl crawl have been
exercised on the cloud development deployment. AgentMail authentication, inbox creation,
component access, and signed webhook rejection are verified. On September 7, the approved
bilingual RFQ was delivered and one approved French reply was received through the signed
callback. OpenAI extracted its evidence and quote; deterministic comparison was verified.
See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the detailed design.

## Local setup

Requirements: Node.js 22+, npm 10+, and a current browser.

```powershell
npm install
$env:CONVEX_AGENT_MODE='anonymous'
npx convex dev --once
npm run dev:all
```

The Convex CLI writes local URLs to `.env.local`. Do not commit that file. Copy
`.env.example` only as a variable-name reference; real provider secrets belong in Convex
environment variables.

## Commands

- `npm run dev` — start Vite
- `npm run dev:convex` — start Convex development
- `npm run dev:all` — run Convex and Vite together
- `npm run typecheck` — strict root and Convex TypeScript checks
- `npm run lint` — Oxlint
- `npm run test` — unit and integration tests
- `npm run test:e2e` — Playwright product flow with its own anonymous local Convex backend
- `npm run screenshots` — required viewport captures
- `npm run build` — production bundle
- `npm run upload:static` — build and upload to a development Convex static host
- `npm run deploy:static` — production Convex backend and static-hosting deployment
- `npm run check` — formatting, linting, types, tests, and build

## Safety model

- Public visitors can run bounded Moroccan-ceramics research after reviewing their brief.
  An operator-controlled allowance and per-visitor/global limits constrain provider usage.
- Custom research is private to a browser capability and expires after 48 hours. Provider
  calls run server-side through durable workflows; visitors never receive credentials.
- AgentMail operations require operator authorization and explicit message approval.
- Real hackathon email is restricted to an allowlisted controlled address.
- Operator sessions use server-side PBKDF2 verification and short-lived signed Convex Auth
  tokens, the Vite-compatible equivalent approved for the reactive client.
- Public snapshots redact email addresses, provider IDs, and private message content.
- Identifiable real suppliers are never publicly failed, negatively ranked, or published
  as Mesh Passports from incomplete public evidence.

## Demo and deployment

The September 19 release is live, including the researched buyer workspace, maker dossiers,
quote-first comparison, persistent drafts, and custom Moroccan-ceramics research. Start at
`/compose`, review the structured brief, then approve a bounded search. Results preserve
exact public evidence and unanswered questions without grading real suppliers. Four live
requests exercised this path. See [release evidence](docs/RELEASE_CANDIDATE_2026-09-19.md).

The public demo reads an immutable, versioned sanitized baseline and stores only a small
24-hour visitor overlay. Research content is projected through a bounded public Convex DTO;
private sources, provider identifiers, real-supplier workflow state, and unsupported claims
fail closed. A transparently labelled local fixture fallback keeps the demo inspectable if
anonymous session capacity is unavailable. Atlas Clay Studio is explicitly fictional.
Production deployment, public GitHub publication, and any real outreach require separate
user approval.

Current status: the fixture-backed vertical slice is available on the verified Convex
development deployment at <https://disciplined-ladybug-82.convex.site>. OpenAI and
Firecrawl have completed a controlled live run. The deployed Research page now reads its
brief, makers, public sources, and supported claims from Convex. Baseline v4 attaches an
inspectable captured-live OpenAI/Firecrawl research proof to that fictional sanitized market
replay and labels the boundary explicitly; it does not claim that the displayed suppliers
came from the live crawl. The controlled AgentMail exchange is verified and its reviewed,
sanitized reply proof is now published. No production deployment has been made.

September 7 readiness work is deployed to the existing development site: sender-bound v2 approval,
an operator-reviewed public projection of the exact controlled fictional reply, reactive
Atlas comparison, and separate AgentMail/OpenAI proof in System Pulse. The published result
is clearly separated from the labelled fixture market and headline metrics.
Legacy v1 drafts remain unapproved. See
[live verification](docs/research/LIVE_EXCHANGE_2026-09-07.md) for the exercised boundaries.

See [SUBMISSION_PACKET.md](SUBMISSION_PACKET.md) for the prepared submission copy and
release sequence, and [the compliance audit](docs/research/COMPLIANCE_AUDIT_2026-09-07.md)
for the original findings. The repository remains private until publication is authorized.

## Limitations

MakerMesh does not verify supplier trustworthiness, certify food safety, calculate landed
costs, send autonomous outreach, negotiate, purchase, arrange freight, or publish
supplier-provided information without consent.

Source code is MIT licensed. Brand, imagery, supplier content, fixtures, and third-party
assets are governed separately; see [NOTICE.md](NOTICE.md) and [CREDITS.md](CREDITS.md).
