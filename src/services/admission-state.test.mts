import { strict as assert } from "node:assert";
import test from "node:test";
import { createInitialAdmissionSimulationState } from "../data/admission-simulation.ts";
import {
  acceptSeat,
  confirmExternalAdmission,
  getCandidateCurrentAdmission,
  getProgrammeVacancies,
  releaseSeat,
  resetAdmissionSimulation,
} from "./admission-state.ts";

const AARYA_SEAT = "AISSMS-COMP-DEMO-001";
const AISSMS_COMPUTER = "0627824510";
const ACTION_AT = "2026-08-27T18:05:00+05:30";

test("Aarya begins holding the seeded AISSMS seat", () => {
  const state = createInitialAdmissionSimulationState();
  assert.equal(state.currentAdmission?.kind, "PARTICIPATING_SEAT");
  assert.equal(state.currentAdmission?.kind === "PARTICIPATING_SEAT" && state.currentAdmission.seatId, AARYA_SEAT);
  assert.equal(state.seats.find((seat) => seat.id === AARYA_SEAT)?.lifecycleState, "ACCEPTED");
});

test("Aarya's accepted seat is not counted as available", () => {
  assert.equal(getProgrammeVacancies(createInitialAdmissionSimulationState(), AISSMS_COMPUTER), 2);
});

test("releasing Aarya's seat increases availability by exactly one", () => {
  const initial = createInitialAdmissionSimulationState();
  const result = releaseSeat(initial, AARYA_SEAT, initial.candidateId, ACTION_AT);
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(getProgrammeVacancies(result.state, AISSMS_COMPUTER), 3);
});

test("releasing the same seat twice does not add another vacancy", () => {
  const initial = createInitialAdmissionSimulationState();
  const first = releaseSeat(initial, AARYA_SEAT, initial.candidateId, ACTION_AT);
  assert.equal(first.ok, true);
  if (!first.ok) return;
  const second = releaseSeat(first.state, AARYA_SEAT, initial.candidateId, ACTION_AT);
  assert.equal(second.ok, false);
  assert.equal(getProgrammeVacancies(second.state, AISSMS_COMPUTER), 3);
});

test("confirming an alternate admission releases the old AISSMS seat", () => {
  const initial = createInitialAdmissionSimulationState();
  const result = confirmExternalAdmission(initial, "CONNECTED-DEMO-JEE-001", ACTION_AT);
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.state.seats.find((seat) => seat.id === AARYA_SEAT)?.lifecycleState, "AVAILABLE");
});

test("candidate state updates after connected admission confirmation", () => {
  const initial = createInitialAdmissionSimulationState();
  const result = confirmExternalAdmission(initial, "CONNECTED-DEMO-JEE-001", ACTION_AT);
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(getCandidateCurrentAdmission(result.state, initial.candidateId)?.kind, "CONNECTED_ADMISSION");
});

test("an unavailable seat cannot be accepted", () => {
  const initial = createInitialAdmissionSimulationState();
  const result = acceptSeat(initial, "PCCOE-COMP-DEMO-002", ACTION_AT);
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error.code, "SEAT_HELD_BY_ANOTHER_CANDIDATE");
});

test("accepting a participating seat leaves Aarya with exactly one active seat", () => {
  const initial = createInitialAdmissionSimulationState();
  const result = acceptSeat(initial, "PICT-ENTC-DEMO-001", ACTION_AT);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const held = result.state.seats.filter((seat) => seat.heldByCandidateId === initial.candidateId && ["HELD", "OFFERED", "ACCEPTED"].includes(seat.lifecycleState));
  assert.equal(held.length, 1);
  assert.equal(held[0].id, "PICT-ENTC-DEMO-001");
  assert.equal(getProgrammeVacancies(result.state, AISSMS_COMPUTER), 3);
});

test("reset restores the deterministic original state", () => {
  const initial = createInitialAdmissionSimulationState();
  const changed = confirmExternalAdmission(initial, "CONNECTED-DEMO-JEE-001", ACTION_AT);
  assert.equal(changed.ok, true);
  if (!changed.ok) return;
  assert.notDeepEqual(changed.state, initial);
  assert.deepEqual(resetAdmissionSimulation(initial), createInitialAdmissionSimulationState());
});

test("vacancy totals are derived from seat records", () => {
  const state = createInitialAdmissionSimulationState();
  const expected = state.seats.filter((seat) => seat.programId === "0627137210" && seat.lifecycleState === "AVAILABLE").length;
  assert.equal(getProgrammeVacancies(state, "0627137210"), expected);
  assert.equal(expected, 3);
});
