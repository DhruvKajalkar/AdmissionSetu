"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { normalizePreferencePositions, reorderPreferences } from "@/services/preference-safety";
import type {
  CandidatePreference,
  CapRound,
  ConfirmedPreferenceSubmission,
  PreferenceAcceptanceIntent,
  PreferenceStorageV2,
} from "@/types";

const V1_STORAGE_KEY = "admissionsetu:preference-shortlist:v1";
const V2_STORAGE_KEY = "admissionsetu:candidate-preferences:v2";
const listeners = new Set<() => void>();
let cachedSignature: string | undefined;
let cachedStore: PreferenceStorageV2 | undefined;

interface PreferenceShortlistValue {
  preferences: readonly CandidatePreference[];
  programIds: readonly string[];
  count: number;
  confirmedSubmission: ConfirmedPreferenceSubmission | null;
  confirmationIsCurrent: boolean;
  hasProgram: (choiceCode: string) => boolean;
  addProgram: (choiceCode: string) => void;
  removeProgram: (choiceCode: string) => void;
  moveProgram: (choiceCode: string, targetIndex: number) => void;
  setAcceptanceIntent: (choiceCode: string, intent: PreferenceAcceptanceIntent) => void;
  confirmDemoSubmission: (round: CapRound, confirmedAt: string) => void;
}

const PreferenceShortlistContext = createContext<PreferenceShortlistValue | null>(null);

function safeParse(raw: string | null): unknown {
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

function sanitizePreferences(value: unknown, validProgramIds: ReadonlySet<string>) {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  const preferences: CandidatePreference[] = [];
  value.forEach((item) => {
    if (!item || typeof item !== "object") return;
    const candidate = item as Record<string, unknown>;
    if (typeof candidate.programId !== "string") return;
    if (!validProgramIds.has(candidate.programId) || seen.has(candidate.programId)) return;
    const acceptanceIntent = candidate.acceptanceIntent === "YES" ? "YES" : "UNSURE";
    seen.add(candidate.programId);
    preferences.push({ programId: candidate.programId, position: preferences.length + 1, acceptanceIntent });
  });
  return preferences;
}

function migrateV1Programs(
  rawV1: string | null,
  initialProgramIds: readonly string[],
  validProgramIds: ReadonlySet<string>,
) {
  const parsedV1 = safeParse(rawV1);
  const source = Array.isArray(parsedV1) ? parsedV1 : initialProgramIds;
  const seen = new Set<string>();
  return source.flatMap((value) => {
    if (typeof value !== "string" || !validProgramIds.has(value) || seen.has(value)) return [];
    seen.add(value);
    return [{ programId: value, position: seen.size, acceptanceIntent: "UNSURE" as const }];
  });
}

function sanitizeConfirmation(
  value: unknown,
  validProgramIds: ReadonlySet<string>,
): ConfirmedPreferenceSubmission | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Record<string, unknown>;
  if (
    typeof candidate.id !== "string" ||
    typeof candidate.confirmedAt !== "string" ||
    candidate.acknowledgedAutoFreezeRule !== true ||
    ![1, 2, 3, 4].includes(candidate.round as number)
  ) {
    return null;
  }

  return {
    id: candidate.id,
    round: candidate.round as CapRound,
    confirmedAt: candidate.confirmedAt,
    acknowledgedAutoFreezeRule: true,
    preferences: sanitizePreferences(candidate.preferences, validProgramIds),
  };
}

function createStoreSnapshot(
  rawV2: string | null,
  rawV1: string | null,
  initialProgramIds: readonly string[],
  validProgramIds: readonly string[],
): PreferenceStorageV2 {
  const validSet = new Set(validProgramIds);
  const parsedV2 = safeParse(rawV2);
  if (parsedV2 && typeof parsedV2 === "object" && (parsedV2 as Record<string, unknown>).version === 2) {
    const candidate = parsedV2 as Record<string, unknown>;
    if (!Array.isArray(candidate.preferences)) {
      return {
        version: 2,
        preferences: migrateV1Programs(rawV1, initialProgramIds, validSet),
        confirmedPreferenceSubmission: null,
      };
    }
    return {
      version: 2,
      preferences: sanitizePreferences(candidate.preferences, validSet),
      confirmedPreferenceSubmission: sanitizeConfirmation(candidate.confirmedPreferenceSubmission, validSet),
    };
  }

  return {
    version: 2,
    preferences: migrateV1Programs(rawV1, initialProgramIds, validSet),
    confirmedPreferenceSubmission: null,
  };
}

function readStore(initialProgramIds: readonly string[], validProgramIds: readonly string[]) {
  const rawV2 = localStorage.getItem(V2_STORAGE_KEY);
  const rawV1 = localStorage.getItem(V1_STORAGE_KEY);
  const signature = `${rawV2 ?? "missing-v2"}::${rawV1 ?? "missing-v1"}::${validProgramIds.join(",")}`;
  if (signature === cachedSignature && cachedStore) return cachedStore;
  cachedSignature = signature;
  cachedStore = createStoreSnapshot(rawV2, rawV1, initialProgramIds, validProgramIds);
  return cachedStore;
}

function writeStore(store: PreferenceStorageV2) {
  localStorage.setItem(V2_STORAGE_KEY, JSON.stringify(store));
  cachedSignature = undefined;
  cachedStore = store;
  listeners.forEach((listener) => listener());
}

function preferenceFingerprint(preferences: readonly CandidatePreference[]) {
  return preferences.map((preference) => `${preference.programId}:${preference.acceptanceIntent}`).join("|");
}

export function PreferenceShortlistProvider({
  children,
  initialProgramIds,
  validProgramIds,
}: {
  children: ReactNode;
  initialProgramIds: readonly string[];
  validProgramIds: readonly string[];
}) {
  const serverStore = useMemo<PreferenceStorageV2>(
    () => ({
      version: 2,
      preferences: initialProgramIds
        .filter((programId, index) => validProgramIds.includes(programId) && initialProgramIds.indexOf(programId) === index)
        .map((programId, index) => ({ programId, position: index + 1, acceptanceIntent: "UNSURE" })),
      confirmedPreferenceSubmission: null,
    }),
    [initialProgramIds, validProgramIds],
  );

  const subscribe = useCallback((listener: () => void) => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === V1_STORAGE_KEY || event.key === V2_STORAGE_KEY) {
        cachedSignature = undefined;
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
    () => readStore(initialProgramIds, validProgramIds),
    [initialProgramIds, validProgramIds],
  );
  const getServerSnapshot = useCallback(() => serverStore, [serverStore]);
  const persistedStore = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [hasHydrated, setHasHydrated] = useState(false);
  const store = hasHydrated ? persistedStore : serverStore;

  useEffect(() => {
    const hydrationFrame = window.requestAnimationFrame(() => setHasHydrated(true));
    const parsedV2 = safeParse(localStorage.getItem(V2_STORAGE_KEY));
    if (!parsedV2 || typeof parsedV2 !== "object" || (parsedV2 as Record<string, unknown>).version !== 2) {
      writeStore(readStore(initialProgramIds, validProgramIds));
    }
    return () => window.cancelAnimationFrame(hydrationFrame);
  }, [initialProgramIds, validProgramIds]);

  const preferences = store.preferences;
  const programIds = useMemo(() => preferences.map((preference) => preference.programId), [preferences]);
  const hasProgram = useCallback((choiceCode: string) => programIds.includes(choiceCode), [programIds]);

  const savePreferences = useCallback(
    (nextPreferences: readonly CandidatePreference[]) => {
      writeStore({ ...store, preferences: normalizePreferencePositions(nextPreferences) });
    },
    [store],
  );

  const addProgram = useCallback(
    (choiceCode: string) => {
      if (!validProgramIds.includes(choiceCode) || programIds.includes(choiceCode)) return;
      savePreferences([
        ...preferences,
        { programId: choiceCode, position: preferences.length + 1, acceptanceIntent: "UNSURE" },
      ]);
    },
    [preferences, programIds, savePreferences, validProgramIds],
  );

  const removeProgram = useCallback(
    (choiceCode: string) => savePreferences(preferences.filter((preference) => preference.programId !== choiceCode)),
    [preferences, savePreferences],
  );

  const moveProgram = useCallback(
    (choiceCode: string, targetIndex: number) => {
      const fromIndex = preferences.findIndex((preference) => preference.programId === choiceCode);
      if (fromIndex === -1 || targetIndex < 0 || targetIndex >= preferences.length) return;
      savePreferences(reorderPreferences(preferences, fromIndex, targetIndex));
    },
    [preferences, savePreferences],
  );

  const setAcceptanceIntent = useCallback(
    (choiceCode: string, intent: PreferenceAcceptanceIntent) => {
      savePreferences(
        preferences.map((preference) =>
          preference.programId === choiceCode ? { ...preference, acceptanceIntent: intent } : preference,
        ),
      );
    },
    [preferences, savePreferences],
  );

  const confirmDemoSubmission = useCallback(
    (round: CapRound, confirmedAt: string) => {
      writeStore({
        ...store,
        confirmedPreferenceSubmission: {
          id: `demo-option-form-round-${round}`,
          round,
          confirmedAt,
          acknowledgedAutoFreezeRule: true,
          preferences: normalizePreferencePositions(preferences),
        },
      });
    },
    [preferences, store],
  );

  const confirmationIsCurrent = Boolean(
    store.confirmedPreferenceSubmission &&
      preferenceFingerprint(store.confirmedPreferenceSubmission.preferences) === preferenceFingerprint(preferences),
  );

  const value = useMemo(
    () => ({
      preferences,
      programIds,
      count: preferences.length,
      confirmedSubmission: store.confirmedPreferenceSubmission,
      confirmationIsCurrent,
      hasProgram,
      addProgram,
      removeProgram,
      moveProgram,
      setAcceptanceIntent,
      confirmDemoSubmission,
    }),
    [addProgram, confirmDemoSubmission, confirmationIsCurrent, hasProgram, moveProgram, preferences, programIds, removeProgram, setAcceptanceIntent, store.confirmedPreferenceSubmission],
  );

  return <PreferenceShortlistContext.Provider value={value}>{children}</PreferenceShortlistContext.Provider>;
}

export function usePreferenceShortlist() {
  const context = useContext(PreferenceShortlistContext);
  if (!context) throw new Error("usePreferenceShortlist must be used within PreferenceShortlistProvider");
  return context;
}
