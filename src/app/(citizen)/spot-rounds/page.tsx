import type { Metadata } from "next";
import { SpotRoundDiscovery } from "@/components";
import { officialInstitutes, officialPrograms } from "@/data";

export const metadata: Metadata = {
  title: "Spot Rounds",
  description: "Join centralized demo spot rounds and follow a live merit queue.",
};

export default function SpotRoundsPage() {
  return <SpotRoundDiscovery institutes={officialInstitutes} programs={officialPrograms} />;
}
