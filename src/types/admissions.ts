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

export type AdmissionSource = "MHT_CET_CAP" | "JEE_CAP" | "INSTITUTE_LEVEL" | "SPOT_ROUND";
export type AdmissionStatus = "PROVISIONAL" | "CONFIRMED" | "CANCELLED" | "SUPERSEDED";

export interface Admission {
  id: string;
  candidateId: string;
  seatId: string;
  source: AdmissionSource;
  allotmentRound: string;
  status: AdmissionStatus;
  allottedAt: string;
  reportingDeadline: string;
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
