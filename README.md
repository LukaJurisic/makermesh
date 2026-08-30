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
component access, and signed webhook rejection are verified; outbound and inbound mail
remain unexercised and are not claimed.
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
- `npm run typecheck` — strict TypeScript check
- `npm run lint` — Oxlint
- `npm run test` — unit and integration tests
- `npm run test:e2e` — Playwright product flow with its own anonymous local Convex backend
- `npm run screenshots` — required viewport captures
- `npm run build` — production bundle
- `npm run upload:static` — build and upload to a development Convex static host
- `npm run deploy:static` — production Convex backend and static-hosting deployment
- `npm run check` — formatting, linting, types, tests, and build

## Safety model

- Public visitors cannot trigger live Firecrawl or AgentMail operations.
- External calls originate only from operator-authenticated Convex actions or verified
  provider callbacks.
- Real hackathon email is restricted to an allowlisted controlled address.
- Operator sessions use server-side PBKDF2 verification and short-lived signed Convex Auth
  tokens, the Vite-compatible equivalent approved for the reactive client.
- Public snapshots redact email addresses, provider IDs, and private message content.
- Identifiable real suppliers are never publicly failed, negatively ranked, or published
  as Mesh Passports from incomplete public evidence.

## Demo and deployment

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
brief, makers, public sources, and supported claims from Convex baseline v2. The controlled
AgentMail send/reply, captured-live public replay, and production deployment remain pending.

## Limitations

MakerMesh does not verify supplier trustworthiness, certify food safety, calculate landed
costs, send autonomous outreach, negotiate, purchase, arrange freight, or publish
supplier-provided information without consent.

Source code is MIT licensed. Brand, imagery, supplier content, fixtures, and third-party
assets are governed separately; see [NOTICE.md](NOTICE.md) and [CREDITS.md](CREDITS.md).
