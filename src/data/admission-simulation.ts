import type {
  AdmissionSimulationState,
  ParticipantStatus,
  SimulationSeat,
  SpotRound,
  SpotRoundParticipant,
  SpotRoundStatus,
} from "@/types";
import { demoCandidate } from "./candidate.ts";
import { demoAdmissionCycle } from "./demo-cycle.ts";

export const HERO_SPOT_ROUND_ID = "spot-pict-entc-live";
export const MAX_ACTIVE_SPOT_INTERESTS = 5;

export const demoSimulationTimestamps = {
  withdrawCurrentSeat: "2026-08-27T18:00:00+05:30",
  confirmConnectedAdmission: "2026-08-27T18:05:00+05:30",
  acceptParticipatingSeat: "2026-08-27T18:10:00+05:30",
  joinSpotRound: "2026-08-27T09:55:00+05:30",
  leaveSpotRound: "2026-08-27T09:57:00+05:30",
  spotEventTimes: [
    "2026-08-27T10:08:00+05:30",
    "2026-08-27T10:09:00+05:30",
    "2026-08-27T10:10:00+05:30",
    "2026-08-27T10:11:00+05:30",
    "2026-08-27T10:12:00+05:30",
  ],
  acceptSpotOffer: "2026-08-27T10:13:00+05:30",
  declineSpotOffer: "2026-08-27T10:13:00+05:30",
  expireSpotOffer: "2026-08-27T10:22:42+05:30",
} as const;

function seat(
  id: string,
  programId: string,
  lifecycleState: SimulationSeat["lifecycleState"] = "AVAILABLE",
  heldByCandidateId: string | null = null,
): SimulationSeat {
  return {
    id,
    programId,
    category: "OPEN",
    lifecycleState,
    heldByCandidateId,
    academicYear: "2026-27",
    isSyntheticSimulation: true,
  };
}

function participant(
  id: string,
  label: string,
  meritOrder: number,
  status: ParticipantStatus = "WAITING",
  isDemoCandidate = false,
): SpotRoundParticipant {
  return { id, label, meritOrder, status, joinedAt: null, isDemoCandidate };
}

function round(
  id: string,
  instituteCode: string,
  programId: string,
  status: SpotRoundStatus,
  startsAt: string,
  endsAt: string,
  seatIds: string[],
  options: Partial<Pick<SpotRound, "participants" | "queuePosition" | "candidatesAhead" | "activeCandidates" | "scheduleConflictRoundIds" | "isHeroRound">> = {},
): SpotRound {
  const candidateParticipantId = `PARTICIPANT-AARYA-${id}`;
  return {
    id,
    instituteCode,
    programId,
    status,
    startsAt,
    endsAt,
    seatIds,
    participants: options.participants ?? [
      participant(`PARTICIPANT-101-${id}`, "Candidate #1024", 1),
      participant(candidateParticipantId, "Your demo queue entry", 2, "WITHDRAWN", true),
    ],
    candidateParticipantId,
    queuePosition: options.queuePosition ?? 2,
    candidatesAhead: options.candidatesAhead ?? 1,
    activeCandidates: options.activeCandidates ?? 8,
    progressStep: 0,
    events: status === "LIVE" ? [{
      id: `SPOT-EVENT-${id}-OPENED`,
      occurredAt: startsAt,
      title: "Live round opened",
      description: "The deterministic synthetic merit queue is now active.",
    }] : [],
    offer: null,
    scheduleConflictRoundIds: options.scheduleConflictRoundIds ?? [],
    isHeroRound: options.isHeroRound ?? false,
    isSyntheticSimulation: true,
  };
}

function heroParticipants(): SpotRoundParticipant[] {
  return [
    participant("PICT-PARTICIPANT-1024", "Candidate #1024", 1),
    participant("PICT-PARTICIPANT-1048", "Candidate #1048", 2, "WITHDRAWN"),
    participant("PICT-PARTICIPANT-1061", "Candidate #1061", 3),
    participant("PICT-PARTICIPANT-1102", "Candidate #1102", 4),
    participant("PICT-PARTICIPANT-1136", "Candidate #1136", 5),
    participant("PICT-PARTICIPANT-1180", "Candidate #1180", 6, "WITHDRAWN"),
    participant(`PARTICIPANT-AARYA-${HERO_SPOT_ROUND_ID}`, "Your demo queue entry", 7, "WITHDRAWN", true),
    participant("PICT-PARTICIPANT-1212", "Candidate #1212", 8),
  ];
}

export function createInitialAdmissionSimulationState(): AdmissionSimulationState {
  return {
    version: 2,
    candidateId: demoCandidate.id,
    currentAdmission: {
      id: "DEMO-ADMISSION-AARYA-CAP-R2",
      kind: "PARTICIPATING_SEAT",
      candidateId: demoCandidate.id,
      seatId: "AISSMS-COMP-DEMO-001",
      programId: "0627824510",
      source: "MHT_CET_CAP",
      allotmentRound: demoAdmissionCycle.currentSeatAllottedRound,
      status: "CONFIRMED",
      bettermentStatus: "ACTIVE",
      confirmedAt: demoAdmissionCycle.currentSeatAllottedAt,
    },
    seats: [
      seat("AISSMS-COMP-DEMO-001", "0627824510", "ACCEPTED", demoCandidate.id),
      seat("AISSMS-COMP-DEMO-002", "0627824510"),
      seat("AISSMS-COMP-DEMO-003", "0627824510"),
      seat("AISSMS-ENTC-DEMO-001", "0627837210"),
      seat("PICT-ENTC-DEMO-001", "0627137210"),
      seat("PICT-ENTC-DEMO-002", "0627137210"),
      seat("PICT-ENTC-DEMO-003", "0627137210", "HELD", "candidate-demo-spot-1024"),
      seat("VIT-COMP-DEMO-001", "0627324510"),
      seat("VIT-COMP-DEMO-002", "0627324510"),
      seat("VIT-AIDS-DEMO-001", "0627399510"),
      seat("VIT-AIDS-DEMO-002", "0627399510"),
      seat("PCCOE-COMP-DEMO-001", "0617524510"),
      seat("PCCOE-COMP-DEMO-002", "0617524510", "HELD", "candidate-demo-rohan-patil"),
      seat("PCCOE-AIML-DEMO-001", "0617591110"),
      seat("PCCOE-AIML-DEMO-002", "0617591110"),
      seat("MMCOE-IT-DEMO-001", "0615624610"),
      seat("MMCOE-IT-DEMO-002", "0615624610"),
      seat("MMCOE-COMP-DEMO-001", "0615624510"),
      seat("MMCOE-COMP-DEMO-002", "0615624510"),
      seat("DYPCOE-AIDS-DEMO-001", "0627299510"),
      seat("DYPCOE-AIDS-DEMO-002", "0627299510"),
      seat("MODERN-AIDS-DEMO-001", "0613999510"),
    ],
    externalAdmissions: [{
      id: "CONNECTED-DEMO-JEE-001",
      candidateId: demoCandidate.id,
      institutionName: "Metro Institute of Engineering (Synthetic)",
      programName: "Computer Science and Engineering",
      sourceLabel: "JEE-based connected counselling (demo)",
      status: "READY",
      confirmedAt: null,
      isSyntheticSimulation: true,
    }],
    events: [{
      id: "EVENT-AARYA-CAP-R2-ACCEPTED",
      type: "SEAT_ACCEPTED",
      occurredAt: demoAdmissionCycle.currentSeatAllottedAt,
      title: "CAP Round II seat accepted",
      description: "AISSMS COE Computer Engineering became Aarya's current participating seat.",
      seatId: "AISSMS-COMP-DEMO-001",
      programId: "0627824510",
    }],
    lastFeedback: null,
    spotRounds: [
      round(HERO_SPOT_ROUND_ID, "06271", "0627137210", "LIVE", "2026-08-27T10:00:00+05:30", "2026-08-27T11:00:00+05:30", ["PICT-ENTC-DEMO-001", "PICT-ENTC-DEMO-002", "PICT-ENTC-DEMO-003"], { participants: heroParticipants(), queuePosition: 7, candidatesAhead: 4, activeCandidates: 8, scheduleConflictRoundIds: ["spot-vit-computer-live"], isHeroRound: true }),
      round("spot-vit-computer-live", "06273", "0627324510", "LIVE", "2026-08-27T10:15:00+05:30", "2026-08-27T11:15:00+05:30", ["VIT-COMP-DEMO-001", "VIT-COMP-DEMO-002"], { scheduleConflictRoundIds: [HERO_SPOT_ROUND_ID] }),
      round("spot-pccoe-aiml-upcoming", "06175", "0617591110", "UPCOMING", "2026-08-27T12:00:00+05:30", "2026-08-27T13:00:00+05:30", ["PCCOE-AIML-DEMO-001", "PCCOE-AIML-DEMO-002"]),
      round("spot-mmcoe-computer-upcoming", "06156", "0615624510", "UPCOMING", "2026-08-27T13:30:00+05:30", "2026-08-27T14:30:00+05:30", ["MMCOE-COMP-DEMO-001", "MMCOE-COMP-DEMO-002"]),
      round("spot-aissms-entc-upcoming", "06278", "0627837210", "UPCOMING", "2026-08-27T14:00:00+05:30", "2026-08-27T15:00:00+05:30", ["AISSMS-ENTC-DEMO-001"]),
      round("spot-dypcoe-aids-upcoming", "06272", "0627299510", "UPCOMING", "2026-08-27T15:30:00+05:30", "2026-08-27T16:30:00+05:30", ["DYPCOE-AIDS-DEMO-001", "DYPCOE-AIDS-DEMO-002"]),
      round("spot-modern-aids-completed", "06139", "0613999510", "COMPLETED", "2026-08-26T16:00:00+05:30", "2026-08-26T17:00:00+05:30", ["MODERN-AIDS-DEMO-001"]),
    ],
    lastSpotRoundOutcome: null,
    updatedAt: demoAdmissionCycle.currentSeatAllottedAt,
  };
}
