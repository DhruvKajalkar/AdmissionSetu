import type {
  AdmissionSimulationEvent,
  AdmissionSimulationState,
  AdmissionTransitionErrorCode,
  AdmissionTransitionResult,
  SimulationCurrentAdmission,
} from "@/types";
import { cloneDocumentPassportState, isDocumentPassportStateValid } from "./document-passport.ts";

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
    documentPassport: cloneDocumentPassportState(state.documentPassport),
  };
}

function failure(
  state: AdmissionSimulationState,
  code: AdmissionTransitionErrorCode,
  message: string,
): AdmissionTransitionResult {
  return { ok: false, state, error: { code, message } };
}

export function getProgrammeVacancies(state: AdmissionSimulationState, programId: string) {
  return state.seats.filter(
    (seat) => seat.programId === programId && seat.lifecycleState === "AVAILABLE",
  ).length;
}

export function getCandidateCurrentAdmission(
  state: AdmissionSimulationState,
  candidateId: string,
): SimulationCurrentAdmission | null {
  return state.candidateId === candidateId ? state.currentAdmission : null;
}

export function getAdmissionEvents(state: AdmissionSimulationState) {
  return [...state.events].reverse();
}

export function isAdmissionSimulationStateValid(state: AdmissionSimulationState) {
  if (state.version !== 4 || !state.candidateId || !Array.isArray(state.seats)) return false;
  if (!Array.isArray(state.events) || !Array.isArray(state.externalAdmissions)) return false;
  if (!Array.isArray(state.spotRounds)) return false;
  if (
    !state.clearing ||
    state.clearing.version !== 1 ||
    !Array.isArray(state.clearing.candidates) ||
    !Array.isArray(state.clearing.offers) ||
    !Array.isArray(state.clearing.events)
  ) return false;
  if (!isDocumentPassportStateValid(state)) return false;

  const seatIds = new Set<string>();
  for (const seat of state.seats) {
    if (!seat.id || !seat.programId || seatIds.has(seat.id)) return false;
    seatIds.add(seat.id);
    if (seat.lifecycleState === "AVAILABLE" && seat.heldByCandidateId !== null) return false;
    if (
      ["HELD", "OFFERED", "ACCEPTED"].includes(seat.lifecycleState) &&
      seat.heldByCandidateId === null
    ) {
      return false;
    }
  }

  const candidateSeats = state.seats.filter(
    (seat) =>
      seat.heldByCandidateId === state.candidateId &&
      ["HELD", "ACCEPTED"].includes(seat.lifecycleState),
  );
  if (candidateSeats.length > 1) return false;

  const activeInterestStates = ["REGISTERED", "WAITING", "ELIGIBLE", "OFFERED"];
  let activeInterests = 0;
  const referencedRoundSeats = new Set<string>();
  for (const round of state.spotRounds) {
    if (!round.id || !round.candidateParticipantId || !Array.isArray(round.participants)) return false;
    if (!round.participants.some((participant) => participant.id === round.candidateParticipantId && participant.isDemoCandidate)) return false;
    const candidateParticipant = round.participants.find((participant) => participant.id === round.candidateParticipantId);
    if (candidateParticipant && activeInterestStates.includes(candidateParticipant.status)) activeInterests += 1;
    for (const seatId of round.seatIds) {
      if (!seatIds.has(seatId) || referencedRoundSeats.has(seatId)) return false;
      referencedRoundSeats.add(seatId);
    }
    if (round.offer?.status === "AWAITING_DECISION") {
      const offeredSeat = state.seats.find((seat) => seat.id === round.offer?.seatId);
      if (!offeredSeat || offeredSeat.lifecycleState !== "OFFERED" || offeredSeat.heldByCandidateId !== state.candidateId) return false;
      if (candidateParticipant?.status !== "OFFERED") return false;
    }
  }
  if (activeInterests > 5) return false;

  if (state.currentAdmission?.kind === "PARTICIPATING_SEAT") {
    return (
      candidateSeats.length === 1 &&
      candidateSeats[0].id === state.currentAdmission.seatId &&
      candidateSeats[0].programId === state.currentAdmission.programId
    );
  }

  return candidateSeats.length === 0;
}

export function sanitizeAdmissionSimulationState(
  value: unknown,
  initialState: AdmissionSimulationState,
) {
  if (!value || typeof value !== "object") return cloneState(initialState);
  const candidate = value as AdmissionSimulationState;
  const expectedSeatIds = initialState.seats.map((seat) => seat.id).sort().join("|");
  const expectedRoundIds = initialState.spotRounds.map((round) => round.id).sort().join("|");
  const expectedClearingCandidateIds = initialState.clearing.candidates.map((candidate) => candidate.candidateId).sort().join("|");
  const expectedDocumentIds = initialState.documentPassport.records.map((record) => record.id).sort().join("|");
  const candidateSeatIds = Array.isArray(candidate.seats)
    ? candidate.seats.map((seat) => seat?.id).sort().join("|")
    : "";
  const candidateRoundIds = Array.isArray(candidate.spotRounds)
    ? candidate.spotRounds.map((round) => round?.id).sort().join("|")
    : "";
  const candidateClearingIds = Array.isArray(candidate.clearing?.candidates)
    ? candidate.clearing.candidates.map((item) => item?.candidateId).sort().join("|")
    : "";
  const candidateDocumentIds = Array.isArray(candidate.documentPassport?.records)
    ? candidate.documentPassport.records.map((record) => record?.id).sort().join("|")
    : "";
  if (
    candidate.version !== 4 ||
    candidate.candidateId !== initialState.candidateId ||
    expectedSeatIds !== candidateSeatIds ||
    expectedRoundIds !== candidateRoundIds ||
    expectedClearingCandidateIds !== candidateClearingIds ||
    expectedDocumentIds !== candidateDocumentIds ||
    !isAdmissionSimulationStateValid(candidate)
  ) {
    return cloneState(initialState);
  }
  return cloneState(candidate);
}

export function offerSeat(
  state: AdmissionSimulationState,
  seatId: string,
  candidateId: string,
  occurredAt: string,
): AdmissionTransitionResult {
  const target = state.seats.find((seat) => seat.id === seatId);
  if (!target) return failure(state, "SEAT_NOT_FOUND", "The requested seat could not be found.");
  if (target.lifecycleState !== "AVAILABLE") {
    return failure(state, "SEAT_UNAVAILABLE", "Only an available synthetic seat can be offered.");
  }
  const next = cloneState(state);
  next.seats = next.seats.map((seat) => seat.id === seatId
    ? { ...seat, lifecycleState: "OFFERED", heldByCandidateId: candidateId }
    : seat);
  next.events = [...next.events, {
    id: `EVENT-OFFER-${seatId}-${occurredAt}`,
    type: "SEAT_OFFERED",
    occurredAt,
    title: "Synthetic spot-round seat offered",
    description: "The exact seat is temporarily reserved while Aarya makes the demo decision.",
    seatId,
    programId: target.programId,
  }];
  next.updatedAt = occurredAt;
  return isAdmissionSimulationStateValid(next)
    ? { ok: true, state: next }
    : failure(state, "INVALID_STATE", "The seat offer would violate the simulation invariants.");
}

export function returnOfferedSeat(
  state: AdmissionSimulationState,
  seatId: string,
  candidateId: string,
  occurredAt: string,
): AdmissionTransitionResult {
  const target = state.seats.find((seat) => seat.id === seatId);
  if (!target) return failure(state, "SEAT_NOT_FOUND", "The offered seat could not be found.");
  if (target.lifecycleState !== "OFFERED" || target.heldByCandidateId !== candidateId) {
    return failure(state, "SPOT_OFFER_UNAVAILABLE", "There is no active offer for this seat.");
  }
  const availabilityBefore = getProgrammeVacancies(state, target.programId);
  const next = cloneState(state);
  next.seats = next.seats.map((seat) => seat.id === seatId
    ? { ...seat, lifecycleState: "AVAILABLE", heldByCandidateId: null }
    : seat);
  const availabilityAfter = getProgrammeVacancies(next, target.programId);
  next.events = [...next.events, {
    id: `EVENT-OFFER-RETURN-${seatId}-${occurredAt}`,
    type: "SEAT_OFFER_RETURNED",
    occurredAt,
    title: "Spot-round offer returned",
    description: "The offered synthetic seat returned to the live round for the next eligible participant.",
    seatId,
    programId: target.programId,
    availabilityBefore,
    availabilityAfter,
  }];
  next.updatedAt = occurredAt;
  return { ok: true, state: next };
}

function releaseOwnedSeat(
  state: AdmissionSimulationState,
  seatId: string,
  candidateId: string,
  occurredAt: string,
  description: string,
): AdmissionTransitionResult {
  const seat = state.seats.find((item) => item.id === seatId);
  if (!seat) return failure(state, "SEAT_NOT_FOUND", "The participating seat could not be found.");
  if (seat.lifecycleState === "AVAILABLE") {
    return failure(state, "SEAT_ALREADY_AVAILABLE", "This seat is already available.");
  }
  if (seat.heldByCandidateId !== candidateId) {
    return failure(
      state,
      "SEAT_HELD_BY_ANOTHER_CANDIDATE",
      "This seat is held by another synthetic candidate.",
    );
  }

  const availabilityBefore = getProgrammeVacancies(state, seat.programId);
  const next = cloneState(state);
  next.seats = next.seats.map((item) =>
    item.id === seatId
      ? { ...item, lifecycleState: "AVAILABLE", heldByCandidateId: null }
      : item,
  );
  if (
    next.currentAdmission?.kind === "PARTICIPATING_SEAT" &&
    next.currentAdmission.seatId === seatId
  ) {
    next.currentAdmission = null;
  }
  const availabilityAfter = getProgrammeVacancies(next, seat.programId);
  const event: AdmissionSimulationEvent = {
    id: `EVENT-RELEASE-${seatId}-${occurredAt}`,
    type: "SEAT_RELEASED",
    occurredAt,
    title: "Seat returned to the vacancy pool",
    description,
    seatId,
    programId: seat.programId,
    availabilityBefore,
    availabilityAfter,
  };
  next.events = [...next.events, event];
  next.lastFeedback = {
    kind: "SEAT_RELEASED",
    occurredAt,
    seatId,
    programId: seat.programId,
    availabilityBefore,
    availabilityAfter,
    title: "Seat released successfully",
  };
  next.updatedAt = occurredAt;
  return isAdmissionSimulationStateValid(next)
    ? { ok: true, state: next }
    : failure(state, "INVALID_STATE", "The seat transition would violate the simulation invariants.");
}

export function releaseSeat(
  state: AdmissionSimulationState,
  seatId: string,
  candidateId: string,
  occurredAt: string,
): AdmissionTransitionResult {
  return releaseOwnedSeat(
    state,
    seatId,
    candidateId,
    occurredAt,
    "The participating seat was released and became available in the demo vacancy exchange.",
  );
}

export function withdrawCurrentAdmission(
  state: AdmissionSimulationState,
  occurredAt: string,
): AdmissionTransitionResult {
  const current = state.currentAdmission;
  if (!current) {
    return failure(state, "NO_CURRENT_ADMISSION", "Aarya does not currently hold an admission.");
  }

  if (current.kind === "CONNECTED_ADMISSION") {
    const next = cloneState(state);
    next.currentAdmission = null;
    next.lastFeedback = null;
    next.updatedAt = occurredAt;
    next.events = [
      ...next.events,
      {
        id: `EVENT-WITHDRAW-${current.id}-${occurredAt}`,
        type: "ADMISSION_WITHDRAWN",
        occurredAt,
        title: "Connected demo admission withdrawn",
        description: `${current.institutionName} — ${current.programName} is no longer Aarya's current admission.`,
      },
    ];
    return { ok: true, state: next };
  }

  const released = releaseOwnedSeat(
    state,
    current.seatId,
    state.candidateId,
    occurredAt,
    "Aarya withdrew her current AISSMS admission. The exact synthetic seat is now available.",
  );
  if (!released.ok) return released;
  const next = released.state;
  next.events = [
    ...next.events,
    {
      id: `EVENT-WITHDRAW-${current.id}-${occurredAt}`,
      type: "ADMISSION_WITHDRAWN",
      occurredAt,
      title: "Current admission withdrawn",
      description: "Aarya no longer holds the participating CAP admission in this demo.",
      seatId: current.seatId,
      programId: current.programId,
    },
  ];
  return { ok: true, state: next };
}

export function confirmExternalAdmission(
  state: AdmissionSimulationState,
  externalAdmissionId: string,
  occurredAt: string,
): AdmissionTransitionResult {
  const external = state.externalAdmissions.find((item) => item.id === externalAdmissionId);
  if (!external || external.status !== "READY") {
    return failure(
      state,
      "CONNECTED_ADMISSION_NOT_READY",
      "The connected demo admission is not available for confirmation.",
    );
  }

  let working = cloneState(state);
  if (working.currentAdmission?.kind === "PARTICIPATING_SEAT") {
    const released = releaseOwnedSeat(
      working,
      working.currentAdmission.seatId,
      state.candidateId,
      occurredAt,
      "A connected counselling confirmation replaced Aarya's participating CAP admission, so the old synthetic seat returned to the vacancy exchange.",
    );
    if (!released.ok) return released;
    working = released.state;
  }

  working.externalAdmissions = working.externalAdmissions.map((item) =>
    item.id === externalAdmissionId
      ? { ...item, status: "CONFIRMED", confirmedAt: occurredAt }
      : item,
  );
  working.currentAdmission = {
    id: `DEMO-ADMISSION-${externalAdmissionId}`,
    kind: "CONNECTED_ADMISSION",
    candidateId: state.candidateId,
    externalAdmissionId,
    institutionName: external.institutionName,
    programName: external.programName,
    sourceLabel: external.sourceLabel,
    status: "CONFIRMED",
    confirmedAt: occurredAt,
  };
  working.events = [
    ...working.events,
    {
      id: `EVENT-CONNECTED-${externalAdmissionId}-${occurredAt}`,
      type: "CONNECTED_ADMISSION_CONFIRMED",
      occurredAt,
      title: "Connected admission confirmed",
      description: `${external.institutionName} — ${external.programName} became Aarya's single current admission in the demo.`,
    },
  ];
  working.updatedAt = occurredAt;
  return isAdmissionSimulationStateValid(working)
    ? { ok: true, state: working }
    : failure(state, "INVALID_STATE", "The connected transition would violate the simulation invariants.");
}

export function acceptSeat(
  state: AdmissionSimulationState,
  seatId: string,
  occurredAt: string,
  options: {
    source?: "MHT_CET_CAP" | "SPOT_ROUND";
    allotmentRound?: string;
    eventTitle?: string;
    eventDescription?: string;
    consumedSpotRoundId?: string;
  } = {},
): AdmissionTransitionResult {
  const target = state.seats.find((seat) => seat.id === seatId);
  if (!target) return failure(state, "SEAT_NOT_FOUND", "The requested seat could not be found.");
  const availableToCandidate = target.lifecycleState === "AVAILABLE" ||
    (target.lifecycleState === "OFFERED" && target.heldByCandidateId === state.candidateId);
  if (!availableToCandidate) {
    return failure(
      state,
      target.heldByCandidateId && target.heldByCandidateId !== state.candidateId
        ? "SEAT_HELD_BY_ANOTHER_CANDIDATE"
        : "SEAT_UNAVAILABLE",
      "Only an available synthetic seat can be accepted.",
    );
  }

  let working = cloneState(state);
  if (working.currentAdmission?.kind === "PARTICIPATING_SEAT") {
    const released = releaseOwnedSeat(
      working,
      working.currentAdmission.seatId,
      state.candidateId,
      occurredAt,
      "Aarya accepted another participating seat, so her previous seat returned to the vacancy exchange.",
    );
    if (!released.ok) return released;
    working = released.state;
  }

  working.seats = working.seats.map((seat) =>
    seat.id === seatId
      ? { ...seat, lifecycleState: "ACCEPTED", heldByCandidateId: state.candidateId }
      : seat,
  );
  working.currentAdmission = {
    id: `DEMO-ADMISSION-${seatId}`,
    kind: "PARTICIPATING_SEAT",
    candidateId: state.candidateId,
    seatId,
    programId: target.programId,
    source: options.source ?? "MHT_CET_CAP",
    allotmentRound: options.allotmentRound ?? "Demo participating admission",
    status: "CONFIRMED",
    bettermentStatus: "CLOSED",
    confirmedAt: occurredAt,
  };
  working.events = [
    ...working.events,
    {
      id: `EVENT-ACCEPT-${seatId}-${occurredAt}`,
      type: "SEAT_ACCEPTED",
      occurredAt,
      title: options.eventTitle ?? "Participating seat accepted",
      description: options.eventDescription ?? "The available synthetic seat became Aarya's single current participating admission.",
      seatId,
      programId: target.programId,
    },
  ];
  if (options.consumedSpotRoundId) {
    working.spotRounds = working.spotRounds.map((round) => round.id === options.consumedSpotRoundId
      ? {
          ...round,
          participants: round.participants.map((participant) => participant.id === round.candidateParticipantId
            ? { ...participant, status: "ACCEPTED" }
            : participant),
          offer: round.offer ? { ...round.offer, status: "ACCEPTED" } : null,
        }
      : round);
  }
  working.updatedAt = occurredAt;
  return isAdmissionSimulationStateValid(working)
    ? { ok: true, state: working }
    : failure(state, "INVALID_STATE", "Accepting this seat would violate the simulation invariants.");
}

export function resetAdmissionSimulation(initialState: AdmissionSimulationState) {
  return cloneState(initialState);
}
