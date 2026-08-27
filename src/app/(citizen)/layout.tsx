import { Suspense } from "react";
import type { ReactNode } from "react";
import { AppNavigation, AppNavigationFallback, PreferenceShortlistProvider } from "@/components";
import { demoCandidate, officialPrograms } from "@/data";

export default function CitizenLayout({ children }: { children: ReactNode }) {
  return (
    <PreferenceShortlistProvider
      initialProgramIds={demoCandidate.preferenceProgramIds}
      validProgramIds={officialPrograms.map((program) => program.choiceCode)}
    >
      <div className="app-shell">
        <Suspense fallback={<AppNavigationFallback />}>
          <AppNavigation />
        </Suspense>
        <div className="app-main">
          <div className="prototype-banner" role="status">
            Hackathon prototype · Candidate, admission, vacancy, and seat states are synthetic. Explorer catalog sources are labelled.
          </div>
          <main className="page-container">{children}</main>
        </div>
      </div>
    </PreferenceShortlistProvider>
  );
}
