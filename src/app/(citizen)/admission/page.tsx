import type { Metadata } from "next";
import { AdmissionControl } from "@/components";
import { mockOfficialCatalogService } from "@/services";

export const metadata: Metadata = {
  title: "My Admission",
  description: "Review your one current admission and its seat-release history.",
};

export default async function AdmissionPage() {
  const catalog = await mockOfficialCatalogService.getCatalog();
  return <AdmissionControl institutes={catalog.institutes} programs={catalog.programs} />;
}
