import type { Metadata } from "next";
import { ScholarshipNavigatorView } from "@/components";

export const metadata: Metadata = {
  title: "Scholarships & Financial Aid",
  description: "Explore explainable scholarship eligibility and document readiness using AdmissionSetu's synthetic admission profile.",
};

export default function ScholarshipsPage() {
  return <ScholarshipNavigatorView />;
}
