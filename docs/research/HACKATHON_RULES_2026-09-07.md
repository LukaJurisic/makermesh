# Convex All Gas Hackathon rules and benefits

Verified on 2026-09-07 from official first-party sources. The event-specific [Convex rules page](https://www.convex.dev/hackathons/all-gas) and [official Luma event](https://luma.com/convex-allgas-hackathon) control; the generic [hackathon-log skill](https://github.com/get-convex/convex-hackathon-skill) is implementation guidance, not a substitute for event rules.

## Dates and deadlines

- The qualifying build window starts **August 25, 2026 at 12:00 PM Pacific Daylight Time (UTC-7)**, i.e. **19:00 UTC / 3:00 PM Toronto EDT**. Only apps started at or after this instant qualify. The exact noon cutoff appears in the expanded FAQ on the [Convex rules page](https://www.convex.dev/hackathons/all-gas); Luma's structured event data supplies the year and matching timestamp (`2026-08-25T12:00:00-07:00`).
- Submit **before September 22, 2026 at 12:00 PM PDT (UTC-7)**, i.e. **19:00 UTC / 3:00 PM Toronto EDT**, through the [exact VibeApps event form](https://vibeapps.dev/judging/convex-all-gas-hackathon-openai/submit). Because both official pages say “before,” treat noon as an exclusive hard cutoff rather than an inclusive final instant. [Convex rules](https://www.convex.dev/hackathons/all-gas) · [Luma event](https://luma.com/convex-allgas-hackathon)
- Winners are scheduled to be announced **September 25, 2026**; no time or time zone is published. [Convex rules](https://www.convex.dev/hackathons/all-gas)
- **Source discrepancy:** Luma's JSON-LD `endDate` is September 21, 2026 at 7:00 PM PDT (September 21 at 10:00 PM Toronto EDT), while the human-readable rules set the later September 22 noon-PDT submission deadline. Use the explicit submission deadline, not Luma's calendar end time. [Luma event](https://luma.com/convex-allgas-hackathon)

## Eligibility and registration

- Entrants must be **18 or older**. Solo entries and teams are allowed; teams may have **at most four people**. There is no stated limit on the number of entrants/teams or on the number of apps an entrant may submit. Only **one team member** needs to register on Luma. [Convex rules](https://www.convex.dev/hackathons/all-gas) · [Luma event](https://luma.com/convex-allgas-hackathon)
- Registration is free general admission on the [official Luma event](https://luma.com/convex-allgas-hackathon). The public form requires a full name; LinkedIn and X fields are optional. Registration does not itself submit the app.
- Employees of Convex and the sponsors/cohosts, plus their immediate family members, are ineligible. Luma names Convex, OpenAI, Firecrawl, and AgentMail. [Convex rules](https://www.convex.dev/hackathons/all-gas) · [Luma event](https://luma.com/convex-allgas-hackathon)
- Participation/prize receipt is barred where prohibited by US or local law. The rules expressly include residents of, or organizations domiciled in, **Quebec, Russia, Crimea, Cuba, Iran, North Korea, and Syria**, plus other OFAC-designated jurisdictions. This is an eligibility rule, not legal advice. [Convex rules](https://www.convex.dev/hackathons/all-gas)
- Projects must be original and must not violate intellectual-property rights. [Convex rules](https://www.convex.dev/hackathons/all-gas)

## Required build and sponsor stack

- The submission must be a **new app** started on or after the exact cutoff above. Existing or earlier-started apps do not qualify. [Convex rules](https://www.convex.dev/hackathons/all-gas)
- Convex must be the substantive backend: database, functions, and realtime sync run on Convex. Judging looks for real queries, mutations, live updates, auth, and components; a thin hosted frontend does not count. Auth itself is optional. [Convex rules](https://www.convex.dev/hackathons/all-gas)
- The qualification language says every submission must include Convex and use hackathon cohost/partner integrations. The sponsor-stack criterion is more specific: **OpenAI, Firecrawl, and AgentMail must perform real product work**—generate, crawl, or send—not merely appear in the README. The safest reading is that all three sponsor integrations must be exercised meaningfully. [Convex rules](https://www.convex.dev/hackathons/all-gas)
- Luma says to build with Codex or another agent/IDE using the Convex plugin. The Convex FAQ also permits a favorite IDE, but says Codex is required when publishing through `chatgpt.site`. Safest compliance: use the Convex plugin in the chosen agent and use Codex for ChatGPT Sites. [Luma event](https://luma.com/convex-allgas-hackathon) · [Convex rules](https://www.convex.dev/hackathons/all-gas)
- Convex Auth v2 is optional and described as super-alpha. Convex AI Gateway is optional and available only to teams on a paid Convex plan. [Convex rules](https://www.convex.dev/hackathons/all-gas)

## Hosting, repository, publicity, video, and submission

- The frontend must be publicly reachable without an invitation at **`*.convex.site` using the Convex static-hosting component, or `*.chatgpt.site` using ChatGPT Sites**. No localhost submission is accepted. [Convex rules](https://www.convex.dev/hackathons/all-gas) · [Luma event](https://luma.com/convex-allgas-hackathon)
- A **public GitHub repository** is required; private repositories do not qualify. [Convex rules](https://www.convex.dev/hackathons/all-gas)
- A public **`hackathon.md` at repository root** is required. Judges read it, and the event page says it must include what was built, the stack, live URL, and demo link. The official [Convex hackathon skill](https://github.com/get-convex/convex-hackathon-skill) recommends an evidence-backed dated log and explicitly excludes secrets and personal data.
- Post the build on **X or LinkedIn** and tag **@convex, @OpenAI, @firecrawl, and @agentmail**. Engagement is part of judging. [Convex rules](https://www.convex.dev/hackathons/all-gas)
- Submit the public repo, live app URL, and video through the [exact VibeApps form](https://vibeapps.dev/judging/convex-all-gas-hackathon-openai/submit). The public form is sign-in/sign-up gated, so any additional authenticated-only fields could not be verified without registering.
- The page alternates between “three-minute video” and **“under 3 minutes.”** Treat strictly **less than 3:00** as controlling. The stated preference is minimal talking and a click-through of the real product. [Convex rules](https://www.convex.dev/hackathons/all-gas)

## Judging

The published criteria have no numeric weights or tie-break procedure. They favor an everyday end-user app rather than developer tooling, and assess: creativity/usefulness; depth of Convex usage; real OpenAI/Firecrawl/AgentMail work; an accessible live URL; social proof and engagement; and a sub-three-minute real-product demo. Judges rely heavily on `hackathon.md`. [Convex rules](https://www.convex.dev/hackathons/all-gas)

## Prizes and participant benefits

The advertised prize pool is **$25,000: $16,500 cash plus $8,500 in Codex credits**. Separately, every participant is advertised **20,000 Firecrawl credits during the build**. [Convex rules](https://www.convex.dev/hackathons/all-gas) · [Luma event](https://luma.com/convex-allgas-hackathon)

| Place          | Award                                                                                                                        |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Overall winner | $10,000 cash; $5,000 Codex credits; 3 months Firecrawl Growth; 6 months AgentMail Startup; Codex, Firecrawl, and Convex swag |
| Second         | $5,000 cash; $2,500 Codex credits; 3 months Firecrawl Growth; 3 months AgentMail Startup; Codex and Convex swag              |
| Third          | $1,500 cash; $1,000 Codex credits; 3 months Firecrawl Growth; 3 months AgentMail Startup; Codex and Convex swag              |

Prizes are non-transferable and cannot be exchanged. The rules say the cohost determines delivery as cash/cards/credits/swag. There are explicitly **no OpenAI API credits and no Convex credits** during the event or as prizes. [Convex rules](https://www.convex.dev/hackathons/all-gas)

### Credit redemption uncertainty

The only published participant-credit instruction is: register on Luma, after which every participant receives 20,000 Firecrawl credits. No official public source states a promo code, delivery channel, account-matching rule, expiry, or redemption steps. Likewise, no public redemption procedure is given for prize Codex credits, Firecrawl Growth, AgentMail Startup, or swag. Do not use unrelated event codes; expect fulfillment instructions after registration or winning, but that expectation is an inference, not a published rule. [Convex rules](https://www.convex.dev/hackathons/all-gas)

## MakerMesh comparison and action items

Compared with `SUBMISSION_CHECKLIST.md`, `README.md`, and `hackathon.md` as inspected on 2026-09-07:

- **Start-date wording is incomplete but MakerMesh qualifies on recorded evidence.** The checklist says “after August 25,” omitting the official noon-PDT cutoff. `hackathon.md` records a start on August 29, safely after the cutoff.
- **Deadline handling is conservative and correct.** The checklist uses September 22 at noon PT and targets a 2:58 walkthrough, which satisfies the stricter “under 3 minutes” wording. Its September 20 internal freeze is a project choice, not an event requirement.
- **AgentMail remains the main sponsor-stack risk.** MakerMesh records real OpenAI and Firecrawl execution, but `README.md` and `hackathon.md` say outbound/inbound AgentMail remains unexercised. The official sponsor-stack criterion says AgentMail must do real work and explicitly uses “send”; mounting/authenticating the component and preparing an unapproved draft may score as insufficient. The checklist correctly leaves the controlled real send-and-receive item open.
- **Public-repo and submission gates remain open.** The checklist leaves Luma registration, eligibility/team confirmation, public GitHub publication, sponsor-tagged social posting, video, and VibeApps submission incomplete. `hackathon.md` still says `Repo: none`, so it cannot yet satisfy the public-repo rule.
- **`hackathon.md` lacks a demo link and is stale.** The event explicitly asks for the demo link in the log. The file has a live app URL but no video/demo link, and its last update is August 31 despite later project state implied by the checklist. Refresh it from evidence before submission.
- **Development hosting is acceptable if publicly open.** The event requires an invite-free `convex.site` or `chatgpt.site` frontend, not a production-labelled Convex deployment. MakerMesh's verified public `convex.site` development fixture can meet the hosting rule; “production not deployed” is not itself a disqualification.
- **Generic skill guidance must not override event rules.** The official log skill's generic format permits custom hosts and private repos because it supports other events. This event specifically requires `convex.site`/`chatgpt.site` and a public GitHub repo. MakerMesh currently uses the compliant host but still needs the public repo.
- **No evidence of disallowed pre-existing-app reuse was found in the brief.** MakerMesh is documented as an independent app/repository started after the cutoff; publishing it from inside the parent workspace should preserve its independent Git history and cutoff evidence.

## Unresolved points

- Additional VibeApps form fields are unknown until an entrant authenticates.
- Winner-announcement time/time zone, scoring weights, tie-break rules, prize tax/fulfillment details, and all credit/plan redemption mechanics are unpublished.
- The official language does not explicitly say whether one real AgentMail send is a binary eligibility test or a scored criterion; it does say sponsor integrations must do real work, so exercising the complete controlled loop is the low-risk interpretation.
