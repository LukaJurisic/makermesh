# September 19 release candidate

## Functional scope

Custom Moroccan-ceramics requests now have a real path: create a private request, let OpenAI
structure a brief, explicitly approve that brief, run bounded English/French Firecrawl
searches, read up to three distinct source domains, and extract exact source-span references.
The results identify sourcing leads and show public statements alongside confirmation
questions. They do not grade real suppliers, infer quotes, or contact anyone.

The captured fictional Atlas exchange remains separate. Its comparison now explains the
reply's contribution: requirements gaining supplier evidence, unresolved requirements, and
the quoted amount. The before view explicitly removes this reply's evidence; it is not
presented as a newly arriving email or a reconstruction of all earlier research.

## Limits and privacy

- Operator-controlled total research allowance, maximum 25 remaining requests per setting.
- At most two new requests per visitor per hour, three per day, and ten globally per day.
- Each request reserves allowance atomically once. Duplicate keys with different input fail.
- At most two OpenAI calls with SDK retries disabled. At most two logical searches and
  three scrapes. Firecrawl's component can attempt each HTTP call four times, so its worst
  case is twenty HTTP attempts per request. Workflow action retries are disabled.
- Private capability stored in the browser profile, never in the URL. Legacy tab tokens
  migrate without changing the owner. Other browser sessions cannot read or approve results.
- Per-request scheduled deletion at 48 hours, plus hourly cleanup fallback. Deletion
  invalidates query subscriptions and removes the request and retained pages.
- Contact details are redacted from source text and rejected in decoded source URL paths.
- Every retrieved page survives extraction even when the model omits it; omitted material
  is retained as an unclear source with no invented facts.
- Generic marketing language is not treated as confirmation of the buyer's exact request.
  All exact requirements remain available as questions, with uncovered essentials first.
- Total provider failures produce a failed workflow, not a misleading successful empty list.

## Live verification

The final backend and frontend were deployed to the existing development site on September 19. The full check passes all 102 tests, formatting, lint, types, and build. The latest
Playwright run passed 11 cases with 5 intentional skips. Four deployed routes also passed
automated axe A/AA checks; deployed revision and cross-session denial were verified.

Four bounded development requests exercised compilation, explicit approval, search,
source retrieval, extraction, and reactive UI. Earlier runs exposed poor search relevance;
the final bilingual run returned three real sources, including a business stating it has
five factories in Morocco. These remain leads requiring direct confirmation, not qualified
makers. No additional email was sent. One standalone provider search was used to diagnose
query relevance; it was not counted as a product request.

Browser checks verified request-specific revision despite a different newer local draft,
cross-session denial, and completed results. Automated axe WCAG A/AA checks found no
violations on landing, composer, comparison, and the real custom result after correcting
sidebar label contrast. This is an automated check, not comprehensive assistive-technology
certification.

The source review scanned 252 then-current working files and all fifteen existing commits
for high-confidence credential patterns, with no matches. Private operational scripts,
browser capabilities, recordings, and review screenshots remain in ignored local directories.
Existing image/font/icon provenance is documented in CREDITS.md and NOTICE.md.

## Release gates

Eligibility and Luma registration still require owner confirmation. Repository visibility,
video/social publication, and final VibeApps submission are tracked separately in the
submission checklist. Do not claim the entry submitted until the form returns confirmation.
