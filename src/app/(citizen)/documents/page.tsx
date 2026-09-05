import type { Metadata } from "next";
import { DocumentPassportView } from "@/components";

export const metadata: Metadata = {
  title: "My Documents",
  description: "Review AdmissionSetu's synthetic verified-document passport and consent history.",
};

export default function DocumentsPage() {
  return <DocumentPassportView />;
}
