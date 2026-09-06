export type AssistantSourceKind = "OFFICIAL" | "INSTITUTE_REPORTED" | "DEMO_STATE" | "PROTOTYPE_RULE";

export interface AssistantSource {
  id: string;
  label: string;
  kind: AssistantSourceKind;
  url?: string;
}

export interface AssistantAction {
  label: string;
  href: string;
}

export interface AssistantAnswer {
  answer: string;
  sources: AssistantSource[];
  actions: AssistantAction[];
  mode: "OPENAI" | "DETERMINISTIC_DEMO";
  notice?: string;
}

export interface AssistantHistoryMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AssistantContextSnapshot {
  version: 1;
  candidate: {
    id: string;
    displayName: string;
    isSynthetic: true;
    cetPercentile: number;
    jeePercentile: number;
    category: string;
  };
  cycle: {
    currentRound: number;
    roundLabel: string;
  };
  alerts: {
    actionableCount: number;
    highestPriority: Array<{
      priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
      title: string;
      message: string;
      dueLabel: string | null;
      actionLabel: string | null;
      actionHref: string | null;
      source: string;
    }>;
  };
  currentAdmission: null | {
    kind: "PARTICIPATING_SEAT" | "CONNECTED_ADMISSION";
    instituteName: string;
    instituteShortName: string;
    programName: string;
    route: string;
    seatState: string;
    bettermentStatus: string;
  };
  preferences: {
    items: Array<{
      position: number;
      choiceCode: string;
      instituteName: string;
      programName: string;
      acceptanceIntent: "YES" | "UNSURE";
    }>;
    autoFreezePreferenceLimit: number | null;
    findings: Array<{ severity: string; title: string; explanation: string; position?: number }>;
  };
  meritLists: Array<{
    roundId: string;
    instituteName: string;
    instituteShortName: string;
    programName: string;
    position: number | null;
    candidatesAhead: number | null;
    interestStatus: string;
    offerStatus: string | null;
  }>;
  vacancies: Array<{
    programId: string;
    instituteName: string;
    programName: string;
    available: number;
  }>;
  documents: {
    verifiedCount: number;
    totalCount: number;
    records: Array<{ documentType: string; displayName: string; status: string }>;
    providerStatus: string;
    consentGranted: boolean;
    workflows: Array<{
      workflowId: string;
      ready: boolean;
      readyCount: number;
      requiredCount: number;
      missingDocumentTypes: string[];
      attentionDocumentTypes: string[];
    }>;
  };
  scholarships: {
    profile: {
      familyAnnualIncomeInr: number;
      hostelStatus: string;
      class12BoardPercentile: number | null;
      domicileState: string;
    };
    summary: {
      eligible: number;
      possiblyEligible: number;
      notEligible: number;
      applicationReady: number;
    };
    evaluations: Array<{
      schemeId: string;
      schemeName: string;
      status: string;
      applicationReady: boolean;
      unknownReasons: string[];
      failedReasons: string[];
      missingDocuments: string[];
      sourceTitle: string;
      sourceUrl: string;
    }>;
  };
  collegeIntelligence: Array<{
    choiceCode: string;
    institute: string;
    programme: string;
    intake: number;
    location: string;
    autonomyStatus: string;
    fee: null | { amountInr: number; academicYear: string; categoryScope: string; sourceId: string };
    institutePlacements: Array<{ metric: string; value: number; unit: string; cohort: string; scope: string; limitation: string | null; sourceId: string }>;
    programmePlacements: Array<{ metric: string; value: number; unit: string; cohort: string; scope: string; limitation: string | null; sourceId: string }>;
    accreditation: Array<{ kind: string; value: string; scope: string; limitation: string | null; sourceId: string }>;
    facilities: Array<{ type: string; name: string; sourceId: string }>;
    latestCutoffObservations: Array<{ academicYear: string; round: string; seatType: string; stage: string; percentile: number; meritNumber: number; sourceUrl: string }>;
    userContext: {
      preferencePosition: number | null;
      isCurrentAdmission: boolean;
      currentAdmissionLabel: string | null;
      syntheticVacancies: number | null;
      meritPosition: number | null;
      meritStatus: string | null;
    };
    sources: Array<{ id: string; title: string; sourceClass: "OFFICIAL" | "INSTITUTE_REPORTED" | "COMMUNITY"; url: string; academicYear: string | null }>;
  }>;
  offerProjection: null | {
    state: "AVAILABLE_TO_SIMULATE" | "AWAITING_DECISION" | "ALREADY_ACCEPTED" | "UNAVAILABLE";
    roundId: string;
    offerId: string | null;
    newAdmission: string;
    previousAdmission: string | null;
    previousSeatReleased: boolean;
    closedRoundIds: string[];
    affectedQueueCount: number;
    releasedVacancyBefore: number | null;
    releasedVacancyAfter: number | null;
  };
}

export interface AssistantRequest {
  message: string;
  history: AssistantHistoryMessage[];
  context: AssistantContextSnapshot;
}
