import type { College, Program } from "@/types";

export interface CollegeService {
  listColleges(): Promise<readonly College[]>;
  getCollegeById(id: string): Promise<College | null>;
  listPrograms(collegeId?: string): Promise<readonly Program[]>;
}
