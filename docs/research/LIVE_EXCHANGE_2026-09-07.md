# Controlled live exchange verification

September 7, 2026. The user explicitly approved the reviewed development deployment and
the exact two-message packet before execution. No real supplier was contacted.

Subsequent publication approval was received. The reviewed fingerprint was unchanged,
publication succeeded, and the anonymous public result matched the preview exactly.
Live browser checks verified quote values, weight updates, reset persistence, and responsive
layouts. The earlier unpublished state described below records the pre-publication milestone.

## Exercised result

- Reviewed backend and frontend deployed to the existing development `convex.site` app.
- Fresh provider mailbox identity attestation completed; v2 draft content matched the approved packet.
- One bilingual RFQ queued and delivered through AgentMail. The controlled-send switch was immediately relocked.
- One approved French reply queued in the original thread and received by the buyer inbox.
- Signed callback accepted: one inbound decision, one processed reply, no quarantined decision for that reply.
- OpenAI extraction completed on the third and final bounded attempt. No additional email was sent during retries.
- Original source, strict structured quote, exact excerpts, current scope, and deterministic comparison verified privately.
- Public query still returns no published reply proof; publication is a separate approval.

## Quote and comparison

The fictional supplier states MOQ 150, 72 MAD per cup, sample 650 MAD, production 30–35 days,
EXW, shipping excluded. Payment terms remain unspecified. All nine hard requirements pass
as supplier statements in this controlled demonstration; packaging remains unknown. The
below-35-days preference fails because the maximum stated production time is 35 days.
No food-safety certification or independent verification is inferred.

## Live findings and corrections

1. AgentMail appends its literal `--` / `Sent via AgentMail` footer. Exact source validation
   now allows only this observed suffix and LF/CRLF transport variants. Arbitrary additions
   still fail. The original received text is preserved.
2. The first two model responses paraphrased a MOQ supporting excerpt. Persistence rejected
   both. Response schemas now restrict evidence to exact source spans using Structured
   Outputs enums; persistence retains its independent substring/hash checks. The final
   attempt passed. See [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs#supported-schemas).
3. French normalized text and explicit `8 oz` were not previously canonicalized for the
   English/numeric evaluator. A narrow deterministic normalizer fixes these known forms,
   preserves raw claims, and keeps unknowns and coordinated negations from earning points.
   Preferred MOQ/production thresholds reuse their corresponding observed hard-attribute
   evidence. Derived stored evaluations and metrics were reconciled after the fix.

Verification: 91 tests across 18 files, strict frontend/backend types, formatting, lint,
and production build. The prior full Playwright run passed 7 applicable cases with 5
intentional skips; deployed landing and demo were opened during this exchange. Follow-up
reviews found no remaining actionable issue in the corrections.

## Remaining submission gates

The sanitized proof is now published and its public UI verified. Finish deployed
accessibility checks and video; confirm registration/eligibility; publish the source and
tagged social post; submit through VibeApps. Current completion is the approved private
exchange and deployment, not the final competition entry.
