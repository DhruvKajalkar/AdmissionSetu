import {
  AISSMS_CLEARING_ROUND_ID,
  MAX_ACTIVE_SPOT_INTERESTS,
  V2_HERO_OFFER_ROUND_ID,
  demoSimulationTimestamps,
} from "../data/admission-simulation.ts";
import { getProgrammeVacancies } from "./admission-state.ts";
import type {
  AdmissionSimulationState,
  AdmissionTransitionResult,
  CandidateClearingProfile,
  ClearingEvent,
  ClearingInterestStatus,
  ClearingOffer,
  ClearingQueueMovement,
  MeritListEntry,
} from "@/types";

const ACTIVE_INTEREST_STATUSES: readonly ClearingInterestStatus[] = [
  "REGISTERED",
  "WAITING",
  "ELIGIBLE",
  "OFFERED",
];

function cloneState(state: AdmissionSimulationState): AdmissionSimulationState {
  return {
    ...state,
    currentAdmission: state.currentAdmission ? { ...state.currentAdmission } : null,
    seats: state.seats.map((seat) => ({ ...seat })),
    externalAdmissions: state.externalAdmissions.map((admission) => ({ ...admission })),
    events: state.events.map((event) => ({ ...event })),
    lastFeedback: state.lastFeedback ? { ...state.lastFeedback } : null,
    spotRounds: state.spotRounds.map((round) => ({
      ...round,
      seatIds: [...round.seatIds],
      participants: round.participants.map((participant) => ({ ...participant })),
      events: round.events.map((event) => ({ ...event })),
      offer: round.offer ? { ...round.offer } : null,
      scheduleConflictRoundIds: [...round.scheduleConflictRoundIds],
    })),
    lastSpotRoundOutcome: state.lastSpotRoundOutcome ? { ...state.lastSpotRoundOutcome } : null,
    clearing: {
      ...state.clearing,
      candidates: state.clearing.candidates.map((candidate) => ({
        ...candidate,
        interests: candidate.interests.map((interest) => ({ ...interest })),
      })),
      offers: state.clearing.offers.map((offer) => ({ ...offer })),
      events: state.clearing.events.map((event) => event.movements
        ? { ...event, movements: event.movements.map((movement) => ({ ...movement })) }
        : { ...event }),
      heroScenario: { ...state.clearing.heroScenario },
      lastOutcome: state.clearing.lastOutcome
        ? {
            ...state.clearing.lastOutcome,
            closedRoundIds: [...state.clearing.lastOutcome.closedRoundIds],
            movements: state.clearing.lastOutcome.movements.map((movement) => ({ ...movement })),
            generatedOfferIds: [...state.clearing.lastOutcome.generatedOfferIds],
          }
        : null,
    },
  };
}

function failure(
  state: AdmissionSimulationState,
  code: "CLEARING_CANDIDATE_NOT_FOUND" | "CLEARING_OFFER_NOT_FOUND" | "CLEARING_INTEREST_NOT_ACTIVE" | "SPOT_ROUND_LIMIT_REACHED" | "SPOT_ROUND_NOT_FOUND" | "INVALID_STATE",
  message: string,
): AdmissionTransitionResult {
  return { ok: false, state, error: { code, message } };
}

export function isActiveClearingInterest(status: ClearingInterestStatus) {
  return ACTIVE_INTEREST_STATUSES.includes(status);
}

export function getClearingCandidate(state: AdmissionSimulationState, candidateId: string) {
  return state.clearing.candidates.find((candidate) => candidate.candidateId === candidateId);
}

export function getCandidateClearingInterest(
  state: AdmissionSimulationState,
  candidateId: string,
  roundId: string,
) {
  return getClearingCandidate(state, candidateId)?.interests.find(
    (interest) => interest.roundId === roundId,
  );
}

export function getActiveClearingInterestCount(
  state: AdmissionSimulationState,
  candidateId = state.candidateId,
) {
  return getClearingCandidate(state, candidateId)?.interests.filter((interest) =>
    isActiveClearingInterest(interest.status)).length ?? 0;
}

export function buildMeritList(
  roundId: string,
  state: AdmissionSimulationState,
): MeritListEntry[] {
  return state.clearing.candidates
    .flatMap((candidate) => {
      const interest = candidate.interests.find((item) => item.roundId === roundId);
      if (!interest || !isActiveClearingInterest(interest.status)) return [];
      if (candidate.status === "INACTIVE" || candidate.status === "ADMITTED") return [];
      return [{ candidate, interest }];
    })
    .sort((left, right) =>
      left.candidate.meritRank - right.candidate.meritRank ||
      left.candidate.candidateId.localeCompare(right.candidate.candidateId))
    .map(({ candidate, interest }, index) => ({
      candidateId: candidate.candidateId,
      displayLabel: candidate.displayLabel,
      meritRank: candidate.meritRank,
      position: index + 1,
      status: interest.status,
      isDemoCandidate: candidate.candidateId === state.candidateId,
    }));
}

export function getCandidateMeritPosition(
  state: AdmissionSimulationState,
  roundId: string,
  candidateId = state.candidateId,
) {
  return buildMeritList(roundId, state).find((entry) => entry.candidateId === candidateId) ?? null;
}

export function getRoundAwaitingOffers(state: AdmissionSimulationState, roundId: string) {
  return state.clearing.offers.filter(
    (offer) => offer.roundId === roundId && offer.status === "AWAITING_DECISION",
  );
}

function movementsBetween(
  roundId: string,
  before: MeritListEntry[],
  after: MeritListEntry[],
): ClearingQueueMovement[] {
  return after.flatMap((entry) => {
    const previous = before.find((item) => item.candidateId === entry.candidateId);
    if (!previous || previous.position === entry.position) return [];
    return [{
      roundId,
      candidateId: entry.candidateId,
      displayLabel: entry.displayLabel,
      fromPosition: previous.position,
      toPosition: entry.position,
    }];
  });
}

function setInterestStatus(
  candidates: CandidateClearingProfile[],
  candidateId: string,
  roundId: string,
  status: ClearingInterestStatus,
) {
  return candidates.map((candidate) => candidate.candidateId === candidateId
    ? {
        ...candidate,
        interests: candidate.interests.map((interest) => interest.roundId === roundId
          ? { ...interest, status }
          : interest),
      }
    : candidate);
}

function generateOffersInternal(
  state: AdmissionSimulationState,
  roundId: string,
  occurredAt: string,
  maximumNewOffers = Number.POSITIVE_INFINITY,
  preferredSeatId?: string,
) {
  const round = state.spotRounds.find((item) => item.id === roundId);
  if (!round) return { state, generated: [] as ClearingOffer[] };

  const next = cloneState(state);
  const candidateWithPendingOffer = new Set(
    next.clearing.offers
      .filter((offer) => offer.status === "AWAITING_DECISION")
      .map((offer) => offer.candidateId),
  );
  const candidates = buildMeritList(roundId, next).filter(
    (entry) => !candidateWithPendingOffer.has(entry.candidateId),
  );
  const availableSeats = next.seats
    .filter((seat) => round.seatIds.includes(seat.id) && seat.lifecycleState === "AVAILABLE")
    .sort((left, right) => {
      if (left.id === preferredSeatId) return -1;
      if (right.id === preferredSeatId) return 1;
      return left.id.localeCompare(right.id);
    });
  const allocationCount = Math.min(availableSeats.length, candidates.length, maximumNewOffers);
  const generated: ClearingOffer[] = [];

  for (let index = 0; index < allocationCount; index += 1) {
    const seat = availableSeats[index];
    const candidate = candidates[index];
    const offer: ClearingOffer = {
      id: `CLEARING-OFFER-${roundId}-${seat.id}-${candidate.candidateId}`,
      roundId,
      candidateId: candidate.candidateId,
      seatId: seat.id,
      status: "AWAITING_DECISION",
      offeredAt: occurredAt,
      remainingSeconds: 600,
    };
    generated.push(offer);
    next.seats = next.seats.map((item) => item.id === seat.id
      ? { ...item, lifecycleState: "OFFERED", heldByCandidateId: candidate.candidateId }
      : item);
    next.clearing.candidates = setInterestStatus(
      next.clearing.candidates,
      candidate.candidateId,
      roundId,
      "OFFERED",
    );
    next.clearing.events.push({
      id: `CLEARING-EVENT-OFFER-${offer.id}`,
      type: "OFFER_GENERATED",
      occurredAt,
      title: candidate.isDemoCandidate ? "VIT seat offer ready" : "Next eligible candidate offered a seat",
      description: candidate.isDemoCandidate
        ? "An exact synthetic VIT Computer Engineering seat is reserved for your decision."
        : `${candidate.displayLabel} advanced by merit order and received an exact synthetic seat offer.`,
      technicalDetail: `Seat ${seat.id} changed AVAILABLE → OFFERED for merit rank ${candidate.meritRank}.`,
      roundId,
      candidateId: candidate.candidateId,
      seatId: seat.id,
    });
  }

  next.clearing.offers.push(...generated);
  next.updatedAt = occurredAt;
  return { state: next, generated };
}

export function generateClearingOffers(
  state: AdmissionSimulationState,
  roundId: string,
  occurredAt: string,
): AdmissionTransitionResult {
  if (!state.spotRounds.some((round) => round.id === roundId)) {
    return failure(state, "SPOT_ROUND_NOT_FOUND", "The selected merit round could not be found.");
  }
  const next = generateOffersInternal(state, roundId, occurredAt).state;
  return isMeritClearingStateValid(next)
    ? { ok: true, state: next }
    : failure(state, "INVALID_STATE", "Generating offers would violate clearing invariants.");
}

export function advanceHeroClearingScenario(
  state: AdmissionSimulationState,
): AdmissionTransitionResult {
  if (state.clearing.heroScenario.status !== "READY") {
    return failure(state, "CLEARING_INTEREST_NOT_ACTIVE", "The deterministic VIT offer event has already run.");
  }
  let next = cloneState(state);
  const before = buildMeritList(V2_HERO_OFFER_ROUND_ID, next);
  for (const candidateId of ["candidate-1014", "candidate-1077"]) {
    next.clearing.candidates = setInterestStatus(
      next.clearing.candidates,
      candidateId,
      V2_HERO_OFFER_ROUND_ID,
      "WITHDRAWN",
    );
  }
  const after = buildMeritList(V2_HERO_OFFER_ROUND_ID, next);
  const movements = movementsBetween(V2_HERO_OFFER_ROUND_ID, before, after);
  next.clearing.events.push({
    id: "CLEARING-EVENT-VIT-PRIOR-CANDIDATES-CLOSED",
    type: "MERIT_LIST_RECOMPUTED",
    occurredAt: demoSimulationTimestamps.triggerClearingOffer,
    title: "VIT merit list recomputed",
    description: "Two higher-ranked candidates confirmed other choices, so the remaining queue moved forward.",
    technicalDetail: "The VIT list was rebuilt from active interests and global synthetic merit rank.",
    roundId: V2_HERO_OFFER_ROUND_ID,
    movements,
  });
  const allocation = generateOffersInternal(
    next,
    V2_HERO_OFFER_ROUND_ID,
    demoSimulationTimestamps.triggerClearingOffer,
  );
  next = allocation.state;
  next.clearing.heroScenario.status = "OFFER_READY";
  return isMeritClearingStateValid(next)
    ? { ok: true, state: next }
    : failure(state, "INVALID_STATE", "The deterministic VIT event would violate clearing invariants.");
}

export function joinClearingRound(
  state: AdmissionSimulationState,
  roundId: string,
  candidateId = state.candidateId,
): AdmissionTransitionResult {
  const round = state.spotRounds.find((item) => item.id === roundId);
  if (!round || round.status === "COMPLETED") {
    return failure(state, "SPOT_ROUND_NOT_FOUND", "This programme round is not open for interest.");
  }
  const candidate = getClearingCandidate(state, candidateId);
  if (!candidate) return failure(state, "CLEARING_CANDIDATE_NOT_FOUND", "The clearing candidate could not be found.");
  if (candidate.status === "ADMITTED") {
    return failure(state, "CLEARING_INTEREST_NOT_ACTIVE", "An admitted candidate cannot join another active list.");
  }
  if (getActiveClearingInterestCount(state, candidateId) >= MAX_ACTIVE_SPOT_INTERESTS) {
    return failure(state, "SPOT_ROUND_LIMIT_REACHED", "Leave one active interest before joining another.");
  }
  const next = cloneState(state);
  const existing = getCandidateClearingInterest(next, candidateId, roundId);
  next.clearing.candidates = next.clearing.candidates.map((item) => item.candidateId === candidateId
    ? {
        ...item,
        interests: existing
          ? item.interests.map((interest) => interest.roundId === roundId
              ? { ...interest, status: "WAITING", joinedAt: demoSimulationTimestamps.joinClearingRound }
              : interest)
          : [...item.interests, { roundId, status: "WAITING", joinedAt: demoSimulationTimestamps.joinClearingRound }],
      }
    : item);
  next.clearing.events.push({
    id: `CLEARING-EVENT-JOIN-${candidateId}-${roundId}`,
    type: "INTEREST_JOINED",
    occurredAt: demoSimulationTimestamps.joinClearingRound,
    title: "Programme interest joined",
    description: "Your position was calculated from the shared synthetic merit list.",
    technicalDetail: `${candidateId} joined ${roundId}; the list was deterministically recomputed.`,
    roundId,
    candidateId,
  });
  next.updatedAt = demoSimulationTimestamps.joinClearingRound;
  return isMeritClearingStateValid(next)
    ? { ok: true, state: next }
    : failure(state, "INVALID_STATE", "Joining would violate clearing invariants.");
}

export function leaveClearingRound(
  state: AdmissionSimulationState,
  roundId: string,
  candidateId = state.candidateId,
): AdmissionTransitionResult {
  const interest = getCandidateClearingInterest(state, candidateId, roundId);
  if (!interest || !isActiveClearingInterest(interest.status)) {
    return failure(state, "CLEARING_INTEREST_NOT_ACTIVE", "The candidate is not active in this merit list.");
  }
  if (interest.status === "OFFERED") {
    return failure(state, "CLEARING_INTEREST_NOT_ACTIVE", "Decide the pending offer before leaving this list.");
  }
  const before = buildMeritList(roundId, state);
  const next = cloneState(state);
  next.clearing.candidates = setInterestStatus(next.clearing.candidates, candidateId, roundId, "WITHDRAWN");
  const movements = movementsBetween(roundId, before, buildMeritList(roundId, next));
  next.clearing.events.push({
    id: `CLEARING-EVENT-LEAVE-${candidateId}-${roundId}`,
    type: "INTEREST_WITHDRAWN",
    occurredAt: demoSimulationTimestamps.leaveClearingRound,
    title: "Programme interest withdrawn",
    description: "The merit list updated immediately for every candidate below this position.",
    technicalDetail: `${candidateId} was removed from ${roundId}; ${movements.length} queue positions changed.`,
    roundId,
    candidateId,
    movements,
  });
  next.updatedAt = demoSimulationTimestamps.leaveClearingRound;
  return isMeritClearingStateValid(next)
    ? { ok: true, state: next }
    : failure(state, "INVALID_STATE", "Leaving would violate clearing invariants.");
}

export function declineClearingOffer(
  state: AdmissionSimulationState,
  offerId: string,
): AdmissionTransitionResult {
  const offer = state.clearing.offers.find(
    (item) => item.id === offerId && item.status === "AWAITING_DECISION",
  );
  if (!offer) return failure(state, "CLEARING_OFFER_NOT_FOUND", "There is no pending clearing offer to decline.");
  let next = cloneState(state);
  next.clearing.offers = next.clearing.offers.map((item) => item.id === offerId
    ? { ...item, status: "DECLINED" }
    : item);
  next.seats = next.seats.map((seat) => seat.id === offer.seatId
    ? { ...seat, lifecycleState: "AVAILABLE", heldByCandidateId: null }
    : seat);
  next.clearing.candidates = setInterestStatus(
    next.clearing.candidates,
    offer.candidateId,
    offer.roundId,
    "DECLINED",
  );
  next.clearing.events.push({
    id: `CLEARING-EVENT-DECLINE-${offer.id}`,
    type: "OFFER_DECLINED",
    occurredAt: demoSimulationTimestamps.declineClearingOffer,
    title: "Seat offer declined",
    description: "The exact seat returned to the round and the next eligible candidate advanced.",
    technicalDetail: `Seat ${offer.seatId} changed OFFERED → AVAILABLE before merit allocation reran.`,
    roundId: offer.roundId,
    candidateId: offer.candidateId,
    seatId: offer.seatId,
  });
  next = generateOffersInternal(
    next,
    offer.roundId,
    demoSimulationTimestamps.declineClearingOffer,
    1,
    offer.seatId,
  ).state;
  return isMeritClearingStateValid(next)
    ? { ok: true, state: next }
    : failure(state, "INVALID_STATE", "Declining would violate clearing invariants.");
}

export function acceptClearingOffer(
  state: AdmissionSimulationState,
  offerId: string,
): AdmissionTransitionResult {
  const offer = state.clearing.offers.find(
    (item) => item.id === offerId && item.status === "AWAITING_DECISION",
  );
  if (!offer) return failure(state, "CLEARING_OFFER_NOT_FOUND", "There is no pending clearing offer to accept.");
  const candidate = getClearingCandidate(state, offer.candidateId);
  const targetSeat = state.seats.find((seat) => seat.id === offer.seatId);
  if (!candidate || !targetSeat || targetSeat.lifecycleState !== "OFFERED" || targetSeat.heldByCandidateId !== candidate.candidateId) {
    return failure(state, "INVALID_STATE", "The offer and exact seat state no longer agree.");
  }

  const competingRoundIds = candidate.interests
    .filter((interest) => interest.roundId !== offer.roundId && isActiveClearingInterest(interest.status))
    .map((interest) => interest.roundId);
  const beforeLists = new Map(
    competingRoundIds.map((roundId) => [roundId, buildMeritList(roundId, state)]),
  );
  let next = cloneState(state);

  const previousSeatId = candidate.activeAdmissionSeatId;
  const previousSeat = previousSeatId
    ? next.seats.find((seat) => seat.id === previousSeatId)
    : undefined;
  const previousProgramId = previousSeat?.programId ?? "";
  const availabilityBefore = previousSeat
    ? getProgrammeVacancies(next, previousSeat.programId)
    : 0;

  if (previousSeat && previousSeat.heldByCandidateId === candidate.candidateId && ["HELD", "ACCEPTED"].includes(previousSeat.lifecycleState)) {
    next.seats = next.seats.map((seat) => seat.id === previousSeat.id
      ? { ...seat, lifecycleState: "AVAILABLE", heldByCandidateId: null }
      : seat);
  }
  const availabilityAfterRelease = previousSeat
    ? getProgrammeVacancies(next, previousSeat.programId)
    : availabilityBefore;

  next.clearing.offers = next.clearing.offers.map((item) => {
    if (item.id === offer.id) return { ...item, status: "ACCEPTED" };
    if (item.candidateId === candidate.candidateId && item.status === "AWAITING_DECISION") {
      next.seats = next.seats.map((seat) => seat.id === item.seatId
        ? { ...seat, lifecycleState: "AVAILABLE", heldByCandidateId: null }
        : seat);
      return { ...item, status: "WITHDRAWN" };
    }
    return item;
  });
  next.seats = next.seats.map((seat) => seat.id === offer.seatId
    ? { ...seat, lifecycleState: "ACCEPTED", heldByCandidateId: candidate.candidateId }
    : seat);
  next.clearing.candidates = next.clearing.candidates.map((item) => item.candidateId === candidate.candidateId
    ? {
        ...item,
        status: "ADMITTED",
        activeAdmissionSeatId: offer.seatId,
        interests: item.interests.map((interest) => interest.roundId === offer.roundId
          ? { ...interest, status: "ACCEPTED" }
          : isActiveClearingInterest(interest.status)
            ? { ...interest, status: "CLOSED_AFTER_ACCEPTANCE" }
            : interest),
      }
    : item);

  if (candidate.candidateId === next.candidateId) {
    next.currentAdmission = {
      id: `DEMO-ADMISSION-${offer.seatId}`,
      kind: "PARTICIPATING_SEAT",
      candidateId: next.candidateId,
      seatId: offer.seatId,
      programId: targetSeat.programId,
      source: "SPOT_ROUND",
      allotmentRound: "V2 synchronized merit clearing",
      status: "CONFIRMED",
      bettermentStatus: "CLOSED",
      confirmedAt: demoSimulationTimestamps.acceptClearingOffer,
    };
  }

  const movements = competingRoundIds.flatMap((roundId) =>
    movementsBetween(roundId, beforeLists.get(roundId) ?? [], buildMeritList(roundId, next)));
  const clearingEvents: ClearingEvent[] = [{
    id: `CLEARING-EVENT-ACCEPT-${offer.id}`,
    type: "OFFER_ACCEPTED",
    occurredAt: demoSimulationTimestamps.acceptClearingOffer,
    title: "VIT Computer Engineering accepted",
    description: "The offered seat became Aarya's single current participating admission.",
    technicalDetail: `Seat ${offer.seatId} changed OFFERED → ACCEPTED for ${candidate.candidateId}.`,
    roundId: offer.roundId,
    candidateId: candidate.candidateId,
    seatId: offer.seatId,
  }];
  if (previousSeat) clearingEvents.push({
    id: `CLEARING-EVENT-RELEASE-${previousSeat.id}`,
    type: "PREVIOUS_SEAT_RELEASED",
    occurredAt: demoSimulationTimestamps.acceptClearingOffer,
    title: "Previous AISSMS seat released",
    description: `The programme's available count changed ${availabilityBefore} → ${availabilityAfterRelease}.`,
    technicalDetail: `Seat ${previousSeat.id} changed ${previousSeat.lifecycleState} → AVAILABLE exactly once.`,
    candidateId: candidate.candidateId,
    seatId: previousSeat.id,
  });
  clearingEvents.push({
    id: `CLEARING-EVENT-CLOSE-${candidate.candidateId}`,
    type: "COMPETING_LISTS_CLOSED",
    occurredAt: demoSimulationTimestamps.acceptClearingOffer,
    title: "Competing merit-list interests closed",
    description: `${competingRoundIds.length} other active programme lists were closed automatically.`,
    technicalDetail: `Closed round IDs: ${competingRoundIds.join(", ")}.`,
    candidateId: candidate.candidateId,
  });
  for (const roundId of competingRoundIds) {
    const roundMovements = movements.filter((movement) => movement.roundId === roundId);
    clearingEvents.push({
      id: `CLEARING-EVENT-RECOMPUTE-${roundId}-${candidate.candidateId}`,
      type: "MERIT_LIST_RECOMPUTED",
      occurredAt: demoSimulationTimestamps.acceptClearingOffer,
      title: "Merit list recomputed",
      description: `${roundMovements.length} candidate position${roundMovements.length === 1 ? "" : "s"} moved after Aarya left the list.`,
      technicalDetail: `${roundId} remained sorted by rank and deterministic candidate-ID tie-break.`,
      roundId,
      candidateId: candidate.candidateId,
      movements: roundMovements,
    });
  }
  next.clearing.events.push(...clearingEvents);

  next.events.push({
    id: `EVENT-CLEARING-ACCEPT-${offer.seatId}`,
    type: "SEAT_ACCEPTED",
    occurredAt: demoSimulationTimestamps.acceptClearingOffer,
    title: "V2 merit-clearing seat accepted",
    description: "VIT Computer Engineering became Aarya's current admission through synchronized merit clearing.",
    seatId: offer.seatId,
    programId: targetSeat.programId,
  });
  if (previousSeat) {
    next.events.push({
      id: `EVENT-CLEARING-RELEASE-${previousSeat.id}`,
      type: "SEAT_RELEASED",
      occurredAt: demoSimulationTimestamps.acceptClearingOffer,
      title: "Previous seat returned to the clearing network",
      description: "Aarya's AISSMS Computer Engineering seat became available for the next eligible candidate.",
      seatId: previousSeat.id,
      programId: previousSeat.programId,
      availabilityBefore,
      availabilityAfter: availabilityAfterRelease,
    });
    next.lastFeedback = {
      kind: "SEAT_RELEASED",
      occurredAt: demoSimulationTimestamps.acceptClearingOffer,
      seatId: previousSeat.id,
      programId: previousSeat.programId,
      availabilityBefore,
      availabilityAfter: availabilityAfterRelease,
      title: "Previous seat released through synchronized clearing",
    };
  }

  const generatedOfferIds: string[] = [];
  if (previousSeat) {
    const releasedRound = next.spotRounds.find((round) =>
      round.id === AISSMS_CLEARING_ROUND_ID && round.programId === previousSeat.programId);
    if (releasedRound) {
      const allocation = generateOffersInternal(
        next,
        releasedRound.id,
        demoSimulationTimestamps.acceptClearingOffer,
        1,
        previousSeat.id,
      );
      next = allocation.state;
      generatedOfferIds.push(...allocation.generated.map((item) => item.id));
    }
  }

  next.clearing.heroScenario.status = "ACCEPTED";
  next.clearing.lastOutcome = {
    offerId: offer.id,
    roundId: offer.roundId,
    seatId: offer.seatId,
    previousSeatId: previousSeat?.id ?? "",
    previousProgramId,
    previousAvailabilityBefore: availabilityBefore,
    previousAvailabilityAfterRelease: availabilityAfterRelease,
    previousAvailabilityCurrent: previousSeat ? getProgrammeVacancies(next, previousSeat.programId) : availabilityAfterRelease,
    closedRoundIds: competingRoundIds,
    movements,
    generatedOfferIds,
    occurredAt: demoSimulationTimestamps.acceptClearingOffer,
  };
  next.updatedAt = demoSimulationTimestamps.acceptClearingOffer;

  return isMeritClearingStateValid(next)
    ? { ok: true, state: next }
    : failure(state, "INVALID_STATE", "Accepting the offer would violate clearing invariants.");
}

export function isMeritClearingStateValid(state: AdmissionSimulationState) {
  if (state.version !== 4 || state.clearing.version !== 1) return false;
  const roundIds = new Set(state.spotRounds.map((round) => round.id));
  const candidateIds = new Set<string>();
  for (const candidate of state.clearing.candidates) {
    if (!candidate.candidateId || candidateIds.has(candidate.candidateId) || candidate.meritRank < 1) return false;
    candidateIds.add(candidate.candidateId);
    const interestRoundIds = new Set<string>();
    let activeInterests = 0;
    for (const interest of candidate.interests) {
      if (!roundIds.has(interest.roundId) || interestRoundIds.has(interest.roundId)) return false;
      interestRoundIds.add(interest.roundId);
      if (isActiveClearingInterest(interest.status)) activeInterests += 1;
    }
    if (activeInterests > MAX_ACTIVE_SPOT_INTERESTS) return false;
    if (candidate.status === "ADMITTED" && candidate.interests.some((interest) => isActiveClearingInterest(interest.status))) return false;
  }

  const offerIds = new Set<string>();
  const awaitingSeatIds = new Set<string>();
  for (const offer of state.clearing.offers) {
    if (offerIds.has(offer.id) || !candidateIds.has(offer.candidateId) || !roundIds.has(offer.roundId)) return false;
    offerIds.add(offer.id);
    if (offer.status === "AWAITING_DECISION") {
      if (awaitingSeatIds.has(offer.seatId)) return false;
      awaitingSeatIds.add(offer.seatId);
      const seat = state.seats.find((item) => item.id === offer.seatId);
      const interest = getCandidateClearingInterest(state, offer.candidateId, offer.roundId);
      if (!seat || seat.lifecycleState !== "OFFERED" || seat.heldByCandidateId !== offer.candidateId) return false;
      if (interest?.status !== "OFFERED") return false;
    }
  }

  const ownership = new Map<string, number>();
  for (const seat of state.seats) {
    if (seat.lifecycleState === "AVAILABLE" && seat.heldByCandidateId !== null) return false;
    if (["HELD", "ACCEPTED"].includes(seat.lifecycleState) && seat.heldByCandidateId) {
      ownership.set(seat.heldByCandidateId, (ownership.get(seat.heldByCandidateId) ?? 0) + 1);
    }
  }
  if ([...ownership.values()].some((count) => count > 1)) return false;

  for (const roundId of roundIds) {
    const list = buildMeritList(roundId, state);
    const listed = new Set(list.map((entry) => entry.candidateId));
    if (listed.size !== list.length) return false;
    for (let index = 1; index < list.length; index += 1) {
      const previous = list[index - 1];
      const current = list[index];
      if (previous.meritRank > current.meritRank) return false;
      if (previous.meritRank === current.meritRank && previous.candidateId.localeCompare(current.candidateId) > 0) return false;
    }
  }
  return true;
}
