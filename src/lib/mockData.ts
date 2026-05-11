import type { Trade, MissedTrade, Session, SetupQuality } from "./types";

const instruments = [
  { name: "E-mini S&P 500", ticker: "ES" },
  { name: "Nasdaq 100", ticker: "NQ" },
  { name: "Gold Futures", ticker: "GC" },
  { name: "Crude Oil", ticker: "CL" },
];
const sessions: Session[] = ["Asia", "London", "NY AM", "NY Lunch", "NY PM"];
const qualities: SetupQuality[] = ["A+", "A", "B", "C"];
const ictPool = ["FVG", "OTE", "liquidity sweep", "SMT divergence", "BOS", "CHOCH", "order block", "displacement", "HTF aligned", "Judas swing", "iFVG", "breaker"];
const psychPool = ["hesitation", "FOMO", "rushed entry", "revenge trade", "lack of confirmation", "early entry"];

function pick<T>(arr: readonly T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function picks<T>(arr: readonly T[], n: number): T[] {
  const a = [...arr].sort(() => Math.random() - 0.5);
  return a.slice(0, n);
}
function rand(min: number, max: number) { return Math.random() * (max - min) + min; }

export function seedTrades(): Trade[] {
  const trades: Trade[] = [];
  const now = Date.now();
  for (let i = 0; i < 64; i++) {
    const ins = pick(instruments);
    const direction = Math.random() > 0.5 ? "long" : "short";
    const quality = pick(qualities);
    // Bias R outcome by quality
    const winChance = quality === "A+" ? 0.78 : quality === "A" ? 0.62 : quality === "B" ? 0.48 : 0.32;
    const win = Math.random() < winChance;
    const r = win ? rand(1, 4.5) : -rand(0.6, 1.1);
    const outcome = Math.abs(r) < 0.2 ? "breakeven" : win ? "win" : "loss";
    const date = new Date(now - i * 86400000 * rand(0.4, 1.2));
    const entry = ins.ticker === "ES" ? rand(4500, 5800) : ins.ticker === "NQ" ? rand(15000, 21000) : ins.ticker === "GC" ? rand(1900, 2400) : rand(60, 95);
    const stopDist = entry * 0.002;
    const stop = direction === "long" ? entry - stopDist : entry + stopDist;
    const target = direction === "long" ? entry + stopDist * 3 : entry - stopDist * 3;
    const exit = direction === "long" ? entry + stopDist * r : entry - stopDist * r;
    trades.push({
      id: `t_${i}_${Math.random().toString(36).slice(2, 8)}`,
      instrument: ins.name,
      ticker: ins.ticker,
      date: date.toISOString().slice(0, 10),
      time: `${String(Math.floor(rand(7, 16))).padStart(2, "0")}:${String(Math.floor(rand(0, 59))).padStart(2, "0")}`,
      session: pick(sessions),
      direction,
      entry: Number(entry.toFixed(2)),
      stop: Number(stop.toFixed(2)),
      target: Number(target.toFixed(2)),
      exit: Number(exit.toFixed(2)),
      rResult: Number(r.toFixed(2)),
      outcome,
      quality,
      ictTags: picks(ictPool, Math.floor(rand(2, 5))),
      psychTags: Math.random() > 0.55 ? picks(psychPool, Math.floor(rand(1, 3))) : [],
      reasoning: "HTF bias aligned, NY AM liquidity sweep into 1H FVG with displacement.",
      execution: win ? "Patient entry on confirmation, scaled out at planned levels." : "Entered too early before displacement confirmed.",
      mistakes: win ? "" : "Skipped checklist; chased the move.",
      lesson: win ? "Process produced positive expectancy." : "Wait for displacement and SMT confirmation.",
      emotion: win ? "calm" : "anxious",
      createdAt: date.toISOString(),
    });
  }
  return trades.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function seedMissed(): MissedTrade[] {
  const arr: MissedTrade[] = [];
  const now = Date.now();
  for (let i = 0; i < 14; i++) {
    const ins = pick(instruments);
    const date = new Date(now - i * 86400000 * 1.5);
    arr.push({
      id: `m_${i}_${Math.random().toString(36).slice(2, 8)}`,
      instrument: ins.name,
      date: date.toISOString().slice(0, 10),
      time: `${String(Math.floor(rand(8, 15))).padStart(2, "0")}:${String(Math.floor(rand(0, 59))).padStart(2, "0")}`,
      session: pick(sessions),
      quality: pick(qualities),
      ictTags: picks(ictPool, Math.floor(rand(2, 4))),
      reason: pick(["hesitated at entry", "not at desk", "waited for extra confirmation", "second-guessed bias"]),
      emotion: pick(["fearful", "uncertain", "distracted", "tired"]),
      wouldHaveWon: Math.random() > 0.35,
      estimatedR: Number(rand(1.2, 4).toFixed(2)),
      lesson: "Trust the checklist when criteria are met.",
      createdAt: date.toISOString(),
    });
  }
  return arr;
}
