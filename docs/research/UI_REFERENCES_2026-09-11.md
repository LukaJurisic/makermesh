# MakerMesh external UI references

Research date: 2026-09-11. Scope: public primary sources for sourcing and procurement workflows. No authenticated product sessions were tested. Product-page claims and published screenshots describe vendor presentations, not independently verified behavior. Recommendations below are our design interpretation, not facts about MakerMesh's current capabilities.

## Direction

Keep MakerMesh's existing warm paper, terracotta, teal, Instrument Serif, and Geist system from `docs/DESIGN_SYSTEM.md`. Borrow organization and interaction patterns from mature procurement products; use adjacent editorial products to refine visual character. The most useful domain references are **Omnea for supplier context and approvals, Zip for intake, and Fictiv for quote tradeoffs**.

## 1. Omnea — the strongest workflow reference

**Public evidence:** Omnea describes a central request summary with upcoming steps and timelines, plus prioritized approval tasks with summaries and access to full context. Its supplier repository groups documents, contacts, requests, approval history, and other information into supplier records. These are official marketing product pages containing illustrations/screenshots; actual application access was not attempted. [Approval workflows](https://www.omnea.co/products/approval-workflows), [Supplier repository](https://www.omnea.co/products/supplier-repository).

**Apply to MakerMesh:** Make the project header answer “Where are we?” and “What needs me?” A compact progress row can show Brief → Makers → Outreach → Replies → Compare, with the current step and a single next action. Give each maker a stable detail view: overview, evidence, messages, and activity. Keep an approval summary above the exact outgoing message; recipient provenance and unresolved questions must stay visible before approval. On reply arrival, link extracted facts back to the original excerpt.

**Design interpretation:** A calm record detail with a narrow context column will suit MakerMesh better than several equally prominent status cards. Omnea is a workflow reference; do not copy enterprise risk, finance, or policy features into the hackathon scope. Its automated approval language does not override MakerMesh's explicit email approval requirement.

## 2. Zip — a brief that is easy to start

**Public evidence:** Zip describes a single entry point, adaptive intake workflows, and AI assistance for gathering request details. Its Intake-to-Procure page describes converting natural-language requests into structured forms. These are public product presentations, not a hands-on form test. [Intake management](https://zip.com/capabilities/intake-management), [Intake-to-Procure](https://zip.com/products/intake-to-procure).

**Apply to MakerMesh:** Lead with one prompt: “What do you need made?” Follow it with an editable structured brief containing quantity, budget, destination, deadline, and material or finish requirements. Ask only for unresolved information. Keep the resulting brief visible while editing so the user can understand what the system captured. Use a clear review step before researching or contacting makers.

**Design interpretation:** One generous input region and a quiet brief summary should feel more approachable than a dashboard of empty widgets. Avoid presenting a decorative chat transcript as the sole way to correct structured information.

## 3. Fictiv — compare decisions, not abstract scores

**Public evidence:** Fictiv's current homepage promotes comparison of quantity tiers using unit price, total cost, lead time, and savings. Its official help article documents a lead-time selection module, automatic cost updates, and per-part lead times. The help page is marked updated July 25, 2025, and includes screenshots, one bearing a 2021 filename; it is useful workflow documentation, not proof of current pixel styling. [Fictiv](https://www.fictiv.com/), [Selecting a quote lead time](https://www.fictiv.com/help/getting-a-quote/how-do-i-select-a-lead-time-for-my-quote).

**Apply to MakerMesh:** Align supplier columns against the same buyer criteria: minimum quantity, price and currency, total cost where actually known, lead time, delivery, and evidence. Distinguish unknown, quoted, and inferred values. Put evidence access beside the fact, not in a detached technical panel. Explain tradeoffs such as lower minimum versus longer lead time; do not crown a winner from incomplete data. On mobile, repeat criterion labels in each structured supplier stack.

**Design interpretation:** Fictiv is useful for operational clarity and comparison semantics. MakerMesh should retain its warmer editorial character rather than adopt an industrial manufacturing aesthetic or imply instant quotes it cannot supply.

## Recommended first redesign slice

1. Project summary with next action and restrained progress.
2. Maker list with consistent decision fields; detail opens a readable dossier.
3. Comparison with explicit missing values and source-linked facts.
4. Approval and reply views that preserve the exact message and its provenance.
5. Brief intake, then landing-page refinement after the working product feels coherent.

These are design recommendations only. No application files, design tokens, integrations, sending behavior, or deployments were changed for this research.

## Adjacent visual references and inspected evidence

### Attio — strongest application-shell reference

Official record documentation shows contextual tabs for overview, activity, email, notes,
tasks, and files, with record previews accessible from list views. Its published activity
screenshot was visually inspected: restrained dividers, compact type, and grouped chronology
make a dense record legible. For MakerMesh, borrow a unified maker dossier and contextual
actions, with evidence and correspondence accessible from the same record. Keep the existing
warm palette instead of copying Attio's colors. [Official record guide](https://attio.com/help/reference/managing-your-data/records/create-and-view-records).

### Dovetail — evidence workspace organization

Its March 2026 experience article shows a home with simplified navigation, search/chat,
pinned material, and personalized content. The published dark UI screenshot was visually
inspected. Borrow clear evidence navigation and recent or pinned sources; a general chat
homepage is less suitable than a guided sourcing request for MakerMesh's current scope.
[Official experience article](https://dovetail.com/blog/new-dovetail-experience/).

### Visual synthesis

The best combination is **Attio's record organization + Omnea's request clarity + MakerMesh's
editorial material palette**. Omnea's public homepage has a large serif headline and neutral
space; its supplier/request illustrations show subtle table rules, compact filters, and a
prominent action-needed state. Keep that hierarchy while avoiding its particle treatment,
which conflicts with MakerMesh's design rules. Zip's inspected homepage emphasizes one
large input and a short set of actions; borrow the approachable start, not its blue gradient.

Screenshots and a linked comparison board are saved under ignored
`artifacts/ui-research.local/index.html`, with overview `reference-board.png`. These contain
third-party reference images for internal research, not reusable production assets. Attio
and Dovetail captures are official help/blog illustrations; Omnea details are official
product-page artwork; Zip and Omnea hero captures are public marketing pages.

Faire is a relevant wholesale-domain reference, but its page returned a browser security
challenge; no claim of current visual inspection is made. [Home decor category](https://www.faire.com/category/Home%20Decor).

Research does not change or approve a new design system. A next design pass should retain
Geist/Instrument Serif, paper surfaces, terracotta actions, and teal evidence states unless
the user explicitly approves a different aesthetic.
