# AdmissionSetu

**One admission journey. Every seat accounted for.**

AdmissionSetu is a hackathon prototype for a simpler, safer Maharashtra engineering admission journey.

## Problem

Students must currently connect decisions spread across MHT-CET CAP, institute-level rounds, individual college notices, vacancy lists and parallel counselling systems. The same student can be tracking several processes while seat releases appear elsewhere and later, making consequences difficult to understand.

## Solution

AdmissionSetu demonstrates one citizen-facing journey with:

- one unified student admission state;
- an explorer built from sourced CET institute, programme, intake and historical cutoff references;
- mistake-resistant CAP preference ordering and safety review;
- one live state for each synthetic seat;
- centralized live vacancies;
- guided online spot-round queues and offers; and
- automatic release of the previous seat when a new seat is accepted.

## Core design principles

**One student → one admission state.**

**One seat → one live state.**

**One verified document set → reused with consent.**

## Demo Journey

1. Open the app and select **Continue as Demo Student**.
2. Use **Reset Demo** to restore the deterministic starting state.
3. On **Dashboard**, show Aarya's AISSMS Computer Engineering seat.
4. In **My Documents**, connect the DigiLocker demo, review the requested scopes and allow selected documents.
5. In **College Explorer**, show sourced PICT programme and cutoff references.
6. In **My Preferences**, show the first-six auto-freeze zone and an **I'm not sure** warning.
7. In **Live Vacancies**, note that AISSMS Computer Engineering starts with 2 demo vacancies.
8. In **Spot Rounds**, show Aarya's derived positions across PICT, VIT, PCCOE and MMCOE.
9. Select **Make VIT seat offerable** to recompute VIT's synthetic merit list and generate exact seat offers.
10. Review the reusable reporting documents, accept VIT Computer Engineering, then confirm the consequence.
11. Share the four verified records with VIT for the simulated reporting purpose—without another upload.
12. Show AISSMS availability moving 2 → 3, Aarya leaving three competing lists, and lower-ranked candidates advancing.
13. Open **Operations** to show synchronized queues, seats, event records and minimum document-readiness status.
14. Reload to show persistence, then use **Reset Demo** to restore the starting state without changing preferences.

See [DEMO.md](./DEMO.md) for the concise presenter walkthrough.

## Data

### Official CET/public reference information

The manually curated subset in `src/data/official/` contains institute identities, programme choice codes, sanctioned intake and limited historical cutoffs. Every record carries its academic year, source URL and access date.

- [Maharashtra CET Cell FE 2026–27 portal](https://fe2026.mahacet.org/StaticPages/HomePage) — source for the displayed CAP Round III first-six auto-freeze rule.
- [Maharashtra CET Cell 2025–26 participating institutes](https://fe2025.mahacet.org/StaticPages/frmInstituteList) — institute and intake reference.
- Official institute summaries at `https://fe2025.mahacet.org/StaticPages/frmInstituteSummary?InstituteCode={code}` — institute status, autonomy, choice codes and intake.
- [Official 2024–25 CAP Round III cutoff list](https://fe2025.mahacet.org/2024/2024ENGG_CAP3_CutOff.pdf) — source for the limited historical cutoff observations.

The subset was manually curated on 27 August 2026. It is not a live or complete current-cycle catalog. Missing values are shown as unavailable and are never inferred.

### Synthetic demo information

Aarya, her scores and document records, consent, sharing history, current admissions, seat ownership, live vacancies, spot rounds, queue positions, participants, offers, timers, deadlines and connected-counselling events are synthetic. Official programme codes are used only as references connecting the demo inventory to the public catalog.

## V2 Merit Clearing Network

V2 proposes merit-ranked digital institute and spot rounds that share one central candidate and seat state. A candidate can declare interest in up to five participating programme lists. Each list is generated from active interests using a simplified global synthetic merit rank and a deterministic candidate-ID tie-break; institutes cannot manually reorder candidates.

When Aarya accepts VIT Computer Engineering, the clearing service accepts the exact offered VIT seat, releases her previous AISSMS seat, closes her PICT, PCCOE and MMCOE interests, rebuilds all affected merit lists, records candidate movements and offers the released seat to the next eligible interested candidate. The student pages and compact `/operations` view read this same state and authoritative seat inventory.

This is a proposed AdmissionSetu clearing model. Its simplified merit logic does not reproduce all official category, reservation, home-university or candidature rules. Every candidate identity, rank, interest, queue event, offer and seat-ownership record is synthetic. Official CET institute and programme reference data remains immutable and separate in `src/data/official/`.

## V2 Verified Document Passport

V2 Phase 2 adds one authoritative synthetic document passport that is reused by the dashboard, current-admission reporting, spot-round offers and the compact operations view. Reusable prototype requirement bundles derive readiness directly from the same records rather than duplicating document status across pages.

The consent journey is inspired by the real DigiLocker Requester model: an eligible organization would request scoped document access and the user would authorize it. In this prototype, **Connect DigiLocker**, selected scopes, access revocation and provider status are entirely deterministic local simulation state. AdmissionSetu is not an authorized DigiLocker Requester, no real DigiLocker APIs or production OAuth credentials are connected, and no external authorization request is made.

Institute-specific sharing records the minimum required document types, synthetic recipient, purpose and deterministic timestamp. The underlying verified records are reused without another upload, and the student can review an append-only activity history. Revoking access removes active permission without deleting document records or historical sharing entries.

All candidate and document values are synthetic. Production integration would require authorized DigiLocker Requester onboarding, approved scopes, credentials, policy-specific requirement rules and an appropriately secured backend.

## Prototype limitations

- No official CET API or live CET vacancy feed.
- No real JoSAA, JEE or connected-counselling API.
- No real applicant identity or admission data.
- Admission, queue, vacancy and offer state is stored only on the current device.
- Live queues, vacancies, offers and timers are guided synthetic simulations.
- Demo confirmation does not submit an official option form or admission decision.
- DigiLocker connection, consent and document sharing are simulated locally; no files or real identifiers are transferred.

## Tech stack

- Next.js 16 App Router
- React 19
- TypeScript with strict checking
- Tailwind CSS 4
- Local TypeScript seed data and service modules
- Browser `localStorage` for device-local preferences and simulation state
- Node's built-in test runner for domain tests

No secrets, authentication, database or external runtime integration are required.

## Codex

The prototype was developed iteratively with OpenAI Codex. Codex supported project scaffolding, domain modelling, implementation, automated tests, focused refactors and browser-led QA. Product decisions and the final prototype scope remained part of the human-directed hackathon workflow.

## Running locally

Requires Node.js 20.9 or newer and npm.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). No seeding, sign-in or environment variables are required.

Validation commands:

```bash
npm run lint
npm run typecheck
npm test
npm run build
git diff --check
```

## Device-local state

- Admission, seat, V2 merit-clearing and document-passport simulation: `admissionsetu:admission-simulation:v4`
- Ordered CAP preferences: `admissionsetu:candidate-preferences:v2`
- Legacy explorer shortlist migration source: `admissionsetu:preference-shortlist:v1`

**Reset Demo** restores the admission, seat inventory, vacancies, interests, queue progress, offers, document passport, provider consent, sharing history and event history. It deliberately does not clear saved CAP preferences.
