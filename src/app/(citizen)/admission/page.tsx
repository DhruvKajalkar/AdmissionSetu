import { AdmissionControl } from "@/components";
import { mockOfficialCatalogService } from "@/services";

export default async function AdmissionPage() {
  const catalog = await mockOfficialCatalogService.getCatalog();
  return <AdmissionControl institutes={catalog.institutes} programs={catalog.programs} />;
}
