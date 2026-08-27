import { Suspense } from "react";
import type { ReactNode } from "react";
import { AppNavigation, AppNavigationFallback, CitizenProviders, DemoResetControl } from "@/components";
import { createInitialAdmissionSimulationState, demoCandidate, officialPrograms } from "@/data";

export default function CitizenLayout({ children }: { children: ReactNode }) {
  return (
    <CitizenProviders
      initialAdmissionState={createInitialAdmissionSimulationState()}
      initialProgramIds={demoCandidate.preferenceProgramIds}
      validProgramIds={officialPrograms.map((program) => program.choiceCode)}
    >
      <div className="app-shell">
        <Suspense fallback={<AppNavigationFallback />}>
          <AppNavigation />
        </Suspense>
        <div className="app-main">
          <DemoResetControl />
          <main className="page-container">{children}</main>
        </div>
      </div>
    </CitizenProviders>
  );
}
