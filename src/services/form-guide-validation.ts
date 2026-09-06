import type {
  DetectedFormField,
  FormFieldConfidence,
  FormFieldPurpose,
  FormGuideContextSnapshot,
} from "../types/index.ts";
import { FORM_FIELD_PURPOSES } from "./form-guide.ts";

export const FORM_GUIDE_LIMITS = {
  imageBytes: 4 * 1024 * 1024,
  requestBytes: 4 * 1024 * 1024 + 120_000,
  questionCharacters: 300,
  contextCharacters: 20_000,
  detectedFields: 20,
  maxOutputTokens: 1_800,
} as const;

export const FORM_GUIDE_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;

type ValidationFailure = {
  ok: false;
  code: "INVALID_REQUEST" | "MISSING_IMAGE" | "UNSUPPORTED_IMAGE" | "IMAGE_TOO_LARGE" | "QUESTION_TOO_LONG" | "INVALID_CONTEXT";
  error: string;
};

export type FormGuideMetadataValidation = { ok: true; question: string } | ValidationFailure;

function record(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function isFormGuideContextSnapshot(value: unknown): value is FormGuideContextSnapshot {
  if (!record(value) || value.version !== 1 || value.isSynthetic !== true) return false;
  if (!record(value.candidate) || typeof value.candidate.displayName !== "string" || typeof value.candidate.cetPercentile !== "number" || typeof value.candidate.category !== "string") return false;
  if (value.currentAdmission !== null && (!record(value.currentAdmission) || typeof value.currentAdmission.instituteName !== "string" || typeof value.currentAdmission.programmeName !== "string")) return false;
  if (typeof value.domicileState !== "string" || !Array.isArray(value.documents)) return false;
  if (value.documents.some((item) => !record(item) || typeof item.documentType !== "string" || typeof item.displayName !== "string" || typeof item.status !== "string")) return false;
  try {
    return JSON.stringify(value).length <= FORM_GUIDE_LIMITS.contextCharacters;
  } catch {
    return false;
  }
}

export function validateFormGuideMetadata(input: {
  imageCount: number;
  imageType?: string;
  imageSize?: number;
  question?: string;
}): FormGuideMetadataValidation {
  if (input.imageCount === 0) return { ok: false, code: "MISSING_IMAGE", error: "Select one form screenshot to analyze." };
  if (input.imageCount !== 1) return { ok: false, code: "INVALID_REQUEST", error: "Upload exactly one screenshot at a time." };
  if (!input.imageType || !FORM_GUIDE_IMAGE_TYPES.includes(input.imageType as typeof FORM_GUIDE_IMAGE_TYPES[number])) {
    return { ok: false, code: "UNSUPPORTED_IMAGE", error: "Use a PNG, JPEG or WebP screenshot." };
  }
  if (!input.imageSize || input.imageSize > FORM_GUIDE_LIMITS.imageBytes) {
    return { ok: false, code: "IMAGE_TOO_LARGE", error: "Screenshot must be 4 MB or smaller." };
  }
  const question = input.question?.trim() || "Help me fill this form.";
  if (question.length > FORM_GUIDE_LIMITS.questionCharacters) {
    return { ok: false, code: "QUESTION_TOO_LONG", error: `Question must be ${FORM_GUIDE_LIMITS.questionCharacters} characters or fewer.` };
  }
  return { ok: true, question };
}

export function hasSupportedImageSignature(type: string, bytes: Uint8Array) {
  if (type === "image/png") return bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  if (type === "image/jpeg") return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === "image/webp") {
    return bytes.length >= 12
      && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF"
      && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  }
  return false;
}

export function parseFormGuideContext(raw: string): FormGuideContextSnapshot | null {
  if (raw.length > FORM_GUIDE_LIMITS.contextCharacters) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isFormGuideContextSnapshot(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

const confidences: readonly FormFieldConfidence[] = ["HIGH", "MEDIUM", "LOW"];

export function parseDetectedFields(value: unknown): DetectedFormField[] | null {
  if (!record(value) || !Array.isArray(value.fields) || value.fields.length > FORM_GUIDE_LIMITS.detectedFields) return null;
  const fields: DetectedFormField[] = [];
  for (const field of value.fields) {
    if (!record(field)
      || typeof field.fieldLabel !== "string"
      || !field.fieldLabel.trim()
      || field.fieldLabel.length > 160
      || !FORM_FIELD_PURPOSES.includes(field.detectedPurpose as FormFieldPurpose)
      || typeof field.explanation !== "string"
      || field.explanation.length > 500
      || !confidences.includes(field.confidence as FormFieldConfidence)) return null;
    fields.push({
      fieldLabel: field.fieldLabel.trim(),
      detectedPurpose: field.detectedPurpose as FormFieldPurpose,
      explanation: field.explanation.trim(),
      confidence: field.confidence as FormFieldConfidence,
    });
  }
  return fields;
}
