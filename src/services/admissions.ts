import type { Admission } from "@/types";

export interface AdmissionService {
  getCurrentAdmission(candidateId: string): Promise<Admission | null>;
}
