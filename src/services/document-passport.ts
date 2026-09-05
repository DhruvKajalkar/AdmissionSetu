import {
  DIGILOCKER_DEMO_SCOPES,
  DOCUMENT_REQUIREMENT_BUNDLES,
} from "../data/document-passport.ts";
import type {
  AdmissionSimulationState,
  AdmissionTransitionErrorCode,
  AdmissionTransitionResult,
  DocumentConsentScope,
  DocumentPassportState,
  DocumentRecord,
  DocumentShareRecord,
  DocumentType,
  DocumentWorkflowId,
  DocumentWorkflowReadiness,
} from "@/types";

const READY_STATUSES = ["VERIFIED", "AVAILABLE"] as const;
const DOCUMENT_TYPES: readonly DocumentType[] = [
  "SSC_MARKSHEET",
  "HSC_MARKSHEET",
  "MHT_CET_SCORECARD",
  "JEE_MAIN_SCORECARD",
  "DOMICILE_CERTIFICATE",
  "INCOME_CERTIFICATE",
];
const DOCUMENT_SOURCES = ["DIGILOCKER", "MANUAL", "INSTITUTION", "SYNTHETIC"] as const;
const VERIFICATION_STATUSES = ["NOT_CONNECTED", "AVAILABLE", "VERIFIED", "MISSING", "NEEDS_ATTENTION", "EXPIRED"] as const;
const PROVIDER_STATUSES = ["NOT_CONNECTED", "CONNECTED", "REVOKED"] as const;
const ACTIVITY_TYPES = ["PROVIDER_CONNECTED", "PROVIDER_ACCESS_REVOKED", "DOCUMENTS_SHARED"] as const;

function failure(
  state: AdmissionSimulationState,
  code: AdmissionTransitionErrorCode,
  message: string,
): AdmissionTransitionResult {
  return { ok: false, state, error: { code, message } };
}

function unique<T>(values: readonly T[]) {
  return [...new Set(values)];
}

function requirementBundle(workflowId: DocumentWorkflowId) {
  return DOCUMENT_REQUIREMENT_BUNDLES.find((bundle) => bundle.id === workflowId);
}

export function getDocumentRecord(
  state: AdmissionSimulationState,
  documentType: DocumentType,
) {
  return state.documentPassport.records.find((record) => record.documentType === documentType);
}

export function getWorkflowReadiness(
  state: AdmissionSimulationState,
  workflowId: DocumentWorkflowId,
): DocumentWorkflowReadiness {
  const bundle = requirementBundle(workflowId);
  const requiredTypes = bundle?.requiredDocumentTypes ?? [];
  const records = requiredTypes.map((documentType) => getDocumentRecord(state, documentType));
  const readyCount = records.filter((record) =>
    record && READY_STATUSES.includes(record.verificationStatus as (typeof READY_STATUSES)[number])).length;
  const missingDocumentTypes = requiredTypes.filter((documentType) => {
    const record = getDocumentRecord(state, documentType);
    return !record || record.verificationStatus === "MISSING";
  });
  const attentionDocumentTypes = requiredTypes.filter((documentType) => {
    const record = getDocumentRecord(state, documentType);
    return record && !READY_STATUSES.includes(record.verificationStatus as (typeof READY_STATUSES)[number]) && record.verificationStatus !== "MISSING";
  });

  return {
    workflowId,
    readyCount,
    requiredCount: requiredTypes.length,
    ready: readyCount === requiredTypes.length,
    missingDocumentTypes,
    attentionDocumentTypes,
  };
}

export function getAccessibleDocumentTypes(state: AdmissionSimulationState) {
  const connection = state.documentPassport.providerConnection;
  if (connection.status !== "CONNECTED") return [];
  return state.documentPassport.records
    .filter((record) =>
      record.accessScope &&
      connection.grantedScopes.includes(record.accessScope) &&
      READY_STATUSES.includes(record.verificationStatus as (typeof READY_STATUSES)[number]))
    .map((record) => record.documentType);
}

export function connectDocumentProvider(
  state: AdmissionSimulationState,
  scopes: readonly DocumentConsentScope[],
  occurredAt: string,
): AdmissionTransitionResult {
  const grantedScopes = unique(scopes);
  if (
    grantedScopes.length === 0 ||
    grantedScopes.some((scope) => !DIGILOCKER_DEMO_SCOPES.includes(scope))
  ) {
    return failure(
      state,
      "DOCUMENT_CONSENT_REQUIRED",
      "Select at least one requested document scope before allowing access.",
    );
  }

  const next: AdmissionSimulationState = {
    ...state,
    documentPassport: {
      ...state.documentPassport,
      providerConnection: {
        provider: "DIGILOCKER_DEMO",
        status: "CONNECTED",
        grantedScopes,
        connectedAt: occurredAt,
        revokedAt: null,
      },
      activity: [
        ...state.documentPassport.activity,
        {
          id: `DOCUMENT-ACTIVITY-CONNECT-${state.documentPassport.activity.length + 1}`,
          type: "PROVIDER_CONNECTED",
          occurredAt,
          title: "DigiLocker demo connected",
          description: `Aarya allowed ${grantedScopes.length} selected access scope${grantedScopes.length === 1 ? "" : "s"}.`,
          documentTypes: getDocumentTypesForScopes(state.documentPassport.records, grantedScopes),
        },
      ],
    },
    updatedAt: occurredAt,
  };

  return isDocumentPassportStateValid(next)
    ? { ok: true, state: next }
    : failure(state, "INVALID_STATE", "Connecting the document provider would violate passport invariants.");
}

export function revokeDocumentConsent(
  state: AdmissionSimulationState,
  occurredAt: string,
): AdmissionTransitionResult {
  if (state.documentPassport.providerConnection.status !== "CONNECTED") {
    return failure(state, "DOCUMENT_PROVIDER_NOT_CONNECTED", "DigiLocker demo access is not currently connected.");
  }
  const previouslyAccessible = getAccessibleDocumentTypes(state);
  const next: AdmissionSimulationState = {
    ...state,
    documentPassport: {
      ...state.documentPassport,
      providerConnection: {
        ...state.documentPassport.providerConnection,
        status: "REVOKED",
        grantedScopes: [],
        revokedAt: occurredAt,
      },
      activity: [
        ...state.documentPassport.activity,
        {
          id: `DOCUMENT-ACTIVITY-REVOKE-${state.documentPassport.activity.length + 1}`,
          type: "PROVIDER_ACCESS_REVOKED",
          occurredAt,
          title: "DigiLocker demo access revoked",
          description: "Active AdmissionSetu access was removed. The underlying synthetic document records were not deleted.",
          documentTypes: previouslyAccessible,
        },
      ],
    },
    updatedAt: occurredAt,
  };

  return isDocumentPassportStateValid(next)
    ? { ok: true, state: next }
    : failure(state, "INVALID_STATE", "Revoking document access would violate passport invariants.");
}

export interface ShareDocumentsInput {
  workflowId: "INSTITUTE_REPORTING" | "SPOT_ROUND";
  recipientInstituteCode: string;
  recipientInstituteName: string;
  recipientProgramId: string;
  recipientProgramName: string;
  purpose: string;
}

export function shareDocumentsForPurpose(
  state: AdmissionSimulationState,
  input: ShareDocumentsInput,
  occurredAt: string,
): AdmissionTransitionResult {
  if (
    !input.recipientInstituteCode ||
    !input.recipientInstituteName ||
    !input.recipientProgramId ||
    !input.recipientProgramName ||
    !input.purpose
  ) {
    return failure(state, "DOCUMENT_RECIPIENT_INVALID", "A valid simulated admission recipient is required.");
  }
  if (state.documentPassport.providerConnection.status !== "CONNECTED") {
    return failure(state, "DOCUMENT_PROVIDER_NOT_CONNECTED", "Connect the DigiLocker demo before sharing documents.");
  }

  const readiness = getWorkflowReadiness(state, input.workflowId);
  if (!readiness.ready) {
    return failure(state, "DOCUMENT_REQUIREMENT_NOT_READY", "The required verified document set is incomplete.");
  }

  const bundle = requirementBundle(input.workflowId);
  const documentTypes = [...(bundle?.requiredDocumentTypes ?? [])];
  const accessible = new Set(getAccessibleDocumentTypes(state));
  if (documentTypes.some((documentType) => !accessible.has(documentType))) {
    return failure(
      state,
      "DOCUMENT_CONSENT_REQUIRED",
      "Allow access to every required document before sharing this minimum set.",
    );
  }

  const share: DocumentShareRecord = {
    id: `DOCUMENT-SHARE-${state.documentPassport.shares.length + 1}`,
    candidateId: state.candidateId,
    workflowId: input.workflowId,
    recipientInstituteCode: input.recipientInstituteCode,
    recipientInstituteName: input.recipientInstituteName,
    recipientProgramId: input.recipientProgramId,
    recipientProgramName: input.recipientProgramName,
    documentTypes,
    purpose: input.purpose,
    sharedAt: occurredAt,
    isSynthetic: true,
  };
  const sharedTypeSet = new Set(documentTypes);
  const next: AdmissionSimulationState = {
    ...state,
    documentPassport: {
      ...state.documentPassport,
      records: state.documentPassport.records.map((record) => sharedTypeSet.has(record.documentType)
        ? { ...record, lastSharedAt: occurredAt }
        : { ...record }),
      shares: [...state.documentPassport.shares, share],
      activity: [
        ...state.documentPassport.activity,
        {
          id: `DOCUMENT-ACTIVITY-SHARE-${state.documentPassport.activity.length + 1}`,
          type: "DOCUMENTS_SHARED",
          occurredAt,
          title: `${input.recipientInstituteName} received a demo document set`,
          description: `${documentTypes.length} verified documents shared for ${input.purpose}. No document was uploaded again.`,
          recipientInstituteCode: input.recipientInstituteCode,
          documentTypes,
        },
      ],
    },
    updatedAt: occurredAt,
  };

  return isDocumentPassportStateValid(next)
    ? { ok: true, state: next }
    : failure(state, "INVALID_STATE", "Sharing documents would violate passport invariants.");
}

export function getDocumentActivity(state: AdmissionSimulationState) {
  return [...state.documentPassport.activity].reverse();
}

export function getLatestDocumentShare(
  state: AdmissionSimulationState,
  recipientInstituteCode: string,
  recipientProgramId: string,
) {
  return [...state.documentPassport.shares].reverse().find((share) =>
    share.recipientInstituteCode === recipientInstituteCode &&
    share.recipientProgramId === recipientProgramId);
}

function getDocumentTypesForScopes(
  records: readonly DocumentRecord[],
  scopes: readonly DocumentConsentScope[],
) {
  return records
    .filter((record) => record.accessScope && scopes.includes(record.accessScope))
    .map((record) => record.documentType);
}

export function isDocumentPassportStateValid(state: AdmissionSimulationState) {
  const passport = state.documentPassport;
  if (
    !passport ||
    passport.version !== 1 ||
    !Array.isArray(passport.records) ||
    !Array.isArray(passport.shares) ||
    !Array.isArray(passport.activity)
  ) return false;

  const recordIds = new Set<string>();
  const documentTypes = new Set<DocumentType>();
  for (const record of passport.records) {
    if (
      !record.id ||
      record.candidateId !== state.candidateId ||
      !record.isSynthetic ||
      !DOCUMENT_TYPES.includes(record.documentType) ||
      !DOCUMENT_SOURCES.includes(record.source) ||
      !VERIFICATION_STATUSES.includes(record.verificationStatus) ||
      (record.accessScope !== undefined && !DIGILOCKER_DEMO_SCOPES.includes(record.accessScope)) ||
      recordIds.has(record.id) ||
      documentTypes.has(record.documentType)
    ) return false;
    recordIds.add(record.id);
    documentTypes.add(record.documentType);
  }

  const connection = passport.providerConnection;
  if (!connection || connection.provider !== "DIGILOCKER_DEMO" || !PROVIDER_STATUSES.includes(connection.status)) return false;
  if (unique(connection.grantedScopes).length !== connection.grantedScopes.length) return false;
  if (connection.grantedScopes.some((scope) => !DIGILOCKER_DEMO_SCOPES.includes(scope))) return false;
  if (connection.status === "CONNECTED" && (!connection.connectedAt || connection.revokedAt)) return false;
  if (connection.status !== "CONNECTED" && connection.grantedScopes.length > 0) return false;
  if (connection.status === "REVOKED" && !connection.revokedAt) return false;

  const shareIds = new Set<string>();
  for (const share of passport.shares) {
    if (
      !share.id ||
      shareIds.has(share.id) ||
      share.candidateId !== state.candidateId ||
      !share.isSynthetic ||
      !["INSTITUTE_REPORTING", "SPOT_ROUND"].includes(share.workflowId) ||
      !share.recipientInstituteCode ||
      !share.recipientProgramId ||
      unique(share.documentTypes).length !== share.documentTypes.length ||
      share.documentTypes.some((documentType) => !documentTypes.has(documentType))
    ) return false;
    shareIds.add(share.id);
  }

  const activityIds = new Set<string>();
  for (const activity of passport.activity) {
    if (!activity.id || activityIds.has(activity.id) || !ACTIVITY_TYPES.includes(activity.type)) return false;
    activityIds.add(activity.id);
  }
  return true;
}

export function cloneDocumentPassportState(passport: DocumentPassportState): DocumentPassportState {
  return {
    ...passport,
    records: passport.records.map((record) => ({ ...record })),
    providerConnection: {
      ...passport.providerConnection,
      grantedScopes: [...passport.providerConnection.grantedScopes],
    },
    shares: passport.shares.map((share) => ({ ...share, documentTypes: [...share.documentTypes] })),
    activity: passport.activity.map((activity) => ({ ...activity, documentTypes: [...activity.documentTypes] })),
  };
}
