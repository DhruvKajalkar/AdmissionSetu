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

## Demo Journey

1. Open the app and select **Continue as Demo Student**.
2. Use **Reset Demo** to restore the deterministic starting state.
3. On **Dashboard**, show Aarya's AISSMS Computer Engineering seat.
4. In **College Explorer**, show sourced PICT programme and cutoff references.
5. In **My Preferences**, show the first-six auto-freeze zone and an **I'm not sure** warning.
6. In **Live Vacancies**, note that AISSMS Computer Engineering starts with 2 demo vacancies.
7. In **Spot Rounds**, join the live PICT ENTC round.
8. Select **Advance Demo Event** five times; PICT availability briefly moves 2 → 3 and Aarya reaches the offer.
9. Accept PICT ENTC and confirm the consequence.
10. Show that AISSMS availability moved 2 → 3 and PICT is now Aarya's one current admission.
11. Reload to show persistence, then use **Reset Demo** to restore the starting state without changing preferences.

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

Aarya, her scores and documents, current admissions, seat ownership, live vacancies, spot rounds, queue positions, participants, offers, timers, deadlines and connected-counselling events are synthetic. Official programme codes are used only as references connecting the demo inventory to the public catalog.

## Prototype limitations

- No official CET API or live CET vacancy feed.
- No real JoSAA, JEE or connected-counselling API.
- No real applicant identity or admission data.
- Admission, queue, vacancy and offer state is stored only on the current device.
- Live queues, vacancies, offers and timers are guided synthetic simulations.
- Demo confirmation does not submit an official option form or admission decision.

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

- Admission and spot-round simulation: `admissionsetu:admission-simulation:v2`
- Ordered CAP preferences: `admissionsetu:candidate-preferences:v2`
- Legacy explorer shortlist migration source: `admissionsetu:preference-shortlist:v1`

**Reset Demo** restores the admission, seat inventory, vacancies, interests, queue progress, offers and event history. It deliberately does not clear saved CAP preferences.
