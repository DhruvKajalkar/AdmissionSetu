"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { demoSimulationTimestamps } from "@/data/admission-simulation";
import {
  acceptSeat,
  confirmExternalAdmission,
  resetAdmissionSimulation,
  sanitizeAdmissionSimulationState,
  withdrawCurrentAdmission,
} from "@/services/admission-state";
import type { AdmissionSimulationState, AdmissionTransitionError } from "@/types";

const STORAGE_KEY = "admissionsetu:admission-simulation:v1";
const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cachedState: AdmissionSimulationState | undefined;

const subscribeToHydration = () => () => undefined;
const getClientHydrationSnapshot = () => true;
const getServerHydrationSnapshot = () => false;

interface AdmissionSimulationValue {
  state: AdmissionSimulationState;
  lastError: AdmissionTransitionError | null;
  withdrawCurrent: () => boolean;
  confirmConnected: (externalAdmissionId: string) => boolean;
  acceptParticipatingSeat: (seatId: string) => boolean;
  resetDemo: () => void;
  clearError: () => void;
}

const AdmissionSimulationContext = createContext<AdmissionSimulationValue | null>(null);

function readState(initialState: AdmissionSimulationState) {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === cachedRaw && cachedState) return cachedState;
  cachedRaw = raw;
  let parsed: unknown = null;
  try {
    parsed = raw ? JSON.parse(raw) : null;
  } catch {
    parsed = null;
  }
  cachedState = sanitizeAdmissionSimulationState(parsed, initialState);
  return cachedState;
}

function writeState(state: AdmissionSimulationState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  cachedRaw = undefined;
  cachedState = state;
  listeners.forEach((listener) => listener());
}

export function AdmissionSimulationProvider({
  children,
  initialState,
}: {
  children: ReactNode;
  initialState: AdmissionSimulationState;
}) {
  const [lastError, setLastError] = useState<AdmissionTransitionError | null>(null);
  const serverState = useMemo(() => resetAdmissionSimulation(initialState), [initialState]);
  const subscribe = useCallback((listener: () => void) => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        cachedRaw = undefined;
        listener();
      }
    };
    listeners.add(listener);
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  }, []);
  const getSnapshot = useCallback(() => readState(initialState), [initialState]);
  const getServerSnapshot = useCallback(() => serverState, [serverState]);
  const persistedState = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const hasHydrated = useSyncExternalStore(
    subscribeToHydration,
    getClientHydrationSnapshot,
    getServerHydrationSnapshot,
  );
  const state = hasHydrated ? persistedState : serverState;

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    let parsed: unknown = null;
    try {
      parsed = raw ? JSON.parse(raw) : null;
    } catch {
      parsed = null;
    }
    const sanitized = sanitizeAdmissionSimulationState(parsed, initialState);
    if (!raw || JSON.stringify(parsed) !== JSON.stringify(sanitized)) writeState(sanitized);
  }, [initialState]);

  const applyResult = useCallback((result: ReturnType<typeof withdrawCurrentAdmission>) => {
    if (!result.ok) {
      setLastError(result.error);
      return false;
    }
    setLastError(null);
    writeState(result.state);
    return true;
  }, []);

  const withdrawCurrent = useCallback(
    () => applyResult(withdrawCurrentAdmission(state, demoSimulationTimestamps.withdrawCurrentSeat)),
    [applyResult, state],
  );
  const confirmConnected = useCallback(
    (externalAdmissionId: string) =>
      applyResult(confirmExternalAdmission(state, externalAdmissionId, demoSimulationTimestamps.confirmConnectedAdmission)),
    [applyResult, state],
  );
  const acceptParticipatingSeat = useCallback(
    (seatId: string) => applyResult(acceptSeat(state, seatId, demoSimulationTimestamps.acceptParticipatingSeat)),
    [applyResult, state],
  );
  const resetDemo = useCallback(() => {
    setLastError(null);
    writeState(resetAdmissionSimulation(initialState));
  }, [initialState]);
  const clearError = useCallback(() => setLastError(null), []);

  const value = useMemo(
    () => ({ state, lastError, withdrawCurrent, confirmConnected, acceptParticipatingSeat, resetDemo, clearError }),
    [acceptParticipatingSeat, clearError, confirmConnected, lastError, resetDemo, state, withdrawCurrent],
  );
  return <AdmissionSimulationContext.Provider value={value}>{children}</AdmissionSimulationContext.Provider>;
}

export function useAdmissionSimulation() {
  const context = useContext(AdmissionSimulationContext);
  if (!context) throw new Error("useAdmissionSimulation must be used within AdmissionSimulationProvider");
  return context;
}
