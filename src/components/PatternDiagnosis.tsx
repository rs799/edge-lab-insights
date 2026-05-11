import { useMemo } from "react";
import type { Trade, MissedTrade } from "@/lib/types";
import { computeStats, groupByStat } from "@/lib/analytics";
import { cn } from "@/lib/utils";

type Severity = "good" | "warn" | "bad" | "info";

interface Pattern {
  id: string;
  severity: Severity;
  title: string;
  detail: string;
  metric?: string;
  evidence: string;
  suggestion: string;
}

const MIN_SAMPLE = 4;

function detectPatterns(trades: Trade[], missed: MissedTrade[]): Pattern[] {
  const out: Pattern[] = [];
  if (trades.length < 5) return out;

  // 1. Best / worst ICT setup (need sample size)
  const byTag = groupByStat(trades, (t) => t.ictTags).filter((g) => g.count >= MIN_SAMPLE);
  const tagBest = [...byTag].sort((a, b) => b.stats.expectancy - a.stats.expectancy)[0];
  const tagWorst = [...byTag].sort((a, b) => a.stats.expectancy - b.stats.expectancy)[0];
  if (tagBest && tagBest.stats.expectancy > 0.3) {
    out.push({
      id: "edge-tag",
      severity: "good",
      title: `Your edge: ${tagBest.key}`,
      detail: `${tagBest.key} setups produce your highest expectancy.`,
      metric: `+${tagBest.stats.expectancy.toFixed(2)}R`,
      evidence: `${tagBest.count} trades · ${(tagBest.stats.winRate * 100).toFixed(0)}% WR · PF ${isFinite(tagBest.stats.profitFactor) ? tagBest.stats.profitFactor.toFixed(2) : "∞"}`,
      suggestion: `Filter your watchlist for ${tagBest.key} conditions. Size up on A+ instances.`,
    });
  }
  if (tagWorst && tagWorst.stats.expectancy < -0.2 && tagWorst.key !== tagBest?.key) {
    out.push({
      id: "leak-tag",
      severity: "bad",
      title: `Bleeding setup: ${tagWorst.key}`,
      detail: `${tagWorst.key} consistently loses money.`,
      metric: `${tagWorst.stats.expectancy.toFixed(2)}R`,
      evidence: `${tagWorst.count} trades · ${(tagWorst.stats.winRate * 100).toFixed(0)}% WR · ${tagWorst.stats.totalR.toFixed(2)}R net`,
      suggestion: `Stop trading ${tagWorst.key} for 2 weeks. Backtest before re-introducing.`,
    });
  }

  // 2. Psychology damage
  const byPsych = groupByStat(trades, (t) => t.psychTags).filter((g) => g.count >= 3);
  const psychWorst = [...byPsych].sort((a, b) => a.stats.expectancy - b.stats.expectancy)[0];
  if (psychWorst && psychWorst.stats.expectancy < -0.1) {
    out.push({
      id: "psych",
      severity: "bad",
      title: `Behavioral leak: ${psychWorst.key}`,
      detail: `Trades flagged "${psychWorst.key}" cost you across the sample.`,
      metric: `${psychWorst.stats.totalR.toFixed(2)}R lost`,
      evidence: `${psychWorst.count} trades · avg ${psychWorst.stats.expectancy.toFixed(2)}R`,
      suggestion: `Add a pre-trade checkbox: "Am I about to ${psychWorst.key}?" If yes — skip.`,
    });
  }

  // 3. Clean-execution comparison
  const clean = trades.filter((t) => t.psychTags.length === 0);
  const dirty = trades.filter((t) => t.psychTags.length > 0);
  if (clean.length >= 5 && dirty.length >= 3) {
    const c = computeStats(clean);
    const d = computeStats(dirty);
    const delta = c.expectancy - d.expectancy;
    if (delta > 0.3) {
      out.push({
        id: "clean-vs-dirty",
        severity: "info",
        title: "Clean execution outperforms",
        detail: `Trades with zero psychology flags expectancy is ${delta.toFixed(2)}R higher than flagged trades.`,
        metric: `+${delta.toFixed(2)}R gap`,
        evidence: `Clean: ${c.expectancy.toFixed(2)}R (n=${clean.length}) · Flagged: ${d.expectancy.toFixed(2)}R (n=${dirty.length})`,
        suggestion: "Your edge IS process. Cut every trade that requires a psych tag.",
      });
    }
  }

  // 4. Session timing
  const bySess = groupByStat(trades, (t) => t.session).filter((g) => g.count >= MIN_SAMPLE);
  const sessBest = [...bySess].sort((a, b) => b.stats.expectancy - a.stats.expectancy)[0];
  const sessWorst = [...bySess].sort((a, b) => a.stats.expectancy - b.stats.expectancy)[0];
  if (sessBest && sessWorst && sessBest.stats.expectancy - sessWorst.stats.expectancy > 0.5) {
    out.push({
      id: "session",
      severity: "warn",
      title: `Session asymmetry: ${sessBest.key} vs ${sessWorst.key}`,
      detail: `${sessBest.key} returns ${sessBest.stats.expectancy.toFixed(2)}R but ${sessWorst.key} returns ${sessWorst.stats.expectancy.toFixed(2)}R per trade.`,
      metric: `${(sessBest.stats.expectancy - sessWorst.stats.expectancy).toFixed(2)}R spread`,
      evidence: `${sessBest.key} n=${sessBest.count} · ${sessWorst.key} n=${sessWorst.count}`,
      suggestion: `Restrict trading to ${sessBest.key}. Treat ${sessWorst.key} as observation only.`,
    });
  }

  // 5. Quality discipline
  const byQ = groupByStat(trades, (t) => t.quality);
  const aplus = byQ.find((g) => g.key === "A+");
  const cTier = byQ.find((g) => g.key === "C");
  if (aplus && aplus.count >= 3 && aplus.stats.expectancy > 0.5) {
    out.push({
      id: "aplus",
      severity: "good",
      title: "A+ setups are working",
      detail: `Your highest-conviction reads pay out as expected.`,
      metric: `+${aplus.stats.expectancy.toFixed(2)}R`,
      evidence: `${aplus.count} A+ trades · ${(aplus.stats.winRate * 100).toFixed(0)}% WR`,
      suggestion: "Increase position size on A+ only — current data justifies it.",
    });
  }
  if (cTier && cTier.count >= 3 && cTier.stats.expectancy < 0) {
    out.push({
      id: "ctier",
      severity: "warn",
      title: "C-grade trades drag the curve",
      detail: `Low-conviction trades have negative expectancy.`,
      metric: `${cTier.stats.totalR.toFixed(2)}R net`,
      evidence: `${cTier.count} C trades · ${(cTier.stats.winRate * 100).toFixed(0)}% WR`,
      suggestion: "Add a hard rule: no C-grade trades. Wait for the setup.",
    });
  }

  // 6. Direction bias
  const longs = trades.filter((t) => t.direction === "long");
  const shorts = trades.filter((t) => t.direction === "short");
  if (longs.length >= 5 && shorts.length >= 5) {
    const lS = computeStats(longs);
    const sS = computeStats(shorts);
    const diff = Math.abs(lS.expectancy - sS.expectancy);
    if (diff > 0.4) {
      const better = lS.expectancy > sS.expectancy ? "long" : "short";
      const worse = better === "long" ? "short" : "long";
      out.push({
        id: "direction",
        severity: "warn",
        title: `Directional bias: better at ${better}s`,
        detail: `${better} trades materially outperform ${worse}s.`,
        metric: `${diff.toFixed(2)}R gap`,
        evidence: `Longs: ${lS.expectancy.toFixed(2)}R (n=${longs.length}) · Shorts: ${sS.expectancy.toFixed(2)}R (n=${shorts.length})`,
        suggestion: `Audit ${worse} entries — likely entering against HTF flow.`,
      });
    }
  }

  // 7. Drawdown / streak
  const sorted = [...trades].sort((a, b) => (a.date < b.date ? -1 : 1));
  let streak = 0, maxLoss = 0;
  for (const t of sorted) {
    if (t.outcome === "loss") { streak++; maxLoss = Math.max(maxLoss, streak); }
    else if (t.outcome === "win") streak = 0;
  }
  if (maxLoss >= 4) {
    out.push({
      id: "streak",
      severity: "warn",
      title: `Worst losing streak: ${maxLoss} in a row`,
      detail: "Plan for variance — define a daily/weekly stop.",
      metric: `${maxLoss}L`,
      evidence: `Across ${trades.length} trades`,
      suggestion: `After 3 consecutive losses, stop trading for the day.`,
    });
  }

  // 8. Missed-trade pattern
  if (missed.length >= 3) {
    const wouldWin = missed.filter((m) => m.wouldHaveWon);
    const missedR = wouldWin.reduce((s, m) => s + m.estimatedR, 0);
    if (wouldWin.length / missed.length > 0.5 && missedR > 2) {
      out.push({
        id: "missed",
        severity: "info",
        title: "Missed trades skew to winners",
        detail: `${wouldWin.length}/${missed.length} of trades you skipped would have won.`,
        metric: `+${missedR.toFixed(1)}R left on table`,
        evidence: "Hesitation, not bad reads, is costing you.",
        suggestion: "Pre-commit entry triggers the night before. Execute on trigger, not feel.",
      });
    }
  }

  return out;
}

const SEVERITY_STYLES: Record<Severity, { ring: string; chip: string; label: string; dot: string }> = {
  good: { ring: "border-bull/40", chip: "bg-bull/10 text-bull", label: "EDGE", dot: "bg-bull" },
  warn: { ring: "border-amber-500/40", chip: "bg-amber-500/10 text-amber-400", label: "WATCH", dot: "bg-amber-400" },
  bad:  { ring: "border-bear/40", chip: "bg-bear/10 text-bear", label: "LEAK", dot: "bg-bear" },
  info: { ring: "border-primary/40", chip: "bg-primary/10 text-primary", label: "INSIGHT", dot: "bg-primary" },
};

export function PatternDiagnosis({ trades, missed }: { trades: Trade[]; missed: MissedTrade[] }) {
  const patterns = useMemo(() => detectPatterns(trades, missed), [trades, missed]);

  return (
    <section className="rounded-xl glass p-5">
      <div className="flex items-end justify-between mb-4 gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Pattern Recognition</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Statistical edges and leaks detected from your journal — minimum {MIN_SAMPLE} trades per pattern.
          </p>
        </div>
        <div className="text-xs font-mono text-muted-foreground">
          {patterns.length} pattern{patterns.length === 1 ? "" : "s"} found
        </div>
      </div>

      {patterns.length === 0 ? (
        <div className="text-sm text-muted-foreground py-8 text-center">
          Log more trades to surface statistically meaningful patterns.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {patterns.map((p) => {
            const s = SEVERITY_STYLES[p.severity];
            return (
              <article key={p.id} className={cn("rounded-lg border bg-card/40 p-4 flex flex-col gap-2", s.ring)}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
                    <span className={cn("text-[10px] font-bold tracking-[0.18em] px-1.5 py-0.5 rounded", s.chip)}>
                      {s.label}
                    </span>
                  </div>
                  {p.metric && (
                    <span className="text-sm font-mono font-semibold tabular-nums">{p.metric}</span>
                  )}
                </div>
                <h3 className="text-sm font-semibold leading-snug">{p.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{p.detail}</p>
                <div className="text-[11px] font-mono text-muted-foreground/80 border-t border-border/50 pt-2 mt-auto">
                  {p.evidence}
                </div>
                <div className="text-xs leading-snug">
                  <span className="text-muted-foreground">→ </span>{p.suggestion}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
