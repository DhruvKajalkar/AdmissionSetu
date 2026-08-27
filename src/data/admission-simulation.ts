import type { AdmissionSimulationState, SimulationSeat } from "@/types";
import { demoCandidate } from "./candidate.ts";
import { demoAdmissionCycle } from "./demo-cycle.ts";

export const demoSimulationTimestamps = {
  withdrawCurrentSeat: "2026-08-27T18:00:00+05:30",
  confirmConnectedAdmission: "2026-08-27T18:05:00+05:30",
  acceptParticipatingSeat: "2026-08-27T18:10:00+05:30",
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

export function createInitialAdmissionSimulationState(): AdmissionSimulationState {
  return {
    version: 1,
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
      seat("PICT-ENTC-DEMO-003", "0627137210"),
      seat("VIT-AIDS-DEMO-001", "0627399510"),
      seat("VIT-AIDS-DEMO-002", "0627399510"),
      seat("PCCOE-COMP-DEMO-001", "0617524510"),
      seat("PCCOE-COMP-DEMO-002", "0617524510", "HELD", "candidate-demo-rohan-patil"),
      seat("MMCOE-IT-DEMO-001", "0615624610"),
      seat("MMCOE-IT-DEMO-002", "0615624610"),
    ],
    externalAdmissions: [
      {
        id: "CONNECTED-DEMO-JEE-001",
        candidateId: demoCandidate.id,
        institutionName: "Metro Institute of Engineering (Synthetic)",
        programName: "Computer Science and Engineering",
        sourceLabel: "JEE-based connected counselling (demo)",
        status: "READY",
        confirmedAt: null,
        isSyntheticSimulation: true,
      },
    ],
    events: [
      {
        id: "EVENT-AARYA-CAP-R2-ACCEPTED",
        type: "SEAT_ACCEPTED",
        occurredAt: demoAdmissionCycle.currentSeatAllottedAt,
        title: "CAP Round II seat accepted",
        description: "AISSMS COE Computer Engineering became Aarya's current participating seat.",
        seatId: "AISSMS-COMP-DEMO-001",
        programId: "0627824510",
      },
    ],
    lastFeedback: null,
    updatedAt: demoAdmissionCycle.currentSeatAllottedAt,
  };
}
