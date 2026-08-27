import { createInitialAdmissionSimulationState } from "./admission-simulation";

// Read-only seed projections for route generation and the legacy mock interface.
// Live ownership and queue changes always use AdmissionSimulationState.spotRounds.
export const spotRounds = createInitialAdmissionSimulationState().spotRounds;
export const spotRoundParticipants = spotRounds.flatMap((round) => round.participants);
