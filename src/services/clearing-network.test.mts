import { strict as assert } from "node:assert";
import test from "node:test";
import {
  AISSMS_CLEARING_ROUND_ID,
  HERO_SPOT_ROUND_ID,
  V2_HERO_OFFER_ROUND_ID,
  createInitialAdmissionSimulationState,
} from "../data/admission-simulation.ts";
import { getProgrammeVacancies, resetAdmissionSimulation } from "./admission-state.ts";
import {
  acceptClearingOffer,
  advanceHeroClearingScenario,
  buildMeritList,
  declineClearingOffer,
  generateClearingOffers,
  getActiveClearingInterestCount,
  getCandidateMeritPosition,
  isMeritClearingStateValid,
  joinClearingRound,
  leaveClearingRound,
} from "./clearing-network.ts";

const AARYA = "candidate-demo-aarya-deshmukh";
const AISSMS_PROGRAM = "0627824510";
const AISSMS_SEAT = "AISSMS-COMP-DEMO-001";

function heroOfferState() {
  const result = advanceHeroClearingScenario(createInitialAdmissionSimulationState());
  assert.equal(result.ok, true);
  if (!result.ok) throw new Error("The hero offer scenario did not complete.");
  return result.state;
}

function acceptedHeroState() {
  const offered = heroOfferState();
  const offer = offered.clearing.offers.find(
    (item) => item.candidateId === AARYA && item.roundId === V2_HERO_OFFER_ROUND_ID && item.status === "AWAITING_DECISION",
  );
  assert.ok(offer);
  const result = acceptClearingOffer(offered, offer.id);
  assert.equal(result.ok, true);
  if (!result.ok) throw new Error("The hero acceptance scenario did not complete.");
  return result.state;
}

test("merit lists sort candidates by ascending synthetic rank", () => {
  const list = buildMeritList(HERO_SPOT_ROUND_ID, createInitialAdmissionSimulationState());
  assert.deepEqual(list.map((entry) => entry.meritRank), [412, 427, 441, 463, 478, 502, 566]);
});

test("equal ranks use candidate ID as a deterministic tie-breaker", () => {
  const state = createInitialAdmissionSimulationState();
  const candidate = state.clearing.candidates.find((item) => item.candidateId === "candidate-1187");
  assert.ok(candidate);
  candidate.meritRank = 412;
  const list = buildMeritList(HERO_SPOT_ROUND_ID, state);
  assert.deepEqual(list.slice(0, 2).map((entry) => entry.candidateId), ["candidate-1042", "candidate-1187"]);
});

test("a candidate appears only in rounds they joined", () => {
  const state = createInitialAdmissionSimulationState();
  assert.ok(buildMeritList(HERO_SPOT_ROUND_ID, state).some((entry) => entry.candidateId === AARYA));
  assert.equal(buildMeritList(AISSMS_CLEARING_ROUND_ID, state).some((entry) => entry.candidateId === AARYA), false);
});

test("Aarya starts in four derived merit positions", () => {
  const state = createInitialAdmissionSimulationState();
  assert.equal(getCandidateMeritPosition(state, HERO_SPOT_ROUND_ID)?.position, 4);
  assert.equal(getCandidateMeritPosition(state, V2_HERO_OFFER_ROUND_ID)?.position, 3);
  assert.equal(getCandidateMeritPosition(state, "spot-pccoe-aiml-upcoming")?.position, 2);
  assert.equal(getCandidateMeritPosition(state, "spot-mmcoe-computer-upcoming")?.position, 6);
});

test("available seat count limits active offers", () => {
  const initial = createInitialAdmissionSimulationState();
  const available = getProgrammeVacancies(initial, "0627137210");
  const result = generateClearingOffers(initial, HERO_SPOT_ROUND_ID, "2026-08-27T10:00:00+05:30");
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.state.clearing.offers.filter((offer) => offer.status === "AWAITING_DECISION").length, available);
});

test("the same seat cannot be offered twice", () => {
  const first = generateClearingOffers(createInitialAdmissionSimulationState(), HERO_SPOT_ROUND_ID, "2026-08-27T10:00:00+05:30");
  assert.equal(first.ok, true);
  if (!first.ok) return;
  const second = generateClearingOffers(first.state, HERO_SPOT_ROUND_ID, "2026-08-27T10:01:00+05:30");
  assert.equal(second.ok, true);
  if (!second.ok) return;
  const activeSeatIds = second.state.clearing.offers.filter((offer) => offer.status === "AWAITING_DECISION").map((offer) => offer.seatId);
  assert.equal(new Set(activeSeatIds).size, activeSeatIds.length);
});

test("the highest-ranked eligible candidates receive exact seats", () => {
  const result = generateClearingOffers(createInitialAdmissionSimulationState(), HERO_SPOT_ROUND_ID, "2026-08-27T10:00:00+05:30");
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(result.state.clearing.offers.map((offer) => offer.candidateId), ["candidate-1042", "candidate-1187"]);
  assert.ok(result.state.clearing.offers.every((offer) => result.state.seats.find((seat) => seat.id === offer.seatId)?.lifecycleState === "OFFERED"));
});

test("the deterministic event makes Aarya offerable at VIT", () => {
  const state = heroOfferState();
  assert.equal(getCandidateMeritPosition(state, V2_HERO_OFFER_ROUND_ID)?.position, 1);
  assert.ok(state.clearing.offers.some((offer) => offer.candidateId === AARYA && offer.status === "AWAITING_DECISION"));
});

test("accepting VIT replaces Aarya's current admission", () => {
  const state = acceptedHeroState();
  assert.equal(state.currentAdmission?.kind, "PARTICIPATING_SEAT");
  assert.equal(state.currentAdmission?.kind === "PARTICIPATING_SEAT" && state.currentAdmission.programId, "0627324510");
});

test("acceptance releases the previous AISSMS seat exactly once", () => {
  const state = acceptedHeroState();
  const releaseEvents = state.clearing.events.filter((event) => event.type === "PREVIOUS_SEAT_RELEASED" && event.seatId === AISSMS_SEAT);
  assert.equal(releaseEvents.length, 1);
  assert.equal(state.clearing.lastOutcome?.previousAvailabilityBefore, 2);
  assert.equal(state.clearing.lastOutcome?.previousAvailabilityAfterRelease, 3);
});

test("the accepted candidate leaves all competing active merit lists", () => {
  const state = acceptedHeroState();
  for (const roundId of [HERO_SPOT_ROUND_ID, "spot-pccoe-aiml-upcoming", "spot-mmcoe-computer-upcoming"]) {
    assert.equal(buildMeritList(roundId, state).some((entry) => entry.candidateId === AARYA), false);
  }
});

test("candidates below Aarya move upward in every affected list", () => {
  const state = acceptedHeroState();
  const movements = state.clearing.lastOutcome?.movements ?? [];
  assert.ok(movements.some((item) => item.roundId === HERO_SPOT_ROUND_ID && item.fromPosition === 5 && item.toPosition === 4));
  assert.ok(movements.some((item) => item.roundId === "spot-pccoe-aiml-upcoming" && item.fromPosition === 3 && item.toPosition === 2));
  assert.ok(movements.some((item) => item.roundId === "spot-mmcoe-computer-upcoming" && item.fromPosition === 7 && item.toPosition === 6));
});

test("recomputed lists remain merit ordered", () => {
  const state = acceptedHeroState();
  for (const roundId of [HERO_SPOT_ROUND_ID, "spot-pccoe-aiml-upcoming", "spot-mmcoe-computer-upcoming"]) {
    const ranks = buildMeritList(roundId, state).map((entry) => entry.meritRank);
    assert.deepEqual(ranks, [...ranks].sort((left, right) => left - right));
  }
});

test("one candidate cannot own two accepted or held seats", () => {
  const state = acceptedHeroState();
  const owned = state.seats.filter((seat) => seat.heldByCandidateId === AARYA && ["HELD", "ACCEPTED"].includes(seat.lifecycleState));
  assert.equal(owned.length, 1);
  assert.equal(owned[0].programId, "0627324510");
});

test("released AISSMS capacity generates the next eligible offer", () => {
  const state = acceptedHeroState();
  const generated = state.clearing.lastOutcome?.generatedOfferIds ?? [];
  assert.equal(generated.length, 1);
  const offer = state.clearing.offers.find((item) => item.id === generated[0]);
  assert.equal(offer?.roundId, AISSMS_CLEARING_ROUND_ID);
  assert.equal(offer?.seatId, AISSMS_SEAT);
  assert.equal(offer?.candidateId, "candidate-1219");
});

test("an offered seat is not counted as available", () => {
  const state = acceptedHeroState();
  assert.equal(state.seats.find((seat) => seat.id === AISSMS_SEAT)?.lifecycleState, "OFFERED");
  assert.equal(getProgrammeVacancies(state, AISSMS_PROGRAM), 2);
});

test("declining an offer advances the next eligible candidate", () => {
  const offered = heroOfferState();
  const aaryaOffer = offered.clearing.offers.find((offer) => offer.candidateId === AARYA && offer.status === "AWAITING_DECISION");
  assert.ok(aaryaOffer);
  const result = declineClearingOffer(offered, aaryaOffer.id);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const replacement = result.state.clearing.offers.find((offer) => offer.seatId === aaryaOffer.seatId && offer.status === "AWAITING_DECISION");
  assert.equal(replacement?.candidateId, "candidate-2391");
});

test("leaving a round removes the candidate and recomputes positions", () => {
  const initial = createInitialAdmissionSimulationState();
  const before = getCandidateMeritPosition(initial, HERO_SPOT_ROUND_ID, "candidate-2092");
  const result = leaveClearingRound(initial, HERO_SPOT_ROUND_ID);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(getCandidateMeritPosition(result.state, HERO_SPOT_ROUND_ID), null);
  assert.equal(getCandidateMeritPosition(result.state, HERO_SPOT_ROUND_ID, "candidate-2092")?.position, (before?.position ?? 0) - 1);
});

test("maximum five active interests remains enforced", () => {
  const initial = createInitialAdmissionSimulationState();
  const fifth = joinClearingRound(initial, AISSMS_CLEARING_ROUND_ID);
  assert.equal(fifth.ok, true);
  if (!fifth.ok) return;
  assert.equal(getActiveClearingInterestCount(fifth.state), 5);
  const sixth = joinClearingRound(fifth.state, "spot-dypcoe-aids-upcoming");
  assert.equal(sixth.ok, false);
  if (!sixth.ok) assert.equal(sixth.error.code, "SPOT_ROUND_LIMIT_REACHED");
});

test("reset restores the exact deterministic V2 seed", () => {
  const changed = acceptedHeroState();
  const reset = resetAdmissionSimulation(createInitialAdmissionSimulationState());
  assert.notDeepEqual(changed, reset);
  assert.deepEqual(reset, createInitialAdmissionSimulationState());
});

test("accepted state satisfies clearing data-integrity assertions", () => {
  assert.equal(isMeritClearingStateValid(acceptedHeroState()), true);
});

test("acceptance records offer, release, closure and recomputation events", () => {
  const state = acceptedHeroState();
  const types = new Set(state.clearing.events.map((event) => event.type));
  assert.ok(types.has("OFFER_ACCEPTED"));
  assert.ok(types.has("PREVIOUS_SEAT_RELEASED"));
  assert.ok(types.has("COMPETING_LISTS_CLOSED"));
  assert.ok(types.has("MERIT_LIST_RECOMPUTED"));
});
