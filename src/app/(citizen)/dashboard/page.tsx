import type { Metadata } from "next";
import { DashboardView } from "@/components";
import { demoCandidate } from "@/data";
import { mockOfficialCatalogService } from "@/services";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Review your current seat, admission journey, deadlines and next actions.",
};

export default async function DashboardPage() {
  const catalog = await mockOfficialCatalogService.getCatalog();
  return <DashboardView candidate={demoCandidate} institutes={catalog.institutes} programs={catalog.programs} />;
}
