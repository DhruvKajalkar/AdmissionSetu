import type { CapRoundRule, OfficialSourceReference } from "@/types";
import { CATALOG_ACCESSED_ON } from "./sources";

export const capRoundThreeRuleSource: OfficialSourceReference = {
  kind: "OFFICIAL_CET_CELL",
  label: "Maharashtra CET Cell FE 2026–27 Round III seat-acceptance schedule",
  academicYear: "2026-27",
  url: "https://fe2026.mahacet.org/StaticPages/HomePage",
  accessedOn: CATALOG_ACCESSED_ON,
};

export const capRoundThreeRule: CapRoundRule = {
  round: 3,
  label: "CAP Round III",
  autoFreezePreferenceLimit: 6,
  bettermentAvailableAfterRound: true,
  finalRound: false,
  explanation:
    "An allotment within the first six preferences is automatically frozen. An allotment outside the first six may continue through Not Freeze / Betterment after the allotted seat is accepted, subject to the official process.",
  source: capRoundThreeRuleSource,
};
