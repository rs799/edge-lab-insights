export type Session = "Asia" | "London" | "NY AM" | "NY Lunch" | "NY PM";
export type Direction = "long" | "short";
export type Outcome = "win" | "loss" | "breakeven";
export type SetupQuality = "A+" | "A" | "B" | "C";

export const ICT_TAGS = [
  "FVG", "iFVG", "liquidity sweep", "SMT divergence", "OTE", "BOS", "CHOCH",
  "displacement", "order block", "breaker", "mitigation block", "HTF aligned",
  "counter-trend", "continuation", "reversal", "liquidity run", "session sweep",
  "equilibrium", "Judas swing",
] as const;

export const PSYCH_TAGS = [
  "hesitation", "emotional", "revenge trade", "rushed entry", "FOMO", "fear",
  "boredom trade", "overtrading", "late entry", "early entry", "lack of confirmation",
] as const;

export const SESSIONS: Session[] = ["Asia", "London", "NY AM", "NY Lunch", "NY PM"];

export interface Trade {
  id: string;
  screenshot?: string;
  instrument: string;
  ticker: string;
  date: string; // ISO
  time: string; // HH:mm
  session: Session;
  direction: Direction;
  entry: number;
  stop: number;
  target: number;
  exit: number;
  rResult: number;
  outcome: Outcome;
  quality: SetupQuality;
  ictTags: string[];
  psychTags: string[];
  reasoning?: string;
  execution?: string;
  mistakes?: string;
  lesson?: string;
  emotion?: string;
  createdAt: string;
}

export interface MissedTrade {
  id: string;
  screenshot?: string;
  instrument: string;
  date: string;
  time: string;
  session: Session;
  quality: SetupQuality;
  ictTags: string[];
  reason: string;
  emotion: string;
  wouldHaveWon: boolean;
  estimatedR: number;
  lesson: string;
  createdAt: string;
}
