import type { Candidate } from "@/types";

export interface CandidateService {
  getCandidateById(id: string): Promise<Candidate | null>;
  getDemoCandidate(): Promise<Candidate>;
}
