export type CandidateCategory = "OPEN" | "OBC" | "SC" | "ST" | "VJNT" | "EWS";

export type HomeUniversity =
  | "SPPU"
  | "BAMU"
  | "DBATU"
  | "MU"
  | "RTMNU"
  | "SGBAU"
  | "OTHER";

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
  preferenceProgramIds: string[];
}

export type DocumentType =
  | "SSC_MARKSHEET"
  | "HSC_MARKSHEET"
  | "MHT_CET_SCORECARD"
  | "JEE_MAIN_SCORECARD"
  | "DOMICILE_CERTIFICATE"
  | "INCOME_CERTIFICATE";

export type DocumentSource = "DIGILOCKER" | "MANUAL" | "INSTITUTION" | "SYNTHETIC";
export type DocumentVerificationStatus =
  | "NOT_CONNECTED"
  | "AVAILABLE"
  | "VERIFIED"
  | "MISSING"
  | "NEEDS_ATTENTION"
  | "EXPIRED";

export type DocumentConsentScope =
  | "SSC_MARKSHEET"
  | "HSC_MARKSHEET"
  | "DOMICILE_CERTIFICATE"
  | "ENTRANCE_EXAM_RECORDS";

export interface DocumentRecord {
  id: string;
  candidateId: string;
  documentType: DocumentType;
  displayName: string;
  source: DocumentSource;
  verificationStatus: DocumentVerificationStatus;
  issuedBy?: string;
  issuedAt?: string;
  expiresAt?: string;
  accessScope?: DocumentConsentScope;
  lastSharedAt: string | null;
  isSynthetic: true;
}

export type DocumentProviderConnectionStatus = "NOT_CONNECTED" | "CONNECTED" | "REVOKED";

export interface DocumentProviderConnection {
  provider: "DIGILOCKER_DEMO";
  status: DocumentProviderConnectionStatus;
  grantedScopes: DocumentConsentScope[];
  connectedAt: string | null;
  revokedAt: string | null;
}

export type DocumentWorkflowId =
  | "DOCUMENT_PASSPORT"
  | "CAP"
  | "INSTITUTE_REPORTING"
  | "SPOT_ROUND";

export interface DocumentRequirementBundle {
  id: DocumentWorkflowId;
  displayName: string;
  description: string;
  requiredDocumentTypes: readonly DocumentType[];
  isPrototypeRequirementSet: true;
}

export interface DocumentWorkflowReadiness {
  workflowId: DocumentWorkflowId;
  readyCount: number;
  requiredCount: number;
  ready: boolean;
  missingDocumentTypes: DocumentType[];
  attentionDocumentTypes: DocumentType[];
}

export interface DocumentShareRecord {
  id: string;
  candidateId: string;
  workflowId: DocumentWorkflowId;
  recipientInstituteCode: string;
  recipientInstituteName: string;
  recipientProgramId: string;
  recipientProgramName: string;
  documentTypes: DocumentType[];
  purpose: string;
  sharedAt: string;
  isSynthetic: true;
}

export type DocumentActivityType =
  | "PROVIDER_CONNECTED"
  | "PROVIDER_ACCESS_REVOKED"
  | "DOCUMENTS_SHARED";

export interface DocumentActivity {
  id: string;
  type: DocumentActivityType;
  occurredAt: string;
  title: string;
  description: string;
  recipientInstituteCode?: string;
  documentTypes: DocumentType[];
}

export interface DocumentPassportState {
  version: 1;
  records: DocumentRecord[];
  providerConnection: DocumentProviderConnection;
  shares: DocumentShareRecord[];
  activity: DocumentActivity[];
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
  source: "MHT_CET_CAP" | "SPOT_ROUND";
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
  | "SEAT_OFFERED"
  | "SEAT_OFFER_RETURNED"
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
  version: 4;
  candidateId: string;
  currentAdmission: SimulationCurrentAdmission | null;
  seats: SimulationSeat[];
  externalAdmissions: ConnectedAdmissionRecord[];
  events: AdmissionSimulationEvent[];
  lastFeedback: AdmissionSimulationFeedback | null;
  spotRounds: SpotRound[];
  lastSpotRoundOutcome: SpotRoundOutcome | null;
  clearing: MeritClearingState;
  documentPassport: DocumentPassportState;
  updatedAt: string;
}

export type AdmissionTransitionErrorCode =
  | "NO_CURRENT_ADMISSION"
  | "SEAT_NOT_FOUND"
  | "SEAT_UNAVAILABLE"
  | "SEAT_HELD_BY_ANOTHER_CANDIDATE"
  | "SEAT_ALREADY_AVAILABLE"
  | "CONNECTED_ADMISSION_NOT_READY"
  | "SPOT_ROUND_NOT_FOUND"
  | "SPOT_ROUND_NOT_ACTIVE"
  | "SPOT_ROUND_LIMIT_REACHED"
  | "SPOT_ROUND_NOT_JOINED"
  | "SPOT_EVENT_UNAVAILABLE"
  | "SPOT_OFFER_UNAVAILABLE"
  | "CLEARING_CANDIDATE_NOT_FOUND"
  | "CLEARING_OFFER_NOT_FOUND"
  | "CLEARING_INTEREST_NOT_ACTIVE"
  | "DOCUMENT_PROVIDER_NOT_CONNECTED"
  | "DOCUMENT_CONSENT_REQUIRED"
  | "DOCUMENT_REQUIREMENT_NOT_READY"
  | "DOCUMENT_RECIPIENT_INVALID"
  | "INVALID_STATE";

export interface AdmissionTransitionError {
  code: AdmissionTransitionErrorCode;
  message: string;
}

export type AdmissionTransitionResult =
  | { ok: true; state: AdmissionSimulationState }
  | { ok: false; state: AdmissionSimulationState; error: AdmissionTransitionError };

export type SpotRoundStatus = "UPCOMING" | "LIVE" | "PAUSED" | "COMPLETED";

export type ParticipantStatus =
  | "REGISTERED"
  | "WAITING"
  | "ELIGIBLE"
  | "OFFERED"
  | "ACCEPTED"
  | "DECLINED"
  | "WITHDRAWN"
  | "EXPIRED";

export type SpotOfferStatus = "AWAITING_DECISION" | "ACCEPTED" | "DECLINED" | "EXPIRED";

export interface SpotRoundParticipant {
  id: string;
  label: string;
  meritOrder: number;
  status: ParticipantStatus;
  joinedAt: string | null;
  isDemoCandidate: boolean;
}

export interface SpotRoundEvent {
  id: string;
  occurredAt: string;
  title: string;
  description: string;
  queuePositionBefore?: number;
  queuePositionAfter?: number;
  availabilityBefore?: number;
  availabilityAfter?: number;
}

export interface SpotRoundOffer {
  id: string;
  seatId: string;
  participantId: string;
  status: SpotOfferStatus;
  offeredAt: string;
  remainingSeconds: number;
}

export interface SpotRound {
  id: string;
  instituteCode: string;
  programId: string;
  startsAt: string;
  endsAt: string;
  status: SpotRoundStatus;
  seatIds: string[];
  participants: SpotRoundParticipant[];
  candidateParticipantId: string;
  queuePosition: number;
  candidatesAhead: number;
  activeCandidates: number;
  progressStep: number;
  events: SpotRoundEvent[];
  offer: SpotRoundOffer | null;
  scheduleConflictRoundIds: string[];
  isHeroRound: boolean;
  isSyntheticSimulation: true;
}

export interface SpotRoundOutcome {
  roundId: string;
  status: "ACCEPTED" | "DECLINED" | "EXPIRED";
  occurredAt: string;
  offeredSeatId: string;
  previousProgramId: string;
  previousSeatId: string;
  previousAvailabilityBefore: number;
  previousAvailabilityAfter: number;
  closedInterestCount: number;
}

export type ClearingCandidateStatus = "ACTIVE" | "ADMITTED" | "INACTIVE";

export type ClearingInterestStatus =
  | "REGISTERED"
  | "WAITING"
  | "ELIGIBLE"
  | "OFFERED"
  | "ACCEPTED"
  | "DECLINED"
  | "WITHDRAWN"
  | "CLOSED_AFTER_ACCEPTANCE";

export interface CandidateClearingInterest {
  roundId: string;
  status: ClearingInterestStatus;
  joinedAt: string;
}

export interface CandidateClearingProfile {
  candidateId: string;
  displayLabel: string;
  meritRank: number;
  cetPercentile?: number;
  activeAdmissionSeatId: string | null;
  status: ClearingCandidateStatus;
  interests: CandidateClearingInterest[];
}

export type ClearingOfferStatus =
  | "AWAITING_DECISION"
  | "ACCEPTED"
  | "DECLINED"
  | "WITHDRAWN";

export interface ClearingOffer {
  id: string;
  roundId: string;
  candidateId: string;
  seatId: string;
  status: ClearingOfferStatus;
  offeredAt: string;
  remainingSeconds: number;
}

export interface MeritListEntry {
  candidateId: string;
  displayLabel: string;
  meritRank: number;
  position: number;
  status: ClearingInterestStatus;
  isDemoCandidate: boolean;
}

export interface ClearingQueueMovement {
  roundId: string;
  candidateId: string;
  displayLabel: string;
  fromPosition: number;
  toPosition: number;
}

export type ClearingEventType =
  | "INTEREST_JOINED"
  | "INTEREST_WITHDRAWN"
  | "SEAT_AVAILABLE"
  | "OFFER_GENERATED"
  | "OFFER_DECLINED"
  | "OFFER_ACCEPTED"
  | "PREVIOUS_SEAT_RELEASED"
  | "COMPETING_LISTS_CLOSED"
  | "MERIT_LIST_RECOMPUTED"
  | "CANDIDATE_ADVANCED";

export interface ClearingEvent {
  id: string;
  type: ClearingEventType;
  occurredAt: string;
  title: string;
  description: string;
  technicalDetail: string;
  roundId?: string;
  candidateId?: string;
  seatId?: string;
  movements?: ClearingQueueMovement[];
}

export interface ClearingAcceptanceOutcome {
  offerId: string;
  roundId: string;
  seatId: string;
  previousSeatId: string;
  previousProgramId: string;
  previousAvailabilityBefore: number;
  previousAvailabilityAfterRelease: number;
  previousAvailabilityCurrent: number;
  closedRoundIds: string[];
  movements: ClearingQueueMovement[];
  generatedOfferIds: string[];
  occurredAt: string;
}

export interface MeritClearingState {
  version: 1;
  candidates: CandidateClearingProfile[];
  offers: ClearingOffer[];
  events: ClearingEvent[];
  heroScenario: {
    status: "READY" | "OFFER_READY" | "ACCEPTED";
  };
  lastOutcome: ClearingAcceptanceOutcome | null;
}
