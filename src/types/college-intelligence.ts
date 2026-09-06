export type CollegeDataSourceClass = "OFFICIAL" | "INSTITUTE_REPORTED" | "COMMUNITY";

export interface CollegeDataSource {
  id: string;
  title: string;
  publisher: string;
  url: string;
  sourceClass: CollegeDataSourceClass;
  academicYear?: string;
  retrievedAt: string;
  notes?: string;
}

export interface SourcedCollegeText {
  value: string;
  sourceId: string;
}

export type CollegeFactScope = "INSTITUTE_WIDE" | "PROGRAMME_SPECIFIC" | "DEPARTMENT" | "UNKNOWN";

export interface PlacementDisclosure {
  id: string;
  metric: "PLACED_STUDENTS" | "GRADUATING_STUDENTS" | "MEDIAN_SALARY" | "AVERAGE_SALARY" | "HIGHEST_SALARY" | "PLACEMENT_DRIVES";
  value: number;
  unit: "STUDENTS" | "INR_PER_YEAR" | "LPA" | "DRIVES";
  cohort: string;
  scope: CollegeFactScope;
  sourceId: string;
  programmeChoiceCode?: string;
  limitation?: string;
}

export interface FeeDisclosure {
  id: string;
  amountInr: number;
  academicYear: string;
  feeType: "FIRST_YEAR_TOTAL" | "TUITION_AND_DEVELOPMENT" | "OFFICIAL_REFERENCE";
  categoryScope: string;
  sourceId: string;
  limitation?: string;
}

export interface AccreditationDisclosure {
  id: string;
  kind: "NAAC" | "NBA" | "AUTONOMY" | "NIRF_PARTICIPATION";
  value: string;
  scope: "INSTITUTE_WIDE" | "PROGRAMME_SPECIFIC";
  sourceId: string;
  programmeChoiceCode?: string;
  validThrough?: string;
  academicYear?: string;
  limitation?: string;
}

export interface CampusFacility {
  id: string;
  type: "HOSTEL" | "LIBRARY" | "LAB" | "RESEARCH_CENTER" | "SPORTS" | "TRANSPORT" | "OTHER";
  name: string;
  description?: string;
  sourceId: string;
}

export interface InstituteIntelligence {
  instituteCode: string;
  overview: SourcedCollegeText;
  fees: readonly FeeDisclosure[];
  placementDisclosures: readonly PlacementDisclosure[];
  accreditation: readonly AccreditationDisclosure[];
  facilities: readonly CampusFacility[];
  sourceIds: readonly string[];
  lastVerified: string;
}

export interface ProgrammeIntelligence {
  choiceCode: string;
  instituteCode: string;
  placementDisclosureIds: readonly string[];
  accreditationDisclosureIds: readonly string[];
}

export interface ProgrammeUserContext {
  preferencePosition: number | null;
  isCurrentAdmission: boolean;
  currentAdmissionLabel: string | null;
  syntheticVacancies: number | null;
  meritPosition: number | null;
  meritStatus: string | null;
}

export interface ProgrammeComparisonEntry {
  choiceCode: string;
  programmeName: string;
  instituteCode: string;
  instituteName: string;
  instituteCommonName: string;
  location: string;
  autonomyStatus: string;
  intake: number;
  cutoffs: Array<{
    academicYear: string;
    round: string;
    seatType: string;
    stage: string;
    percentile: number;
    meritNumber: number;
    sourceUrl: string;
  }>;
  fees: readonly FeeDisclosure[];
  institutePlacements: readonly PlacementDisclosure[];
  programmePlacements: readonly PlacementDisclosure[];
  accreditation: readonly AccreditationDisclosure[];
  facilities: readonly CampusFacility[];
  sources: readonly CollegeDataSource[];
  userContext: ProgrammeUserContext;
  labels: {
    publicReference: "Public reference data";
    syntheticState: "Synthetic live demo";
  };
}

export interface ProgrammeComparison {
  entries: ProgrammeComparisonEntry[];
  hasOverallScore: false;
  hasWinner: false;
}
