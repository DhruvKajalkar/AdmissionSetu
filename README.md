# AdmissionSetu

**One admission journey. Every seat accounted for.**

AdmissionSetu is a hackathon prototype that reimagines Maharashtra engineering admissions as one student-centric journey. It brings the currently fragmented college discovery, preference planning, CAP admission, vacancy, and spot-round experiences into one coherent citizen service.

## Problem

Students currently navigate CAP workflows, individual institute notices, vacancy lists, documents, and parallel counselling systems separately. AdmissionSetu demonstrates a simpler model: one student has one admission state, and every seat has one live state.

## Prototype scope

Phase 4 keeps the dashboard, Pune-region College Explorer, and mistake-resistant CAP preference workflow, then adds a deterministic admission-state engine and centralized vacancy exchange. Aarya has one current admission state, and every synthetic seat has one live lifecycle state. Withdrawing her participating admission or confirming the fictional connected-counselling record releases her exact AISSMS Computer Engineering seat and immediately increases the derived vacancy count from 2 to 3.

AdmissionSetu protects the student’s stated intent; it does not recommend a subjective college order. It does not label programmes as safe, target, or dream, estimate admission probability, compare placements, or infer preference quality from historical cutoffs. Cutoffs are displayed only as sourced historical context. Confirmation is simulated and does not submit information to the Maharashtra CET Cell.

The `/admission` page provides controlled withdrawal, connected-admission, event-history, and reset interactions. `/vacancies` derives available counts directly from the small synthetic seat inventory and supports institute, programme, and availability filtering. Preference review remains non-mutating; only explicit Phase 4 demo actions change admission state.

Spot-round registration, queues, offers, timers, and conflict handling remain outside this phase.

## Technical stack

- Next.js 16 with the App Router
- React 19
- TypeScript with strict checking
- Tailwind CSS 4
- Local TypeScript seed data and mock services

No authentication, database, or external government integration is used.

## Unified admission simulation

The versioned `admissionsetu:admission-simulation:v1` device-local state contains Aarya's current admission, a deliberately small synthetic seat inventory, one fictional connected-counselling record, deterministic events, and the latest vacancy change. Invalid or stale stored inventory is reset safely to the deterministic seed.

- **One student → one current admission state:** transitions reject any result that would leave Aarya holding two participating seats.
- **One seat → one live seat state:** availability is counted only from synthetic seat records whose lifecycle is `AVAILABLE`; there is no separately mutable vacancy count.
- Official institute and programme records remain immutable reference metadata. Synthetic seats reference official programme choice codes, but their quantities, ownership, and lifecycle states are entirely fictional.
- The connected JEE-based counselling event is mocked locally. No CET, JoSAA, JEE, or cross-government API exists in this prototype.
- Reset Demo restores only admission simulation state. It does not delete Phase 3 preference selections.

## Run locally

Requirements: Node.js 20.9 or newer and npm.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Useful validation commands:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Data disclaimer

The repository keeps public catalog records separate from synthetic admission simulation data:

- `src/data/official/` contains the manually curated public institute, programme, intake, and limited historical cutoff records used by the explorer. Every record carries its academic year, official CET Cell source URL, and access date.
- `src/data/colleges.ts`, `src/data/candidate.ts`, `src/data/dashboard.ts`, and `src/data/spot-rounds.ts` contain synthetic records used to demonstrate the candidate journey, current admission, vacancies, dates, queues, and future seat transitions.
- Aarya Deshmukh, her scores, preferences, seat ownership, deadlines, and all live-state concepts are synthetic. No student identity, ownership, vacancy, queue, or offer data was obtained from public sources.
- Missing cutoff values are displayed as unavailable. The prototype does not infer or estimate them.

### Official public sources

- [Maharashtra CET Cell FE 2026–27 portal](https://fe2026.mahacet.org/StaticPages/HomePage) — source for the Phase 3 Round III rule: an allotment within the first six preferences is auto-frozen and ends eligibility for subsequent rounds; for an allotment outside the first six, a candidate seeking betterment must accept the seat and select Not Freeze / Betterment according to the official process. This source does not make the curated 2025–26 catalog current-cycle availability data.
- [Maharashtra CET Cell 2025–26 participating institutes list](https://fe2025.mahacet.org/StaticPages/frmInstituteList) — institute and overall intake reference.
- Official 2025–26 institute summaries at `https://fe2025.mahacet.org/StaticPages/frmInstituteSummary?InstituteCode={code}` — institute status, autonomy, programme choice code, sanctioned intake, shift, and gender. Each curated institute stores its exact resolved URL.
- [Official 2024–25 Maharashtra CAP Round III cutoff list](https://fe2025.mahacet.org/2024/2024ENGG_CAP3_CutOff.pdf) — source for the limited cutoff observations shown in the explorer.

The public subset was manually curated on 27 August 2026 for a hackathon demonstration. There is no runtime scraping, live CET integration, or claim of completeness. Students must check the current CET Cell portal and admission notices before acting.

## Local preference data

Phase 3 stores ordered preferences in `admissionsetu:candidate-preferences:v2`. On first use, valid programme IDs from the Phase 2 `admissionsetu:preference-shortlist:v1` key are migrated in their existing order with a neutral `UNSURE` acceptance intent. Invalid, stale, and duplicate entries are ignored safely. A persisted demo confirmation contains the ordered snapshot and deterministic demo timestamp; any later list or intent change marks that snapshot as needing review without deleting it. Phase 4 reset does not modify either preference key.
