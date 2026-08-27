import { SpotRoundDiscovery } from "@/components";
import { officialInstitutes, officialPrograms } from "@/data";

export default function SpotRoundsPage() {
  return <SpotRoundDiscovery institutes={officialInstitutes} programs={officialPrograms} />;
}
