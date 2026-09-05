import type { Metadata } from "next";
import { AdmissionAssistantView } from "@/components";

export const metadata: Metadata = {
  title: "Ask AdmissionSetu",
  description: "Ask grounded, read-only questions about the current synthetic admission journey.",
};

export default function AssistantPage() {
  return <AdmissionAssistantView />;
}
