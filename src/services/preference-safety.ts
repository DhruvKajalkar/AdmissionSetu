import type {
  CandidatePreference,
  CapRoundRule,
  CurrentSeatContext,
  PreferenceConsequence,
  PreferenceReview,
  PreferenceReviewFinding,
} from "@/types";

export function normalizePreferencePositions(
  preferences: readonly CandidatePreference[],
): CandidatePreference[] {
  return preferences.map((preference, index) => ({ ...preference, position: index + 1 }));
}

export function reorderPreferences(
  preferences: readonly CandidatePreference[],
  fromIndex: number,
  toIndex: number,
): CandidatePreference[] {
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= preferences.length ||
    toIndex >= preferences.length ||
    fromIndex === toIndex
  ) {
    return normalizePreferencePositions(preferences);
  }

  const reordered = [...preferences];
  const [moved] = reordered.splice(fromIndex, 1);
  reordered.splice(toIndex, 0, moved);
  return normalizePreferencePositions(reordered);
}

export function reviewPreferenceList(
  preferences: readonly CandidatePreference[],
  rule: CapRoundRule,
): PreferenceReview {
  const findings: PreferenceReviewFinding[] = [];

  if (preferences.length === 0) {
    findings.push({
      id: "empty-preference-list",
      severity: "BLOCKING",
      type: "EMPTY_LIST",
      title: "Add at least one preference",
      explanation: "An empty option form cannot be reviewed or confirmed.",
    });
  }

  const seenProgramIds = new Set<string>();
  preferences.forEach((preference) => {
    if (seenProgramIds.has(preference.programId)) {
      findings.push({
        id: `duplicate-${preference.programId}-${preference.position}`,
        severity: "BLOCKING",
        type: "DUPLICATE_PROGRAM",
        preferenceId: preference.programId,
        position: preference.position,
        title: "Remove the duplicate programme",
        explanation: `The programme at Preference #${preference.position} already appears earlier in the list.`,
      });
    }
    seenProgramIds.add(preference.programId);
  });

  const autoFreezePreferenceLimit = rule.autoFreezePreferenceLimit;
  if (autoFreezePreferenceLimit !== null) {
    preferences.forEach((preference) => {
      if (
        preference.position <= autoFreezePreferenceLimit &&
        preference.acceptanceIntent === "UNSURE"
      ) {
        findings.push({
          id: `unsure-auto-freeze-${preference.programId}-${preference.position}`,
          severity: "CAUTION",
          type: "UNSURE_AUTO_FREEZE",
          preferenceId: preference.programId,
          position: preference.position,
          title: `Review Preference #${preference.position}`,
          explanation: `You marked this choice as “I'm not sure”, but it is inside the ${rule.label} auto-freeze zone. An allotment here would end participation in subsequent CAP rounds.`,
        });
      }
    });
  }

  return {
    findings,
    blockingCount: findings.filter((finding) => finding.severity === "BLOCKING").length,
    cautionCount: findings.filter((finding) => finding.severity === "CAUTION").length,
    autoFreezePreferenceLimit: rule.autoFreezePreferenceLimit,
  };
}

export function getPreferenceConsequence(
  preference: CandidatePreference,
  rule: CapRoundRule,
  currentSeat: CurrentSeatContext | null,
): PreferenceConsequence {
  const autoFrozen =
    rule.autoFreezePreferenceLimit !== null &&
    preference.position <= rule.autoFreezePreferenceLimit;

  return {
    position: preference.position,
    autoFrozen,
    currentSeatEffect: currentSeat === null
      ? "No participating seat is currently held in the demo. This preview does not create or change an admission."
      : currentSeat.kind === "CONNECTED_ADMISSION"
        ? `${currentSeat.instituteShortName} — ${currentSeat.programName} is the current connected demo admission. A future replacement would require a separate confirmed transition; this preview changes nothing.`
        : `${currentSeat.instituteShortName} — ${currentSeat.programName} would be superseded or released according to the admission process once the new allotment is acted upon. This preview does not change that seat.`,
    capStatus: autoFrozen
      ? `Auto-frozen in ${rule.label}`
      : `Not automatically frozen by the first-${rule.autoFreezePreferenceLimit ?? 0} rule`,
    nextRoundStatus: autoFrozen
      ? "Not eligible for a subsequent CAP round under this rule"
      : "May choose Not Freeze / Betterment after accepting the allotted seat, subject to the official process",
  };
}
