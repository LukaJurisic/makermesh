# MakerMesh decision experience: design and copy

Date:2026-09-19
Status: Recommended choices selected by user delegation; implementation pending.
Depends on DECISION_STRATEGY_2026-09-19.md, including its independent-review resolutions.
Method: source-informed plan review across seven dimensions, followed by copywriting.
The gstack designer binary is unavailable in both global and project locations; no generated
visual mockups or rendered validation are claimed. Use these wireframes for implementation,
then inspect rendered output at the four required viewports.

## 1. Information architecture

Initial plan completeness 6/10; revised specification 9/10 (judgment, not a measured usability
score). Previously unspecified: placement of original comparison, entry route and shell
next-step banner. Decisions: primary landing action goes directly to the existing Compare
route; custom research remains a secondary action. The workspace presents just three things
first: the production requirement, the consequence, and the source that explains it.

```
MakerMesh / Harbour Coffee Lab                    About this demo
Fictional supplier example · captured exchange
Does this quote fit your production window?

200 cups · Original brief limit:42 production days
Maximum production days after sample approval [42]
[Try a 30-day limit]   [Reset to original brief]

Timing meets this requirement / Timing requirement not met
Supplier states 30–35 days AFTER SAMPLE APPROVAL.
Original French excerpt + labelled English explanation
[Read full reply]

What to ask next
[Selectable clarification draft]
[Copy questions]   [Download decision brief]

> Explore a different quantity
> Original brief comparison (historical table and weights)
```

Do not duplicate ReplyImpact as a separate leading metrics section. Incorporate essential
context into this section. Keep the original brief accessible without forcing visitors
through approval/research screens before the decision example. The Compare next-step banner
must match the current task rather than directing an unapproved visitor back to Brief.

## 2. Interaction states

Initial 7/10 -> revised 9/10. No success color is sufficient without text. Results and export
use a single evaluator result, and proof loading is distinct from proof unavailable.

| Feature          | Loading                                     | Empty                                           | Error                                | Success                                    | Partial                                        |
| ---------------- | ------------------------------------------- | ----------------------------------------------- | ------------------------------------ | ------------------------------------------ | ---------------------------------------------- |
| Captured reply   | “Loading captured reply”; controls inactive | “Captured reply unavailable”; view brief action | “Couldn’t load reply”; retry         | Scenario workspace                         | Unknown fields labelled individually           |
| Production input | Inactive until evidence loaded              | Inline “Enter production days”                  | “Use a whole number from 1 to 365”   | Recompute without moving focus             | Timing missing: no verdict                     |
| Quantity         | Secondary disclosure                        | Inline quantity prompt                          | Whole number 1–100000                | MOQ condition + illustrative arithmetic    | Changed size: quote must be reconfirmed        |
| Clarification    | No draft until valid state                  | No actionable proof: explanation                | Clipboard failure: selectable text   | “Questions copied” only after success      | Unconfirmed terms stay as questions            |
| Export           | Disabled                                    | Disabled if proof missing                       | Show selectable brief if unsupported | “Download requested”; browser decides save | Include unknowns, never fabricate completeness |

Clearing input immediately suppresses dependent results and export; retain unaffected source
wording and user focus. Update a short polite live status after a valid change; avoid reading
the full reply on each keystroke. If proof updates, recompute; if it disappears, remove the
old result. Reload resets local scenario. Drawer close preserves edits and restores focus.

## 3. Journey

Initial 6/10 -> revised 9/10. The existing journey introduces several stages before a useful
outcome. New journey keeps stages available but makes the decision directly reachable.

| Moment              | User action                     | Intended understanding                     | Evidence                                    |
| ------------------- | ------------------------------- | ------------------------------------------ | ------------------------------------------- |
| First screen        | Enter quote example             | A ceramics sourcing example I can try      | Specific CTA and fictional/captured label   |
| First interaction   | Choose30 days                   | The supplier has not committed to my limit | Timing mismatch, no overall approval badge  |
| Explanation         | Read original sentence          | The clock starts after sample approval     | Exact French sentence and plain explanation |
| Next action         | Copy question or download brief | I can ask for a revised commitment         | Current scenario in draft and export        |
| Further exploration | Change quantity                 | An old quote cannot promise a new order    | Visible reconfirmation state                |

Target: a fresh visitor can reach the mismatch with one click after entering the example.
Comprehension test checks four facts specified in the strategy, not a satisfaction score.

## 4. Specificity and generic-design risk

Initial 7/10 -> revised 9/10. Classify Compare as app UI and landing as marketing. No new KPI
card grid, decorative illustration, badges claiming quality, confetti or fake arrival animation.
The visual anchor is the production limit beside the exact commitment. Content order must
remain comprehensible when colors and decorative shadows are removed. Each section has one
job; disclosure hides secondary controls, not material limitations.

Litmus: unmistakable brand yes; one anchor yes; scanning headings communicates journey yes;
one job per section yes; no decorative cards required; motion only aids state transition;
layout works without shadows. These are specification checks, not completed rendering checks.

## 5. Design system

Initial 8/10 -> revised 9/10. Retain docs/DESIGN_SYSTEM.md and src/styles/tokens.css. Geist UI,
Instrument Serif headings; canvas#f3efe7, surface#fbfaf6, ink#1d1d1a, teal#246a63 and existing
contrast-safe clay token. Use thin rules and existing form/button styles. The mismatch can
use existing danger text with an explicit label; unknown is neutral, never green. Preserve
image licensing and current branding. No font, palette or broad layout redesign.

## 6. Responsive and accessibility

Initial 6/10 -> revised 9/10. At 1440/1280 use a bounded workspace with input/consequence on
left and exact evidence on right; questions span below. At 768 use one column: input,
consequence, source, questions, actions. At 390 retain that same semantic order, full-width
input, wrapping labels, vertically stacked actions and no fixed overlay covering evidence.
Never require horizontal scrolling to interpret the scenario.

Visible labels; numeric text with inputMode numeric plus explicit validation; 44px minimum
main actions; focus ring from existing tokens; aria-describedby for timing start condition
and errors; aria-invalid for rejected input; polite short result status. French excerpts
have lang=fr and English explanation lang=en. Respect reduced motion; no scroll/focus jump
when result changes. Evidence drawer remains keyboard-complete. Verify200% zoom, long
translated text, four required viewports and automated contrast; manual screen-reader
coverage remains separately stated rather than implied by axe.

## 7. Resolved choices and boundaries

Initial 6/10 -> revised 9/10. Chosen: Compare integration over a new route; timing primary;
quantity secondary; original table/weights disclosed; exact evidence inline; Markdown export;
custom research linked as a separate workflow. No live supplier contact button is added.
Loading/error capability in the existing context may require a small explicit state field,
not a new query API. Design remains subject to rendered QA; no 10/10 completion claim.

## Copywriting: chosen direction

Audience: café/boutique hospitality buyers; secondary audience hackathon judges. Primary
landing action: try the evidence-backed example without signup or provider spending.
Tone: specific, calm and practical. No fabricated traction, savings, uniqueness or endorsements.
These are implementation-ready drafts; they do not describe the current deployed feature
as already shipped. Publish them with the implementation, not before.

### Landing

Eyebrow: Custom ceramics sourcing
Headline: Know what the workshop can commit to.
Supporting sentence: Explore Moroccan ceramics sources, then try a captured quote example
to see how requirements, exact wording and unanswered questions shape a sourcing decision.
Primary CTA: Try the quote example
Adjacent disclosure: Fictional supplier · captured email exchange
Secondary CTA: Research your own request
Brand line elsewhere: A market appears when you ask.

Rationale: a concrete buyer benefit leads; the supporting sentence honestly distinguishes
live source research from the controlled quote example. Retaining the brand line preserves
identity without making it carry the whole explanation.

Alternatives considered:

- “Understand the quote before you order.” Clearer transactional cue, but can imply broader
  ordering support; retain as an alternate only with scoped supporting copy.
- “A market appears when you ask.” Distinctive brand line, less concrete; keep secondary.
  CTA alternate: “Test a production deadline.” Specific but may sound like a logistics tool;
  prefer “Try the quote example” and use the30-day action inside the workspace.

### Scenario

Heading: Does this quote fit your production window?
Context:200 cups · original brief limit 42 days
Input: Maximum production days after sample approval
Shortcut: Try a 30-day limit
Reset: Reset to original brief

Original scenario result: Timing meets this requirement.
Explanation: The supplier states 30–35 production days after sample approval. Your limit is
42 days. Sample preparation and approval time, shipping and customs time are not included.

30-day scenario result: Timing requirement not met.
Explanation: The quoted range extends to 35 days after sample approval. Your30-day limit
needs a revised supplier commitment.

Source: “La production prend 30 à 35 jours après validation de l'échantillon.”
Implementation must use the actual DTO substring with original spaces/punctuation, not
copy this illustrative typeset line as manufactured evidence.
English explanation: Production takes 30–35 days after sample approval.

Question heading: Ask for a revised commitment.
Draft: “Your reply states production takes 30–35 days after sample approval for 200 cups.
Can you confirm production within 30 days after sample approval for 200 cups, and whether
that changes the 72 MAD unit price? Please also confirm packaging for international transport.”
Draft must use current scenario values. At the original 42-day limit, omit the false urgency:
“Please confirm packaging for international transport. Your quote excludes freight,
customs, taxes and duties; which shipping details would you need for a separate estimate?”
These are deterministic English drafts. No invented supplier responses or certification claims.

### Quantity and cost

Label: Explore a different quantity
Changed quantity heading: A revised quote is needed.
Explanation: This reply priced200 cups. The requested quantity has changed; unit price,
capacity and production timing need supplier reconfirmation.
Subtotal label original quantity: Product cost at the quoted unit rate
Subtotal label changed quantity: Illustrative product cost using the original unit rate
Qualifier: Shipping, customs, taxes and duties excluded. Sample quoted separately at 650 MAD.
Do not combine sample charge with subtotal or imply a refund/credit policy.

### Export and workflow bridge

Export CTA: Download decision brief
Copy CTA: Copy questions
Export title: MakerMesh sourcing decision brief — fictional supplier example
Bridge on custom research: “What happens after a supplier replies? Explore a separate
fictional quote example. These research leads are not part of that comparison.”
Bridge CTA: Try the quote example

### Submission paragraph, after implementation is verified

MakerMesh helps café buyers understand what a ceramics workshop has actually committed to.
Visitors can research Moroccan ceramics sources and explore a separately labelled captured
French reply. Change the production requirement, inspect the exact supporting sentence,
and prepare the clarification needed before proceeding. Convex stores the sourcing workflow
and live evidence; OpenAI structures briefs and replies, Firecrawl retrieves public sources,
and AgentMail carried the approved controlled exchange. Original currency, exclusions and
unknowns stay visible.

### Video opening, after implementation

Show the30-day shortcut first. Caption: “You need production within 30 days after sample
approval. This workshop quoted30–35. What do you ask next?” Show exact evidence, then the
clarification. Move to the research path only after that outcome is clear. Keep the captured
fictional disclosure visible; no simulated real-time delivery or extra email for recording.

### Metadata

Title: MakerMesh | Ceramics sourcing with evidence
Description: Research Moroccan ceramics sources and explore a captured quote example.
See stated terms, unanswered questions and the evidence behind a sourcing decision.

## Completion

Seven design dimensions reviewed; recommended choices recorded. Copywriting includes
chosen page copy, alternatives, annotations and metadata. No app code changed. Required
next work is implementation and rendered verification, not another general planning loop.
