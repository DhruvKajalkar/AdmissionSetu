# AdmissionSetu

**One admission journey. Every seat accounted for.**

AdmissionSetu is a hackathon prototype for a unified, student-centred Maharashtra engineering admission platform.

## Problem

Engineering admission decisions are fragmented across:

- multiple portals and counselling systems;
- preference forms with difficult-to-see consequences;
- delayed vacancy information and institute-level rounds;
- repeated document collection; and
- disconnected financial-aid discovery.

Students must reconstruct one high-stakes journey from these separate systems, while a released seat may take time to become visible to another eligible candidate.

## V2 solution

### Student layer

- one unified candidate and admission profile;
- an explorer backed by sourced official CET reference data;
- CAP preference ordering with consequence previews and safety checks;
- one reusable verified-document passport with explicit simulated consent;
- explainable scholarship matching separated from document readiness; and
- a read-only contextual Admission Assistant.

### Clearing layer

- one exact lifecycle for every synthetic seat;
- synchronized merit lists derived from declared interest and merit order;
- automatic withdrawal from competing lists after acceptance;
- cascading queue and offer recomputation; and
- immediate recycling of released capacity to the next eligible candidate.

### Operations layer

- a clearly labelled prototype authority/institution view;
- shared visibility into seats, merit lists, offers and event history; and
- document-readiness status without exposing document contents.

## Core principles

**One student → one admission state.**

**One seat → one live state.**

**One merit network → synchronized clearing.**

**One verified document set → reused with consent.**

**One profile → reused across admissions and financial aid.**

## Official data

The checked-in generated metadata currently records:

- **48 institutes**;
- **610 programmes**; and
- **7,481 contextual cutoff observations**.

The catalog is a static 2025–26 reference snapshot generated from public Maharashtra CET Cell institute summaries and CAP Round II/III cutoff publications. Official names, codes, intake and cutoff observations retain source and academic-year context. It is not a live CET feed.

Aarya, candidate ranks, admissions, seat ownership, vacancy totals, queues, offers, deadlines, document records, consent events and scholarship-profile values are synthetic. They are kept separate from official reference data.

See [CET data sources and refresh steps](./docs/CET_DATA_SOURCES.md).

## AI

The Admission Assistant is a read-only natural-language layer over a sanitized snapshot of the current prototype state and existing deterministic domain services. It can explain consequences and link to relevant pages and official sources, but cannot accept a seat, reorder preferences, join a round, share documents, submit an application or reset the demo.

With no API configuration—or if the provider fails—the rest of AdmissionSetu continues to work and the assistant returns a clearly labelled deterministic response for its demo questions. Automated tests do not call an external model.

### Vercel assistant configuration

1. Add `OPENAI_API_KEY` to the Vercel project’s server-side Environment Variables.
2. Optionally add `OPENAI_MODEL`; it defaults to `gpt-5`.
3. Do not use a `NEXT_PUBLIC_` prefix for either value.
4. Redeploy after changing environment variables.
5. Open `/assistant` and confirm an answer is labelled **OpenAI response**; without a key, expect **Deterministic demo response**.

The browser only calls `/api/assistant`; the API key is read inside the server route’s provider module.

## Demo

Use [DEMO_V2.md](./DEMO_V2.md) as the definitive short judging walkthrough.

## Architecture

See [V2 architecture](./docs/V2_ARCHITECTURE.md) for the state, service and production-boundary overview.

## Data refresh

Production and preview builds read checked-in generated TypeScript artifacts. They do not fetch CET pages, run Python or regenerate data during deployment.

Maintainers can rehearse the deterministic local pipeline with:

```bash
npm run data:generate
npm run data:validate
```

For a source refresh, follow [the documented snapshot, extraction, generation and validation sequence](./docs/CET_DATA_SOURCES.md#refresh-rehearsal).

## Run locally

Requires Node.js 20.9 or newer and npm.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). No sign-in, database or environment variable is required for the deterministic prototype.

Run the full verification suite with:

```bash
npm run data:validate
npm run lint
npm run typecheck
npm test
npm run build
git diff --check
```

## Technology and deployment

- Next.js 16 App Router and React 19
- strict TypeScript and Tailwind CSS 4
- local typed seed data and domain services
- device-local persistence for the hackathon simulation
- Node’s built-in test runner
- Vercel-compatible server route for the optional assistant

No authentication, database, live government API or external notification infrastructure is required.

## Limitations

- This is not an official government service or a live CET vacancy feed.
- Merit clearing uses a simplified global synthetic rank and does not reproduce reservation, candidature or home-university policy.
- DigiLocker connection, consent and document sharing are local simulations; no real files or identifiers are transferred.
- Scholarship coverage is deliberately small and explanatory; official portals make final eligibility and application decisions.
- Candidate, admission and clearing state is stored only on the current device and is not a production trust boundary.
- Assistant conversations are page-session state; its context is suitable for a prototype, not a government deployment.

**Reset Demo** restores the AISSMS admission, seat inventory, clearing state, offers, document passport, consent/history and scholarship profile. Saved CAP preferences intentionally remain unchanged.
