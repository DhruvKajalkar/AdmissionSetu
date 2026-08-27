import { admissions, colleges, demoCandidate, programs, seats, spotRoundParticipants, spotRounds } from "@/data";
import type { AdmissionService } from "./admissions";
import type { CandidateService } from "./candidates";
import type { CollegeService } from "./colleges";
import type { SeatService } from "./seats";
import type { SpotRoundService } from "./spot-rounds";

export const mockCollegeService: CollegeService = {
  async listColleges() {
    return colleges;
  },
  async getCollegeById(id) {
    return colleges.find((college) => college.id === id) ?? null;
  },
  async listPrograms(collegeId) {
    return collegeId ? programs.filter((program) => program.collegeId === collegeId) : programs;
  },
  async getProgramById(id) {
    return programs.find((program) => program.id === id) ?? null;
  },
};

export const mockCandidateService: CandidateService = {
  async getCandidateById(id) {
    return id === demoCandidate.id ? demoCandidate : null;
  },
  async getDemoCandidate() {
    return demoCandidate;
  },
};

export const mockAdmissionService: AdmissionService = {
  async getCurrentAdmission(candidateId) {
    return admissions.find((admission) => admission.candidateId === candidateId && admission.status === "CONFIRMED") ?? null;
  },
};

export const mockSeatService: SeatService = {
  async getSeatById(id) {
    return seats.find((seat) => seat.id === id) ?? null;
  },
  async listAvailableSeats(programId) {
    return seats.filter((seat) => seat.lifecycleState === "AVAILABLE" && (!programId || seat.programId === programId));
  },
};

export const mockSpotRoundService: SpotRoundService = {
  async listSpotRounds() {
    return spotRounds;
  },
  async getSpotRoundById(id) {
    return spotRounds.find((round) => round.id === id) ?? null;
  },
  async listParticipants(spotRoundId) {
    return spotRoundParticipants.filter((participant) => participant.spotRoundId === spotRoundId);
  },
};
