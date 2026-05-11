import { useEffect, useState, useCallback } from "react";
import type { Trade, MissedTrade } from "./types";
import { seedTrades, seedMissed } from "./mockData";

const TRADES_KEY = "edgelab.trades.v1";
const MISSED_KEY = "edgelab.missed.v1";

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
  if (typeof window === "undefined") return;
  if (!localStorage.getItem(TRADES_KEY)) write(TRADES_KEY, seedTrades());
  if (!localStorage.getItem(MISSED_KEY)) write(MISSED_KEY, seedMissed());
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

export function exportAll() {
  return JSON.stringify({
    trades: read<Trade[]>(TRADES_KEY, []),
    missed: read<MissedTrade[]>(MISSED_KEY, []),
  }, null, 2);
}

export function importAll(json: string) {
  const data = JSON.parse(json);
  if (data.trades) write(TRADES_KEY, data.trades);
  if (data.missed) write(MISSED_KEY, data.missed);
}

export function clearAll() {
  localStorage.removeItem(TRADES_KEY);
  localStorage.removeItem(MISSED_KEY);
  window.dispatchEvent(new CustomEvent("edgelab:store"));
}
