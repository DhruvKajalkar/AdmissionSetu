import type { OfficialSourceReference } from "@/types";

export const CATALOG_ACCESSED_ON = "2026-09-04";

export const currentFePortalSource: OfficialSourceReference = {
  kind: "OFFICIAL_CET_CELL",
  label: "Maharashtra CET Cell FE 2026 admissions portal",
  academicYear: "2026-27",
  url: "https://fe2026.mahacet.org/StaticPages/HomePage",
  accessedOn: CATALOG_ACCESSED_ON,
  sourceType: "OFFICIAL_WEB_PAGE",
};

export const instituteListSource: OfficialSourceReference = {
  kind: "OFFICIAL_CET_CELL",
  label: "Maharashtra CET Cell participating institutes and intake list",
  academicYear: "2025-26",
  url: "https://fe2025.mahacet.org/StaticPages/frmInstituteList",
  accessedOn: CATALOG_ACCESSED_ON,
  sourceType: "OFFICIAL_WEB_PAGE",
};

export const capThreeCutoffSource: OfficialSourceReference = {
  kind: "OFFICIAL_CET_CELL",
  label: "Maharashtra CET Cell 2025-26 CAP Round III Maharashtra and Minority Seats cutoff list",
  academicYear: "2025-26",
  url: "https://fe2025.mahacet.org/ViewPublicDocument.aspx?MenuId=3483",
  accessedOn: CATALOG_ACCESSED_ON,
  sourceType: "OFFICIAL_PDF",
};

export function instituteSummarySource(instituteCode: string): OfficialSourceReference {
  return {
    kind: "OFFICIAL_CET_CELL",
    label: `Maharashtra CET Cell institute summary ${instituteCode}`,
    academicYear: "2025-26",
    url: `https://fe2025.mahacet.org/StaticPages/frmInstituteSummary?InstituteCode=${instituteCode}`,
    accessedOn: CATALOG_ACCESSED_ON,
    sourceType: "OFFICIAL_WEB_PAGE",
  };
}
