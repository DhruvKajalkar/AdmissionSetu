# AdmissionSetu V2 architecture

AdmissionSetu is a local-first hackathon prototype with deliberately separated citizen UI, domain rules, synthetic state and official public reference data.

## Runtime application

```text
Student UI and prototype operations view
                 ↓
AdmissionSimulationState + focused domain services
                 ↓
Exact seat lifecycle + synchronized merit-clearing engine
                 ↓
Reusable document passport and consent/share records
                 ↓
Explainable scholarship eligibility/readiness engine
                 ↓
Sanitized context snapshot → read-only assistant tools → optional server provider
```

The citizen and operations routes consume the same state. The React provider owns one `AdmissionSimulationState`, persists it on the current device and exposes narrow commands implemented by domain services. Those services validate transitions and return a new state; UI components do not independently calculate seat ownership or merit order.

The clearing engine derives merit lists from active declared interests, candidate status, simplified synthetic global merit rank and deterministic candidate-ID tie-breaking. Accepting an exact offered seat updates the one current admission, releases the previously held seat once, closes competing interests, rebuilds affected lists, records movements and generates any newly possible offer.

Document readiness is derived from one authoritative synthetic passport. Consent and institute sharing are explicit, append-only demo events. Scholarship matching consumes the same candidate, current admission and document readiness but keeps rule eligibility separate from application readiness.

The assistant receives only a sanitized, read-only snapshot and can invoke only the existing explanatory query tools. It has no mutation tool. `/api/assistant` reads `OPENAI_API_KEY` server-side when configured and falls back to a deterministic responder if the provider is unavailable.

## Official CET data

```text
Official CET pages and publications
                 ↓
Checked-in offline source snapshots
                 ↓
Deterministic extraction, parsing and validation
                 ↓
Checked-in generated TypeScript catalog
                 ↓
Explorer + preference cutoff context + assistant catalog lookup
```

The production application never scrapes or fetches CET data. Python is used only by maintainers to extract refreshed PDFs; it is not a runtime or deployment dependency. Official catalog records are immutable inputs and never supply synthetic live vacancies.

## Prototype persistence and reset

Admission, seat, clearing, document and scholarship state is stored together in browser `localStorage`. Preferences use a separate persisted store so **Reset Demo** can intentionally preserve them. Reset replaces the simulation store with a fresh deterministic seed, which prevents state drift across repeated demonstrations.

## Production government boundary

For a production public service, the following local responsibilities would become secured, audited backend services:

- identity, authentication, candidate profile and authorization;
- authoritative admissions, seat inventory and atomic seat transitions;
- official merit policy, reservation/candidature rules and clearing orchestration;
- signed event history, deadlines, notifications and operational audit;
- DigiLocker requester authorization, scoped consent and document access;
- verified scholarship/profile integrations and official application handoffs; and
- server-owned assistant context assembled from trusted records.

The current prototype intentionally implements none of those external integrations. It demonstrates the interaction model and state invariants with synthetic records behind replaceable service boundaries.
