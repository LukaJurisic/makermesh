# MakerMesh decision experience: strategy review

Date: 2026-09-19
Branch: codex/submission-ready-20260919; base: main (origin/main exists)
Mode: SELECTIVE EXPANSION
Status: Recommended decisions selected under user's instruction to default to recommended answers.
Planning only; no application changes made by this review.
Input: office-hours decision design and docs/research/PUBLIC_BUILDS_2026-09-19.md.

## Strategic conclusion

The current implementation proves sponsor integrations; the proposed scenario calculator
alone does not establish a strong competitive advantage. Quote Arena already describes
replies changing rankings. Make the distinguishing experience a traceable buyer question:
change a constraint, see exactly which supplier commitment fails, inspect the original
French wording including its conditions, and leave with a precise clarification draft.
This is a positioning hypothesis, not proven uniqueness or a forecast of winning odds.

## System audit and what already exists

HEAD 809bd37 contains the released custom research, captured reply and buyer workspace.
The sole uncommitted input is the public-build research note; no stashes were reported.
Existing reviews addressed provider failure, contact redaction and capability persistence.
No TODO/FIXME matches were returned in the inspected source areas. Publication and
eligibility remain open in SUBMISSION_CHECKLIST.md, independent of this review.

Reuse controlledReply sanitized DTO, controlledReplyMaker, the exact-excerpt reply drawer,
ComparePage, requirement evaluation semantics, existing Button/Drawer and CSS tokens.
Good patterns: pure comparison.ts functions; server-reviewed controlledReply projection;
Drawer keyboard/focus behavior. Avoid growing ComparePage into a second evaluator and
avoid the current simultaneous impact metrics, quote section, status banner and weight
slider competing with the buyer's next action.

## Step 0: Premises, alternatives and ambition

Accepted premises: judges can inspect a public example; integrations alone are shared by
other entries; no real buyer validation is yet documented; source qualifiers must survive
interpretation; scenario changes cannot amend supplier commitments. Doing nothing leaves
us with a robust demo whose commercial payoff is hard to discover.

Current -> this release -> twelve-month direction:
separate research/proof -> evidence-linked decision and question -> consented supplier
workflows with revised quotes and retained decision history. Long-term persistence is not
required to prove the narrower experience and is deferred.

Alternatives:

- Minimal: better copy around existing reply impact. Small effort, low risk; clearer but
  not sufficiently interactive. Reuses current components, no new decision behavior.
- Selected: local scenario evaluator plus exact evidence, clarification draft and export.
  Medium effort, bounded risks, useful output; cannot validate commercial acceptance.
- Ideal longer-term: connected custom request-to-supplier reply and revision history.
  Large effort, external approval/delivery/state complexity; strongest continuity but
  unnecessary new exposure before the deadline. Defer.

Human effort estimates: selected path approximately 1–3 engineering days; agent-assisted
implementation plus review/QA approximately half to one working day, not a guarantee.
Do not sacrifice release verification to meet these estimates.

10x vision: a buyer can explain every proposed purchasing decision in one place and ask
the one unresolved question that matters. The current release demonstrates one truthful
slice of that vision, not autonomous negotiation or verified supplier qualification.

## Scope decision log

| Decision                                | Recommendation selected                                                        | Reason                                                                     |
| --------------------------------------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| Core experience                         | Keep scenario inputs, source evidence, questions and export                    | Links the calculation to buyer action                                      |
| Small expansion 1                       | Add “Try a 30-day production limit” shortcut                                   | One obvious interaction makes the consequence discoverable                 |
| Small expansion 2                       | Show original French timing sentence inline, with labelled English explanation | Preserves after-sample-approval condition at the point of decision         |
| Small expansion 3                       | Put a specific clarification draft directly after the mismatch                 | Closes the read-to-next-action gap without sending email                   |
| Small expansion 4                       | Offer one-click reset with an explicit original 42-day limit                   | Makes exploration reversible and original conditions legible               |
| Small expansion 5                       | Make “Try the quote example” the primary landing action for this release       | Value remains inspectable even if research allowance is exhausted          |
| Quantity                                | Retain as secondary “Explore quantity” control                                 | Useful arithmetic, less compelling than the timing decision                |
| Print/PDF or public share               | Defer; retain one Markdown export                                              | Avoid another artifact renderer or privacy surface                         |
| Fresh live email replay                 | Defer                                                                          | Prior controlled exchange is enough evidence; new costs/latency not needed |
| New supplier matching or more verticals | Skip for submission                                                            | Dilutes the ceramics case and increases unverified claims                  |

## 1. Architecture

New frontend pure module evaluates only explicit scenario dimensions and creates a
structured decision result. A formatter consumes that same result for UI/export parity.
No new database writes, endpoints, LLM calls, secrets or dependencies are needed. Do not
import server execution modules into the client; mirror only the small numeric semantics
with parity tests or reuse a genuinely browser-safe pure helper.

```
Convex sanitized captured reply ----+--> scenario evaluator --> decision view
Original example requirements -----|          |                   |
Local validated inputs ------------+          +--> formatter --> download
                                                      |
                                              clarification text
```

No historical comparison badge may imply the changed scenario passed. Move historical
comparison and weights under a clearly titled “Original brief comparison” disclosure;
scenario outputs say “Timing requirement not met”, not an overall supplier verdict.
Proof unavailable or loading cannot silently become fictional fixture evidence in this area.
At 10x/100x traffic local arithmetic adds no provider demand; existing proof query/hosting
remain the availability dependencies. Component isolation makes rollback a frontend change.

## 2. Error and rescue registry

| Codepath / failure                             | Typed state or exception                                    | Recovery and visible result                                                | Test           |
| ---------------------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------- | -------------- |
| Input empty/fractional/nonfinite/out of bounds | invalid_input result                                        | Labelled inline error; suppress derived outputs/export                     | unit/UI        |
| Quote/proof absent or withdrawn                | unavailable result                                          | “Captured reply unavailable”; keep original clearly labelled demo separate | UI             |
| Proof query still pending                      | loading state                                               | Text progress; controls disabled; no assumed values                        | UI             |
| App query throws                               | query error boundary                                        | Retry action; no retained success claim                                    | UI/integration |
| Quote field absent                             | unknown result per field                                    | Unconfirmed text; other known fields remain visible                        | unit           |
| Clipboard blocked                              | DOMException NotAllowedError/SecurityError where applicable | Selectable draft; explain manual copy                                      | UI             |
| Blob/download unavailable                      | browser capability/DOMException                             | Show selectable text; do not claim saved                                   | browser        |
| Unexpected formatter failure                   | invariant error                                             | Disable export, visible generic error, sanitized diagnostic                | unit           |

No blanket silent catches. Pure evaluation returns discriminated results rather than
throwing for expected user mistakes. Browser failures have browser-specific error names;
unknown browser exceptions use a visible fallback rather than pretending success.

## 3. Security and threat model

Input misuse (medium likelihood/low impact): strict finite integer validation with max
quantity 100000, maximum days 365; reject exponent notation if the string grammar is digits-only.
Export contamination (low/medium): allowlist sanitized fields; fixed filename; Markdown
escape headings/links/HTML from external excerpts and preserve readable source wording.
No raw provider IDs, owner tokens, private paths or request identifiers in output.
Privacy crossover (low/high): never feed custom-research results into Atlas evaluation;
link to a visibly separate example only. No external communications or paid API operations
are added. Existing public-read boundary and source withdrawal behavior must remain intact.

## 4. Data and interaction states

```
proof loading -> available + valid inputs -> decision + draft + export
      |                     | input edit          | proof removed
      v                     v                     v
 query failure       invalid input           unavailable
      |                     | correction          | proof returns
      +-- retry ------------+---------------------+
```

Nilproof: unavailable; empty evaluations: quote fields may display with provenance but no
invented requirement coverage; missing quote: no arithmetic; malformed input: inline error.
Source update: recompute all outputs from newest DTO and announce change once; withdrawn
proof clears result/draft/export immediately. Download is a labelled snapshot at click time.
Existing downloaded files cannot be remotely revoked; never imply otherwise.
Doubleclick export may download twice, but cannot send/spend/mutate. Navigate away resets
local edits as designed. Drawer Escape restores trigger focus. Reload/reset restore 200/42.
Edits persist while opening/closing the evidence drawer but do not persist across reload.

## 5. Code quality

Keep evaluator, formatter and React rendering separate. One result object should drive
summary, copied question and export; independent arithmetic in each is a regression risk.
Reuse currency formatting but never invent conversion. Explicit per-field functions beat
a generic policy engine. Target roughly 6–8 implementation/test files; a larger diff needs
justification, not skipped coverage. No backend redesign is required.

## 6. Test review

```
Inputs -> unit validation boundaries
Proof + inputs -> unit MOQ/timing/cost/unknown/conditional cases
Result -> unit escaped export and privacy allowlist
React -> edit/reset/loading/withdrawal/copy-failure component tests
Browser -> landingCTA -> shortcut -> evidence -> draft -> download
```

Critical cases:35 meets 35 and fails 30; original hardlimit 42; timing clock starts after
sample approval;149 below MOQ 150; 150 meets MOQ but changed order still requires confirmation;
200 × 72 = 14,400 product-only; different quantity never represented as binding quote; sample 650
stays separate; shipping false stays excluded; zero/blank/decimal/Infinity rejected.
Hostile QA: remove proof after user edits, then try to export. Chaos: query fails while a
result is showing. No live provider dependencies in tests. E2E verifies Markdown download
contents against visible scenario, focus restoration and mobile layout. No prompt changes,
so no new model-evaluation suite is warranted by this scope.

## 7. Performance

Arithmetic scales with the small bounded proof DTO, not the supplier corpus. No database
indexes, caching layer, additional connections or background jobs are introduced. Slowest
operations will be initial network proof fetch, existing drawer loading and browser file
save; no measured p99 claim is available. Acceptance: input outcome updates by the next
render without network calls; downloadable payload remains bounded by sanitized source DTO.

## 8. Observability

User-visible states identify input/query/copy/export failure; browser QA captures errors.
Do not collect raw quantities, draft text or private content merely for analytics. Existing
comparison_viewed metric remains sufficient for this bounded release; document whether
manual testers reached the shortcut and correctly explained the resulting issue. Browser
automation does not prove user comprehension. No new dashboard, cron or alert is justified.

## 9. Deployment and rollback

```
unit/UI/fullcheck -> local browser -> frontend development upload -> public smoke
                                                                |
                                                        fail? restore prior build
```

No schema migration. Existing DTO consumers must tolerate missing optional fields. Keep
backend unchanged; set explicit cloud URLs for frontend build because E2E rewrites local
environment selection. In first postdeploycheck: open directly, try30, inspect wording,
export and test anonymous mobile view. If broken, redeploy prior known-good frontend from
an isolated checkout of 809bd37; do not reset the user's working tree. Existing static-host
uploader cleans earlier deployment assets, so do not assume old manifest remains runnable.

## 10. Long-term trajectory

Reversible 5/5: frontend local state over existing proof. A pure decision DTO can later serve
private custom projects, but no generic workflow framework is needed now. Phase 2 would
require persisted buyer revisions, supplier quote scope/versioning and permission boundaries.
The scenario cannot silently become purchasing authorization or a real-supplier grade.
The main deferred debt is fragmented research-to-quote continuity, explicitly retained.

## 11. Design direction

One workspace with editable production limit, consequence, exact evidence and next action.
Keep quantity secondary and historical scores collapsed. Entry: landingexampleCTA directly
to Compare, bypassing the long brief/research tour; the original brief remains accessible.
No mandatory tutorial. Calm paper/clay/teal, Instrument Serif/Geist, existingdrawer,44px
controls, readablemobileorder, text status not color alone. Detailed design follows.

## Failure mode register

| Failure                             | Rescue                    | Coverage planned | Visible? | Diagnostics             |
| ----------------------------------- | ------------------------- | ---------------- | -------- | ----------------------- |
| Invalid input                       | Reject                    | unit/UI          | yes      | field error             |
| Unknown data                        | Preserve unknown          | unit             | yes      | source missing state    |
| Proof unavailable                   | Clear results             | UI               | yes      | query/error state       |
| Stale proof                         | Reactive recompute        | UI               | yes      | update announcement     |
| Clipboard blocked                   | Manual copy               | UI               | yes      | sanitized browser error |
| Download unsupported                | Show text                 | browser          | yes      | sanitized browser error |
| Changed quantity presented as quote | Conditional label         | unit/UI          | yes      | test failure if omitted |
| Timing presented as delivered date  | Explicit start/exclusions | unit/export      | yes      | test failure if omitted |

## NOT in scope / deferred

New mail, new suppliers, autonomous follow-ups, foreign exchange, landed-cost estimation,
real-supplier ranking, multi-supplier hypothetical claims, public share links and polished
PDF generation. Preserve all existing safety boundaries and pending publication decisions.

## Completion summary

All11review sections examined. Decisions resolved under user-selected recommended defaults.
Architecture, data/state, tests and deploy/rollback diagrams included. Eight failure modes
mapped; no intentionally silent failure. Scope adds discoverability, inline timing evidence,
and question emphasis rather than external systems. Actual implementation/testing remains
future work. No comparative user study or win-probability claim is made.

## Independent review resolutions

Independent strategy/spec review: 8/10, five substantive improvements accepted under
recommended defaults. These rules supersede any ambiguous wording above.

1. Exact next action for original quantity with 30-day limit:
   “Your reply states production takes 30–35 days after sample approval for 200 cups.
   Can you confirm production within 30 days after sample approval for 200 cups, and
   whether that changes the 72 MAD unit price? Please also confirm packaging for
   international transport.” The text is a draft, not a sent message or supplier agreement.
   A stricter requirement remains unmet until a revised supported commitment arrives.
2. At any changed quantity, authoritative timing/price applicability becomes unconfirmed.
   Show “Original quote: 200 cups at 72 MAD,30–35 days after sample approval” and an
   illustrative subtotal separately. Never apply the original timing as a commitment to
   a different order size. A MOQ check can still say “Meets stated minimum” without
   implying capacity. Test changed quantity and tighter timing simultaneously.
3. Fresh-reader comprehension task: after trying30 days, explain when the clock starts,
   whether shipping is included, whether editing changed the supplier’s quote, and what
   to do next. Expected answers: after sample approval; no; no; request a revised
   confirmation. Unassisted real-person observation is desired, not claimed completed;
   automated or agent reviews cannot count as customer validation.
4. Delivery order: original-order timing/evidence/draft/reset first; export second;
   secondary quantity exploration and clipboard convenience last. Never cut truthful
   labels, unknown states or core verification. If secondary features threaten verification,
   defer them explicitly and record the revised scope rather than half-ship them.
5. Place “Fictional supplier example · captured exchange” beside the main heading,
   beside the landing CTA and in the export. Avoid presenting a scenario as a live quote.

A source audit also found the current AppShell next-step prompt can send a direct Compare
visitor backwards to brief approval. Make the next-step banner route-aware on Compare:
“Test your production limit” rather than implying they must approve an example to read it.
Do not falsely mark uncompleted stages complete. Expose loading vs unavailable proof states
explicitly if the current context type collapses them; keep query failures visible.
