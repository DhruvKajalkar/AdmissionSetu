import { MAX_ACTIVE_SPOT_INTERESTS, demoSimulationTimestamps } from "../data/admission-simulation.ts";
import type {
  AdmissionSimulationState,
  AdmissionTransitionErrorCode,
  AdmissionTransitionResult,
  ParticipantStatus,
  SpotRound,
} from "@/types";
import {
  acceptSeat,
  getProgrammeVacancies,
  isAdmissionSimulationStateValid,
  offerSeat,
  releaseSeat,
  returnOfferedSeat,
} from "./admission-state.ts";

const ACTIVE_INTEREST_STATES: readonly ParticipantStatus[] = ["REGISTERED", "WAITING", "ELIGIBLE", "OFFERED"];

function failure(
  state: AdmissionSimulationState,
  code: AdmissionTransitionErrorCode,
  message: string,
): AdmissionTransitionResult {
  return { ok: false, state, error: { code, message } };
}

function candidateParticipant(round: SpotRound) {
  return round.participants.find((participant) => participant.id === round.candidateParticipantId);
}

function replaceRound(state: AdmissionSimulationState, round: SpotRound, occurredAt: string) {
  return {
    ...state,
    spotRounds: state.spotRounds.map((item) => item.id === round.id ? round : item),
    updatedAt: occurredAt,
  };
}

function updateParticipant(round: SpotRound, participantId: string, status: ParticipantStatus, joinedAt?: string | null): SpotRound {
  return {
    ...round,
    participants: round.participants.map((participant) => participant.id === participantId
      ? { ...participant, status, joinedAt: joinedAt === undefined ? participant.joinedAt : joinedAt }
      : participant),
  };
}

function appendRoundEvent(
  round: SpotRound,
  event: SpotRound["events"][number],
): SpotRound {
  return { ...round, events: [...round.events, event] };
}

export function isActiveSpotInterest(status: ParticipantStatus) {
  return ACTIVE_INTEREST_STATES.includes(status);
}

export function getActiveSpotInterestCount(state: AdmissionSimulationState) {
  return state.spotRounds.filter((round) => {
    const participant = candidateParticipant(round);
    return participant ? isActiveSpotInterest(participant.status) : false;
  }).length;
}

export function getCandidateSpotStatus(round: SpotRound) {
  return candidateParticipant(round)?.status ?? "WITHDRAWN";
}

export function getSpotRoundAvailableSeats(state: AdmissionSimulationState, roundId: string) {
  const round = state.spotRounds.find((item) => item.id === roundId);
  if (!round) return 0;
  return state.seats.filter((seat) => round.seatIds.includes(seat.id) && seat.lifecycleState === "AVAILABLE").length;
}

export function joinSpotRound(
  state: AdmissionSimulationState,
  roundId: string,
  occurredAt = demoSimulationTimestamps.joinSpotRound,
): AdmissionTransitionResult {
  const round = state.spotRounds.find((item) => item.id === roundId);
  if (!round) return failure(state, "SPOT_ROUND_NOT_FOUND", "The demo spot round could not be found.");
  if (round.status === "COMPLETED" || round.status === "PAUSED") {
    return failure(state, "SPOT_ROUND_NOT_ACTIVE", "This demo spot round is not accepting participation.");
  }
  const participant = candidateParticipant(round);
  if (!participant) return failure(state, "INVALID_STATE", "Aarya's seeded queue entry is missing.");
  if (isActiveSpotInterest(participant.status)) return { ok: true, state };
  if (getActiveSpotInterestCount(state) >= MAX_ACTIVE_SPOT_INTERESTS) {
    return failure(
      state,
      "SPOT_ROUND_LIMIT_REACHED",
      "AdmissionSetu's prototype participation limit allows up to 5 active spot-round interests.",
    );
  }

  const nextStatus: ParticipantStatus = round.status === "LIVE" ? "WAITING" : "REGISTERED";
  let nextRound = updateParticipant(round, participant.id, nextStatus, occurredAt);
  nextRound = appendRoundEvent(nextRound, {
    id: `SPOT-EVENT-${round.id}-JOINED`,
    occurredAt,
    title: round.status === "LIVE" ? "You joined the live merit queue" : "Spot-round interest registered",
    description: round.status === "LIVE"
      ? `Your deterministic demo queue position is ${round.queuePosition}.`
      : "AdmissionSetu will keep this synthetic upcoming round in your active interests.",
  });
  const next = replaceRound(state, nextRound, occurredAt);
  return isAdmissionSimulationStateValid(next)
    ? { ok: true, state: next }
    : failure(state, "INVALID_STATE", "Joining would violate the simulation invariants.");
}

export function leaveSpotRound(
  state: AdmissionSimulationState,
  roundId: string,
  occurredAt = demoSimulationTimestamps.leaveSpotRound,
): AdmissionTransitionResult {
  const round = state.spotRounds.find((item) => item.id === roundId);
  if (!round) return failure(state, "SPOT_ROUND_NOT_FOUND", "The demo spot round could not be found.");
  const participant = candidateParticipant(round);
  if (!participant || !isActiveSpotInterest(participant.status)) {
    return failure(state, "SPOT_ROUND_NOT_JOINED", "Aarya does not have an active interest in this round.");
  }
  if (participant.status === "OFFERED") {
    return failure(state, "SPOT_OFFER_UNAVAILABLE", "Decline or accept the active seat offer before leaving this round.");
  }
  let nextRound = updateParticipant(round, participant.id, "WITHDRAWN");
  nextRound = appendRoundEvent(nextRound, {
    id: `SPOT-EVENT-${round.id}-LEFT-${occurredAt}`,
    occurredAt,
    title: "You left this spot round",
    description: "The active-interest slot is immediately available for another demo round.",
  });
  const next = replaceRound(state, nextRound, occurredAt);
  return { ok: true, state: next };
}

export function advanceSpotRound(
  state: AdmissionSimulationState,
  roundId: string,
): AdmissionTransitionResult {
  const round = state.spotRounds.find((item) => item.id === roundId);
  if (!round) return failure(state, "SPOT_ROUND_NOT_FOUND", "The demo spot round could not be found.");
  if (round.status !== "LIVE" || !round.isHeroRound) {
    return failure(state, "SPOT_EVENT_UNAVAILABLE", "Deterministic event controls are available only for the hero live round.");
  }
  const participant = candidateParticipant(round);
  if (!participant || !isActiveSpotInterest(participant.status)) {
    return failure(state, "SPOT_ROUND_NOT_JOINED", "Join the live round before advancing demo events.");
  }
  if (round.progressStep >= 5) {
    return failure(state, "SPOT_EVENT_UNAVAILABLE", "All deterministic demo events have already run.");
  }

  const nextStep = round.progressStep + 1;
  const occurredAt = demoSimulationTimestamps.spotEventTimes[round.progressStep];
  let working = state;
  let nextRound = { ...round, progressStep: nextStep };

  if (nextStep === 1) {
    nextRound = updateParticipant(nextRound, "PICT-PARTICIPANT-1024", "WITHDRAWN");
    nextRound = { ...nextRound, queuePosition: 6, candidatesAhead: 3, activeCandidates: 7 };
    nextRound = appendRoundEvent(nextRound, {
      id: "SPOT-EVENT-PICT-1",
      occurredAt,
      title: "Candidate ahead withdrew",
      description: "Your queue position moved from 7 to 6.",
      queuePositionBefore: 7,
      queuePositionAfter: 6,
    });
  }

  if (nextStep === 2) {
    nextRound = updateParticipant(nextRound, "PICT-PARTICIPANT-1061", "WITHDRAWN");
    nextRound = { ...nextRound, queuePosition: 5, candidatesAhead: 2, activeCandidates: 6 };
    nextRound = appendRoundEvent(nextRound, {
      id: "SPOT-EVENT-PICT-2",
      occurredAt,
      title: "Candidate ahead accepted elsewhere",
      description: "Your queue position moved from 6 to 5.",
      queuePositionBefore: 6,
      queuePositionAfter: 5,
    });
  }

  if (nextStep === 3) {
    const seatId = "PICT-ENTC-DEMO-003";
    const availabilityBefore = getProgrammeVacancies(working, round.programId);
    const released = releaseSeat(working, seatId, "candidate-demo-spot-1024", occurredAt);
    if (!released.ok) return released;
    working = released.state;
    const availabilityAfter = getProgrammeVacancies(working, round.programId);
    nextRound = appendRoundEvent(nextRound, {
      id: "SPOT-EVENT-PICT-3",
      occurredAt,
      title: "One additional seat became available",
      description: "A synthetic PICT ENTC seat returned to this centralized live round.",
      availabilityBefore,
      availabilityAfter,
    });
  }

  if (nextStep === 4) {
    nextRound = updateParticipant(nextRound, "PICT-PARTICIPANT-1102", "DECLINED");
    nextRound = updateParticipant(nextRound, "PICT-PARTICIPANT-1136", "EXPIRED");
    nextRound = updateParticipant(nextRound, round.candidateParticipantId, "ELIGIBLE");
    nextRound = { ...nextRound, queuePosition: 1, candidatesAhead: 0, activeCandidates: 4 };
    nextRound = appendRoundEvent(nextRound, {
      id: "SPOT-EVENT-PICT-4",
      occurredAt,
      title: "You reached the offer position",
      description: "Two candidates ahead declined or expired. You are now next for an available seat.",
      queuePositionBefore: 5,
      queuePositionAfter: 1,
    });
  }

  if (nextStep === 5) {
    if (round.queuePosition !== 1 || round.candidatesAhead !== 0) {
      return failure(state, "SPOT_EVENT_UNAVAILABLE", "The queue has not reached the offer position.");
    }
    const seatId = round.seatIds.find((id) => working.seats.find((seat) => seat.id === id)?.lifecycleState === "AVAILABLE");
    if (!seatId) return failure(state, "SEAT_UNAVAILABLE", "No synthetic seat is currently available for the offer.");
    const offered = offerSeat(working, seatId, state.candidateId, occurredAt);
    if (!offered.ok) return offered;
    working = offered.state;
    nextRound = updateParticipant(nextRound, round.candidateParticipantId, "OFFERED");
    nextRound = {
      ...nextRound,
      offer: {
        id: `SPOT-OFFER-${seatId}`,
        seatId,
        participantId: round.candidateParticipantId,
        status: "AWAITING_DECISION",
        offeredAt: occurredAt,
        remainingSeconds: 582,
      },
    };
    nextRound = appendRoundEvent(nextRound, {
      id: "SPOT-EVENT-PICT-5",
      occurredAt,
      title: "Seat offered to you",
      description: "One exact synthetic PICT ENTC seat is reserved while you make the demo decision.",
    });
  }

  const next = replaceRound(working, nextRound, occurredAt);
  return isAdmissionSimulationStateValid(next)
    ? { ok: true, state: next }
    : failure(state, "INVALID_STATE", "The queue event would violate the simulation invariants.");
}

export function acceptSpotRoundOffer(
  state: AdmissionSimulationState,
  roundId: string,
): AdmissionTransitionResult {
  const round = state.spotRounds.find((item) => item.id === roundId);
  if (!round?.offer || round.offer.status !== "AWAITING_DECISION") {
    return failure(state, "SPOT_OFFER_UNAVAILABLE", "No live demo offer is awaiting your decision.");
  }
  const previous = state.currentAdmission;
  if (!previous || previous.kind !== "PARTICIPATING_SEAT") {
    return failure(state, "INVALID_STATE", "The hero demo expects one current participating admission before acceptance.");
  }
  const availabilityBefore = getProgrammeVacancies(state, previous.programId);
  const accepted = acceptSeat(state, round.offer.seatId, demoSimulationTimestamps.acceptSpotOffer, {
    source: "SPOT_ROUND",
    allotmentRound: "PICT live spot round · demo",
    eventTitle: "Spot-round seat accepted",
    eventDescription: "PICT ENTC became Aarya's single current participating admission.",
    consumedSpotRoundId: roundId,
  });
  if (!accepted.ok) return accepted;
  let working = accepted.state;
  const availabilityAfter = getProgrammeVacancies(working, previous.programId);
  let closedInterestCount = 0;
  working = {
    ...working,
    spotRounds: working.spotRounds.map((item) => {
      const itemCandidate = candidateParticipant(item);
      if (!itemCandidate) return item;
      if (item.id === roundId) {
        let acceptedRound = updateParticipant(item, item.candidateParticipantId, "ACCEPTED");
        acceptedRound = {
          ...acceptedRound,
          offer: acceptedRound.offer ? { ...acceptedRound.offer, status: "ACCEPTED" } : null,
        };
        return appendRoundEvent(acceptedRound, {
          id: "SPOT-EVENT-PICT-ACCEPTED",
          occurredAt: demoSimulationTimestamps.acceptSpotOffer,
          title: "Admission confirmed",
          description: "Your previous participating seat was released and remaining active spot interests were closed.",
        });
      }
      if (isActiveSpotInterest(itemCandidate.status)) {
        closedInterestCount += 1;
        return updateParticipant(item, item.candidateParticipantId, "WITHDRAWN");
      }
      return item;
    }),
    lastSpotRoundOutcome: {
      roundId,
      status: "ACCEPTED",
      occurredAt: demoSimulationTimestamps.acceptSpotOffer,
      offeredSeatId: round.offer.seatId,
      previousProgramId: previous.programId,
      previousSeatId: previous.seatId,
      previousAvailabilityBefore: availabilityBefore,
      previousAvailabilityAfter: availabilityAfter,
      closedInterestCount,
    },
    updatedAt: demoSimulationTimestamps.acceptSpotOffer,
  };
  return isAdmissionSimulationStateValid(working)
    ? { ok: true, state: working }
    : failure(state, "INVALID_STATE", "Accepting the spot-round offer would violate the simulation invariants.");
}

function resolveSpotOffer(
  state: AdmissionSimulationState,
  roundId: string,
  resolution: "DECLINED" | "EXPIRED",
): AdmissionTransitionResult {
  const round = state.spotRounds.find((item) => item.id === roundId);
  if (!round?.offer || round.offer.status !== "AWAITING_DECISION") {
    return failure(state, "SPOT_OFFER_UNAVAILABLE", "No live demo offer is awaiting your decision.");
  }
  const occurredAt = resolution === "DECLINED"
    ? demoSimulationTimestamps.declineSpotOffer
    : demoSimulationTimestamps.expireSpotOffer;
  const returned = returnOfferedSeat(state, round.offer.seatId, state.candidateId, occurredAt);
  if (!returned.ok) return returned;
  const previous = state.currentAdmission;
  const previousProgramId = previous?.kind === "PARTICIPATING_SEAT" ? previous.programId : "";
  const previousSeatId = previous?.kind === "PARTICIPATING_SEAT" ? previous.seatId : "";
  let nextRound = returned.state.spotRounds.find((item) => item.id === roundId) ?? round;
  nextRound = updateParticipant(nextRound, nextRound.candidateParticipantId, resolution);
  nextRound = {
    ...nextRound,
    offer: nextRound.offer ? { ...nextRound.offer, status: resolution } : null,
  };
  nextRound = appendRoundEvent(nextRound, {
    id: `SPOT-EVENT-PICT-${resolution}`,
    occurredAt,
    title: resolution === "DECLINED" ? "You declined the seat offer" : "Demo offer expired",
    description: "The synthetic seat returned to the round. Your existing AISSMS admission remains unchanged and the next eligible participant can move forward.",
  });
  const next = {
    ...replaceRound(returned.state, nextRound, occurredAt),
    lastSpotRoundOutcome: {
      roundId,
      status: resolution,
      occurredAt,
      offeredSeatId: round.offer.seatId,
      previousProgramId,
      previousSeatId,
      previousAvailabilityBefore: previousProgramId ? getProgrammeVacancies(state, previousProgramId) : 0,
      previousAvailabilityAfter: previousProgramId ? getProgrammeVacancies(returned.state, previousProgramId) : 0,
      closedInterestCount: 0,
    },
  };
  return isAdmissionSimulationStateValid(next)
    ? { ok: true, state: next }
    : failure(state, "INVALID_STATE", "Resolving the spot-round offer would violate the simulation invariants.");
}

export function declineSpotRoundOffer(state: AdmissionSimulationState, roundId: string) {
  return resolveSpotOffer(state, roundId, "DECLINED");
}

export function expireSpotRoundOffer(state: AdmissionSimulationState, roundId: string) {
  return resolveSpotOffer(state, roundId, "EXPIRED");
}
