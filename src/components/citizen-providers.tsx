"use client";

import type { ReactNode } from "react";
import type { AdmissionSimulationState } from "@/types";
import { AdmissionSimulationProvider } from "./admission-simulation-provider";
import { PreferenceShortlistProvider } from "./preference-shortlist";
import { ProgrammeCompareSelectionProvider } from "./programme-compare-selection";

export function CitizenProviders({
  children,
  initialAdmissionState,
  initialProgramIds,
  validProgramIds,
  initialCompareProgramIds,
}: {
  children: ReactNode;
  initialAdmissionState: AdmissionSimulationState;
  initialProgramIds: readonly string[];
  validProgramIds: readonly string[];
  initialCompareProgramIds: readonly string[];
}) {
  return (
    <AdmissionSimulationProvider initialState={initialAdmissionState}>
      <PreferenceShortlistProvider initialProgramIds={initialProgramIds} validProgramIds={validProgramIds}>
        <ProgrammeCompareSelectionProvider initialChoiceCodes={initialCompareProgramIds} validChoiceCodes={validProgramIds}>
          {children}
        </ProgrammeCompareSelectionProvider>
      </PreferenceShortlistProvider>
    </AdmissionSimulationProvider>
  );
}
