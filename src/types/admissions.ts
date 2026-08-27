export type CandidateCategory = "OPEN" | "OBC" | "SC" | "ST" | "VJNT" | "EWS";

export type HomeUniversity =
  | "SPPU"
  | "BAMU"
  | "DBATU"
  | "MU"
  | "RTMNU"
  | "SGBAU"
  | "OTHER";

export type DocumentStatus = "VERIFIED" | "UPLOADED" | "PENDING" | "NOT_REQUIRED";

export type DocumentKind =
  | "MHT_CET_SCORECARD"
  | "JEE_MAIN_SCORECARD"
  | "SSC_MARKSHEET"
  | "HSC_MARKSHEET"
  | "SCHOOL_LEAVING_CERTIFICATE"
  | "DOMICILE_CERTIFICATE"
  | "NATIONALITY_CERTIFICATE"
  | "CATEGORY_CERTIFICATE";

export interface CandidateDocument {
  id: string;
  kind: DocumentKind;
  label: string;
  status: DocumentStatus;
  updatedAt?: string;
}

export interface Candidate {
  id: string;
  fullName: string;
  applicationNumber: string;
  isSynthetic: true;
  cetPercentile: number;
  jeePercentile: number;
  category: CandidateCategory;
  homeUniversity: HomeUniversity;
  currentJourneyStage: AdmissionJourneyStageId;
  documents: CandidateDocument[];
  currentAdmissionId: string | null;
  preferenceProgramIds: string[];
  spotRoundInterestIds: string[];
}

export type InstituteType = "GOVERNMENT" | "GOVERNMENT_AIDED" | "UNIVERSITY" | "UNAIDED";

export interface College {
  id: string;
  instituteCode: string;
  name: string;
  shortName: string;
  city: string;
  district: string;
  university: HomeUniversity;
  type: InstituteType;
  website?: string;
  isSyntheticDataset: true;
}

export type ProgramCode = "CE" | "IT" | "ENTC" | "ME" | "EE" | "AI_DS" | "CIVIL";

export interface HistoricalCutoff {
  academicYear: string;
  round: "CAP_I" | "CAP_II" | "CAP_III";
  category: CandidateCategory;
  percentile: number;
}

export interface Program {
  id: string;
  collegeId: string;
  code: ProgramCode;
  name: string;
  intake: number;
  historicalCutoffs: HistoricalCutoff[];
  currentVacancies: number;
}

export type PublicDataKind = "OFFICIAL_CET_CELL";

export type OfficialInstituteStatus = "Government" | "Un-Aided";
export type OfficialAutonomyStatus = "Autonomous" | "Non-Autonomous";
export type OfficialProgramGender = "Co-Education" | "Female";

export type BranchFamily =
  | "Computer & IT"
  | "AI & Data"
  | "Electronics & Electrical"
  | "Mechanical & Automation"
  | "Civil & Core"
  | "Chemical & Biotechnology";

export interface OfficialSourceReference {
  kind: PublicDataKind;
  label: string;
  academicYear: string;
  url: string;
  accessedOn: string;
}

export interface OfficialInstitute {
  code: string;
  name: string;
  commonName: string;
  searchAliases: readonly string[];
  address: string;
  locality: string;
  city: string;
  district: "Pune";
  university: string;
  status: OfficialInstituteStatus;
  autonomyStatus: OfficialAutonomyStatus;
  minorityStatus: string;
  gender: OfficialProgramGender;
  source: OfficialSourceReference;
}

export interface OfficialProgram {
  choiceCode: string;
  instituteCode: string;
  name: string;
  branchFamily: BranchFamily;
  intake: number;
  shift: "General Shift" | "Morning Shift";
  gender: OfficialProgramGender;
  source: OfficialSourceReference;
}

export type CutoffSeatType = "GOPENS" | "GOPENH" | "LOPENS";

export interface OfficialCutoffObservation {
  programChoiceCode: string;
  academicYear: "2024-25";
  round: "CAP Round III";
  seatType: CutoffSeatType;
  meritNumber: number;
  percentile: number;
  source: OfficialSourceReference;
}

export type AdmissionSource = "MHT_CET_CAP" | "JEE_CAP" | "INSTITUTE_LEVEL" | "SPOT_ROUND";
export type AdmissionStatus = "PROVISIONAL" | "CONFIRMED" | "CANCELLED" | "SUPERSEDED";
export type BettermentStatus = "ACTIVE" | "NOT_REQUESTED" | "CLOSED";

export interface Admission {
  id: string;
  candidateId: string;
  seatId: string;
  source: AdmissionSource;
  allotmentRound: string;
  status: AdmissionStatus;
  bettermentStatus: BettermentStatus;
  allottedAt: string;
  reportingDeadline: string;
}

export type AdmissionJourneyStageId =
  | "EXAMS_COMPLETED"
  | "CET_REGISTRATION"
  | "DOCUMENTS_VERIFIED"
  | "CAP_PREFERENCES"
  | "CAP_ALLOTMENT"
  | "BETTERMENT"
  | "INSTITUTE_SPOT_ROUNDS"
  | "FINAL_ADMISSION";

export type AdmissionJourneyStageState = "COMPLETED" | "CURRENT" | "UPCOMING";

export interface AdmissionJourneyStage {
  id: AdmissionJourneyStageId;
  title: string;
  description: string;
}

export interface AdmissionDeadline {
  id: string;
  title: string;
  deadlineAt: string;
  actionLabel: string;
  actionHref: string;
  whyItMatters: string;
}

export type AdmissionAlertTone = "INFO" | "WARNING";

export interface AdmissionAlert {
  id: string;
  tone: AdmissionAlertTone;
  label: string;
  title: string;
  message: string;
  actionLabel?: string;
  actionHref?: string;
}

export type SeatLifecycleState = "AVAILABLE" | "HELD" | "OFFERED" | "ACCEPTED" | "RELEASED";

export interface Seat {
  id: string;
  programId: string;
  category: CandidateCategory;
  lifecycleState: SeatLifecycleState;
  heldByCandidateId: string | null;
  academicYear: string;
}

export type SpotRoundStatus = "REGISTRATION_OPEN" | "SCHEDULED" | "LIVE" | "COMPLETED";

export interface SpotRound {
  id: string;
  title: string;
  collegeId: string;
  programIds: string[];
  registrationDeadline: string;
  startsAt: string;
  status: SpotRoundStatus;
  vacancyCount: number;
}

export type ParticipantStatus = "INTERESTED" | "REGISTERED" | "WAITING" | "CALLED" | "OFFERED" | "COMPLETED";

export interface SpotRoundParticipant {
  id: string;
  spotRoundId: string;
  candidateId: string;
  status: ParticipantStatus;
  joinedAt: string;
  queuePosition?: number;
  offeredSeatId?: string;
}
