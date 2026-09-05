import type {
  AssistantContextSnapshot,
  DetectedFormField,
  FormFieldGuidance,
  FormFieldPurpose,
  FormGuideContextSnapshot,
} from "../types/index.ts";

const sensitiveLabelPattern = /\b(otp|one[ -]?time password|password|passcode|cvv|cvc|bank login|internet banking|upi pin|transaction pin|security pin)\b/i;
const policyLabelPattern = /\b(candidature type|minority status|reservation classification|seat type|eligibility declaration)\b/i;

function documentByType(context: FormGuideContextSnapshot, documentType: string) {
  return context.documents.find((document) => document.documentType === documentType);
}

function documentGuidance(
  field: DetectedFormField,
  context: FormGuideContextSnapshot,
  documentType: string,
): FormFieldGuidance {
  const document = documentByType(context, documentType);
  const ready = document && ["VERIFIED", "AVAILABLE"].includes(document.status);
  return {
    ...field,
    status: ready ? "KNOWN_FROM_DOCUMENTS" : "UNKNOWN",
    suggestedValue: ready ? "Verified" : "Not available",
    source: document ? `Document Passport · ${document.displayName}` : "Document Passport",
    suggestion: ready
      ? "The corresponding synthetic document record is verified. Confirm the portal's required format before entering or uploading anything."
      : "AdmissionSetu does not have a ready document for this field. Follow the form's official instructions or obtain the document first.",
    warning: "Verify before entering. AdmissionSetu does not upload documents or submit this form.",
  };
}

function sensitiveGuidance(field: DetectedFormField): FormFieldGuidance {
  return {
    ...field,
    status: "SENSITIVE_DO_NOT_ASSIST",
    suggestion: "Enter this yourself. AdmissionSetu does not access or provide authentication secrets.",
    warning: "Do not share this value or include it in another screenshot.",
  };
}

function mapField(field: DetectedFormField, context: FormGuideContextSnapshot): FormFieldGuidance {
  if (sensitiveLabelPattern.test(field.fieldLabel) || ["OTP", "PASSWORD", "CVV", "PIN", "BANK_LOGIN"].includes(field.detectedPurpose)) {
    return sensitiveGuidance(field);
  }
  if (policyLabelPattern.test(field.fieldLabel) || field.detectedPurpose === "POLICY_CLASSIFICATION") {
    return {
      ...field,
      status: "NEEDS_VERIFICATION",
      suggestion: "I can explain this field, but I cannot determine this classification from the information currently available. Check the official instructions or provide the relevant verified information.",
      warning: "Please confirm this value yourself.",
    };
  }

  switch (field.detectedPurpose) {
    case "CANDIDATE_NAME":
      return {
        ...field,
        status: "KNOWN_FROM_PROFILE",
        suggestedValue: context.candidate.displayName,
        source: "AdmissionSetu profile",
        suggestion: "Use your registered admission name exactly as it appears in the official application.",
        warning: "Verify before entering.",
      };
    case "MHT_CET_PERCENTILE":
      return {
        ...field,
        status: "KNOWN_FROM_PROFILE",
        suggestedValue: context.candidate.cetPercentile.toFixed(2),
        source: "AdmissionSetu profile",
        suggestion: "Use the percentile shown in your official MHT-CET scorecard.",
        warning: "Verify before entering.",
      };
    case "CURRENT_INSTITUTE":
      return context.currentAdmission ? {
        ...field,
        status: "KNOWN_FROM_ADMISSION",
        suggestedValue: context.currentAdmission.instituteName,
        source: "Current accepted admission",
        suggestion: "Use the institute from your current accepted admission if that is what this form requests.",
        warning: "Verify before entering.",
      } : {
        ...field,
        status: "UNKNOWN",
        suggestion: "AdmissionSetu does not currently show an accepted institute.",
        warning: "Please confirm this value yourself.",
      };
    case "CURRENT_PROGRAMME":
      return context.currentAdmission ? {
        ...field,
        status: "KNOWN_FROM_ADMISSION",
        suggestedValue: context.currentAdmission.programmeName,
        source: "Current accepted admission",
        suggestion: "Use the programme from your current accepted admission if that is what this form requests.",
        warning: "Verify before entering.",
      } : {
        ...field,
        status: "UNKNOWN",
        suggestion: "AdmissionSetu does not currently show an accepted programme.",
        warning: "Please confirm this value yourself.",
      };
    case "DOMICILE_STATE": {
      const domicile = documentByType(context, "DOMICILE_CERTIFICATE");
      const verified = domicile && ["VERIFIED", "AVAILABLE"].includes(domicile.status);
      return {
        ...field,
        status: verified ? "KNOWN_FROM_DOCUMENTS" : "NEEDS_VERIFICATION",
        suggestedValue: verified ? context.domicileState : undefined,
        source: verified ? "Verified Domicile Certificate profile" : "Document Passport",
        suggestion: verified
          ? "The synthetic Domicile Certificate profile supports this state. Match the official certificate wording."
          : "Confirm domicile using the official instructions and relevant verified document.",
        warning: "Verify before entering.",
      };
    }
    case "CANDIDATE_CATEGORY":
      return {
        ...field,
        status: "NEEDS_VERIFICATION",
        suggestedValue: context.candidate.category,
        source: "AdmissionSetu profile",
        suggestion: "This is the category recorded in the synthetic profile, but category is policy-sensitive. Match your official application and instructions.",
        warning: "Please confirm this classification yourself.",
      };
    case "HSC_STATUS":
      return documentGuidance(field, context, "HSC_MARKSHEET");
    case "CET_SCORECARD_STATUS":
      return documentGuidance(field, context, "MHT_CET_SCORECARD");
    case "INCOME_CERTIFICATE_STATUS":
      return documentGuidance(field, context, "INCOME_CERTIFICATE");
    case "APPLICATION_REFERENCE":
      return {
        ...field,
        status: "UNKNOWN",
        suggestedValue: "Not available in AdmissionSetu",
        suggestion: "Check your official CET application record. AdmissionSetu will not invent an application reference.",
        warning: "Please confirm this value yourself.",
      };
    case "AADHAAR_IDENTIFIER":
      return {
        ...field,
        status: "USER_MUST_ENTER",
        suggestion: "Enter this yourself only if the official form genuinely requires it. AdmissionSetu does not store or provide the identifier.",
        warning: "Do not share an Aadhaar number in screenshots or chat.",
      };
    default:
      return {
        ...field,
        status: "UNKNOWN",
        suggestion: "I can identify the visible field, but AdmissionSetu has no verified value for it. Check the form instructions or your official record.",
        warning: "Please confirm this value yourself.",
      };
  }
}

export function buildFormGuideContextSnapshot(context: AssistantContextSnapshot): FormGuideContextSnapshot {
  return {
    version: 1,
    isSynthetic: true,
    candidate: {
      displayName: context.candidate.displayName,
      cetPercentile: context.candidate.cetPercentile,
      category: context.candidate.category,
    },
    currentAdmission: context.currentAdmission ? {
      instituteName: context.currentAdmission.instituteShortName,
      programmeName: context.currentAdmission.programName,
    } : null,
    domicileState: context.scholarships.profile.domicileState,
    documents: context.documents.records.map((document) => ({
      documentType: document.documentType,
      displayName: document.displayName,
      status: document.status,
    })),
  };
}

export function mapDetectedFormFields(
  detectedFields: readonly DetectedFormField[],
  context: FormGuideContextSnapshot,
): FormFieldGuidance[] {
  const unique = new Map<string, DetectedFormField>();
  for (const field of detectedFields.slice(0, 20)) {
    const key = `${field.detectedPurpose}:${field.fieldLabel.trim().toLowerCase()}`;
    if (!unique.has(key)) unique.set(key, { ...field, fieldLabel: field.fieldLabel.trim() });
  }
  return [...unique.values()].map((field) => mapField(field, context));
}

export function isSensitiveFormLabel(label: string) {
  return sensitiveLabelPattern.test(label);
}

export function isPolicySensitiveFormLabel(label: string) {
  return policyLabelPattern.test(label);
}

export const FORM_FIELD_PURPOSES: readonly FormFieldPurpose[] = [
  "CANDIDATE_NAME", "MHT_CET_PERCENTILE", "CURRENT_INSTITUTE", "CURRENT_PROGRAMME",
  "DOMICILE_STATE", "CANDIDATE_CATEGORY", "HSC_STATUS", "CET_SCORECARD_STATUS",
  "INCOME_CERTIFICATE_STATUS", "APPLICATION_REFERENCE", "AADHAAR_IDENTIFIER", "OTP",
  "PASSWORD", "CVV", "PIN", "BANK_LOGIN", "POLICY_CLASSIFICATION", "OTHER",
];
