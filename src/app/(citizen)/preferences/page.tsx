import { PreferenceBuilder } from "@/components";
import { capRoundThreeRule, demoAdmissionCycle } from "@/data";
import {
  mockAdmissionService,
  mockCandidateService,
  mockCollegeService,
  mockOfficialCatalogService,
  mockSeatService,
} from "@/services";

export default async function PreferencesPage() {
  const [catalog, candidate] = await Promise.all([
    mockOfficialCatalogService.getCatalog(),
    mockCandidateService.getDemoCandidate(),
  ]);
  const admission = await mockAdmissionService.getCurrentAdmission(candidate.id);
  const seat = admission ? await mockSeatService.getSeatById(admission.seatId) : null;
  const currentProgram = seat ? await mockCollegeService.getProgramById(seat.programId) : null;
  const currentCollege = currentProgram ? await mockCollegeService.getCollegeById(currentProgram.collegeId) : null;

  if (!admission || !seat || !currentProgram || !currentCollege) {
    throw new Error("The deterministic current-seat scenario is incomplete.");
  }

  return (
    <PreferenceBuilder
      institutes={catalog.institutes}
      programs={catalog.programs}
      cutoffs={catalog.cutoffs}
      rule={capRoundThreeRule}
      cycle={demoAdmissionCycle}
      currentSeat={{
        instituteName: currentCollege.name,
        instituteShortName: currentCollege.shortName,
        programName: currentProgram.name,
        bettermentActive: admission.bettermentStatus === "ACTIVE",
      }}
    />
  );
}
