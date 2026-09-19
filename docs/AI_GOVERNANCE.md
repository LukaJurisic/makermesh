# MakerMesh AI governance

## Boundary

OpenAI may structure requests, extract source and reply fields, translate or localize
messages, propose question gaps, and explain deterministic results. It may not secretly
choose the best supplier, convert unknowns into passes, infer certification, or establish
trustworthiness.

## API and schema rules

- Use the current OpenAI Responses API.
- Default structured model: `gpt-5.6-luna`, centrally configurable through Convex
  environment variables and selected for cost-sensitive structured workloads.
- Every extraction uses strict Structured Outputs and is validated again with Zod.
- Model identifiers live in one server-only configuration module.
- Persist operation, prompt version, model, timestamp, and source reference.
- Reject or quarantine invalid model output rather than partially trusting it.

## Prompt registry

Planned versioned operations:

- `brief.compile.v1`
- `reference-image.suggest.v1`
- `supplier.extract.v1`
- `question-gaps.write.v1`
- `outreach.localize.v1`
- `supplier-reply.extract.v2`

Prompts are code-reviewed modules, not database-editable production instructions.

## Evidence integrity

AI summaries are not evidence. A stored claim must retain the exact source excerpt or
supplier wording and its evidence state. Extraction confidence describes whether the
model believes it parsed the text correctly; evidence state describes who or what
supports the underlying claim. These values are never collapsed.

Email-derived claims are written only when their excerpt is an exact substring of the
hashed analyzed message. Every non-null quote field requires its own exact excerpt.
Model-provided status remains audit metadata; deterministic operators evaluate the
normalized value and never delegate pass/fail to the model.

## Human approval

Research starts only after brief approval. Email requires review of the exact sender identity, recipient,
recipient source, subject, questions, English text, localized text, and recipient count.
No model completion can send an email.

Controlled v2 approval fingerprints include sender inbox, email, and display-name hashes.
Refreshing provider attestation cannot make an approval valid for a different sender.
Publishing a controlled reply requires a separate reviewed fingerprint; public text is
restricted to the authored demonstration message and exact excerpts, with private metadata
excluded. This proves provider execution without implying a real supplier endorsement.

## Cost and privacy

- Send only relevant excerpts, not complete crawl histories.
- Use the least expensive model that passes fixture evaluations.
- Cache by stable source/message and prompt versions.
- Cap output and retry counts.
- Log latency, cache state, operation, and status—never secrets or hidden reasoning.
- Public visitors cannot trigger live research or outreach.
