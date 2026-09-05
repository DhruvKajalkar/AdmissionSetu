# AdmissionSetu official CET data sources

AdmissionSetu uses a static, checked-in reference snapshot. Production pages never fetch or scrape a CET Cell website. A source refresh is an explicit offline operation followed by deterministic generation and validation.

Generated on: **4 September 2026**  
Academic year represented in the generated catalog: **2025–26**

## Source manifest

| Dataset | Academic year | Official publication | Import method | Generated records | Limitations |
| --- | --- | --- | --- | ---: | --- |
| Institutes | 2025–26 | [Participating institute list](https://fe2025.mahacet.org/StaticPages/frmInstituteList) and 48 linked institute-summary pages | `data:fetch` stores the selected official HTML; `data:generate` parses labelled summary fields | 48 | Deliberately scoped to broad Pune and meaningful Mumbai-region coverage; not every Maharashtra institute is included. |
| Programmes | 2025–26 | Same official institute-summary pages | Course-detail tables are parsed without replacing official programme names; branch family is a separate normalization | 610 | Includes distinct official choice-code variants where published. Two malformed cutoff alignments do not affect programme import. |
| CAP Round II cutoffs | 2025–26 | [CAP Round II Maharashtra and Minority Seats Cut Off](https://fe2025.mahacet.org/ViewPublicDocument.aspx?MenuId=3475) | Official embedded PDF is downloaded offline; `extract-cutoffs.py` creates a selected-page text extract; `data:generate` parses category/value pairs | Included in 7,481 combined observations | One malformed value/category alignment for choice code `0620719110` was skipped rather than guessed. |
| CAP Round III cutoffs | 2025–26 | [CAP Round III Maharashtra and Minority Seats Cut Off](https://fe2025.mahacet.org/ViewPublicDocument.aspx?MenuId=3483) | Same deterministic offline extraction and normalization path | Included in 7,481 combined observations | No malformed selected rows were accepted silently. |
| Historical vacancy observations | — | No source imported | Import type and validation boundary exist, but the generated artifact is intentionally empty | 0 | Available official vacancy publications were not imported because their complex allocation context was not validated to the same standard in this phase. They are never substituted with demo vacancies. |

## Pipeline

```text
Official CET Cell pages and publications
  -> scripts/cet/source-data (offline snapshot)
  -> scripts/cet/extract-cutoffs.py (selected PDF text extraction)
  -> scripts/cet/pipeline.mts (parse, normalize, validate)
  -> src/data/official/generated (checked-in static TypeScript)
  -> Explorer, preferences, read-only assistant
```

## Refresh rehearsal

Refreshing public sources is an explicit maintainer workflow, never a production build step:

1. Run `npm run data:fetch` with network access. This replaces the selected institute HTML snapshots and the CAP Round II/III PDF snapshots under `scripts/cet/source-data/` after checking expected institute codes and PDF signatures.
2. Run `python scripts/cet/extract-cutoffs.py`. This reads the refreshed PDFs with `pypdf` and replaces only the selected-institute text extracts.
3. Run `npm run data:generate`. The deterministic parser normalizes and validates the snapshots, reports every warning and skipped record to the console, and replaces the TypeScript artifacts under `src/data/official/generated/`.
4. Run `npm run data:validate`. This independently checks the committed artifacts for identifiers, relationships, bounds, provenance, duplicate/conflicting observations and metadata-count drift.
5. Review the source and generated diffs, investigate all warning/skip count changes, then run the full application verification suite before committing.

To rehearse deterministic regeneration without changing the source snapshot, run:

```bash
npm run data:generate
npm run data:validate
```

`npm run data:fetch` is not called by the application, build, or validation commands. Python and `pypdf` are needed only when checked-in cutoff PDFs are refreshed; neither is required at production runtime.

## Normalization and provenance

- Institute code, official name, address, region, district, status, autonomy, minority status, university, gender and programme rows come from the official summary pages.
- Familiar names, search aliases and a small number of useful localities are maintained separately in `scripts/cet/curation.mts`; they never replace official names.
- Official programme names remain unchanged. `branchFamily` is a deterministic search helper with an explicit `Other` fallback.
- Every cutoff keeps academic year, CAP round, seat category, merit number, percentile, stage, candidature text, admission type and its publication URL.
- Output is sorted by stable codes and cutoff context. The generation date is pinned to the source-retrieval date, so rerunning against the checked-in snapshot is deterministic.
- Generated files have a **DO NOT MANUALLY EDIT** header.

## Validation and skipped records

Validation fails on duplicate institute codes, duplicate choice codes, orphan programme or cutoff references, malformed choice codes, negative/non-integer intake, impossible percentiles, incomplete cutoff context, missing provenance, negative historical vacancies, conflicting duplicate cutoff observations, or metadata-count drift.

The 2025–26 CAP Round II extract contains two value sequences whose PDF text layout exposes more values than category headings (`0620719110` and `0682224510`). Those two sequences are reported and skipped. AdmissionSetu does not infer their missing category labels.

## Official versus synthetic state

This dataset is public reference information only. Aarya, candidate ranks, current admissions, synthetic seat inventory, live vacancy totals, merit queues, offers and events remain in the separate demo simulation state. Imported historical vacancies—when a later verified source is supported—must use `OfficialHistoricalVacancyObservation` and must never feed the live vacancy exchange.

Historical/current-cycle reference information in AdmissionSetu should be verified against the official CET Cell portal before an actual admission decision.
