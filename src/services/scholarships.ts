import { SCHOLARSHIP_SCHEMES } from "../data/scholarships.ts";
import type {
  AdmissionSimulationState,
  AdmissionTransitionResult,
  Candidate,
  ScholarshipAdmissionRoute,
  ScholarshipDocumentReadiness,
  ScholarshipEvaluation,
  ScholarshipNavigatorState,
  ScholarshipProfile,
  ScholarshipRule,
  ScholarshipRuleField,
  ScholarshipRuleResult,
  ScholarshipScheme,
  ScholarshipSummary,
} from "../types/admissions.ts";

const READY_DOCUMENT_STATUSES = ["VERIFIED", "AVAILABLE"] as const;
const HOSTEL_STATUSES = ["UNKNOWN", "HOSTELLER", "DAY_SCHOLAR"] as const;

export interface ScholarshipEvaluationContext {
  profile: ScholarshipProfile;
  candidateCategory: Candidate["category"];
  admissionRoute: ScholarshipAdmissionRoute;
}

export interface ScholarshipProfileUpdate {
  hostelStatus?: ScholarshipProfile["hostelStatus"];
  class12BoardPercentile?: number | null;
}

function failure(
  state: AdmissionSimulationState,
  code: "SCHOLARSHIP_PROFILE_INVALID" | "SCHOLARSHIP_SCHEME_NOT_FOUND",
  message: string,
): AdmissionTransitionResult {
  return { ok: false, state, error: { code, message } };
}

function getAdmissionRoute(state: AdmissionSimulationState): ScholarshipAdmissionRoute {
  const admission = state.currentAdmission;
  if (!admission) return "NONE";
  if (admission.kind === "CONNECTED_ADMISSION") return "CONNECTED";
  return admission.source === "MHT_CET_CAP" ? "CAP" : "SPOT_ROUND";
}

export function buildScholarshipEvaluationContext(
  state: AdmissionSimulationState,
  candidate: Candidate,
): ScholarshipEvaluationContext {
  return {
    profile: state.scholarshipNavigator.profile,
    candidateCategory: candidate.category,
    admissionRoute: getAdmissionRoute(state),
  };
}

function contextValue(context: ScholarshipEvaluationContext, field: ScholarshipRuleField) {
  if (field === "candidateCategory") return context.candidateCategory;
  if (field === "admissionRoute") return context.admissionRoute;
  return context.profile[field];
}

function isUnknown(value: unknown) {
  return value === null || value === undefined || value === "UNKNOWN";
}

function rulePasses(rule: ScholarshipRule, actual: unknown) {
  if (rule.operator === "EQUALS") return actual === rule.value;
  if (rule.operator === "LTE") return typeof actual === "number" && typeof rule.value === "number" && actual <= rule.value;
  if (rule.operator === "GTE") return typeof actual === "number" && typeof rule.value === "number" && actual >= rule.value;
  return Array.isArray(rule.value) && rule.value.includes(String(actual));
}

function evaluateRule(
  rule: ScholarshipRule,
  context: ScholarshipEvaluationContext,
): ScholarshipRuleResult {
  const actual = contextValue(context, rule.field);
  if (isUnknown(actual)) {
    return {
      ruleId: rule.id,
      status: "UNKNOWN",
      explanation: `We need ${fieldLabel(rule.field)} to evaluate this official rule.`,
    };
  }
  const passed = rulePasses(rule, actual);
  return {
    ruleId: rule.id,
    status: passed ? "PASSED" : "FAILED",
    explanation: passed ? rule.explanation : rule.failureExplanation,
  };
}

function fieldLabel(field: ScholarshipRuleField) {
  const labels: Record<ScholarshipRuleField, string> = {
    nationality: "nationality",
    domicileState: "domicile state",
    studyingState: "state of study",
    familyAnnualIncomeInr: "annual family income",
    studyLevel: "study level",
    courseType: "course type",
    courseMode: "course mode",
    currentStudyYear: "current study year",
    class12Percentage: "Class XII percentage",
    class12BoardPercentile: "Class XII board percentile",
    hostelStatus: "hosteller or day-scholar status",
    disabilityPercentage: "disability percentage",
    isReceivingOtherScholarship: "other-scholarship status",
    isReceivingOtherMaintenanceAllowance: "other maintenance-allowance status",
    familyBeneficiaryCount: "family beneficiary count",
    educationGapYears: "education-gap information",
    attendanceRequirementSatisfied: "attendance-rule status",
    institutionRecognition: "institution recognition",
    institutionOwnership: "institution ownership",
    candidateCategory: "candidate category",
    admissionRoute: "current admission route",
  };
  return labels[field];
}

export function evaluateScheme(
  state: AdmissionSimulationState,
  candidate: Candidate,
  scheme: ScholarshipScheme,
): ScholarshipEvaluation {
  const context = buildScholarshipEvaluationContext(state, candidate);
  const ruleResults = scheme.rules.map((rule) => evaluateRule(rule, context));
  const passedRules = ruleResults.filter((result) => result.status === "PASSED");
  const failedRules = ruleResults.filter((result) => result.status === "FAILED");
  const unknownRules = ruleResults.filter((result) => result.status === "UNKNOWN");
  const status = failedRules.length
    ? "NOT_ELIGIBLE"
    : unknownRules.length || scheme.criteriaCoverage === "PARTIAL"
      ? "POSSIBLY_ELIGIBLE"
      : "ELIGIBLE";
  const requiredDocuments: ScholarshipDocumentReadiness[] = scheme.requiredDocuments.map((requirement) => {
    const record = state.documentPassport.records.find(
      (item) => item.documentType === requirement.documentType,
    );
    const ready = Boolean(
      record && READY_DOCUMENT_STATUSES.includes(
        record.verificationStatus as (typeof READY_DOCUMENT_STATUSES)[number],
      ),
    );
    return {
      documentType: requirement.documentType,
      displayName: requirement.displayName,
      ready,
      verificationStatus: record?.verificationStatus ?? ("NOT_IN_PASSPORT" as const),
      recordId: record?.id ?? null,
    };
  });
  const missingDocuments = requiredDocuments.filter((document) => !document.ready);
  const readyDocumentCount = requiredDocuments.length - missingDocuments.length;
  const applicationReady = status === "ELIGIBLE" && missingDocuments.length === 0 && scheme.documentCoverage === "FULL";
  const nextActions: string[] = [];
  if (unknownRules.length) nextActions.push("Provide the missing profile detail or verify it on the official portal.");
  if (missingDocuments.length) nextActions.push("Review the missing document requirement in My Documents.");
  if (scheme.criteriaCoverage === "PARTIAL" || scheme.documentCoverage === "PARTIAL") {
    nextActions.push("Review the complete official criteria and document list before applying.");
  }
  if (status !== "NOT_ELIGIBLE") nextActions.push(`Continue on the official ${scheme.portal === "NSP" ? "NSP" : "MahaDBT"} portal.`);

  return {
    schemeId: scheme.id,
    status,
    passedRules,
    failedRules,
    unknownRules,
    requiredDocuments,
    missingDocuments,
    readyDocumentCount,
    requiredDocumentCount: requiredDocuments.length,
    applicationReady,
    nextActions,
  };
}

export function evaluateAllSchemes(
  state: AdmissionSimulationState,
  candidate: Candidate,
  schemes: readonly ScholarshipScheme[] = SCHOLARSHIP_SCHEMES,
) {
  return schemes.map((scheme) => evaluateScheme(state, candidate, scheme));
}

export function getScholarshipSummary(
  evaluations: readonly ScholarshipEvaluation[],
): ScholarshipSummary {
  return {
    eligible: evaluations.filter((evaluation) => evaluation.status === "ELIGIBLE").length,
    possiblyEligible: evaluations.filter((evaluation) => evaluation.status === "POSSIBLY_ELIGIBLE").length,
    notEligible: evaluations.filter((evaluation) => evaluation.status === "NOT_ELIGIBLE").length,
    applicationReady: evaluations.filter((evaluation) => evaluation.applicationReady).length,
  };
}

export function updateScholarshipProfile(
  state: AdmissionSimulationState,
  update: ScholarshipProfileUpdate,
  occurredAt: string,
): AdmissionTransitionResult {
  if (
    (update.hostelStatus !== undefined && !HOSTEL_STATUSES.includes(update.hostelStatus)) ||
    (update.class12BoardPercentile !== undefined && update.class12BoardPercentile !== null &&
      (!Number.isFinite(update.class12BoardPercentile) || update.class12BoardPercentile < 0 || update.class12BoardPercentile > 100))
  ) {
    return failure(state, "SCHOLARSHIP_PROFILE_INVALID", "The scholarship profile update is invalid.");
  }
  const next: AdmissionSimulationState = {
    ...state,
    scholarshipNavigator: {
      ...state.scholarshipNavigator,
      profile: {
        ...state.scholarshipNavigator.profile,
        ...update,
        updatedAt: occurredAt,
      },
    },
    updatedAt: occurredAt,
  };
  return isScholarshipNavigatorStateValid(next)
    ? { ok: true, state: next }
    : failure(state, "SCHOLARSHIP_PROFILE_INVALID", "The scholarship profile update failed validation.");
}

export function recordScholarshipPortalHandoff(
  state: AdmissionSimulationState,
  schemeId: string,
  occurredAt: string,
): AdmissionTransitionResult {
  if (!SCHOLARSHIP_SCHEMES.some((scheme) => scheme.id === schemeId)) {
    return failure(state, "SCHOLARSHIP_SCHEME_NOT_FOUND", "The selected scholarship scheme could not be found.");
  }
  const existing = state.scholarshipNavigator.handoffs.some((handoff) => handoff.schemeId === schemeId);
  const handoffs = existing
    ? state.scholarshipNavigator.handoffs.map((handoff) => handoff.schemeId === schemeId
      ? { ...handoff, status: "HANDED_OFF" as const, openedAt: occurredAt }
      : { ...handoff })
    : [...state.scholarshipNavigator.handoffs, { schemeId, status: "HANDED_OFF" as const, openedAt: occurredAt }];
  const next: AdmissionSimulationState = {
    ...state,
    scholarshipNavigator: { ...state.scholarshipNavigator, handoffs },
    updatedAt: occurredAt,
  };
  return isScholarshipNavigatorStateValid(next)
    ? { ok: true, state: next }
    : failure(state, "SCHOLARSHIP_PROFILE_INVALID", "The official-portal handoff could not be recorded.");
}

export function isScholarshipNavigatorStateValid(state: AdmissionSimulationState) {
  const navigator = state.scholarshipNavigator;
  const profile = navigator?.profile;
  if (!navigator || navigator.version !== 1 || !profile || !Array.isArray(navigator.handoffs)) return false;
  if (
    profile.candidateId !== state.candidateId ||
    !profile.isSynthetic ||
    profile.nationality !== "INDIAN" ||
    profile.domicileState !== "MAHARASHTRA" ||
    profile.studyingState !== "MAHARASHTRA" ||
    !Number.isFinite(profile.familyAnnualIncomeInr) ||
    profile.familyAnnualIncomeInr < 0 ||
    !["UNDERGRADUATE", "POSTGRADUATE", "DIPLOMA"].includes(profile.studyLevel) ||
    !["PROFESSIONAL_TECHNICAL", "ARTS", "COMMERCE", "SCIENCE", "LAW"].includes(profile.courseType) ||
    profile.courseMode !== "REGULAR" ||
    !Number.isInteger(profile.currentStudyYear) ||
    profile.currentStudyYear < 1 ||
    !Number.isFinite(profile.class12Percentage) ||
    profile.class12Percentage < 0 ||
    profile.class12Percentage > 100 ||
    (profile.class12BoardPercentile !== null &&
      (!Number.isFinite(profile.class12BoardPercentile) || profile.class12BoardPercentile < 0 || profile.class12BoardPercentile > 100)) ||
    !HOSTEL_STATUSES.includes(profile.hostelStatus) ||
    !Number.isFinite(profile.disabilityPercentage) ||
    profile.disabilityPercentage < 0 ||
    profile.disabilityPercentage > 100 ||
    typeof profile.isReceivingOtherScholarship !== "boolean" ||
    typeof profile.isReceivingOtherMaintenanceAllowance !== "boolean" ||
    !Number.isInteger(profile.familyBeneficiaryCount) ||
    profile.familyBeneficiaryCount < 0 ||
    !Number.isInteger(profile.educationGapYears) ||
    profile.educationGapYears < 0 ||
    typeof profile.attendanceRequirementSatisfied !== "boolean" ||
    profile.institutionRecognition !== "RECOGNIZED" ||
    profile.institutionOwnership !== "NON_PRIVATE_UNIVERSITY" ||
    !profile.updatedAt
  ) return false;

  const validSchemeIds = new Set<string>(SCHOLARSHIP_SCHEMES.map((scheme) => scheme.id));
  const handoffSchemeIds = new Set<string>();
  for (const handoff of navigator.handoffs) {
    if (
      !validSchemeIds.has(handoff.schemeId) ||
      handoff.status !== "HANDED_OFF" ||
      !handoff.openedAt ||
      handoffSchemeIds.has(handoff.schemeId)
    ) return false;
    handoffSchemeIds.add(handoff.schemeId);
  }
  return true;
}

export function cloneScholarshipNavigatorState(
  navigator: ScholarshipNavigatorState,
): ScholarshipNavigatorState {
  return {
    ...navigator,
    profile: { ...navigator.profile },
    handoffs: navigator.handoffs.map((handoff) => ({ ...handoff })),
  };
}
