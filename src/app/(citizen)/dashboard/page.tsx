import { DashboardView } from "@/components";
import { demoCandidate } from "@/data";
import { mockOfficialCatalogService } from "@/services";

export default async function DashboardPage() {
  const catalog = await mockOfficialCatalogService.getCatalog();
  return <DashboardView candidate={demoCandidate} institutes={catalog.institutes} programs={catalog.programs} />;
}
