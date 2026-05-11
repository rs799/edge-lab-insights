import { useEffect, useState, useCallback } from "react";

export interface Preferences {
  styles: string[];
  symbols: string[];
  sessions: string[];
  confluences: string[];
  psychology: string[];
  goals: string[];
  completed: boolean;
  completedAt?: string;
}

const KEY = "edgelab.prefs.v1";

export const DEFAULT_PREFS: Preferences = {
  styles: [],
  symbols: [],
  sessions: [],
  confluences: [],
  psychology: [],
  goals: [],
  completed: false,
};

export function readPrefs(): Preferences {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function writePrefs(p: Preferences) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(p));
  window.dispatchEvent(new CustomEvent("edgelab:prefs"));
}

export function usePreferences() {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFS);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const sync = () => setPrefs(readPrefs());
    sync();
    setLoaded(true);
    window.addEventListener("edgelab:prefs", sync);
    return () => window.removeEventListener("edgelab:prefs", sync);
  }, []);
  const save = useCallback((p: Preferences) => writePrefs(p), []);
  return { prefs, save, loaded };
}
