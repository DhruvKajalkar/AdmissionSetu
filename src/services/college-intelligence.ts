import {
  collegeIntelligenceSources,
  instituteIntelligence,
  programmeIntelligence,
} from "../data/college-intelligence.ts";
import { officialCutoffs } from "../data/official/cutoffs.ts";
import { officialInstitutes } from "../data/official/institutes.ts";
import { officialPrograms } from "../data/official/programs.ts";
import type {
  AdmissionSimulationState,
  CandidatePreference,
  OfficialSourceReference,
} from "../types/admissions.ts";
import type {
  CollegeDataSource,
  InstituteIntelligence,
  PlacementDisclosure,
  ProgrammeComparison,
  ProgrammeComparisonEntry,
  ProgrammeIntelligence,
} from "../types/college-intelligence.ts";
import { getProgrammeVacancies } from "./admission-state.ts";
import { getCandidateClearingInterest, getCandidateMeritPosition } from "./clearing-network.ts";
import { groupOfficialCutoffs, selectDisplayCutoffs } from "./official-catalog.ts";

const intelligenceByInstitute = new Map(instituteIntelligence.map((item) => [item.instituteCode, item]));
const intelligenceByProgramme = new Map(programmeIntelligence.map((item) => [item.choiceCode, item]));
const sourceById = new Map(collegeIntelligenceSources.map((item) => [item.id, item]));
const cutoffsByProgramme = groupOfficialCutoffs(selectDisplayCutoffs(officialCutoffs));

export function getInstituteIntelligence(instituteCode: string): InstituteIntelligence | null {
  return intelligenceByInstitute.get(instituteCode) ?? null;
}

export function getProgrammeIntelligence(choiceCode: string): ProgrammeIntelligence | null {
  return intelligenceByProgramme.get(choiceCode) ?? null;
}

export function getCollegeIntelligenceSource(sourceId: string): CollegeDataSource | null {
  return sourceById.get(sourceId) ?? null;
}

export function getCoveredInstituteCodes() {
  return instituteIntelligence.map((item) => item.instituteCode);
}

function officialSource(source: OfficialSourceReference, id: string): CollegeDataSource {
  return {
    id,
    title: source.label,
    publisher: "Maharashtra State Common Entrance Test Cell",
    url: source.url,
    sourceClass: "OFFICIAL",
    academicYear: source.academicYear,
    retrievedAt: source.accessedOn,
  };
}

function currentAdmissionLabel(state: AdmissionSimulationState) {
  const admission = state.currentAdmission;
  if (!admission) return null;
  if (admission.kind === "CONNECTED_ADMISSION") return `${admission.institutionName} — ${admission.programName}`;
  const program = officialPrograms.find((item) => item.choiceCode === admission.programId);
  const institute = program ? officialInstitutes.find((item) => item.code === program.instituteCode) : null;
  return `${institute?.commonName ?? "Institute"} — ${program?.name ?? "Programme"}`;
}

function programmePlacements(profile: InstituteIntelligence, programme: ProgrammeIntelligence | null) {
  const ids = new Set(programme?.placementDisclosureIds ?? []);
  return profile.placementDisclosures.filter((item) =>
    ids.has(item.id) && item.programmeChoiceCode === programme?.choiceCode,
  );
}

function institutePlacements(profile: InstituteIntelligence) {
  return profile.placementDisclosures.filter((item) => item.scope === "INSTITUTE_WIDE");
}

function userContext(
  choiceCode: string,
  state: AdmissionSimulationState,
  preferences: readonly CandidatePreference[],
) {
  const round = state.spotRounds.find((item) => item.programId === choiceCode);
  const merit = round ? getCandidateMeritPosition(state, round.id) : null;
  const interest = round ? getCandidateClearingInterest(state, state.candidateId, round.id) : null;
  return {
    preferencePosition: preferences.find((item) => item.programId === choiceCode)?.position ?? null,
    isCurrentAdmission: state.currentAdmission?.kind === "PARTICIPATING_SEAT" && state.currentAdmission.programId === choiceCode,
    currentAdmissionLabel: currentAdmissionLabel(state),
    syntheticVacancies: round ? getProgrammeVacancies(state, choiceCode) : null,
    meritPosition: merit?.position ?? null,
    meritStatus: interest?.status ?? null,
  };
}

export function buildProgrammeComparison(
  choiceCodes: readonly string[],
  state: AdmissionSimulationState,
  preferences: readonly CandidatePreference[],
): ProgrammeComparison {
  const requested = [...new Set(choiceCodes)].slice(0, 4);
  const entries = requested.flatMap<ProgrammeComparisonEntry>((choiceCode) => {
    const program = officialPrograms.find((item) => item.choiceCode === choiceCode);
    const institute = program ? officialInstitutes.find((item) => item.code === program.instituteCode) : null;
    const profile = institute ? getInstituteIntelligence(institute.code) : null;
    if (!program || !institute || !profile) return [];
    const programmeProfile = getProgrammeIntelligence(choiceCode);
    const cutoffs = (cutoffsByProgramme.get(choiceCode) ?? []).slice(0, 6);
    const sourceIds = new Set([
      ...profile.sourceIds,
      ...profile.fees.map((item) => item.sourceId),
      ...profile.placementDisclosures.map((item) => item.sourceId),
      ...profile.accreditation.map((item) => item.sourceId),
      ...profile.facilities.map((item) => item.sourceId),
    ]);
    const sources = [...sourceIds].flatMap((id) => {
      const source = getCollegeIntelligenceSource(id);
      return source ? [source] : [];
    });
    sources.unshift(officialSource(program.source, `cet-program-${choiceCode}`));
    const cutoffSource = cutoffs[0]?.source;
    if (cutoffSource) sources.push(officialSource(cutoffSource, `cet-cutoff-${choiceCode}`));

    return [{
      choiceCode,
      programmeName: program.name,
      instituteCode: institute.code,
      instituteName: institute.name,
      instituteCommonName: institute.commonName,
      location: `${institute.locality}, ${institute.city}`,
      autonomyStatus: institute.autonomyStatus,
      intake: program.intake,
      cutoffs: cutoffs.map((cutoff) => ({
        academicYear: cutoff.academicYear,
        round: cutoff.round,
        seatType: cutoff.seatType,
        stage: cutoff.stage,
        percentile: cutoff.percentile,
        meritNumber: cutoff.meritNumber,
        sourceUrl: cutoff.source.url,
      })),
      fees: profile.fees,
      institutePlacements: institutePlacements(profile),
      programmePlacements: programmePlacements(profile, programmeProfile),
      accreditation: profile.accreditation.filter((item) =>
        item.scope === "INSTITUTE_WIDE" || item.programmeChoiceCode === choiceCode),
      facilities: profile.facilities,
      sources: [...new Map(sources.map((source) => [source.id, source])).values()],
      userContext: userContext(choiceCode, state, preferences),
      labels: { publicReference: "Public reference data", syntheticState: "Synthetic live demo" },
    }];
  });
  return { entries, hasOverallScore: false, hasWinner: false };
}

export function formatPlacementMetric(metric: PlacementDisclosure) {
  if (metric.unit === "LPA") return `₹${metric.value.toLocaleString("en-IN")} LPA`;
  if (metric.unit === "INR_PER_YEAR") return `₹${metric.value.toLocaleString("en-IN")} per year`;
  if (metric.unit === "DRIVES" && metric.limitation?.includes("lower-bound")) return `${metric.value.toLocaleString("en-IN")}+`;
  return metric.value.toLocaleString("en-IN");
}

export function buildBoundedCollegeAssistantContext(
  state: AdmissionSimulationState,
  preferences: readonly CandidatePreference[],
) {
  const choiceCodes = [
    "0627137210",
    "0627324510",
    "0617591110",
    "0627824510",
    "0615624510",
  ];
  const entries = [
    ...buildProgrammeComparison(choiceCodes.slice(0, 4), state, preferences).entries,
    ...buildProgrammeComparison(choiceCodes.slice(4), state, preferences).entries,
  ];
  return entries.map((entry) => ({
    choiceCode: entry.choiceCode,
    institute: entry.instituteCommonName,
    programme: entry.programmeName,
    intake: entry.intake,
    location: entry.location,
    autonomyStatus: entry.autonomyStatus,
    fee: entry.fees[0] ? {
      amountInr: entry.fees[0].amountInr,
      academicYear: entry.fees[0].academicYear,
      categoryScope: entry.fees[0].categoryScope,
      sourceId: entry.fees[0].sourceId,
    } : null,
    institutePlacements: entry.institutePlacements.slice(0, 3).map((metric) => ({
      metric: metric.metric,
      value: metric.value,
      unit: metric.unit,
      cohort: metric.cohort,
      scope: metric.scope,
      limitation: metric.limitation ?? null,
      sourceId: metric.sourceId,
    })),
    programmePlacements: entry.programmePlacements.slice(0, 3).map((metric) => ({
      metric: metric.metric,
      value: metric.value,
      unit: metric.unit,
      cohort: metric.cohort,
      scope: metric.scope,
      limitation: metric.limitation ?? null,
      sourceId: metric.sourceId,
    })),
    accreditation: entry.accreditation.slice(0, 3).map((item) => ({
      kind: item.kind,
      value: item.value,
      scope: item.scope,
      limitation: item.limitation ?? null,
      sourceId: item.sourceId,
    })),
    facilities: entry.facilities.slice(0, 4).map((item) => ({ type: item.type, name: item.name, sourceId: item.sourceId })),
    latestCutoffObservations: entry.cutoffs.slice(0, 3),
    userContext: entry.userContext,
    sources: entry.sources.slice(0, 6).map((source) => ({
      id: source.id,
      title: source.title,
      sourceClass: source.sourceClass,
      url: source.url,
      academicYear: source.academicYear ?? null,
    })),
  }));
}
