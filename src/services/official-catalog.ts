import type { OfficialCutoffObservation, OfficialInstitute, OfficialProgram, OfficialSourceReference } from "@/types";

export interface OfficialCatalog {
  institutes: readonly OfficialInstitute[];
  programs: readonly OfficialProgram[];
  cutoffs: readonly OfficialCutoffObservation[];
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
