import { PreferenceList } from "@/components";
import { mockOfficialCatalogService } from "@/services";

export default async function PreferencesPage() {
  const catalog = await mockOfficialCatalogService.getCatalog();
  return <PreferenceList institutes={catalog.institutes} programs={catalog.programs} />;
}
