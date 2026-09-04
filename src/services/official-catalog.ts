import type {
  OfficialCutoffObservation,
  OfficialDatasetMetadata,
  OfficialHistoricalVacancyObservation,
  OfficialInstitute,
  OfficialProgram,
  OfficialSourceReference,
} from "@/types";

export interface OfficialCatalog {
  institutes: readonly OfficialInstitute[];
  programs: readonly OfficialProgram[];
  cutoffs: readonly OfficialCutoffObservation[];
  historicalVacancies: readonly OfficialHistoricalVacancyObservation[];
  metadata: OfficialDatasetMetadata;
  sources: {
    currentPortal: OfficialSourceReference;
    instituteList: OfficialSourceReference;
    cutoffDocument: OfficialSourceReference;
  };
}

export interface OfficialCatalogService {
  getCatalog(): Promise<OfficialCatalog>;
  getInstituteByCode(code: string): Promise<OfficialInstitute | null>;
  getProgramByChoiceCode(choiceCode: string): Promise<OfficialProgram | null>;
}

export interface OfficialCatalogSearchFilters {
  branchFamily?: string;
  location?: string;
  instituteStatus?: string;
  autonomyStatus?: string;
}

const searchSynonyms: Readonly<Record<string, readonly string[]>> = {
  entc: ["electronics", "telecommunication"],
  aids: ["artificial", "intelligence", "data", "science"],
  ai: ["artificial", "intelligence"],
  ds: ["data", "science"],
  cs: ["computer"],
  it: ["information", "technology"],
};

function normalizedSearchTokens(query: string) {
  return query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .flatMap((token) => searchSynonyms[token] ?? [token]);
}

export function searchOfficialPrograms(
  institutes: readonly OfficialInstitute[],
  programs: readonly OfficialProgram[],
  query = "",
  filters: OfficialCatalogSearchFilters = {},
) {
  const instituteByCode = new Map(institutes.map((institute) => [institute.code, institute]));
  const tokens = normalizedSearchTokens(query);
  return programs
    .flatMap((program) => {
      const institute = instituteByCode.get(program.instituteCode);
      if (!institute) return [];
      const haystack = [
        institute.name,
        institute.commonName,
        institute.code,
        ...institute.searchAliases,
        program.name,
        program.choiceCode,
        program.branchFamily,
      ].join(" ").toLowerCase();
      if (
        (tokens.length && !tokens.every((token) => haystack.includes(token)))
        || (filters.branchFamily && program.branchFamily !== filters.branchFamily)
        || (filters.instituteStatus && institute.status !== filters.instituteStatus)
        || (filters.autonomyStatus && institute.autonomyStatus !== filters.autonomyStatus)
        || (filters.location && ![institute.city, institute.district].includes(filters.location))
      ) return [];
      const compactQuery = query.trim().toLowerCase();
      const score = program.choiceCode === compactQuery
        ? 100
        : institute.code === compactQuery
          ? 80
          : institute.name.toLowerCase() === compactQuery
            ? 70
            : institute.commonName.toLowerCase() === compactQuery
              ? 60
            : tokens.filter((token) => `${program.name} ${program.choiceCode}`.toLowerCase().includes(token)).length * 5;
      return [{ program, institute, score }];
    })
    .toSorted((a, b) => b.score - a.score || a.institute.commonName.localeCompare(b.institute.commonName) || a.program.name.localeCompare(b.program.name));
}

export function groupOfficialCutoffs(cutoffs: readonly OfficialCutoffObservation[]) {
  const grouped = new Map<string, OfficialCutoffObservation[]>();
  cutoffs.forEach((cutoff) => {
    const existing = grouped.get(cutoff.programChoiceCode) ?? [];
    existing.push(cutoff);
    grouped.set(cutoff.programChoiceCode, existing);
  });
  grouped.forEach((observations) => observations.sort((a, b) =>
    b.academicYear.localeCompare(a.academicYear)
    || b.round.localeCompare(a.round)
    || a.seatType.localeCompare(b.seatType)
    || a.stage.localeCompare(b.stage)
  ));
  return grouped;
}

export function selectPrimaryCutoff(observations: readonly OfficialCutoffObservation[]) {
  return observations.find((item) => item.seatType === "GOPENS" && item.stage === "I")
    ?? observations.find((item) => item.stage === "I")
    ?? observations[0];
}

export function selectDisplayCutoffs(cutoffs: readonly OfficialCutoffObservation[]) {
  return cutoffs.filter((item) => item.stage === "I" && /^(G|L)OPEN(S|H|O)?$/.test(item.seatType));
}
