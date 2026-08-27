# AdmissionSetu

**One admission journey. Every seat accounted for.**

AdmissionSetu is a hackathon prototype that reimagines Maharashtra engineering admissions as one student-centric journey. It brings the currently fragmented college discovery, preference planning, CAP admission, vacancy, and spot-round experiences into one coherent citizen service.

## Problem

Students currently navigate CAP workflows, individual institute notices, vacancy lists, documents, and parallel counselling systems separately. AdmissionSetu demonstrates a simpler model: one student has one admission state, and every seat has one live state.

## Prototype scope

Phase 0 provides the product shell, shared navigation, dashboard, domain types, synthetic development data, and mock service boundaries. Admission workflows, recommendations, live updates, queue simulation, and seat transition logic are intentionally not implemented yet.

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
npm run build
```

## Data disclaimer

All candidate identities, admissions, seat ownership, vacancy counts, cutoffs, round dates, and queue-related records in this repository are synthetic demonstration data. Government, CET, JEE, and institute integrations are mocked behind local interfaces.
