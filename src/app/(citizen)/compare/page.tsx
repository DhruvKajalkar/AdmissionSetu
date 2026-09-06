import type { Metadata } from "next";
import { ProgrammeCompareView } from "@/components";

export const metadata: Metadata = {
  title: "Compare Programmes",
  description: "Compare sourced programme facts and current AdmissionSetu demo context without rankings or admission predictions.",
};

export default function ComparePage() {
  return <ProgrammeCompareView />;
}
