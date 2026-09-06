import { strict as assert } from "node:assert";
import test from "node:test";
import {
  AISSMS_CLEARING_ROUND_ID,
  HERO_SPOT_ROUND_ID,
  V2_HERO_OFFER_ROUND_ID,
  createInitialAdmissionSimulationState,
} from "../data/admission-simulation.ts";
import { DIGILOCKER_DEMO_SCOPES, documentDemoTimestamps } from "../data/document-passport.ts";
import { scholarshipDemoTimestamps } from "../data/scholarships.ts";
import type { AdmissionSimulationState } from "../types/admissions.ts";
import {
  getProgrammeVacancies,
  resetAdmissionSimulation,
  restoreAdmissionSimulationState,
  serializeAdmissionSimulationState,
} from "./admission-state.ts";
import { snoozeAlert } from "./alerts.ts";
import {
  acceptClearingOffer,
  advanceHeroClearingScenario,
  buildMeritList,
} from "./clearing-network.ts";
import { connectDocumentProvider } from "./document-passport.ts";
import { updateScholarshipProfile } from "./scholarships.ts";

const AARYA = "candidate-demo-aarya-deshmukh";
const AISSMS_PROGRAM = "0627824510";
const AISSMS_SEAT = "AISSMS-COMP-DEMO-001";
const VIT_PROGRAM = "0627324510";
const VIT_SEAT = "VIT-COMP-DEMO-001";
const COMPETING_ROUND_IDS = [
  HERO_SPOT_ROUND_ID,
  "spot-pccoe-aiml-upcoming",
  "spot-mmcoe-computer-upcoming",
] as const;

function requireSuccess(result: { ok: boolean; state: AdmissionSimulationState }) {
  assert.equal(result.ok, true);
  return result.state;
}

function offeredHeroState() {
  return requireSuccess(advanceHeroClearingScenario(createInitialAdmissionSimulationState()));
}

function acceptedHeroState() {
  const offered = offeredHeroState();
  const offer = offered.clearing.offers.find(
    (item) => item.roundId === V2_HERO_OFFER_ROUND_ID && item.candidateId === AARYA && item.status === "AWAITING_DECISION",
  );
  assert.ok(offer);
  return requireSuccess(acceptClearingOffer(offered, offer.id));
}

function restore(state: AdmissionSimulationState) {
  return restoreAdmissionSimulationState(
    serializeAdmissionSimulationState(state),
    createInitialAdmissionSimulationState(),
  ).state;
}

function assertSerializedEqual(actual: AdmissionSimulationState, expected: AdmissionSimulationState) {
  assert.equal(
    serializeAdmissionSimulationState(actual),
    serializeAdmissionSimulationState(expected),
  );
}

test("baseline state serializes and restores identically", () => {
  const initial = createInitialAdmissionSimulationState();
  assertSerializedEqual(restore(initial), initial);
});

test("VIT offer state serializes and restores identically", () => {
  const offered = offeredHeroState();
  const restored = restore(offered);
  assertSerializedEqual(restored, offered);
  assert.equal(restored.clearing.heroScenario.status, "OFFER_READY");
  assert.equal(restored.seats.find((seat) => seat.id === VIT_SEAT)?.lifecycleState, "OFFERED");
});

test("accepted VIT state serializes and restores identically", () => {
  const accepted = acceptedHeroState();
  assertSerializedEqual(restore(accepted), accepted);
});

test("accepted VIT seat remains accepted after restore", () => {
  const restored = restore(acceptedHeroState());
  assert.equal(restored.seats.find((seat) => seat.id === VIT_SEAT)?.lifecycleState, "ACCEPTED");
  assert.equal(restored.seats.find((seat) => seat.id === VIT_SEAT)?.heldByCandidateId, AARYA);
});

test("AISSMS release remains exactly once after restore", () => {
  const restored = restore(acceptedHeroState());
  const releases = restored.clearing.events.filter(
    (event) => event.type === "PREVIOUS_SEAT_RELEASED" && event.seatId === AISSMS_SEAT,
  );
  assert.equal(releases.length, 1);
  assert.equal(restored.clearing.lastOutcome?.previousAvailabilityBefore, 2);
  assert.equal(restored.clearing.lastOutcome?.previousAvailabilityAfterRelease, 3);
});

test("VIT remains the current admission after restore", () => {
  const restored = restore(acceptedHeroState());
  assert.equal(restored.currentAdmission?.kind, "PARTICIPATING_SEAT");
  assert.equal(restored.currentAdmission?.kind === "PARTICIPATING_SEAT" && restored.currentAdmission.programId, VIT_PROGRAM);
  assert.equal(restored.currentAdmission?.kind === "PARTICIPATING_SEAT" && restored.currentAdmission.seatId, VIT_SEAT);
});

test("PICT, PCCOE and MMCOE interests remain closed after restore", () => {
  const restored = restore(acceptedHeroState());
  const candidate = restored.clearing.candidates.find((item) => item.candidateId === AARYA);
  assert.ok(candidate);
  for (const roundId of COMPETING_ROUND_IDS) {
    assert.equal(candidate.interests.find((interest) => interest.roundId === roundId)?.status, "CLOSED_AFTER_ACCEPTANCE");
    assert.equal(buildMeritList(roundId, restored).some((entry) => entry.candidateId === AARYA), false);
  }
});

test("candidate queue movements remain correct after restore", () => {
  const restored = restore(acceptedHeroState());
  const movements = restored.clearing.lastOutcome?.movements ?? [];
  assert.ok(movements.some((item) => item.roundId === HERO_SPOT_ROUND_ID && item.candidateId === "candidate-2092" && item.fromPosition === 5 && item.toPosition === 4));
  assert.equal(buildMeritList(HERO_SPOT_ROUND_ID, restored).find((entry) => entry.candidateId === "candidate-2092")?.position, 4);
});

test("released AISSMS replacement offer remains correct after restore", () => {
  const restored = restore(acceptedHeroState());
  const offer = restored.clearing.offers.find(
    (item) => item.roundId === AISSMS_CLEARING_ROUND_ID && item.seatId === AISSMS_SEAT && item.status === "AWAITING_DECISION",
  );
  assert.equal(offer?.candidateId, "candidate-1219");
  assert.equal(restored.seats.find((seat) => seat.id === AISSMS_SEAT)?.lifecycleState, "OFFERED");
  assert.equal(getProgrammeVacancies(restored, AISSMS_PROGRAM), 2);
});

test("event history survives restore", () => {
  const accepted = acceptedHeroState();
  assert.deepEqual(restore(accepted).clearing.events, accepted.clearing.events);
  assert.deepEqual(restore(accepted).events, accepted.events);
});

test("document state survives restore", () => {
  const connected = requireSuccess(connectDocumentProvider(
    createInitialAdmissionSimulationState(),
    DIGILOCKER_DEMO_SCOPES,
    documentDemoTimestamps.connectProvider,
  ));
  assert.equal(
    JSON.stringify(restore(connected).documentPassport),
    JSON.stringify(connected.documentPassport),
  );
});

test("scholarship state survives restore", () => {
  const updated = requireSuccess(updateScholarshipProfile(
    createInitialAdmissionSimulationState(),
    { hostelStatus: "HOSTELLER", class12BoardPercentile: 88.4 },
    scholarshipDemoTimestamps.updateProfile,
  ));
  assert.deepEqual(restore(updated).scholarshipNavigator, updated.scholarshipNavigator);
});

test("alert and reminder state survives restore", () => {
  const snoozed = snoozeAlert(createInitialAdmissionSimulationState(), "preference-safety-round-3", "LATER");
  assert.deepEqual(restore(snoozed).alertControls, snoozed.alertControls);
});

test("Reset Demo still restores and persists the exact baseline", () => {
  const reset = resetAdmissionSimulation(createInitialAdmissionSimulationState());
  assertSerializedEqual(restore(reset), createInitialAdmissionSimulationState());
});

test("malformed persisted state fails safely", () => {
  const initial = createInitialAdmissionSimulationState();
  assert.deepEqual(restoreAdmissionSimulationState("{not-json", initial).state, initial);
  const malformed = structuredClone(initial);
  malformed.seats.push({ ...malformed.seats[0] });
  assert.deepEqual(
    restoreAdmissionSimulationState(JSON.stringify(malformed), initial).state,
    initial,
  );
});

test("unsupported persisted versions fail safely instead of being treated as current", () => {
  const initial = createInitialAdmissionSimulationState();
  const unsupported = { ...initial, version: 4 };
  assert.deepEqual(
    restoreAdmissionSimulationState(JSON.stringify(unsupported), initial).state,
    initial,
  );
});

test("repeated accepted-state restores do not duplicate releases or replacement offers", () => {
  const first = restore(acceptedHeroState());
  const second = restore(first);
  assert.equal(second.clearing.events.filter((event) => event.type === "PREVIOUS_SEAT_RELEASED" && event.seatId === AISSMS_SEAT).length, 1);
  assert.equal(second.clearing.offers.filter((offer) => offer.seatId === AISSMS_SEAT && offer.candidateId === "candidate-1219").length, 1);
});
