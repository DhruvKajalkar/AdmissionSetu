import { CollegeExplorer } from "@/components";
import { mockCandidateService, mockOfficialCatalogService } from "@/services";

export default async function ExplorePage() {
  const [catalog, candidate] = await Promise.all([
    mockOfficialCatalogService.getCatalog(),
    mockCandidateService.getDemoCandidate(),
  ]);

  return (
    <CollegeExplorer
      institutes={catalog.institutes}
      programs={catalog.programs}
      cutoffs={catalog.cutoffs}
      sources={catalog.sources}
      candidate={{
        name: candidate.fullName,
        cetPercentile: candidate.cetPercentile,
        category: candidate.category,
        homeUniversity: candidate.homeUniversity,
      }}
    />
  );
}
