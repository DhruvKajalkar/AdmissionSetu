export type FormFieldPurpose =
  | "CANDIDATE_NAME"
  | "MHT_CET_PERCENTILE"
  | "CURRENT_INSTITUTE"
  | "CURRENT_PROGRAMME"
  | "DOMICILE_STATE"
  | "CANDIDATE_CATEGORY"
  | "HSC_STATUS"
  | "CET_SCORECARD_STATUS"
  | "INCOME_CERTIFICATE_STATUS"
  | "APPLICATION_REFERENCE"
  | "AADHAAR_IDENTIFIER"
  | "OTP"
  | "PASSWORD"
  | "CVV"
  | "PIN"
  | "BANK_LOGIN"
  | "POLICY_CLASSIFICATION"
  | "OTHER";

export type FormFieldGuidanceStatus =
  | "KNOWN_FROM_PROFILE"
  | "KNOWN_FROM_DOCUMENTS"
  | "KNOWN_FROM_ADMISSION"
  | "UNKNOWN"
  | "USER_MUST_ENTER"
  | "SENSITIVE_DO_NOT_ASSIST"
  | "NEEDS_VERIFICATION";

export type FormFieldConfidence = "HIGH" | "MEDIUM" | "LOW";

export interface DetectedFormField {
  fieldLabel: string;
  detectedPurpose: FormFieldPurpose;
  explanation: string;
  confidence: FormFieldConfidence;
}

export interface FormFieldGuidance extends DetectedFormField {
  status: FormFieldGuidanceStatus;
  suggestedValue?: string;
  source?: string;
  suggestion: string;
  warning?: string;
}

export interface FormGuideContextSnapshot {
  version: 1;
  isSynthetic: true;
  candidate: {
    displayName: string;
    cetPercentile: number;
    category: string;
  };
  currentAdmission: null | {
    instituteName: string;
    programmeName: string;
  };
  domicileState: string;
  documents: Array<{
    documentType: string;
    displayName: string;
    status: string;
  }>;
}

export interface FormGuideResponse {
  summary: string;
  fields: FormFieldGuidance[];
  mode: "OPENAI_VISION";
  notice: string;
}

export interface FormGuideErrorResponse {
  error: string;
  code:
    | "INVALID_REQUEST"
    | "MISSING_IMAGE"
    | "UNSUPPORTED_IMAGE"
    | "IMAGE_TOO_LARGE"
    | "QUESTION_TOO_LONG"
    | "INVALID_CONTEXT"
    | "PROVIDER_UNAVAILABLE";
}
