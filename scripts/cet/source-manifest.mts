export const DATASET_GENERATED_ON = "2026-09-04";

export const selectedInstituteCodes = [
  "06004", "06139", "06146", "06149", "06155", "06156", "06175", "06177",
  "06178", "06179", "06182", "06183", "06184", "06185", "06187", "06203",
  "06206", "06207", "06271", "06272", "06273", "06274", "06276", "06278",
  "06754", "06822",
  "03012", "03014", "03035", "03036", "03135", "03139", "03148", "03154",
  "03176", "03182", "03184", "03185", "03189", "03190", "03199", "03203",
  "03204", "03207", "03208", "03209", "03211", "03215",
] as const;

export const cetSources = {
  instituteList: {
    id: "fe2025-institute-list",
    title: "Maharashtra CET Cell 2025-26 participating institute list",
    academicYear: "2025-26",
    sourceType: "OFFICIAL_WEB_PAGE",
    url: "https://fe2025.mahacet.org/StaticPages/frmInstituteList",
    retrievedOn: DATASET_GENERATED_ON,
  },
  instituteSummaries: {
    id: "fe2025-institute-summaries",
    title: "Maharashtra CET Cell 2025-26 institute summaries",
    academicYear: "2025-26",
    sourceType: "OFFICIAL_WEB_PAGE",
    urlTemplate: "https://fe2025.mahacet.org/StaticPages/frmInstituteSummary?InstituteCode={code}",
    retrievedOn: DATASET_GENERATED_ON,
  },
  capTwoCutoff: {
    id: "fe2025-cap2-mh-cutoff",
    title: "CAP Round II Maharashtra and Minority Seats Cut Off",
    academicYear: "2025-26",
    round: "CAP Round II",
    sourceType: "OFFICIAL_PDF",
    url: "https://fe2025.mahacet.org/ViewPublicDocument.aspx?MenuId=3475",
    retrievedOn: DATASET_GENERATED_ON,
  },
  capThreeCutoff: {
    id: "fe2025-cap3-mh-cutoff",
    title: "CAP Round III Maharashtra and Minority Seats Cut Off",
    academicYear: "2025-26",
    round: "CAP Round III",
    sourceType: "OFFICIAL_PDF",
    url: "https://fe2025.mahacet.org/ViewPublicDocument.aspx?MenuId=3483",
    retrievedOn: DATASET_GENERATED_ON,
  },
} as const;

