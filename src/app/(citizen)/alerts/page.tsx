import type { Metadata } from "next";
import { ActionCenterView } from "@/components";

export const metadata: Metadata = {
  title: "Action Center",
  description: "Deadlines, offers and next steps from your current admission journey.",
};

export default function AlertsPage() {
  return <ActionCenterView />;
}
