# MakerMesh continuation handoff

Updated: 2026-09-19 EDT  
Purpose: review the existing work, then finish the sponsor loop and submission.

## Current release — September 19

### Next implementation: reviewed purchasing-decision experience

After inspecting public hackathon listings, the user selected the interactive decision
direction and authorized recommended defaults for strategy/design/copy reviews. Those
reviews are complete in [strategy](docs/designs/DECISION_STRATEGY_2026-09-19.md) and
[design and copy](docs/designs/DECISION_EXPERIENCE_2026-09-19.md). Five independent review
findings were resolved; follow-up review passed. This feature is NOT implemented yet.

Build timing constraint → exact French evidence → clarification draft → decision export
in Compare. Original request is 200 cups with a 42-day hard production limit; quoted
30–35 days starts AFTER SAMPLE APPROVAL. Changed quantity requires renewed price/capacity/
timing confirmation, never a binding extension of the old quote. Keep the fictional captured
boundary visible. Make direct Compare entry and its next-step banner coherent. Quantity
exploration is secondary; core verification takes priority. Publication/eligibility gates
below remain separate and unanswered. No new emails or paid provider calls were made by
these reviews. Deferred work is recorded in TODOS.md.

The refreshed frontend and custom research backend are deployed to the existing approved
development site. Custom ceramics requests compile, require brief approval, search and
extract attributed public source spans. Four live requests completed; no additional email
was sent. Eight further requests were enabled, constrained by visitor/global daily limits.

All 102 tests and the full check pass. E2E: 11 passed, 5 intentional skips. Four deployed
routes have zero automated axe A/AA violations. Request revision restores the correct draft;
a different browser session cannot read the private result. See
[release evidence](docs/RELEASE_CANDIDATE_2026-09-19.md).

Updated local walkthrough verified: 1:58.52, H.264, 1440×900, captions, no voiceover,
zero browser errors. Public hosting remains pending.

Remaining: source/video/social publication;
owner eligibility/Luma/team confirmation; submit through VibeApps and retain confirmation.
The previous controlled email exchange is complete: do not resend it. Older sections below
are historical and may describe gates that have since closed.

## Latest UI refresh — September 12, local preview

The user approved proceeding with the researched buyer-focused design direction. New UI
implemented locally: calmer shell, on-demand “About this demo”/System Pulse, maker directory
and filters, unified dossiers with messages/evidence, quote-first comparison, clearer landing,
and persistent local request drafts. Tokens and imagery preserved. No new live sourcing is
enabled. No email or cloud deployment was performed in this UI pass.

See [UI refresh](docs/UI_REFRESH_2026-09-12.md). Validation: 91 tests, 11 Playwright passes,
5 intentional skips, and four-size captured-reply visual/focus checks. Local Vite preview
uses port 5176 with explicit cloud public URLs. E2E may rewrite ignored `.env.local` to
local endpoints; keep deployment selection explicit. The public site and 2:32 walkthrough
still show the preceding UI. Changes remain uncommitted alongside prior session work.

## Latest publication — approved result is public

The user explicitly approved the sanitized proof. Its fresh fingerprint matched the
reviewed preview; publication succeeded and the anonymous query matched the reviewed
result exactly. Public Compare shows 72 MAD/unit, 650 MAD sample, MOQ 150, 30–35 days,
EXW, shipping excluded, and one unknown requirement. Scores: preference 76%, evidence 94%,
commercial 88%, within-tier 86 at default weights. The supplier remains fictional.

Deployed browser checks passed at four required viewports, with no page overflow or
private metadata, reactive weight changes, and proof persistence after visitor reset.
Updated source labels distinguish the captured quote from fixture market metrics.
Do not request email, development deployment, or proof publication approval again.
Repository/public video/social/final submission and eligibility remain pending.

Local walkthrough recorded against the deployed public app: 152.16 seconds, H.264 MP4,
1440×900, captions, no voiceover. It lives in ignored
`artifacts/submission.local/MakerMesh-walkthrough.mp4`; recording metadata and review
frames are alongside it. Recording reported zero browser errors. Video is not public.
Fresh mobile capture after layout settled confirms the navigation rail is closed; an
earlier resize screenshot caught its transition mid-animation.

## Latest live milestone — approved exchange completed

The user approved development deployment and the two exact messages. Backend/frontend are
deployed; the RFQ was delivered, the French reply was accepted once via signed callback,
and OpenAI extraction completed on bounded attempt 3. The controlled-send switch is false.
No other messages were sent. Original v1 draft remains unapproved; v2 is replied.

See [live verification](docs/research/LIVE_EXCHANGE_2026-09-07.md). Exact provider footer,
source-constrained evidence enums, deterministic bilingual/unit normalization, preferred
attribute reuse, and stored comparison recalculation now have regression coverage.
91 tests pass. Raw claims and received text remain intact. Derived comparison has no hard
failures, one unknown (packaging), and a failed below-35-days preference.

The sanitized proof preview is prepared outside the repository but NOT published. Ask only
for its publication approval next; do not request approval again for the completed emails
or deployment. Repository visibility, social, video publication, and final submission are
still separate pending gates. All code/docs remain uncommitted; earlier sections below are
historical. Use explicit cloud deployment selection; no production deployment occurred.

## Latest continuation — local changes ready for live approval

The initial audit findings below are historical. Local code now implements sender-bound
v2 approval and a separate safe controlled-reply publication path, reactive Atlas comparison,
original reply/quote evidence, and System Pulse proof. Follow-up review findings were fixed:
parser metadata survives completion, model status cannot override deterministic evaluation,
receipt time is immutable, and Passport fixture history is explicitly separated.

Current local verification: 75 tests and 7 applicable Playwright tests pass, with 5 intentional
skips. The new result layout has separate labelled fixture-rehearsal captures at all four
required viewports. README, architecture, governance, checklist, log, and submission packet
are updated. Changes are uncommitted and undeployed.

Cloud inspection with explicit `--deployment disciplined-ladybug-82` confirms the only
controlled draft is still v1, unapproved and unsent. Private exact-message approval material
is stored outside this public repository. No messages, provider-cost switches, cloud code,
GitHub visibility, or public release were changed. GBrain was unavailable; this file is the
durable local handoff.

Next: obtain approval of the prepared exact two-message packet and existing development
deployment update; prepare the v2 draft under a freshly verified sender identity, execute
the approved exchange, verify extraction, preview and approve public proof, then complete
the deployed QA/video/social/repository/submission steps in `SUBMISSION_PACKET.md`.

September 7 continuation audit: see
[docs/research/COMPLIANCE_AUDIT_2026-09-07.md](docs/research/COMPLIANCE_AUDIT_2026-09-07.md).
Fresh verification passed 64 tests and 7 Playwright cases (5 intentional skips), including
all canonical viewport captures. GitHub API confirms the repository is private. Before
the controlled send, address the sender identity missing from the approval fingerprint;
the public reply/proof projection and reactive comparison also need implementation.
No email, publication, or application-code change was made during the audit. The E2E
runner rewrote ignored local deployment configuration; explicitly select the cloud
development target for the next live inspection. Follow the audit's corrected order below
the original historical handoff sequence.

## Start here

- Run from this repository root. It is an independent nested Git repository; do not modify or reuse the parent Webcafe app.
- Branch/HEAD: `main` at `96d013b`.
- `main` is two commits ahead of `origin/main`: `3262d70`, `96d013b`.
- Current untracked handoff additions: `HANDOFF.md` and `docs/research/`.
- Remote: `https://github.com/LukaJurisic/makermesh.git`. An unauthenticated request returned 404 on September 7, so treat it as private until proven public.
- Public development app: <https://disciplined-ladybug-82.convex.site> (HTTP 200 on September 7).
- Convex development backend: `https://disciplined-ladybug-82.convex.cloud`.
- No production deployment or final submission has been authorized.
- Use the latest available root model. Subagent preference: `gpt-5.6-luna` max for routine bounded work, `gpt-5.6-sol` medium for deeper review, unless a newer instruction overrides this.

## Product and frozen demo

MakerMesh compiles a custom-production request into an evidence-backed maker network. AI
structures and extracts; deterministic TypeScript evaluates. Unknown never becomes a pass.
Tagline: **A market appears when you ask.**

Frozen wedge: custom Moroccan ceramics for small businesses. Fictional buyer Harbour Coffee
Lab needs 200 handcrafted eight-ounce espresso cups for Toronto, maximum MOQ 250, custom logo,
production within 42 days, documentation statement, pre-production sample, English/French
communication, and export-history statement. Preferences cover handmade production, matte
sand/off-white with dark green/ink-blue detail, visible variation, export-safe packaging,
Moroccan production centres, MOQ below 200, and production below 35 days. The product-only
budget is CAD 3,500 before freight, customs, taxes, and duties; preserve original currencies
and quote bases.

Only fictional **Atlas Clay Studio — Demo Supplier** may carry the public quote, email reply,
eligibility, score, and Mesh Passport. Identifiable real suppliers may show attributed public
facts, links, excerpts, and unknowns, but no public negative grade, rejection, score, or Passport.

## Competition rules

Verified September 7 from the [official Convex rules](https://www.convex.dev/hackathons/all-gas)
and [Luma event](https://luma.com/convex-allgas-hackathon). The complete rule, prize, benefit,
source-discrepancy, and redemption appendix is
[docs/research/HACKATHON_RULES_2026-09-07.md](docs/research/HACKATHON_RULES_2026-09-07.md).

- New apps only, started on/after **August 25, 2026 at 12:00 PM PDT**. MakerMesh started August 29.
- Submit **before September 22, 2026 at 12:00 PM PDT / 3:00 PM Toronto EDT** through the [exact VibeApps form](https://vibeapps.dev/judging/convex-all-gas-hackathon-openai/submit). Winners are scheduled for September 25.
- Entrants must be 18+. Solo or teams up to four; one member registers on Luma; multiple apps allowed.
- Convex/sponsor/cohost employees and immediate family are ineligible. Prohibited jurisdictions expressly include Quebec, Russia, Crimea, Cuba, Iran, North Korea, Syria, and other OFAC-prohibited locations.
- Project must be original and respect intellectual-property rights.
- Convex must run the substantive database, functions, and realtime sync. Judges value real queries, mutations, live updates, auth, and components; auth is optional.
- OpenAI, Firecrawl, and AgentMail must do real product work. Safest compliance is the complete controlled generate/crawl/send-and-receive loop.
- Build with Codex or another agent/IDE using the Convex plugin. Codex is required for `chatgpt.site`.
- Public invite-free frontend must use Convex static hosting at `*.convex.site` or ChatGPT Sites at `*.chatgpt.site`; no localhost.
- Public GitHub repository and public root `hackathon.md` are required. The log must include what was built, stack, live URL, and demo/video link.
- Share on X or LinkedIn and tag `@convex`, `@OpenAI`, `@firecrawl`, and `@agentmail`; engagement counts.
- Submit public repo, live URL, and a strictly under-three-minute real-product video. Target 2:58.
- Judging covers everyday-user usefulness/creativity, Convex depth, real sponsor work, live access, social engagement, and video quality. No numeric weights are published.
- Prize pool: $16,500 cash plus $8,500 Codex credits. Placements and plan/swag awards are in the appendix. Registered participants are advertised 20,000 Firecrawl credits; no public redemption steps are documented. No OpenAI API or Convex credits are supplied.
- Luma metadata has an earlier September 21 calendar end; use the explicit September 22 submission deadline. The September 20 MakerMesh freeze is internal, not an event rule.

Open administrative gates: confirm Luma registration, entrant/team eligibility, repository
visibility, social post, video, and VibeApps submission. Do not infer completion.

## Architecture and safeguards

- React 19, Vite, strict TypeScript, React Router, Tailwind tokens, Radix, Motion, Zod.
- Convex is the only backend/system of record. Mounted components: rate limiter, workflow, Firecrawl, AgentMail, static hosting.
- Convex Auth operator gate uses a server-only PBKDF2 verifier, rate-limited attempts, short-lived signed sessions, indexed roles, and checks in every privileged function.
- Public demo uses an immutable sanitized baseline plus 24-hour visitor overlays. Private addresses, provider IDs, messages, and real-supplier workflow state stay private.
- Claims retain source, exact excerpt, observed time, acquisition method, evidence state, model, and prompt version.
- `@agentmail/convex` is pinned at `0.1.0` with a narrow `patch-package` typed-environment shim.
- AgentMail preparation binds project-owned sender/recipient identities with hashes and a 15-minute provider attestation. Refresh it immediately before an approved send.
- The controlled brief guard fingerprints all 17 v4 requirements, assumptions, Atlas identity, template bytes, recipient count, and approval hash. Generic or mutated inbound scope is quarantined.
- Secrets and the operator code were supplied in chat and exist only in Convex configuration. Never print or commit them; rotate before production.

## Current verified state

- Captured baseline v4 is `captured_live` with `research_only` scope.
- OpenAI performed a real structured brief compilation; Firecrawl performed a real search and durable five-page crawl.
- Public maker/quote/reply content remains explicitly fictional and separate from live provider proof.
- AgentMail sender/recipient identities were verified and one bilingual draft was prepared.
- Draft is still `draft`: no approval, send timestamp, or outbound ID. No email or inbound reply has been exercised.
- Safety switches: demo mode on; real outreach and public live research/brief compilation off; controlled demo outreach unset/effectively off.
- `npm run check` passed September 7: formatting, Oxlint, root/Convex types, 64 Vitest tests, and production build.
- Last recorded Playwright result: 7 passed, 5 intentionally skipped. Required viewport and Lighthouse accessibility checks previously passed; rerun them.
- Independent Convex/security reviews reported no Critical or Important findings at `96d013b`.
- README/checklist are stale: they still mention baseline v3/52 tests and earlier AgentMail status. `hackathon.md` needs current repo status and the eventual demo link.

## Review and continuation order

1. Review `3262d70` and `96d013b` against `16c8617`, especially AgentMail approval, provider fetch, inbound quarantine, and exact-scope checks.
2. Run `npm install`, `npm run check`, `npm run test:e2e`, `npm run screenshots`, and browser checks at 1440×900, 1280×800, 768×1024, and 390×844.
3. Confirm Luma registration, eligibility/team identity, and authority to make the repository public.
4. Show the exact sender, recipient, subject, and body for both the outbound RFQ and controlled French reply. Obtain either two explicit action-time approvals or one combined approval that clearly enumerates both messages.
5. After approval only: refresh the 15-minute binding, enable the narrow switch, approve the immutable hash, send one Atlas RFQ, relock, and confirm queued → sent → delivered.
6. Send the project-owned French reply only after its own approval or an explicit combined approval. It contains MOQ 150, 72 MAD/unit, 650 MAD sample, 30–35 days, decal/hand-painted logo, available food-contact documentation, shipping excluded, previous European exports, and one unresolved packaging question. Never infer that RFQ approval also covers this reply.
7. Verify signed callback, original message view, strict OpenAI extraction, exact evidence, deterministic recalculation, realtime UI, duplicate protection, and a sanitized AgentMail proof. Then sync README, architecture, checklist, decisions, and `hackathon.md` using the official skill.
8. Ask separately before each public action: pushing commits; changing GitHub visibility; production/static-hosting deployment; publishing the tagged social post; and submitting through VibeApps. Approval for one does not authorize the others. Between those gates, run the incognito test, record the sub-2:58 video, and add its link to `hackathon.md`.

## Approval gates

Stop and ask before sending either controlled message or any real email; using a
non-project-owned recipient; creating paid resources; enabling unrestricted paid/public APIs;
pushing or changing repository visibility; production deployment or DNS; social/final
submission; destructive operations; or using unsupplied credentials.

The prior requested phrase **“Approve controlled send and reply” was never received**. The
prepared draft and this handoff are not send authorization.

## Internal target scope

Finish the polished core loop before stretch work: landing/open demo, structured brief,
reference-image suggestions, real reactive research, evidence and dedupe, Question Gap Engine,
human-approved outreach, AgentMail delivery/reply, strict extraction, deterministic comparison,
evidence viewer, System Pulse, Mesh Passport, presentation/reset/replay, public hosting,
submission docs/assets, and the video.

Do not expand into payments, escrow, purchase orders, freight/customs/tax calculation, lending,
insurance, WhatsApp/phone agents, autonomous negotiation/follow-ups, reviews, broad catalogues,
supplier onboarding, mobile apps, native Arabic UI, or general chat before submission.

Key files: [hackathon.md](hackathon.md), [SUBMISSION_CHECKLIST.md](SUBMISSION_CHECKLIST.md),
[DEMO_SCRIPT.md](DEMO_SCRIPT.md), [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md),
[docs/PRODUCT.md](docs/PRODUCT.md), [docs/AI_GOVERNANCE.md](docs/AI_GOVERNANCE.md),
[DECISIONS.md](DECISIONS.md), and [.env.example](.env.example). Never inspect or print real
environment values merely to enrich documentation.
