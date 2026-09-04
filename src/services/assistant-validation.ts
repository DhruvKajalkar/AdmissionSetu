import type { AssistantContextSnapshot, AssistantRequest } from "../types/assistant.ts";

export const ASSISTANT_LIMITS = {
  messageCharacters: 500,
  historyMessages: 8,
  historyMessageCharacters: 1_000,
  serializedContextCharacters: 80_000,
  requestCharacters: 100_000,
} as const;

type ValidationResult = { ok: true; value: AssistantRequest } | { ok: false; error: string };

function record(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function isAssistantContextSnapshot(value: unknown): value is AssistantContextSnapshot {
  if (!record(value) || value.version !== 1 || !record(value.candidate) || value.candidate.isSynthetic !== true) return false;
  if (typeof value.candidate.id !== "string" || typeof value.candidate.displayName !== "string") return false;
  if (!record(value.cycle) || !record(value.preferences) || !Array.isArray(value.preferences.items) || !Array.isArray(value.preferences.findings)) return false;
  if (!Array.isArray(value.meritLists) || !Array.isArray(value.vacancies) || !record(value.documents) || !Array.isArray(value.documents.records) || !Array.isArray(value.documents.workflows)) return false;
  if (!record(value.scholarships) || !record(value.scholarships.profile) || !record(value.scholarships.summary) || !Array.isArray(value.scholarships.evaluations)) return false;
  if (value.currentAdmission !== null && !record(value.currentAdmission)) return false;
  if (value.offerProjection !== null && !record(value.offerProjection)) return false;
  try {
    return JSON.stringify(value).length <= ASSISTANT_LIMITS.serializedContextCharacters;
  } catch {
    return false;
  }
}

export function validateAssistantRequest(value: unknown): ValidationResult {
  if (!record(value)) return { ok: false, error: "Request body must be a JSON object." };
  if (typeof value.message !== "string" || !value.message.trim()) return { ok: false, error: "Please enter a question." };
  if (value.message.length > ASSISTANT_LIMITS.messageCharacters) return { ok: false, error: `Question must be ${ASSISTANT_LIMITS.messageCharacters} characters or fewer.` };
  if (!Array.isArray(value.history)) return { ok: false, error: "Conversation history is malformed." };
  if (value.history.length > ASSISTANT_LIMITS.historyMessages) return { ok: false, error: `Conversation history must contain at most ${ASSISTANT_LIMITS.historyMessages} messages.` };
  for (const item of value.history) {
    if (!record(item) || !["user", "assistant"].includes(String(item.role)) || typeof item.content !== "string" || item.content.length > ASSISTANT_LIMITS.historyMessageCharacters) {
      return { ok: false, error: "Conversation history is malformed." };
    }
  }
  if (!isAssistantContextSnapshot(value.context)) return { ok: false, error: "Admission context is malformed or too large." };
  return {
    ok: true,
    value: {
      message: value.message.trim(),
      history: value.history.map((item) => ({ role: item.role as "user" | "assistant", content: item.content })),
      context: value.context,
    },
  };
}
