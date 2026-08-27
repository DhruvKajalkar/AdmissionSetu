import { VacancyExchange } from "@/components";
import { mockOfficialCatalogService } from "@/services";

export default async function VacanciesPage() {
  const catalog = await mockOfficialCatalogService.getCatalog();
  return <VacancyExchange institutes={catalog.institutes} programs={catalog.programs} />;
}
