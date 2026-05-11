import { useEffect, useState, useCallback } from "react";
import type { Trade, MissedTrade } from "./types";

const TRADES_KEY = "edgelab.trades.v2";
const MISSED_KEY = "edgelab.missed.v2";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent("edgelab:store"));
}

export function ensureSeed() {
  // Intentionally no seeding — new users start with an empty workspace.
}

export function useTrades() {
  const [trades, setTrades] = useState<Trade[]>([]);
  useEffect(() => {
    ensureSeed();
    const sync = () => setTrades(read<Trade[]>(TRADES_KEY, []));
    sync();
    window.addEventListener("edgelab:store", sync);
    return () => window.removeEventListener("edgelab:store", sync);
  }, []);

  const add = useCallback((t: Trade) => {
    const cur = read<Trade[]>(TRADES_KEY, []);
    write(TRADES_KEY, [t, ...cur]);
  }, []);
  const update = useCallback((t: Trade) => {
    const cur = read<Trade[]>(TRADES_KEY, []);
    write(TRADES_KEY, cur.map((x) => (x.id === t.id ? t : x)));
  }, []);
  const remove = useCallback((id: string) => {
    const cur = read<Trade[]>(TRADES_KEY, []);
    write(TRADES_KEY, cur.filter((x) => x.id !== id));
  }, []);
  return { trades, add, update, remove };
}

export function useMissed() {
  const [missed, setMissed] = useState<MissedTrade[]>([]);
  useEffect(() => {
    ensureSeed();
    const sync = () => setMissed(read<MissedTrade[]>(MISSED_KEY, []));
    sync();
    window.addEventListener("edgelab:store", sync);
    return () => window.removeEventListener("edgelab:store", sync);
  }, []);

  const add = useCallback((m: MissedTrade) => {
    const cur = read<MissedTrade[]>(MISSED_KEY, []);
    write(MISSED_KEY, [m, ...cur]);
  }, []);
  const remove = useCallback((id: string) => {
    const cur = read<MissedTrade[]>(MISSED_KEY, []);
    write(MISSED_KEY, cur.filter((x) => x.id !== id));
  }, []);
  return { missed, add, remove };
}

const PREFS_KEY = "edgelab.prefs.v1";
const THEME_KEY = "edgelab.theme";

export function exportAll() {
  const payload = {
    version: 2,
    exportedAt: new Date().toISOString(),
    app: "EdgeLab",
    trades: read<Trade[]>(TRADES_KEY, []),
    missed: read<MissedTrade[]>(MISSED_KEY, []),
    preferences: typeof window !== "undefined" ? JSON.parse(localStorage.getItem(PREFS_KEY) || "null") : null,
    settings: {
      theme: typeof window !== "undefined" ? localStorage.getItem(THEME_KEY) : null,
    },
  };
  return JSON.stringify(payload, null, 2);
}

export function importAll(json: string) {
  const data = JSON.parse(json);
  if (!data || typeof data !== "object") throw new Error("Invalid backup");
  if (Array.isArray(data.trades)) write(TRADES_KEY, data.trades);
  if (Array.isArray(data.missed)) write(MISSED_KEY, data.missed);
  if (data.preferences && typeof data.preferences === "object") {
    localStorage.setItem(PREFS_KEY, JSON.stringify(data.preferences));
    window.dispatchEvent(new CustomEvent("edgelab:prefs"));
  }
  if (data.settings?.theme) {
    localStorage.setItem(THEME_KEY, data.settings.theme);
    document.documentElement.classList.toggle("light", data.settings.theme !== "dark");
  }
  window.dispatchEvent(new CustomEvent("edgelab:store"));
}

export function clearAll() {
  localStorage.removeItem(TRADES_KEY);
  localStorage.removeItem(MISSED_KEY);
  window.dispatchEvent(new CustomEvent("edgelab:store"));
}
