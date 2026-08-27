"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";
import type { ReactNode } from "react";

const STORAGE_KEY = "admissionsetu:preference-shortlist:v1";
const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cachedPrograms: readonly string[] = [];

interface PreferenceShortlistValue {
  programIds: readonly string[];
  count: number;
  hasProgram: (choiceCode: string) => boolean;
  addProgram: (choiceCode: string) => void;
}

const PreferenceShortlistContext = createContext<PreferenceShortlistValue | null>(null);

function parseStoredPrograms(raw: string | null, fallback: readonly string[]) {
  if (raw === null) return fallback;
  if (raw === cachedRaw) return cachedPrograms;

  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) return fallback;
    cachedRaw = raw;
    cachedPrograms = [...new Set(value)];
    return cachedPrograms;
  } catch {
    return fallback;
  }
}

function notifySubscribers() {
  listeners.forEach((listener) => listener());
}

function savePrograms(programIds: readonly string[]) {
  const serialized = JSON.stringify(programIds);
  localStorage.setItem(STORAGE_KEY, serialized);
  cachedRaw = serialized;
  cachedPrograms = programIds;
  notifySubscribers();
}

export function PreferenceShortlistProvider({
  children,
  initialProgramIds,
}: {
  children: ReactNode;
  initialProgramIds: readonly string[];
}) {
  const subscribe = useCallback((listener: () => void) => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        cachedRaw = undefined;
        listener();
      }
    };

    listeners.add(listener);
    window.addEventListener("storage", handleStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const getSnapshot = useCallback(
    () => parseStoredPrograms(localStorage.getItem(STORAGE_KEY), initialProgramIds),
    [initialProgramIds],
  );
  const getServerSnapshot = useCallback(() => initialProgramIds, [initialProgramIds]);
  const programIds = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const hasProgram = useCallback((choiceCode: string) => programIds.includes(choiceCode), [programIds]);
  const addProgram = useCallback(
    (choiceCode: string) => {
      if (!programIds.includes(choiceCode)) savePrograms([...programIds, choiceCode]);
    },
    [programIds],
  );

  const value = useMemo(
    () => ({ programIds, count: programIds.length, hasProgram, addProgram }),
    [addProgram, hasProgram, programIds],
  );

  return <PreferenceShortlistContext.Provider value={value}>{children}</PreferenceShortlistContext.Provider>;
}

export function usePreferenceShortlist() {
  const context = useContext(PreferenceShortlistContext);
  if (!context) throw new Error("usePreferenceShortlist must be used within PreferenceShortlistProvider");
  return context;
}
