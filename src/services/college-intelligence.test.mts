import assert from "node:assert/strict";
import test from "node:test";
import { createInitialAdmissionSimulationState } from "../data/admission-simulation.ts";
import { demoCandidate } from "../data/candidate.ts";
import { collegeIntelligenceSources } from "../data/college-intelligence.ts";
import type { CandidatePreference } from "../types/admissions.ts";
import { buildAssistantContextSnapshot } from "./assistant-context.ts";
import { DeterministicDemoAssistantProvider } from "./assistant-provider.ts";
import {
  buildBoundedCollegeAssistantContext,
  buildProgrammeComparison,
  getCollegeIntelligenceSource,
  getInstituteIntelligence,
  getProgrammeIntelligence,
} from "./college-intelligence.ts";

const state = createInitialAdmissionSimulationState();
const preferences: CandidatePreference[] = [
  { programId: "0627324510", position: 1, acceptanceIntent: "YES" },
  { programId: "0627137210", position: 2, acceptanceIntent: "UNSURE" },
  { programId: "0617591110", position: 3, acceptanceIntent: "UNSURE" },
];

test("intelligence record maps to the correct official institute code", () => {
  assert.equal(getInstituteIntelligence("06271")?.instituteCode, "06271");
  assert.equal(getInstituteIntelligence("99999"), null);
});

test("programme intelligence maps to the exact official choice code", () => {
  const record = getProgrammeIntelligence("0627137210");
  assert.equal(record?.choiceCode, "0627137210");
  assert.equal(record?.instituteCode, "06271");
});

test("source provenance is preserved by identifier", () => {
  const fee = getInstituteIntelligence("06271")?.fees[0];
  assert.equal(fee?.sourceId, "pict-admissions-2026");
  assert.match(getCollegeIntelligenceSource(fee?.sourceId ?? "")?.url ?? "", /admissions\.pict\.edu/);
});

test("official and institute-reported sources remain distinguishable", () => {
  assert.ok(collegeIntelligenceSources.some((source) => source.sourceClass === "OFFICIAL"));
  assert.ok(collegeIntelligenceSources.some((source) => source.sourceClass === "INSTITUTE_REPORTED"));
});

test("missing verified values remain absent", () => {
  assert.deepEqual(getInstituteIntelligence("06273")?.fees, []);
  assert.deepEqual(getInstituteIntelligence("06278")?.placementDisclosures, []);
});

test("placement metric preserves cohort and institute-wide scope", () => {
  const metric = getInstituteIntelligence("06273")?.placementDisclosures.find((item) => item.metric === "MEDIAN_SALARY");
  assert.equal(metric?.scope, "INSTITUTE_WIDE");
  assert.equal(metric?.cohort, "2025-26 placement highlights (ongoing)");
  assert.equal(metric?.sourceId, "vit-placement-2025");
});

test("programme does not inherit a department disclosure from another programme", () => {
  const comparison = buildProgrammeComparison(["0617591110"], state, preferences);
  assert.equal(comparison.entries[0]?.programmePlacements.length, 0);
  assert.equal(comparison.entries[0]?.institutePlacements.length, 0);
});

test("fee disclosure preserves academic year and category context", () => {
  const fee = getInstituteIntelligence("06156")?.fees[0];
  assert.equal(fee?.academicYear, "2026-27");
  assert.match(fee?.categoryScope ?? "", /First Year B\.Tech/);
});

test("comparison includes requested covered programmes only", () => {
  const comparison = buildProgrammeComparison(["0627137210", "0627324510", "invalid"], state, preferences);
  assert.deepEqual(comparison.entries.map((entry) => entry.choiceCode), ["0627137210", "0627324510"]);
});

test("comparison explicitly contains no overall score or winner", () => {
  const comparison = buildProgrammeComparison(["0627137210", "0627324510"], state, preferences);
  assert.equal(comparison.hasOverallScore, false);
  assert.equal(comparison.hasWinner, false);
  assert.equal("score" in comparison.entries[0], false);
});

test("existing preference position overlays comparison", () => {
  const comparison = buildProgrammeComparison(["0627137210"], state, preferences);
  assert.equal(comparison.entries[0]?.userContext.preferencePosition, 2);
});

test("existing merit position overlays comparison", () => {
  const comparison = buildProgrammeComparison(["0627137210"], state, preferences);
  assert.equal(comparison.entries[0]?.userContext.meritPosition, 4);
  assert.equal(comparison.entries[0]?.userContext.meritStatus, "WAITING");
});

test("synthetic vacancy state overlays comparison", () => {
  const comparison = buildProgrammeComparison(["0627137210"], state, preferences);
  assert.equal(comparison.entries[0]?.userContext.syntheticVacancies, 2);
});

test("public and synthetic labels remain separate", () => {
  const labels = buildProgrammeComparison(["0627137210"], state, preferences).entries[0]?.labels;
  assert.deepEqual(labels, { publicReference: "Public reference data", syntheticState: "Synthetic live demo" });
});

test("assistant context contains a bounded intelligence set", () => {
  const context = buildBoundedCollegeAssistantContext(state, preferences);
  assert.equal(context.length, 5);
  assert.ok(context.every((entry) => entry.sources.length <= 6 && entry.latestCutoffObservations.length <= 3));
});

test("assistant does not invent a missing placement metric", async () => {
  const context = buildAssistantContextSnapshot(state, preferences, demoCandidate);
  const answer = await new DeterministicDemoAssistantProvider().respond({ message: "What placement information do we have for AISSMS college?", history: [], context });
  assert.match(answer.answer, /no verified placement metric/i);
  assert.doesNotMatch(answer.answer, /average salary|median salary|highest salary/i);
});

test("assistant compares evidence but refuses a universal ranking", async () => {
  const context = buildAssistantContextSnapshot(state, preferences, demoCandidate);
  const provider = new DeterministicDemoAssistantProvider();
  const comparison = await provider.respond({ message: "Compare PICT ENTC and VIT Computer.", history: [], context });
  const ranking = await provider.respond({ message: "Which is the best college, PICT or VIT?", history: [], context });
  assert.match(comparison.answer, /PICT.*VIT Pune/);
  assert.match(comparison.answer, /does not calculate a score or universal winner/i);
  assert.match(ranking.answer, /does not assign college rankings or name a universal winner/i);
});
