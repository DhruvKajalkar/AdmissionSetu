import type { Metadata } from "next";
import { VacancyExchange } from "@/components";
import { mockOfficialCatalogService } from "@/services";

export const metadata: Metadata = {
  title: "Live Vacancies",
  description: "See synthetic vacancies update from the shared live seat inventory.",
};

export default async function VacanciesPage() {
  const catalog = await mockOfficialCatalogService.getCatalog();
  return <VacancyExchange institutes={catalog.institutes} programs={catalog.programs} />;
}
