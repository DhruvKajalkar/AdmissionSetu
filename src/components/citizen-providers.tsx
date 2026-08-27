"use client";

import type { ReactNode } from "react";
import type { AdmissionSimulationState } from "@/types";
import { AdmissionSimulationProvider } from "./admission-simulation-provider";
import { PreferenceShortlistProvider } from "./preference-shortlist";

export function CitizenProviders({
  children,
  initialAdmissionState,
  initialProgramIds,
  validProgramIds,
}: {
  children: ReactNode;
  initialAdmissionState: AdmissionSimulationState;
  initialProgramIds: readonly string[];
  validProgramIds: readonly string[];
}) {
  return (
    <AdmissionSimulationProvider initialState={initialAdmissionState}>
      <PreferenceShortlistProvider initialProgramIds={initialProgramIds} validProgramIds={validProgramIds}>
        {children}
      </PreferenceShortlistProvider>
    </AdmissionSimulationProvider>
  );
}
