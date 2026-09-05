import type {
  DocumentConsentScope,
  DocumentPassportState,
  DocumentRecord,
  DocumentRequirementBundle,
} from "@/types";

const CANDIDATE_ID = "candidate-demo-aarya-deshmukh";

export const documentDemoTimestamps = {
  connectProvider: "2026-08-27T10:31:00+05:30",
  shareForAdmission: "2026-08-27T10:42:00+05:30",
  revokeProvider: "2026-08-27T10:48:00+05:30",
} as const;

export const DIGILOCKER_DEMO_SCOPES: readonly DocumentConsentScope[] = [
  "SSC_MARKSHEET",
  "HSC_MARKSHEET",
  "DOMICILE_CERTIFICATE",
  "ENTRANCE_EXAM_RECORDS",
];

export const DOCUMENT_REQUIREMENT_BUNDLES: readonly DocumentRequirementBundle[] = [
  {
    id: "DOCUMENT_PASSPORT",
    displayName: "Admission document passport",
    description: "A broad prototype readiness view across Aarya's admission journey.",
    requiredDocumentTypes: [
      "SSC_MARKSHEET",
      "HSC_MARKSHEET",
      "MHT_CET_SCORECARD",
      "JEE_MAIN_SCORECARD",
      "DOMICILE_CERTIFICATE",
      "INCOME_CERTIFICATE",
    ],
    isPrototypeRequirementSet: true,
  },
  {
    id: "CAP",
    displayName: "CAP document readiness",
    description: "Core synthetic documents used for the CAP readiness demonstration.",
    requiredDocumentTypes: [
      "SSC_MARKSHEET",
      "HSC_MARKSHEET",
      "MHT_CET_SCORECARD",
      "DOMICILE_CERTIFICATE",
    ],
    isPrototypeRequirementSet: true,
  },
  {
    id: "INSTITUTE_REPORTING",
    displayName: "Institute reporting readiness",
    description: "Minimum synthetic set reused for confirmed-seat reporting in this demo.",
    requiredDocumentTypes: [
      "SSC_MARKSHEET",
      "HSC_MARKSHEET",
      "MHT_CET_SCORECARD",
      "DOMICILE_CERTIFICATE",
    ],
    isPrototypeRequirementSet: true,
  },
  {
    id: "SPOT_ROUND",
    displayName: "Spot-round reporting readiness",
    description: "Core synthetic set reused when a participating spot-round offer is received.",
    requiredDocumentTypes: [
      "SSC_MARKSHEET",
      "HSC_MARKSHEET",
      "MHT_CET_SCORECARD",
      "DOMICILE_CERTIFICATE",
    ],
    isPrototypeRequirementSet: true,
  },
] as const;

function record(
  id: string,
  documentType: DocumentRecord["documentType"],
  displayName: string,
  options: Pick<DocumentRecord, "source" | "verificationStatus"> &
    Partial<Pick<DocumentRecord, "issuedBy" | "issuedAt" | "expiresAt" | "accessScope">>,
): DocumentRecord {
  return {
    id,
    candidateId: CANDIDATE_ID,
    documentType,
    displayName,
    source: options.source,
    verificationStatus: options.verificationStatus,
    issuedBy: options.issuedBy,
    issuedAt: options.issuedAt,
    expiresAt: options.expiresAt,
    accessScope: options.accessScope,
    lastSharedAt: null,
    isSynthetic: true,
  };
}

export function createInitialDocumentPassportState(): DocumentPassportState {
  return {
    version: 1,
    records: [
      record("document-ssc", "SSC_MARKSHEET", "SSC Marksheet", {
        source: "DIGILOCKER",
        verificationStatus: "VERIFIED",
        issuedBy: "Maharashtra State Board · synthetic metadata",
        issuedAt: "2024-06-01T09:00:00+05:30",
        accessScope: "SSC_MARKSHEET",
      }),
      record("document-hsc", "HSC_MARKSHEET", "HSC Marksheet", {
        source: "DIGILOCKER",
        verificationStatus: "VERIFIED",
        issuedBy: "Maharashtra State Board · synthetic metadata",
        issuedAt: "2026-05-15T09:00:00+05:30",
        accessScope: "HSC_MARKSHEET",
      }),
      record("document-cet", "MHT_CET_SCORECARD", "MHT-CET Scorecard", {
        source: "DIGILOCKER",
        verificationStatus: "VERIFIED",
        issuedBy: "State Common Entrance Test Cell, Maharashtra · synthetic record",
        issuedAt: "2026-06-16T09:00:00+05:30",
        accessScope: "ENTRANCE_EXAM_RECORDS",
      }),
      record("document-jee", "JEE_MAIN_SCORECARD", "JEE Main Scorecard", {
        source: "DIGILOCKER",
        verificationStatus: "VERIFIED",
        issuedBy: "National Testing Agency · synthetic record",
        issuedAt: "2026-04-20T09:00:00+05:30",
        accessScope: "ENTRANCE_EXAM_RECORDS",
      }),
      record("document-domicile", "DOMICILE_CERTIFICATE", "Domicile Certificate", {
        source: "DIGILOCKER",
        verificationStatus: "VERIFIED",
        issuedBy: "Government of Maharashtra · synthetic metadata",
        issuedAt: "2025-11-10T09:00:00+05:30",
        accessScope: "DOMICILE_CERTIFICATE",
      }),
      record("document-income", "INCOME_CERTIFICATE", "Income Certificate", {
        source: "SYNTHETIC",
        verificationStatus: "MISSING",
      }),
    ],
    providerConnection: {
      provider: "DIGILOCKER_DEMO",
      status: "NOT_CONNECTED",
      grantedScopes: [],
      connectedAt: null,
      revokedAt: null,
    },
    shares: [],
    activity: [],
  };
}
