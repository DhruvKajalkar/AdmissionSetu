import type { Metadata } from "next";
import { OperationsView } from "@/components";
import { officialInstitutes, officialPrograms } from "@/data";

export const metadata: Metadata = {
  title: "Merit Clearing Operations",
  description: "Prototype operations view for AdmissionSetu's synthetic merit clearing network.",
};

export default function OperationsPage() {
  return <OperationsView institutes={officialInstitutes} programs={officialPrograms} />;
}
