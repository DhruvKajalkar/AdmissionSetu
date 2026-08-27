# AdmissionSetu

**One admission journey. Every seat accounted for.**

AdmissionSetu is a hackathon prototype that reimagines Maharashtra engineering admissions as one student-centric journey. It brings the currently fragmented college discovery, preference planning, CAP admission, vacancy, and spot-round experiences into one coherent citizen service.

## Problem

Students currently navigate CAP workflows, individual institute notices, vacancy lists, documents, and parallel counselling systems separately. AdmissionSetu demonstrates a simpler model: one student has one admission state, and every seat has one live state.

## Prototype scope

Phase 3 keeps the Phase 1 product shell and dashboard plus the Phase 2 Pune-region College Explorer, then turns My Preferences into a mistake-resistant CAP Round III option-form simulation. Students can arrange an ordered list, use drag or accessible up/down controls, state whether they would genuinely accept each choice, preview the consequence of an allotment, review structured safety findings, acknowledge the first-six auto-freeze rule, and save a deterministic demo confirmation locally.

AdmissionSetu protects the student’s stated intent; it does not recommend a subjective college order. It does not label programmes as safe, target, or dream, estimate admission probability, compare placements, or infer preference quality from historical cutoffs. Cutoffs are displayed only as sourced historical context. Confirmation is simulated and does not submit information to the Maharashtra CET Cell.

Live vacancies, queue simulation, offers, and seat-transition logic remain intentionally outside this phase. The current AISSMS seat is explanatory context only and is never mutated by the preference workflow.

## Technical stack

- Next.js 16 with the App Router
- React 19
- TypeScript with strict checking
- Tailwind CSS 4
- Local TypeScript seed data and mock services

No authentication, database, or external government integration is used.

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

Phase 3 stores ordered preferences in `admissionsetu:candidate-preferences:v2`. On first use, valid programme IDs from the Phase 2 `admissionsetu:preference-shortlist:v1` key are migrated in their existing order with a neutral `UNSURE` acceptance intent. Invalid, stale, and duplicate entries are ignored safely. A persisted demo confirmation contains the ordered snapshot and deterministic demo timestamp; any later list or intent change marks that snapshot as needing review without deleting it.
