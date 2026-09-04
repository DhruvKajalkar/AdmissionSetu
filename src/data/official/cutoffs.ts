import type { CutoffSeatType, OfficialCutoffObservation } from "@/types";
import { capThreeCutoffSource } from "./sources.ts";

function cutoff(
  programChoiceCode: string,
  seatType: CutoffSeatType,
  meritNumber: number,
  percentile: number,
): OfficialCutoffObservation {
  return {
    programChoiceCode,
    academicYear: "2024-25",
    round: "CAP Round III",
    seatType,
    meritNumber,
    percentile,
    source: capThreeCutoffSource,
  };
}

export const officialCutoffs = [
  cutoff("0613924510", "GOPENS", 14122, 95.3015716),
  cutoff("0613924610", "GOPENS", 16574, 94.5198836),
  cutoff("0613937210", "GOPENS", 20966, 93.0070517),
  cutoff("0617524510", "GOPENS", 3760, 98.7008251),
  cutoff("0617524610", "GOPENS", 4769, 98.3761174),
  cutoff("0617537210", "GOPENS", 8126, 97.2978705),
  cutoff("0627124510", "GOPENS", 714, 99.7007854),
  cutoff("0627124610", "GOPENS", 1114, 99.5592791),
  cutoff("0627126310", "GOPENS", 1238, 99.5199424),
  cutoff("0627137210", "GOPENS", 2616, 99.069138),
  cutoff("0627184410", "GOPENS", 1726, 99.356188),
  cutoff("0627224510", "GOPENS", 6827, 97.704494),
  cutoff("0627324510", "GOPENS", 2557, 99.0906887),
  cutoff("0627324610", "GOPENS", 4020, 98.6171206),
  cutoff("0627337210", "GOPENS", 8033, 97.3250291),
  cutoff("0627624550F", "LOPENS", 1989, 99.2685866),
  cutoff("0627637250F", "LOPENS", 4049, 98.5995678),
  cutoff("0627824510", "GOPENH", 10827, 96.4178856),
] as const satisfies readonly OfficialCutoffObservation[];
