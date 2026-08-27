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

export type CapRound = 1 | 2 | 3 | 4;

export interface CapRoundRule {
  round: CapRound;
  label: string;
  autoFreezePreferenceLimit: number | null;
  bettermentAvailableAfterRound: boolean;
  finalRound: boolean;
  explanation: string;
  source: OfficialSourceReference;
}

export interface DemoAdmissionCycle {
  academicYear: "2026-27";
  currentRound: CapRound;
  roundLabel: string;
  now: string;
  preferenceReviewDeadline: string;
  deterministicConfirmationAt: string;
  currentSeatAllottedRound: string;
  currentSeatAllottedAt: string;
  currentSeatReportingDeadline: string;
}

export type PreferenceAcceptanceIntent = "YES" | "UNSURE";

export interface CandidatePreference {
  programId: string;
  position: number;
  acceptanceIntent: PreferenceAcceptanceIntent;
}

export interface ConfirmedPreferenceSubmission {
  id: string;
  round: CapRound;
  confirmedAt: string;
  acknowledgedAutoFreezeRule: true;
  preferences: readonly CandidatePreference[];
}

export interface PreferenceStorageV2 {
  version: 2;
  preferences: readonly CandidatePreference[];
  confirmedPreferenceSubmission: ConfirmedPreferenceSubmission | null;
}

export type PreferenceFindingSeverity = "INFO" | "CAUTION" | "BLOCKING";
export type PreferenceFindingType = "EMPTY_LIST" | "DUPLICATE_PROGRAM" | "UNSURE_AUTO_FREEZE";

export interface PreferenceReviewFinding {
  id: string;
  severity: PreferenceFindingSeverity;
  type: PreferenceFindingType;
  preferenceId?: string;
  position?: number;
  title: string;
  explanation: string;
}

export interface PreferenceReview {
  findings: readonly PreferenceReviewFinding[];
  blockingCount: number;
  cautionCount: number;
  autoFreezePreferenceLimit: number | null;
}

export interface CurrentSeatContext {
  kind: "PARTICIPATING_SEAT" | "CONNECTED_ADMISSION";
  instituteName: string;
  instituteShortName: string;
  programName: string;
  bettermentActive: boolean;
  sourceLabel: string;
  allotmentRound: string;
}

export interface PreferenceConsequence {
  position: number;
  autoFrozen: boolean;
  currentSeatEffect: string;
  capStatus: string;
  nextRoundStatus: string;
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

export interface SimulationSeat {
  id: string;
  programId: string;
  category: CandidateCategory;
  lifecycleState: SeatLifecycleState;
  heldByCandidateId: string | null;
  academicYear: "2026-27";
  isSyntheticSimulation: true;
}

export interface SimulationParticipatingAdmission {
  id: string;
  kind: "PARTICIPATING_SEAT";
  candidateId: string;
  seatId: string;
  programId: string;
  source: "MHT_CET_CAP";
  allotmentRound: string;
  status: "CONFIRMED";
  bettermentStatus: BettermentStatus;
  confirmedAt: string;
}

export interface SimulationConnectedAdmission {
  id: string;
  kind: "CONNECTED_ADMISSION";
  candidateId: string;
  externalAdmissionId: string;
  institutionName: string;
  programName: string;
  sourceLabel: string;
  status: "CONFIRMED";
  confirmedAt: string;
}

export type SimulationCurrentAdmission =
  | SimulationParticipatingAdmission
  | SimulationConnectedAdmission;

export interface ConnectedAdmissionRecord {
  id: string;
  candidateId: string;
  institutionName: string;
  programName: string;
  sourceLabel: string;
  status: "READY" | "CONFIRMED";
  confirmedAt: string | null;
  isSyntheticSimulation: true;
}

export type AdmissionSimulationEventType =
  | "SEAT_ACCEPTED"
  | "SEAT_RELEASED"
  | "ADMISSION_WITHDRAWN"
  | "CONNECTED_ADMISSION_CONFIRMED";

export interface AdmissionSimulationEvent {
  id: string;
  type: AdmissionSimulationEventType;
  occurredAt: string;
  title: string;
  description: string;
  seatId?: string;
  programId?: string;
  availabilityBefore?: number;
  availabilityAfter?: number;
}

export interface AdmissionSimulationFeedback {
  kind: "SEAT_RELEASED";
  occurredAt: string;
  seatId: string;
  programId: string;
  availabilityBefore: number;
  availabilityAfter: number;
  title: string;
}

export interface AdmissionSimulationState {
  version: 1;
  candidateId: string;
  currentAdmission: SimulationCurrentAdmission | null;
  seats: SimulationSeat[];
  externalAdmissions: ConnectedAdmissionRecord[];
  events: AdmissionSimulationEvent[];
  lastFeedback: AdmissionSimulationFeedback | null;
  updatedAt: string;
}

export type AdmissionTransitionErrorCode =
  | "NO_CURRENT_ADMISSION"
  | "SEAT_NOT_FOUND"
  | "SEAT_UNAVAILABLE"
  | "SEAT_HELD_BY_ANOTHER_CANDIDATE"
  | "SEAT_ALREADY_AVAILABLE"
  | "CONNECTED_ADMISSION_NOT_READY"
  | "INVALID_STATE";

export interface AdmissionTransitionError {
  code: AdmissionTransitionErrorCode;
  message: string;
}

export type AdmissionTransitionResult =
  | { ok: true; state: AdmissionSimulationState }
  | { ok: false; state: AdmissionSimulationState; error: AdmissionTransitionError };

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
