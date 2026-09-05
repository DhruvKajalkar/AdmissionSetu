import { officialCutoffs } from "../../src/data/official/generated/cutoffs.generated.ts";
import { officialInstitutes } from "../../src/data/official/generated/institutes.generated.ts";
import { officialDatasetMetadata } from "../../src/data/official/generated/metadata.generated.ts";
import { officialPrograms } from "../../src/data/official/generated/programmes.generated.ts";
import { officialHistoricalVacancies } from "../../src/data/official/generated/vacancies.generated.ts";
import { validateDataset } from "./pipeline.mts";

validateDataset({
  institutes: [...officialInstitutes],
  programs: [...officialPrograms],
  cutoffs: [...officialCutoffs],
  historicalVacancies: [...officialHistoricalVacancies],
  metadata: officialDatasetMetadata,
});

const actual = {
  institutes: officialInstitutes.length,
  programs: officialPrograms.length,
  cutoffs: officialCutoffs.length,
  historicalVacancies: officialHistoricalVacancies.length,
};
if (JSON.stringify(actual) !== JSON.stringify(officialDatasetMetadata.counts)) {
  throw new Error(`Generated metadata counts do not match generated records: ${JSON.stringify({ actual, metadata: officialDatasetMetadata.counts })}`);
}

console.log(`Official CET dataset valid: ${actual.institutes} institutes, ${actual.programs} programmes, ${actual.cutoffs} cutoff observations, ${actual.historicalVacancies} historical vacancy observations.`);

