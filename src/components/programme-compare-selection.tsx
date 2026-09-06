"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { ReactNode } from "react";

const STORAGE_KEY = "admissionsetu:programme-compare:v1";
const MAX_SELECTIONS = 4;
const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cachedSelection: readonly string[] | undefined;

interface ProgrammeCompareSelectionValue {
  selectedChoiceCodes: readonly string[];
  count: number;
  maximum: number;
  isSelected: (choiceCode: string) => boolean;
  addProgram: (choiceCode: string) => boolean;
  removeProgram: (choiceCode: string) => void;
  toggleProgram: (choiceCode: string) => boolean;
}

const ProgrammeCompareSelectionContext = createContext<ProgrammeCompareSelectionValue | null>(null);

function sanitize(raw: string | null, initialChoiceCodes: readonly string[], validChoiceCodes: readonly string[]) {
  if (raw === cachedRaw && cachedSelection) return cachedSelection;
  let parsed: unknown = null;
  try { parsed = raw ? JSON.parse(raw) : null; } catch { parsed = null; }
  const values = Array.isArray(parsed) ? parsed : initialChoiceCodes;
  const valid = new Set(validChoiceCodes);
  cachedSelection = values.flatMap((value) => typeof value === "string" && valid.has(value) ? [value] : [])
    .filter((value, index, all) => all.indexOf(value) === index)
    .slice(0, MAX_SELECTIONS);
  cachedRaw = raw;
  return cachedSelection;
}

function writeSelection(selection: readonly string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(selection));
  cachedRaw = undefined;
  cachedSelection = selection;
  listeners.forEach((listener) => listener());
}

export function ProgrammeCompareSelectionProvider({
  children,
  initialChoiceCodes,
  validChoiceCodes,
}: {
  children: ReactNode;
  initialChoiceCodes: readonly string[];
  validChoiceCodes: readonly string[];
}) {
  const serverSelection = useMemo(
    () => initialChoiceCodes.filter((code, index) => validChoiceCodes.includes(code) && initialChoiceCodes.indexOf(code) === index).slice(0, MAX_SELECTIONS),
    [initialChoiceCodes, validChoiceCodes],
  );
  const subscribe = useCallback((listener: () => void) => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) { cachedRaw = undefined; listener(); }
    };
    listeners.add(listener);
    window.addEventListener("storage", onStorage);
    return () => { listeners.delete(listener); window.removeEventListener("storage", onStorage); };
  }, []);
  const getSnapshot = useCallback(() => sanitize(localStorage.getItem(STORAGE_KEY), initialChoiceCodes, validChoiceCodes), [initialChoiceCodes, validChoiceCodes]);
  const getServerSnapshot = useCallback(() => serverSelection, [serverSelection]);
  const persisted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [hydrated, setHydrated] = useState(false);
  const selectedChoiceCodes = hydrated ? persisted : serverSelection;

  useEffect(() => {
    const frame = requestAnimationFrame(() => setHydrated(true));
    if (!localStorage.getItem(STORAGE_KEY)) writeSelection(serverSelection);
    return () => cancelAnimationFrame(frame);
  }, [serverSelection]);

  const isSelected = useCallback((choiceCode: string) => selectedChoiceCodes.includes(choiceCode), [selectedChoiceCodes]);
  const addProgram = useCallback((choiceCode: string) => {
    if (selectedChoiceCodes.includes(choiceCode)) return true;
    if (!validChoiceCodes.includes(choiceCode) || selectedChoiceCodes.length >= MAX_SELECTIONS) return false;
    writeSelection([...selectedChoiceCodes, choiceCode]);
    return true;
  }, [selectedChoiceCodes, validChoiceCodes]);
  const removeProgram = useCallback((choiceCode: string) => writeSelection(selectedChoiceCodes.filter((code) => code !== choiceCode)), [selectedChoiceCodes]);
  const toggleProgram = useCallback((choiceCode: string) => {
    if (selectedChoiceCodes.includes(choiceCode)) { removeProgram(choiceCode); return true; }
    return addProgram(choiceCode);
  }, [addProgram, removeProgram, selectedChoiceCodes]);
  const value = useMemo(() => ({ selectedChoiceCodes, count: selectedChoiceCodes.length, maximum: MAX_SELECTIONS, isSelected, addProgram, removeProgram, toggleProgram }), [addProgram, isSelected, removeProgram, selectedChoiceCodes, toggleProgram]);
  return <ProgrammeCompareSelectionContext.Provider value={value}>{children}</ProgrammeCompareSelectionContext.Provider>;
}

export function useProgrammeCompareSelection() {
  const context = useContext(ProgrammeCompareSelectionContext);
  if (!context) throw new Error("useProgrammeCompareSelection must be used within ProgrammeCompareSelectionProvider");
  return context;
}
