import { strict as assert } from "node:assert";
import test from "node:test";
import {
  HERO_SPOT_ROUND_ID,
  createInitialAdmissionSimulationState,
} from "../data/admission-simulation.ts";
import { getProgrammeVacancies, resetAdmissionSimulation } from "./admission-state.ts";
import {
  acceptSpotRoundOffer,
  advanceSpotRound,
  declineSpotRoundOffer,
  expireSpotRoundOffer,
  getActiveSpotInterestCount,
  getCandidateSpotStatus,
  getSpotRoundAvailableSeats,
  joinSpotRound,
  leaveSpotRound,
} from "./spot-round-state.ts";

const AISSMS_COMPUTER = "0627824510";
const PICT_ENTC = "0627137210";

function requireSuccess(result: ReturnType<typeof joinSpotRound>) {
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}

function stateWithOffer() {
  let state = requireSuccess(joinSpotRound(createInitialAdmissionSimulationState(), HERO_SPOT_ROUND_ID));
  for (let step = 0; step < 5; step += 1) state = requireSuccess(advanceSpotRound(state, HERO_SPOT_ROUND_ID));
  return state;
}

test("Aarya can join one spot round", () => {
  const state = requireSuccess(joinSpotRound(createInitialAdmissionSimulationState(), HERO_SPOT_ROUND_ID));
  const round = state.spotRounds.find((item) => item.id === HERO_SPOT_ROUND_ID);
  assert.equal(round && getCandidateSpotStatus(round), "WAITING");
});

test("active interest count increments", () => {
  const initial = createInitialAdmissionSimulationState();
  assert.equal(getActiveSpotInterestCount(initial), 0);
  assert.equal(getActiveSpotInterestCount(requireSuccess(joinSpotRound(initial, HERO_SPOT_ROUND_ID))), 1);
});

test("Aarya cannot join a sixth active round", () => {
  let state = createInitialAdmissionSimulationState();
  for (const round of state.spotRounds.filter((item) => item.status !== "COMPLETED").slice(0, 5)) {
    state = requireSuccess(joinSpotRound(state, round.id));
  }
  const sixth = state.spotRounds.filter((item) => item.status !== "COMPLETED")[5];
  const result = joinSpotRound(state, sixth.id);
  assert.equal(getActiveSpotInterestCount(state), 5);
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error.code, "SPOT_ROUND_LIMIT_REACHED");
});

test("leaving a round frees an active-interest slot", () => {
  let state = createInitialAdmissionSimulationState();
  const activeRounds = state.spotRounds.filter((item) => item.status !== "COMPLETED");
  for (const round of activeRounds.slice(0, 5)) state = requireSuccess(joinSpotRound(state, round.id));
  state = requireSuccess(leaveSpotRound(state, activeRounds[0].id));
  state = requireSuccess(joinSpotRound(state, activeRounds[5].id));
  assert.equal(getActiveSpotInterestCount(state), 5);
});

test("deterministic queue progression changes Aarya from position 7 to 6", () => {
  const joined = requireSuccess(joinSpotRound(createInitialAdmissionSimulationState(), HERO_SPOT_ROUND_ID));
  const advanced = requireSuccess(advanceSpotRound(joined, HERO_SPOT_ROUND_ID));
  const round = advanced.spotRounds.find((item) => item.id === HERO_SPOT_ROUND_ID);
  assert.equal(round?.queuePosition, 6);
  assert.equal(round?.candidatesAhead, 3);
});

test("the third deterministic event releases one PICT seat", () => {
  let state = requireSuccess(joinSpotRound(createInitialAdmissionSimulationState(), HERO_SPOT_ROUND_ID));
  assert.equal(getProgrammeVacancies(state, PICT_ENTC), 2);
  for (let step = 0; step < 3; step += 1) state = requireSuccess(advanceSpotRound(state, HERO_SPOT_ROUND_ID));
  assert.equal(getProgrammeVacancies(state, PICT_ENTC), 3);
});

test("a seat offer can be generated only at the deterministic offer step", () => {
  let state = requireSuccess(joinSpotRound(createInitialAdmissionSimulationState(), HERO_SPOT_ROUND_ID));
  for (let step = 0; step < 4; step += 1) state = requireSuccess(advanceSpotRound(state, HERO_SPOT_ROUND_ID));
  assert.equal(state.spotRounds.find((item) => item.id === HERO_SPOT_ROUND_ID)?.offer, null);
  state = requireSuccess(advanceSpotRound(state, HERO_SPOT_ROUND_ID));
  assert.equal(state.spotRounds.find((item) => item.id === HERO_SPOT_ROUND_ID)?.offer?.status, "AWAITING_DECISION");
});

test("accepting an offer changes the offered seat to ACCEPTED", () => {
  const offered = stateWithOffer();
  const seatId = offered.spotRounds.find((item) => item.id === HERO_SPOT_ROUND_ID)?.offer?.seatId;
  const accepted = requireSuccess(acceptSpotRoundOffer(offered, HERO_SPOT_ROUND_ID));
  assert.equal(accepted.seats.find((seat) => seat.id === seatId)?.lifecycleState, "ACCEPTED");
});

test("accepting releases Aarya's previous AISSMS seat exactly once", () => {
  const accepted = requireSuccess(acceptSpotRoundOffer(stateWithOffer(), HERO_SPOT_ROUND_ID));
  assert.equal(accepted.seats.find((seat) => seat.id === "AISSMS-COMP-DEMO-001")?.lifecycleState, "AVAILABLE");
  assert.equal(accepted.events.filter((event) => event.type === "SEAT_RELEASED" && event.seatId === "AISSMS-COMP-DEMO-001").length, 1);
});

test("AISSMS vacancy increases exactly once after spot acceptance", () => {
  const accepted = requireSuccess(acceptSpotRoundOffer(stateWithOffer(), HERO_SPOT_ROUND_ID));
  assert.equal(getProgrammeVacancies(accepted, AISSMS_COMPUTER), 3);
  const repeated = acceptSpotRoundOffer(accepted, HERO_SPOT_ROUND_ID);
  assert.equal(repeated.ok, false);
  assert.equal(getProgrammeVacancies(repeated.state, AISSMS_COMPUTER), 3);
});

test("Aarya has only one active participating admission after acceptance", () => {
  const accepted = requireSuccess(acceptSpotRoundOffer(stateWithOffer(), HERO_SPOT_ROUND_ID));
  const activeSeats = accepted.seats.filter((seat) => seat.heldByCandidateId === accepted.candidateId && ["HELD", "ACCEPTED"].includes(seat.lifecycleState));
  assert.equal(activeSeats.length, 1);
  assert.equal(accepted.currentAdmission?.kind === "PARTICIPATING_SEAT" && accepted.currentAdmission.programId, PICT_ENTC);
});

test("remaining active spot interests close after acceptance", () => {
  let state = requireSuccess(joinSpotRound(createInitialAdmissionSimulationState(), "spot-vit-computer-live"));
  state = requireSuccess(joinSpotRound(state, HERO_SPOT_ROUND_ID));
  for (let step = 0; step < 5; step += 1) state = requireSuccess(advanceSpotRound(state, HERO_SPOT_ROUND_ID));
  state = requireSuccess(acceptSpotRoundOffer(state, HERO_SPOT_ROUND_ID));
  const vit = state.spotRounds.find((item) => item.id === "spot-vit-computer-live");
  assert.equal(vit && getCandidateSpotStatus(vit), "WITHDRAWN");
  assert.equal(getActiveSpotInterestCount(state), 0);
});

test("declining keeps Aarya's current admission and returns the offered seat", () => {
  const offered = stateWithOffer();
  const offeredSeatId = offered.spotRounds.find((item) => item.id === HERO_SPOT_ROUND_ID)?.offer?.seatId;
  const declined = requireSuccess(declineSpotRoundOffer(offered, HERO_SPOT_ROUND_ID));
  assert.equal(declined.currentAdmission?.kind === "PARTICIPATING_SEAT" && declined.currentAdmission.seatId, "AISSMS-COMP-DEMO-001");
  assert.equal(declined.seats.find((seat) => seat.id === offeredSeatId)?.lifecycleState, "AVAILABLE");
  assert.equal(getSpotRoundAvailableSeats(declined, HERO_SPOT_ROUND_ID), 3);
});

test("expiry preserves Aarya's existing current admission", () => {
  const expired = requireSuccess(expireSpotRoundOffer(stateWithOffer(), HERO_SPOT_ROUND_ID));
  assert.equal(expired.currentAdmission?.kind === "PARTICIPATING_SEAT" && expired.currentAdmission.seatId, "AISSMS-COMP-DEMO-001");
  const round = expired.spotRounds.find((item) => item.id === HERO_SPOT_ROUND_ID);
  assert.equal(round && getCandidateSpotStatus(round), "EXPIRED");
});

test("reset restores original Phase 4 and Phase 5 simulation state", () => {
  const accepted = requireSuccess(acceptSpotRoundOffer(stateWithOffer(), HERO_SPOT_ROUND_ID));
  assert.deepEqual(resetAdmissionSimulation(createInitialAdmissionSimulationState()), createInitialAdmissionSimulationState());
  assert.notDeepEqual(accepted, createInitialAdmissionSimulationState());
});
