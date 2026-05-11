import type { Trade } from "./types";

export interface Stats {
  total: number;
  wins: number;
  losses: number;
  breakevens: number;
  winRate: number;
  totalR: number;
  avgR: number;
  avgWin: number;
  avgLoss: number;
  expectancy: number;
  profitFactor: number;
  maxDrawdown: number;
  bestTrade: number;
  worstTrade: number;
}

export function computeStats(trades: Trade[]): Stats {
  const wins = trades.filter((t) => t.outcome === "win");
  const losses = trades.filter((t) => t.outcome === "loss");
  const bes = trades.filter((t) => t.outcome === "breakeven");
  const totalR = trades.reduce((s, t) => s + t.rResult, 0);
  const winSum = wins.reduce((s, t) => s + t.rResult, 0);
  const lossSum = Math.abs(losses.reduce((s, t) => s + t.rResult, 0));
  const winRate = trades.length ? wins.length / trades.length : 0;
  const avgWin = wins.length ? winSum / wins.length : 0;
  const avgLoss = losses.length ? -lossSum / losses.length : 0;
  const expectancy = winRate * avgWin + (1 - winRate) * avgLoss;
  const profitFactor = lossSum ? winSum / lossSum : winSum > 0 ? Infinity : 0;

  // Drawdown on chronological order
  const sorted = [...trades].sort((a, b) => (a.date < b.date ? -1 : 1));
  let peak = 0, eq = 0, dd = 0;
  for (const t of sorted) {
    eq += t.rResult;
    if (eq > peak) peak = eq;
    const cur = peak - eq;
    if (cur > dd) dd = cur;
  }

  return {
    total: trades.length,
    wins: wins.length,
    losses: losses.length,
    breakevens: bes.length,
    winRate,
    totalR,
    avgR: trades.length ? totalR / trades.length : 0,
    avgWin,
    avgLoss,
    expectancy,
    profitFactor,
    maxDrawdown: dd,
    bestTrade: trades.length ? Math.max(...trades.map((t) => t.rResult)) : 0,
    worstTrade: trades.length ? Math.min(...trades.map((t) => t.rResult)) : 0,
  };
}

export function equityCurve(trades: Trade[]) {
  const sorted = [...trades].sort((a, b) => (a.date < b.date ? -1 : 1));
  let eq = 0, peak = 0;
  return sorted.map((t, i) => {
    eq += t.rResult;
    if (eq > peak) peak = eq;
    return { i: i + 1, date: t.date, equity: Number(eq.toFixed(2)), drawdown: Number((eq - peak).toFixed(2)) };
  });
}

export function groupByStat<K extends string>(trades: Trade[], keyFn: (t: Trade) => K | K[]) {
  const groups = new Map<K, Trade[]>();
  for (const t of trades) {
    const k = keyFn(t);
    const keys = Array.isArray(k) ? k : [k];
    for (const kk of keys) {
      if (!groups.has(kk)) groups.set(kk, []);
      groups.get(kk)!.push(t);
    }
  }
  return Array.from(groups.entries()).map(([key, arr]) => ({ key, stats: computeStats(arr), count: arr.length }));
}

export function monthlyPerformance(trades: Trade[]) {
  const m = new Map<string, number>();
  for (const t of trades) {
    const k = t.date.slice(0, 7);
    m.set(k, (m.get(k) ?? 0) + t.rResult);
  }
  return Array.from(m.entries()).sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([month, r]) => ({ month, r: Number(r.toFixed(2)) }));
}
