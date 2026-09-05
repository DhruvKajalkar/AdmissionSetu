import { strict as assert } from "node:assert";
import test from "node:test";
import { createInitialAdmissionSimulationState, V2_HERO_OFFER_ROUND_ID } from "../data/admission-simulation.ts";
import { SCHOLARSHIP_SCHEMES, scholarshipDemoTimestamps } from "../data/scholarships.ts";
import { demoCandidate } from "../data/candidate.ts";
import type { ScholarshipScheme } from "../types/admissions.ts";
import { resetAdmissionSimulation } from "./admission-state.ts";
import { acceptClearingOffer, advanceHeroClearingScenario } from "./clearing-network.ts";
import {
  evaluateAllSchemes,
  evaluateScheme,
  getScholarshipSummary,
  recordScholarshipPortalHandoff,
  updateScholarshipProfile,
} from "./scholarships.ts";

function scheme(id: string): ScholarshipScheme {
  const selected = SCHOLARSHIP_SCHEMES.find((item) => item.id === id);
  assert.ok(selected);
  return selected;
}

function acceptedVitState() {
  const advanced = advanceHeroClearingScenario(createInitialAdmissionSimulationState());
  assert.equal(advanced.ok, true);
  if (!advanced.ok) throw new Error("The VIT offer could not be generated.");
  const offer = advanced.state.clearing.offers.find((item) =>
    item.candidateId === demoCandidate.id &&
    item.roundId === V2_HERO_OFFER_ROUND_ID &&
    item.status === "AWAITING_DECISION");
  assert.ok(offer);
  const accepted = acceptClearingOffer(advanced.state, offer.id);
  assert.equal(accepted.ok, true);
  if (!accepted.ok) throw new Error("The VIT offer could not be accepted.");
  return accepted.state;
}

test("an eligible scheme passes every known mandatory rule", () => {
  const evaluation = evaluateScheme(
    createInitialAdmissionSimulationState(),
    demoCandidate,
    scheme("mahadbt-rajarshi-dte"),
  );
  assert.equal(evaluation.status, "ELIGIBLE");
  assert.ok(evaluation.passedRules.length > 0);
  assert.equal(evaluation.failedRules.length, 0);
  assert.equal(evaluation.unknownRules.length, 0);
});

test("a failed mandatory rule produces NOT_ELIGIBLE", () => {
  const state = createInitialAdmissionSimulationState();
  state.scholarshipNavigator.profile.familyAnnualIncomeInr = 900_000;
  const evaluation = evaluateScheme(state, demoCandidate, scheme("mahadbt-rajarshi-dte"));
  assert.equal(evaluation.status, "NOT_ELIGIBLE");
  assert.ok(evaluation.failedRules.some((result) => result.ruleId === "rajarshi-income"));
});

test("an unknown required profile field produces POSSIBLY_ELIGIBLE", () => {
  const evaluation = evaluateScheme(
    createInitialAdmissionSimulationState(),
    demoCandidate,
    scheme("mahadbt-panjabrao-dte"),
  );
  assert.equal(evaluation.status, "POSSIBLY_ELIGIBLE");
  assert.deepEqual(evaluation.unknownRules.map((result) => result.ruleId), ["panjabrao-hosteller"]);
});

test("rule evaluation remains structured and explainable", () => {
  const evaluation = evaluateScheme(
    createInitialAdmissionSimulationState(),
    demoCandidate,
    scheme("mahadbt-obc-post-matric"),
  );
  assert.equal(evaluation.status, "NOT_ELIGIBLE");
  assert.ok(evaluation.passedRules.every((result) => result.explanation.length > 0));
  assert.ok(evaluation.failedRules.every((result) => result.explanation.length > 0));
  assert.ok(evaluation.nextActions.length > 0);
});

test("a missing application document does not change eligibility", () => {
  const evaluation = evaluateScheme(
    createInitialAdmissionSimulationState(),
    demoCandidate,
    scheme("mahadbt-rajarshi-dte"),
  );
  assert.equal(evaluation.status, "ELIGIBLE");
  assert.ok(evaluation.missingDocuments.some((document) => document.documentType === "INCOME_CERTIFICATE"));
});

test("a missing document independently prevents application readiness", () => {
  const fullDocumentModel: ScholarshipScheme = {
    ...scheme("mahadbt-rajarshi-dte"),
    documentCoverage: "FULL",
  };
  const evaluation = evaluateScheme(createInitialAdmissionSimulationState(), demoCandidate, fullDocumentModel);
  assert.equal(evaluation.status, "ELIGIBLE");
  assert.equal(evaluation.applicationReady, false);
  assert.equal(evaluation.readyDocumentCount, 3);
  assert.equal(evaluation.requiredDocumentCount, 4);
});

test("verified passport documents satisfy a scheme requirement", () => {
  const evaluation = evaluateScheme(
    createInitialAdmissionSimulationState(),
    demoCandidate,
    scheme("mahadbt-rajarshi-dte"),
  );
  const domicile = evaluation.requiredDocuments.find((document) => document.documentType === "DOMICILE_CERTIFICATE");
  assert.deepEqual(domicile, {
    documentType: "DOMICILE_CERTIFICATE",
    displayName: "Domicile Certificate",
    ready: true,
    verificationStatus: "VERIFIED",
    recordId: "document-domicile",
  });
});

test("the same authoritative passport record is reused across schemes", () => {
  const evaluations = evaluateAllSchemes(createInitialAdmissionSimulationState(), demoCandidate);
  const domicileRecordIds = evaluations
    .flatMap((evaluation) => evaluation.requiredDocuments)
    .filter((document) => document.documentType === "DOMICILE_CERTIFICATE")
    .map((document) => document.recordId);
  assert.ok(domicileRecordIds.length >= 4);
  assert.deepEqual(new Set(domicileRecordIds), new Set(["document-domicile"]));
});

test("summary counts are derived from current evaluations", () => {
  const summary = getScholarshipSummary(evaluateAllSchemes(createInitialAdmissionSimulationState(), demoCandidate));
  assert.deepEqual(summary, {
    eligible: 1,
    possiblyEligible: 2,
    notEligible: 3,
    applicationReady: 0,
  });
});

test("a supplemental profile update triggers immediate reevaluation", () => {
  const initial = createInitialAdmissionSimulationState();
  const updated = updateScholarshipProfile(initial, { hostelStatus: "HOSTELLER" }, scholarshipDemoTimestamps.updateProfile);
  assert.equal(updated.ok, true);
  if (!updated.ok) return;
  const before = evaluateScheme(initial, demoCandidate, scheme("mahadbt-panjabrao-dte"));
  const after = evaluateScheme(updated.state, demoCandidate, scheme("mahadbt-panjabrao-dte"));
  assert.equal(before.status, "POSSIBLY_ELIGIBLE");
  assert.equal(after.status, "ELIGIBLE");
  assert.equal(after.unknownRules.length, 0);
});

test("invalid supplemental values fail without changing state", () => {
  const initial = createInitialAdmissionSimulationState();
  const result = updateScholarshipProfile(initial, { class12BoardPercentile: 101 }, scholarshipDemoTimestamps.updateProfile);
  assert.equal(result.ok, false);
  assert.equal(result.state, initial);
  if (!result.ok) assert.equal(result.error.code, "SCHOLARSHIP_PROFILE_INVALID");
});

test("a partially modelled criteria set is not silently marked eligible", () => {
  const partialScheme: ScholarshipScheme = {
    ...scheme("mahadbt-rajarshi-dte"),
    criteriaCoverage: "PARTIAL",
  };
  const evaluation = evaluateScheme(createInitialAdmissionSimulationState(), demoCandidate, partialScheme);
  assert.equal(evaluation.failedRules.length, 0);
  assert.equal(evaluation.unknownRules.length, 0);
  assert.equal(evaluation.status, "POSSIBLY_ELIGIBLE");
});

test("official handoff records HANDED_OFF without claiming submission", () => {
  const initial = createInitialAdmissionSimulationState();
  const result = recordScholarshipPortalHandoff(
    initial,
    "mahadbt-rajarshi-dte",
    scholarshipDemoTimestamps.portalHandoff,
  );
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(result.state.scholarshipNavigator.handoffs, [{
    schemeId: "mahadbt-rajarshi-dte",
    status: "HANDED_OFF",
    openedAt: scholarshipDemoTimestamps.portalHandoff,
  }]);
  assert.equal(Object.hasOwn(result.state.scholarshipNavigator.handoffs[0], "submitted"), false);
});

test("an unknown scheme cannot create a handoff", () => {
  const initial = createInitialAdmissionSimulationState();
  const result = recordScholarshipPortalHandoff(initial, "invented-scheme", scholarshipDemoTimestamps.portalHandoff);
  assert.equal(result.ok, false);
  assert.equal(result.state, initial);
  if (!result.ok) assert.equal(result.error.code, "SCHOLARSHIP_SCHEME_NOT_FOUND");
});

test("reset restores the deterministic scholarship profile and clears handoffs", () => {
  const initial = createInitialAdmissionSimulationState();
  const updated = updateScholarshipProfile(initial, { hostelStatus: "HOSTELLER" }, scholarshipDemoTimestamps.updateProfile);
  assert.equal(updated.ok, true);
  if (!updated.ok) return;
  const handedOff = recordScholarshipPortalHandoff(updated.state, "mahadbt-rajarshi-dte", scholarshipDemoTimestamps.portalHandoff);
  assert.equal(handedOff.ok, true);
  if (!handedOff.ok) return;
  const reset = resetAdmissionSimulation(createInitialAdmissionSimulationState());
  assert.notDeepEqual(handedOff.state.scholarshipNavigator, reset.scholarshipNavigator);
  assert.deepEqual(reset.scholarshipNavigator, createInitialAdmissionSimulationState().scholarshipNavigator);
});

test("accepting VIT updates CAP-dependent scholarship results from the live admission", () => {
  const initialEvaluation = evaluateScheme(
    createInitialAdmissionSimulationState(),
    demoCandidate,
    scheme("mahadbt-rajarshi-dte"),
  );
  const acceptedEvaluation = evaluateScheme(acceptedVitState(), demoCandidate, scheme("mahadbt-rajarshi-dte"));
  assert.equal(initialEvaluation.status, "ELIGIBLE");
  assert.equal(acceptedEvaluation.status, "NOT_ELIGIBLE");
  assert.ok(acceptedEvaluation.failedRules.some((result) => result.ruleId === "rajarshi-cap"));
});
