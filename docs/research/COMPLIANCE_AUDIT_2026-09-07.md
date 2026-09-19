# MakerMesh competition and implementation audit

Audited September 7, 2026. Verdict: **audit complete with concerns; submission readiness is not established**.

## Scope and evidence

Reviewed `3262d70` and `96d013b` using `git diff 16c8617...96d013b`, with independent Standards and Spec reviews. Also inspected the broader public journey against `docs/PRODUCT.md`, `AGENTS.md`, and the continuation handoff. No application code, cloud configuration, email state, repository visibility, or deployment was changed during this audit.

Reopened the [official Convex rules](https://www.convex.dev/hackathons/all-gas) and [Luma event](https://luma.com/convex-allgas-hackathon). Their substantive requirements agree with the existing [rules research](HACKATHON_RULES_2026-09-07.md). Repository evidence and browser observations below are separate from organizer requirements; this is not organizer certification of eligibility.

## Competition readiness

| Requirement                                      | Status and evidence                                                                                                                                                                             |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| New original app after the kickoff               | History begins August 29, 2026; compatible with the August 25 noon PT cutoff. History alone cannot establish all originality/IP claims. `CREDITS.md` and `NOTICE.md` document asset provenance. |
| Convex backend and agent/plugin workflow         | Implemented: schema, indexed queries, mutations, actions, workflow, realtime client, and official components. Repository log records the build workflow.                                        |
| Sponsors perform real product work               | Partial. Public captured proof records OpenAI brief compilation and Firecrawl search/crawl. AgentMail send/receive remains unexercised according to the handoff.                                |
| Public supported hosting                         | Browser opened the development `convex.site` landing and demo without login. It displays captured research proof and explicit fictional-market disclosure.                                      |
| Public GitHub and root build log                 | Not ready. Authenticated `gh repo view` confirms `PRIVATE`. Root `hackathon.md` exists but says `Repo: none` and lacks a demo-video link.                                                       |
| Registration and eligible entrants               | Unverified. User confirmation requested for registration, team, age, residence, and excluded affiliations.                                                                                      |
| Tagged social post and video under three minutes | Unverified/pending; prepared social assets are not evidence of publication.                                                                                                                     |
| Submission                                       | Pending; cutoff is before September 22, noon PDT / 3 PM Toronto EDT.                                                                                                                            |

These requirements come from the [Convex rules](https://www.convex.dev/hackathons/all-gas) and [Luma requirements](https://luma.com/convex-allgas-hackathon). A send-and-receive demonstration is MakerMesh's chosen end-to-end acceptance criterion; the organizer's sponsor wording requires real work and does not separately prescribe this exact controlled exchange. Production-tier hosting is not an explicit requirement; public supported hosting is.

## Standards review

No confirmed hard Standards violation in the two-commit diff. Operator authorization, canonical recipient and fictional supplier identity, frozen brief semantics, provider mailbox attestation, message hashing, explicit approval, and inbound quarantine are present. Provider lookup restricts origins, rejects redirects, bounds response bytes, and times out.

One non-blocking maintainability observation: `requireFreshDedicatedDemoRecipient` in `convex/model/controlledOutreach.ts` repeats the binding lookup already performed by `requireDedicatedDemoRecipient`. A shared loader could return both configuration and binding. This is a possible duplication smell, not a safety failure.

Pre-existing behavior outside the diff: the inbound handler in `convex/agentMail.ts` accepts drafts in `queued`, `sent`, or `delivered`, then changes the first accepted reply to `replied`. A second distinct reply is quarantined even though a three-message quota exists. The frozen one-reply demonstration does not require changing this; document the limit or add coverage before supporting additional replies.

## Spec review

### P2: sender identity is outside the approved fingerprint

The handoff requires review of the exact sender, recipient, subject, and body. `hashControlledDraftContent` in `convex/model/controlledOutreach.ts:107` hashes recipient/template fields but omits sender inbox, email, and display name. `approveControlledDemoDraft` in `convex/controlledOutreach.ts:454` stores only the content hash as approval. Sender identity is checked independently against current configuration and a fresh provider attestation.

Consequently, an operator configuration change to another valid project-owned sender, followed by fresh attestation, can leave an earlier approval valid. This requires privileged configuration changes; it is not an unauthenticated email bypass. Found through code tracing, not a provider send or an added regression test.

Before sending, bind the reviewed sender identity to the approval fingerprint and cover sender rotation after review and approval. Existing draft migration/re-preparation must preserve the unapproved state; no automatic approval or send should accompany the fix.

### Public reply and reactive comparison are still unfinished

Product scope requires preserving and structuring a normal reply, followed by reactive deterministic comparison. The continuation also requires sanitized AgentMail proof.

`convex/schema.ts:417` and `convex/demo.ts:60` permit only `research_only` capture scope. `convex/demoCapture.ts` explicitly rejects mail usage and reply state. `src/pages/project/ComparePage.tsx:18` ranks bundled `demoMakers`. A successful private exchange alone therefore cannot complete the public product journey.

Implement a bounded, privacy-preserving projection for the controlled fictional Atlas reply and deterministic comparison. Keep provider identifiers, mailbox addresses, and private mail outside public DTOs. Preserve the distinction between a real provider operation and fictional supplier assertions. Add tests for privacy, stale brief/message rejection, duplicate callbacks, and reactive result updates before claiming this loop complete.

The unapproved draft is intentional pending work. The exact 17-requirement scope guards and extraction checks otherwise align with the frozen wedge. No unrequested feature expansion was found.

## Verification run

- `npm run check`: passed formatting, Oxlint, root/Convex TypeScript, **64 tests across 15 files**, and production build.
- `npm run test:e2e`: **7 passed, 5 intentionally skipped**. The skips avoid duplicate visual/social cases in the mobile project.
- This E2E invocation also ran all canonical screenshot tests: 1440×900, 1280×800, 768×1024, and 390×844. Twelve landing/brief/passport captures are under ignored `artifacts/screenshots/`; a second identical screenshot invocation was unnecessary.
- Public browser: landing and demo accessible; captured-live research and fictional market labels visible. This was not a complete fresh Lighthouse or assistive-technology audit.
- GitHub API: repository visibility is `PRIVATE`, replacing the earlier unauthenticated-404 inference.
- Application worktree remained unchanged. Two historical commits are ahead of the locally stored remote-tracking ref; no fetch or push was performed.

The E2E command starts its own anonymous local Convex backend and rewrites ignored `.env.local` to local endpoints. The test process stops that backend afterward. Explicitly select the intended cloud development deployment before subsequent cloud inspection; do not infer it from this local test configuration. A subsequent Convex MCP status request resolved the stopped local backend, so private cloud draft state and switches were not freshly queried in this audit.

## Corrected continuation order

1. Fix sender-bound approval and prove sender changes invalidate reviewed/approved state.
2. Implement the sanitized controlled reply/proof projection and reactive public comparison; verify locally with explicit fixture tests.
3. Select the cloud development target explicitly and inspect current draft/status without printing secrets. Prepare the exact outbound and French reply approval packet, including actual sender and recipient.
4. Obtain explicit approval for both enumerated messages; then execute and verify the controlled exchange, callback, extraction, duplicate handling, and safe public proof. The previous phrase requesting approval was not itself authorization.
5. Reconcile README baseline v3, checklist 52-test claim, build-log repo metadata, and all historical versus current verification claims. Do not mark pending gates complete.
6. Confirm registration/eligibility; obtain approval for repository publication and other external publication actions when the concrete artifacts are ready.
7. Once the functional compliance gaps are closed, improve UI/UX under `docs/DESIGN_SYSTEM.md`, then record the video, publish the tagged post, and submit.

UI/UX redesign remains deferred as requested. Preserve the standalone MakerMesh design system rather than inheriting the parent portfolio palette and typography.
