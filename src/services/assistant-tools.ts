import { capRoundThreeRule } from "../data/official/cap-rules.ts";
import { officialCutoffs } from "../data/official/cutoffs.ts";
import { officialInstitutes } from "../data/official/institutes.ts";
import { officialPrograms } from "../data/official/programs.ts";
import type { AssistantAction, AssistantContextSnapshot, AssistantSource } from "../types/assistant.ts";
import { groupOfficialCutoffs, searchOfficialPrograms, selectPrimaryCutoff } from "./official-catalog.ts";

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

const cutoffsByProgram = groupOfficialCutoffs(officialCutoffs);

function catalogQuery(query: string) {
  const ignored = new Set(["about", "college", "colleges", "institute", "institutes", "programme", "programmes", "program", "programs", "show", "tell", "what", "which", "the", "is", "are", "have", "has", "historical", "cutoff", "cutoffs", "context", "data", "do", "we", "our", "in", "for"]);
  return query.toLowerCase().replace(/\bour data\b/g, "").split(/[^a-z0-9]+/).filter((term) => term && !ignored.has(term)).join(" ");
}

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

  const normalized = catalogQuery(query);
  const programs = searchOfficialPrograms(officialInstitutes, officialPrograms, normalized).flatMap(({ program, institute }) => {
    if (!institute) return [];
    const allCutoffs = cutoffsByProgram.get(program.choiceCode) ?? [];
    const primaryCutoff = selectPrimaryCutoff(allCutoffs);
    const otherRoundPrimary = primaryCutoff
      ? allCutoffs.find((cutoff) => cutoff.round !== primaryCutoff.round && cutoff.seatType === "GOPENS" && cutoff.stage === "I")
      : undefined;
    const preferred = [primaryCutoff, otherRoundPrimary].filter((cutoff) => cutoff !== undefined);
    const representativeCutoffs = primaryCutoff
      ? [...preferred, ...allCutoffs.filter((cutoff) => !preferred.includes(cutoff))].slice(0, 12)
      : [];
    return [{
      choiceCode: program.choiceCode,
      programme: program.name,
      institute: institute.name,
      instituteCommonName: institute.commonName,
      instituteCode: program.instituteCode,
      district: institute.district,
      intake: program.intake,
      cutoffs: representativeCutoffs.map((cutoff) => ({
        academicYear: cutoff.academicYear,
        round: cutoff.round,
        seatType: cutoff.seatType,
        stage: cutoff.stage,
        candidature: cutoff.candidature,
        admissionType: cutoff.admissionType,
        meritNumber: cutoff.meritNumber,
        percentile: cutoff.percentile,
        source: { label: cutoff.source.label, url: cutoff.source.url },
      })),
    }];
  }).slice(0, 8);
  const instituteSource: AssistantSource = {
    id: `cet-official-catalog-${programs[0]?.instituteCode ?? "search"}`,
    label: "Maharashtra CET Cell static local reference catalog",
    kind: "OFFICIAL",
    url: programs[0]
      ? officialPrograms.find((program) => program.choiceCode === programs[0].choiceCode)?.source.url
      : capRoundThreeRule.source.url,
  };
  const cutoffSources = programs.flatMap((program) => program.cutoffs).map((cutoff) => ({
    id: `cet-cutoff-${cutoff.academicYear}-${cutoff.round}`,
    label: cutoff.source.label,
    kind: "OFFICIAL" as const,
    url: cutoff.source.url,
  }));
  return result(name, { query, normalizedQuery: normalized, matches: programs }, [instituteSource, ...cutoffSources], [{ label: "Open College Explorer", href: "/explore" }]);
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
