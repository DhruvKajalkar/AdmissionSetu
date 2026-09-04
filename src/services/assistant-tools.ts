import { capRoundThreeRule } from "../data/official/cap-rules.ts";
import { officialCutoffs } from "../data/official/cutoffs.ts";
import { officialInstitutes } from "../data/official/institutes.ts";
import { officialPrograms } from "../data/official/programs.ts";
import type { AssistantAction, AssistantContextSnapshot, AssistantSource } from "../types/assistant.ts";

export const ASSISTANT_READ_ONLY_TOOL_NAMES = [
  "get_current_admission",
  "get_preference_safety",
  "get_active_merit_lists",
  "get_offer_consequences",
  "get_document_readiness",
  "get_scholarship_matches",
  "get_cap_rule",
  "search_official_catalog",
] as const;

export type AssistantReadOnlyToolName = (typeof ASSISTANT_READ_ONLY_TOOL_NAMES)[number];

export interface AssistantToolResult {
  name: AssistantReadOnlyToolName;
  data: unknown;
  sources: AssistantSource[];
  actions: AssistantAction[];
}

const demoSource: AssistantSource = {
  id: "admissionsetu-demo-state",
  label: "Your current AdmissionSetu demo state",
  kind: "DEMO_STATE",
};

const capSource: AssistantSource = {
  id: "cet-cap-round-three",
  label: capRoundThreeRule.source.label,
  kind: "OFFICIAL",
  url: capRoundThreeRule.source.url,
};

function result(name: AssistantReadOnlyToolName, data: unknown, sources: AssistantSource[], actions: AssistantAction[] = []): AssistantToolResult {
  return { name, data, sources, actions };
}

export function runAssistantTool(
  name: AssistantReadOnlyToolName,
  context: AssistantContextSnapshot,
  query = "",
): AssistantToolResult {
  if (name === "get_current_admission") {
    return result(name, context.currentAdmission, [demoSource], [{ label: "View Current Admission", href: "/admission" }]);
  }
  if (name === "get_preference_safety") {
    return result(name, { cycle: context.cycle, ...context.preferences }, [demoSource, capSource], [{ label: "Review Preferences", href: "/preferences" }]);
  }
  if (name === "get_active_merit_lists") {
    const lists = context.meritLists
      .filter((list) => list.position !== null || ["ACCEPTED", "CLOSED_AFTER_ACCEPTANCE"].includes(list.interestStatus))
      .sort((a, b) => (a.position ?? Number.POSITIVE_INFINITY) - (b.position ?? Number.POSITIVE_INFINITY));
    return result(name, lists, [demoSource, { id: "merit-clearing-model", label: "AdmissionSetu prototype merit-clearing model", kind: "PROTOTYPE_RULE" }], [{ label: "View Spot Rounds", href: "/spot-rounds" }]);
  }
  if (name === "get_offer_consequences") {
    return result(name, context.offerProjection, [demoSource, { id: "clearing-transition-model", label: "AdmissionSetu prototype seat-transition logic", kind: "PROTOTYPE_RULE" }], [{ label: "Open VIT Offer", href: "/spot-rounds" }]);
  }
  if (name === "get_document_readiness") {
    return result(name, context.documents, [demoSource, { id: "document-requirements", label: "AdmissionSetu prototype document requirement sets", kind: "PROTOTYPE_RULE" }], [{ label: "Open My Documents", href: "/documents" }]);
  }
  if (name === "get_scholarship_matches") {
    const sources = context.scholarships.evaluations.map((evaluation) => ({
      id: `scheme-${evaluation.schemeId}`,
      label: evaluation.sourceTitle,
      kind: "OFFICIAL" as const,
      url: evaluation.sourceUrl,
    }));
    return result(name, context.scholarships, [demoSource, ...sources], [{ label: "Open Scholarships", href: "/scholarships" }]);
  }
  if (name === "get_cap_rule") {
    return result(name, {
      round: capRoundThreeRule.round,
      label: capRoundThreeRule.label,
      autoFreezePreferenceLimit: capRoundThreeRule.autoFreezePreferenceLimit,
      bettermentAvailableAfterRound: capRoundThreeRule.bettermentAvailableAfterRound,
      explanation: capRoundThreeRule.explanation,
    }, [capSource], [{ label: "Review Preferences", href: "/preferences" }]);
  }

  const normalized = query.trim().toLowerCase();
  const searchTerms = normalized.split(/[^a-z0-9]+/).filter((term) =>
    term.length >= 3 && !["about", "college", "institute", "programme", "program", "show", "tell", "what", "which"].includes(term));
  const programs = officialPrograms.flatMap((program) => {
    const institute = officialInstitutes.find((item) => item.code === program.instituteCode);
    const haystack = [program.choiceCode, program.name, institute?.name, institute?.commonName, ...(institute?.searchAliases ?? [])].join(" ").toLowerCase();
    if (normalized && !haystack.includes(normalized) && !searchTerms.some((term) => haystack.includes(term))) return [];
    return [{
      choiceCode: program.choiceCode,
      programme: program.name,
      institute: institute?.name ?? "Unavailable",
      instituteCode: program.instituteCode,
      intake: program.intake,
      cutoffs: officialCutoffs.filter((cutoff) => cutoff.programChoiceCode === program.choiceCode).map((cutoff) => ({
        academicYear: cutoff.academicYear,
        round: cutoff.round,
        seatType: cutoff.seatType,
        percentile: cutoff.percentile,
      })),
    }];
  }).slice(0, 8);
  const officialSource: AssistantSource = {
    id: "cet-official-catalog",
    label: "Maharashtra CET Cell curated local reference catalog",
    kind: "OFFICIAL",
    url: programs[0]
      ? officialPrograms.find((program) => program.choiceCode === programs[0].choiceCode)?.source.url
      : capRoundThreeRule.source.url,
  };
  return result(name, { query, matches: programs }, [officialSource], [{ label: "Open College Explorer", href: "/explore" }]);
}

function includesAny(message: string, terms: string[]) {
  return terms.some((term) => message.includes(term));
}

export function selectAssistantTools(message: string): AssistantReadOnlyToolName[] {
  const normalized = message.toLowerCase();
  const tools = new Set<AssistantReadOnlyToolName>();
  if (includesAny(normalized, ["admission", "seat", "hold", "aissms", "vit", "accept", "offer", "spot round"])) tools.add("get_current_admission");
  if (includesAny(normalized, ["accept", "offer", "happen", "release", "other spot", "competing", "vit"])) tools.add("get_offer_consequences");
  if (includesAny(normalized, ["preference", "top six", "first six", "freeze", "risky", "cap rule"])) tools.add("get_preference_safety");
  if (includesAny(normalized, ["rule", "source", "where does", "cap round"])) tools.add("get_cap_rule");
  if (includesAny(normalized, ["merit", "position", "queue", "highest", "spot round", "pict", "pccoe", "mmcoe"])) tools.add("get_active_merit_lists");
  if (includesAny(normalized, ["document", "missing", "reporting", "digilocker", "consent", "ready"])) tools.add("get_document_readiness");
  if (includesAny(normalized, ["scholarship", "financial aid", "eligible", "panjabrao", "mahadbt", "nsp"])) tools.add("get_scholarship_matches");
  if (includesAny(normalized, ["college", "institute", "programme", "program", "choice code", "cutoff", "catalog"])) tools.add("search_official_catalog");
  return [...tools];
}

export function runToolsForMessage(message: string, context: AssistantContextSnapshot): AssistantToolResult[] {
  return selectAssistantTools(message).map((name) => runAssistantTool(name, context, message));
}

export function uniqueSources(results: readonly AssistantToolResult[]) {
  return [...new Map(results.flatMap((item) => item.sources).map((source) => [source.id, source])).values()];
}

export function uniqueActions(results: readonly AssistantToolResult[]) {
  return [...new Map(results.flatMap((item) => item.actions).map((action) => [action.href, action])).values()];
}
