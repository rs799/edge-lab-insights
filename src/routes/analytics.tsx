import { createFileRoute } from "@tanstack/react-router";
import { useTrades } from "@/lib/store";
import { useMissed } from "@/lib/store";
import { PatternDiagnosis } from "@/components/PatternDiagnosis";

import { computeStats, groupByStat } from "@/lib/analytics";
import { useMemo, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, Tooltip, CartesianGrid, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/analytics")({
  head: () => ({ meta: [{ title: "Analytics — EdgeLab" }, { name: "description", content: "Deep statistical breakdowns by tag, session, quality, psychology and more." }] }),
  component: Analytics,
});

const CHART_PRIMARY = "oklch(0.70 0.18 250)";
const CHART_BULL = "oklch(0.74 0.18 152)";
const CHART_BEAR = "oklch(0.66 0.22 25)";
const CHART_MUTED = "oklch(0.50 0.02 260)";
const tip = { contentStyle: { background: "oklch(0.20 0.02 260)", border: "1px solid oklch(0.30 0.02 260)", borderRadius: 8, fontSize: 12 } };

const dimensions = [
  { key: "ictTags", label: "ICT Tag" },
  { key: "session", label: "Session" },
  { key: "quality", label: "Quality" },
  { key: "psychTags", label: "Psychology" },
  { key: "ticker", label: "Instrument" },
  { key: "direction", label: "Direction" },
  { key: "dow", label: "Day of Week" },
] as const;

function Analytics(const { missed } = useMissed();
) {
  const { trades } = useTrades();
  const [dim, setDim] = useState<typeof dimensions[number]["key"]>("ictTags");

  const groups = useMemo(() => {
    return groupByStat(trades, (t) => {
      switch (dim) {
        case "ictTags": return t.ictTags;
        case "psychTags": return t.psychTags;
        case "session": return t.session;
        case "quality": return t.quality;
        case "ticker": return t.ticker;
        case "direction": return t.direction;
        case "dow": return new Date(t.date).toLocaleDateString("en-US", { weekday: "short" });
      }
    }).filter((g) => g.count >= 1);
  }, [trades, dim]);

  const sorted = [...groups].sort((a, b) => b.stats.expectancy - a.stats.expectancy);

  // Insights
  const byTag = useMemo(() => groupByStat(trades, (t) => t.ictTags).filter((g) => g.count >= 3), [trades]);
  const bySess = useMemo(() => groupByStat(trades, (t) => t.session), [trades]);
  const byPsych = useMemo(() => groupByStat(trades, (t) => t.psychTags).filter((g) => g.count >= 2), [trades]);
  const bestTag = [...byTag].sort((a, b) => b.stats.expectancy - a.stats.expectancy)[0];
  const worstPsych = [...byPsych].sort((a, b) => a.stats.expectancy - b.stats.expectancy)[0];
  const bestSess = [...bySess].sort((a, b) => b.stats.totalR - a.stats.totalR)[0];

  // Heatmap: tag x session expectancy
  const tags = Array.from(new Set(trades.flatMap((t) => t.ictTags))).slice(0, 8);
  const sessions = ["Asia", "London", "NY AM", "NY Lunch", "NY PM"];
  const heatmap = tags.map((tag) => ({
    tag,
    cells: sessions.map((s) => {
      const subset = trades.filter((t) => t.ictTags.includes(tag) && t.session === s);
      const exp = subset.length ? computeStats(subset).expectancy : null;
      return { session: s, exp, count: subset.length };
    }),
  }));

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <header>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Advanced Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">Find your edge. Sort, group, and compare.</p>
      </header>

      <section className="rounded-xl glass p-4">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs uppercase tracking-wider text-muted-foreground mr-2">Group by</span>
          {dimensions.map((d) => (
            <button key={d.key} onClick={() => setDim(d.key)}
              className={cn("px-3 py-1 rounded-md text-xs border transition-all",
                dim === d.key ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground")}>
              {d.label}
            </button>
          ))}
        </div>

        <ResponsiveContainer width="100%" height={Math.max(280, sorted.length * 26)}>
          <BarChart data={sorted.map((g) => ({ name: String(g.key), exp: Number(g.stats.expectancy.toFixed(2)) }))} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.30 0.02 260 / 0.3)" />
            <XAxis type="number" stroke={CHART_MUTED} fontSize={11} />
            <YAxis type="category" dataKey="name" stroke={CHART_MUTED} fontSize={11} width={130} />
            <Tooltip {...tip} />
            <Bar dataKey="exp" radius={[0, 6, 6, 0]}>
              {sorted.map((g) => <Cell key={String(g.key)} fill={g.stats.expectancy >= 0 ? CHART_BULL : CHART_BEAR} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </section>

      <section className="rounded-xl glass overflow-hidden">
        <div className="px-4 py-3 border-b border-border text-xs uppercase tracking-[0.18em] text-muted-foreground font-semibold">Sortable Breakdown</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-2 font-medium">Group</th>
                <th className="px-4 py-2 font-medium text-right">Trades</th>
                <th className="px-4 py-2 font-medium text-right">Win Rate</th>
                <th className="px-4 py-2 font-medium text-right">Expectancy</th>
                <th className="px-4 py-2 font-medium text-right">PF</th>
                <th className="px-4 py-2 font-medium text-right">Net R</th>
                <th className="px-4 py-2 font-medium text-right">Avg Win</th>
                <th className="px-4 py-2 font-medium text-right">Avg Loss</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((g) => (
                <tr key={String(g.key)} className="border-t border-border/60 hover:bg-accent/30">
                  <td className="px-4 py-2 font-medium">{String(g.key)}</td>
                  <td className="px-4 py-2 text-right font-mono text-muted-foreground">{g.count}</td>
                  <td className="px-4 py-2 text-right font-mono">{(g.stats.winRate * 100).toFixed(1)}%</td>
                  <td className={cn("px-4 py-2 text-right font-mono font-semibold", g.stats.expectancy >= 0 ? "text-bull" : "text-bear")}>
                    {g.stats.expectancy >= 0 ? "+" : ""}{g.stats.expectancy.toFixed(2)}R
                  </td>
                  <td className="px-4 py-2 text-right font-mono">{isFinite(g.stats.profitFactor) ? g.stats.profitFactor.toFixed(2) : "∞"}</td>
                  <td className={cn("px-4 py-2 text-right font-mono", g.stats.totalR >= 0 ? "text-bull" : "text-bear")}>
                    {g.stats.totalR >= 0 ? "+" : ""}{g.stats.totalR.toFixed(2)}R
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-bull">+{g.stats.avgWin.toFixed(2)}R</td>
                  <td className="px-4 py-2 text-right font-mono text-bear">{g.stats.avgLoss.toFixed(2)}R</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-xl glass p-4">
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-semibold mb-3">Heatmap — Tag × Session (expectancy)</div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted-foreground">
                  <th className="text-left px-2 py-1.5 font-medium">Tag</th>
                  {sessions.map((s) => <th key={s} className="px-2 py-1.5 font-medium text-center">{s}</th>)}
                </tr>
              </thead>
              <tbody>
                {heatmap.map((row) => (
                  <tr key={row.tag} className="border-t border-border/60">
                    <td className="px-2 py-1.5 font-medium">{row.tag}</td>
                    {row.cells.map((c) => {
                      const intensity = c.exp == null ? 0 : Math.min(1, Math.abs(c.exp) / 2);
                      const bg = c.exp == null
                        ? "transparent"
                        : c.exp >= 0
                          ? `color-mix(in oklab, ${CHART_BULL} ${intensity * 70}%, transparent)`
                          : `color-mix(in oklab, ${CHART_BEAR} ${intensity * 70}%, transparent)`;
                      return (
                        <td key={c.session} className="px-2 py-1.5 text-center">
                          <div className="rounded font-mono py-1.5" style={{ background: bg }}>
                            {c.exp == null ? "—" : `${c.exp >= 0 ? "+" : ""}${c.exp.toFixed(1)}R`}
                            <div className="text-[9px] text-muted-foreground">{c.count} trades</div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl glass p-4">
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-semibold mb-3">Session Profile</div>
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart data={bySess.map((s) => ({ name: s.key, wr: Number((s.stats.winRate * 100).toFixed(0)), exp: Number(((s.stats.expectancy + 2) * 25).toFixed(0)) }))}>
              <PolarGrid stroke="oklch(0.30 0.02 260)" />
              <PolarAngleAxis dataKey="name" tick={{ fill: CHART_MUTED, fontSize: 11 }} />
              <PolarRadiusAxis tick={{ fill: CHART_MUTED, fontSize: 10 }} />
              <Radar name="Win %" dataKey="wr" stroke={CHART_PRIMARY} fill={CHART_PRIMARY} fillOpacity={0.3} />
              <Tooltip {...tip} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-xl glass p-5">
        <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-semibold mb-3">Insights</div>
        <ul className="space-y-2 text-sm">
          {bestTag && <li>✦ Best performing setup tag: <span className="font-semibold text-bull">{bestTag.key as string}</span> with <span className="font-mono">+{bestTag.stats.expectancy.toFixed(2)}R</span> expectancy across {bestTag.count} trades.</li>}
          {worstPsych && <li>⚠ Most damaging behavior: <span className="font-semibold text-bear">{worstPsych.key as string}</span> averaging <span className="font-mono">{worstPsych.stats.expectancy.toFixed(2)}R</span> per trade.</li>}
          {bestSess && <li>◷ Strongest session: <span className="font-semibold text-bull">{bestSess.key as string}</span> with <span className="font-mono">+{bestSess.stats.totalR.toFixed(2)}R</span> net.</li>}
          <li>◆ {trades.filter((t) => t.psychTags.length === 0).length} trades executed with zero psychological flags — these are your cleanest reps.</li>
        </ul>
      </section>
    </div>
  );
}
