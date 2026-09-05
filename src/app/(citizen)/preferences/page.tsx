import type { Metadata } from "next";
import { PreferenceBuilder } from "@/components";
import { capRoundThreeRule, demoAdmissionCycle } from "@/data";
import { mockOfficialCatalogService } from "@/services";
import { selectDisplayCutoffs } from "@/services/official-catalog";

export const metadata: Metadata = {
  title: "My Preferences",
  description: "Arrange CAP preferences and review auto-freeze consequences before confirming the demo form.",
};

export default async function PreferencesPage() {
  const catalog = await mockOfficialCatalogService.getCatalog();

  return (
    <PreferenceBuilder
      institutes={catalog.institutes}
      programs={catalog.programs}
      cutoffs={selectDisplayCutoffs(catalog.cutoffs)}
      rule={capRoundThreeRule}
      cycle={demoAdmissionCycle}
    />
  );
}
