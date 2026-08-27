import { PreferenceBuilder } from "@/components";
import { capRoundThreeRule, demoAdmissionCycle } from "@/data";
import { mockOfficialCatalogService } from "@/services";

export default async function PreferencesPage() {
  const catalog = await mockOfficialCatalogService.getCatalog();

  return (
    <PreferenceBuilder
      institutes={catalog.institutes}
      programs={catalog.programs}
      cutoffs={catalog.cutoffs}
      rule={capRoundThreeRule}
      cycle={demoAdmissionCycle}
    />
  );
}
