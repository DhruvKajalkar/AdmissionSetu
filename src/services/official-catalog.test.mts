import { strict as assert } from "node:assert";
import test from "node:test";
import { createInitialAdmissionSimulationState } from "../data/admission-simulation.ts";
import { officialCutoffs } from "../data/official/cutoffs.ts";
import { officialHistoricalVacancies } from "../data/official/generated/vacancies.generated.ts";
import { officialDatasetMetadata } from "../data/official/generated/metadata.generated.ts";
import { officialInstitutes } from "../data/official/institutes.ts";
import { officialPrograms } from "../data/official/programs.ts";
import type { AssistantContextSnapshot } from "../types/assistant.ts";
import type { OfficialHistoricalVacancyObservation } from "../types/admissions.ts";
import { runAssistantTool } from "./assistant-tools.ts";
import { groupOfficialCutoffs, searchOfficialPrograms, selectPrimaryCutoff } from "./official-catalog.ts";

const historicalVacancies: readonly OfficialHistoricalVacancyObservation[] = officialHistoricalVacancies;

test("generated metadata counts match every generated artifact", () => {
  assert.deepEqual(officialDatasetMetadata.counts, {
    institutes: officialInstitutes.length,
    programs: officialPrograms.length,
    cutoffs: officialCutoffs.length,
    historicalVacancies: historicalVacancies.length,
  });
});

test("reliable institute snapshot stays within the 30–50 target", () => {
  assert.ok(officialInstitutes.length >= 30 && officialInstitutes.length <= 50);
});

test("generated programme snapshot materially exceeds 150 programmes", () => {
  assert.ok(officialPrograms.length >= 150);
});

test("generated cutoff snapshot materially exceeds the former 18 observations", () => {
  assert.ok(officialCutoffs.length > 18);
});

test("institute codes are unique", () => {
  assert.equal(new Set(officialInstitutes.map((item) => item.code)).size, officialInstitutes.length);
});

test("programme choice codes are unique", () => {
  assert.equal(new Set(officialPrograms.map((item) => item.choiceCode)).size, officialPrograms.length);
});

test("every programme resolves to an imported institute", () => {
  const instituteCodes = new Set(officialInstitutes.map((item) => item.code));
  assert.equal(officialPrograms.every((item) => instituteCodes.has(item.instituteCode)), true);
});

test("every cutoff resolves to an imported programme", () => {
  const choiceCodes = new Set(officialPrograms.map((item) => item.choiceCode));
  assert.equal(officialCutoffs.every((item) => choiceCodes.has(item.programChoiceCode)), true);
});

test("all cutoff percentiles are finite and between zero and 100", () => {
  assert.equal(officialCutoffs.every((item) => Number.isFinite(item.percentile) && item.percentile >= 0 && item.percentile <= 100), true);
});

test("all sanctioned intake values are non-negative integers", () => {
  assert.equal(officialPrograms.every((item) => Number.isInteger(item.intake) && item.intake >= 0), true);
});

test("historical vacancy observations cannot contain a negative count", () => {
  assert.equal(historicalVacancies.every((item) => Number.isInteger(item.publishedVacancyCount) && item.publishedVacancyCount >= 0), true);
});

test("cutoff observations preserve year, round, category, stage and candidature", () => {
  assert.equal(officialCutoffs.every((item) => item.academicYear && item.round && item.seatType && item.stage && item.candidature && item.admissionType), true);
});

test("every official record carries CET Cell provenance", () => {
  const sources = [
    ...officialInstitutes.map((item) => item.source),
    ...officialPrograms.map((item) => item.source),
    ...officialCutoffs.map((item) => item.source),
  ];
  assert.equal(sources.every((source) => source.kind === "OFFICIAL_CET_CELL" && source.url.includes("mahacet.org") && source.academicYear && source.sourceType), true);
});

test("Explorer search finds PICT by institute name", () => {
  const matches = searchOfficialPrograms(officialInstitutes, officialPrograms, "Pune Institute of Computer Technology");
  assert.ok(matches.length > 0);
  assert.equal(matches[0].institute.code, "06271");
});

test("Explorer search finds an institute by code", () => {
  const matches = searchOfficialPrograms(officialInstitutes, officialPrograms, "06271");
  assert.ok(matches.length > 0);
  assert.equal(matches.every((item) => item.institute.code === "06271"), true);
});

test("Explorer search finds the exact PICT ENTC choice code", () => {
  const matches = searchOfficialPrograms(officialInstitutes, officialPrograms, "0627137210");
  assert.equal(matches[0]?.program.choiceCode, "0627137210");
});

test("ENTC synonym search resolves the official programme name", () => {
  const matches = searchOfficialPrograms(officialInstitutes, officialPrograms, "PICT ENTC");
  assert.equal(matches[0]?.program.choiceCode, "0627137210");
});

test("branch filters use the normalized branch family", () => {
  const matches = searchOfficialPrograms(officialInstitutes, officialPrograms, "", { branchFamily: "AI & Data" });
  assert.ok(matches.length > 0);
  assert.equal(matches.every((item) => item.program.branchFamily === "AI & Data"), true);
});

test("location filter supports Pune and Mumbai-area districts", () => {
  const pune = searchOfficialPrograms(officialInstitutes, officialPrograms, "", { location: "Pune" });
  const mumbai = searchOfficialPrograms(officialInstitutes, officialPrograms, "", { location: "Mumbai City" });
  assert.ok(pune.length > 0);
  assert.ok(mumbai.length > 0);
  assert.equal(pune.every((item) => item.institute.city === "Pune" || item.institute.district === "Pune"), true);
  assert.equal(mumbai.every((item) => item.institute.city === "Mumbai City" || item.institute.district === "Mumbai City"), true);
});

test("institute-type and autonomy filters use official normalized fields", () => {
  const matches = searchOfficialPrograms(officialInstitutes, officialPrograms, "", { instituteStatus: "Government-Aided", autonomyStatus: "Autonomous" });
  assert.ok(matches.length > 0);
  assert.equal(matches.every((item) => item.institute.status === "Government-Aided" && item.institute.autonomyStatus === "Autonomous"), true);
});

test("multiple cutoff observations remain distinct across CAP rounds", () => {
  const observations = groupOfficialCutoffs(officialCutoffs).get("0627137210") ?? [];
  assert.ok(observations.length > 2);
  assert.deepEqual(new Set(observations.map((item) => item.round)), new Set(["CAP Round II", "CAP Round III"]));
  assert.ok(new Set(observations.map((item) => `${item.round}|${item.seatType}|${item.stage}|${item.percentile}`)).size > 2);
});

test("primary historical context prefers Stage I GOPENS without predicting", () => {
  const observations = groupOfficialCutoffs(officialCutoffs).get("0627137210") ?? [];
  const primary = selectPrimaryCutoff(observations);
  assert.equal(primary?.seatType, "GOPENS");
  assert.equal(primary?.stage, "I");
});

test("assistant catalog tool returns labelled source-aware cutoff observations", () => {
  const result = runAssistantTool("search_official_catalog", {} as AssistantContextSnapshot, "PICT ENTC cutoff");
  const data = result.data as { matches: Array<{ choiceCode: string; cutoffs: Array<{ academicYear: string; round: string; seatType: string; source: { url: string } }> }> };
  assert.equal(data.matches[0]?.choiceCode, "0627137210");
  assert.ok(data.matches[0].cutoffs.length > 1);
  assert.equal(data.matches[0].cutoffs.every((item) => item.academicYear && item.round && item.seatType && item.source.url.includes("mahacet.org")), true);
  assert.ok(result.sources.some((source) => source.kind === "OFFICIAL" && source.url?.includes("mahacet.org")));
});

test("official historical vacancies are never the synthetic live seat inventory", () => {
  const simulation = createInitialAdmissionSimulationState();
  assert.equal(simulation.seats.every((seat) => seat.isSyntheticSimulation), true);
  assert.equal(historicalVacancies.some((observation) => simulation.seats.some((seat) => seat.programId === observation.programChoiceCode)), false);
});
