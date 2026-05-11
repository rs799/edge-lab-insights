import { createFileRoute } from "@tanstack/react-router";
import { useTrades, useMissed } from "@/lib/store";
import { computeStats, equityCurve, monthlyPerformance, groupByStat } from "@/lib/analytics";
import { StatCard } from "@/components/StatCard";
import { EmptyWorkspace } from "@/components/EmptyWorkspace";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { useMemo, useEffect, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Dashboard — EdgeLab" }, { name: "description", content: "Overview of your trading performance, expectancy, and key metrics." }] }),
  component: Dashboard,
});

const CHART_PRIMARY = "oklch(0.70 0.18 250)";
const CHART_BULL = "oklch(0.74 0.18 152)";
const CHART_BEAR = "oklch(0.66 0.22 25)";
const CHART_MUTED = "oklch(0.50 0.02 260)";

const tooltipStyle = {
  contentStyle: { background: "oklch(0.20 0.02 260)", border: "1px solid oklch(0.30 0.02 260)", borderRadius: 8, fontSize: 12 },
  labelStyle: { color: "oklch(0.96 0.01 250)", fontWeight: 600 },
};

function Dashboard() {
  const { trades } = useTrades();
  const { missed } = useMissed();
  const stats = useMemo(() => computeStats(trades), [trades]);
  const eq = useMemo(() => equityCurve(trades), [trades]);
  const monthly = useMemo(() => monthlyPerformance(trades), [trades]);
  const bySession = useMemo(() => groupByStat(trades, (t) => t.session), [trades]);
  const byQuality = useMemo(() => groupByStat(trades, (t) => t.quality), [trades]);
  const byTag = useMemo(() => groupByStat(trades, (t) => t.ictTags), [trades]);

  const winLoss = [
    { name: "Wins", value: stats.wins, color: CHART_BULL },
    { name: "Losses", value: stats.losses, color: CHART_BEAR },
    { name: "BE", value: stats.breakevens, color: CHART_MUTED },
  ];

  const bestSetup = [...byTag].sort((a, b) => b.stats.expectancy - a.stats.expectancy)[0];
  const worstSetup = [...byTag].sort((a, b) => a.stats.expectancy - b.stats.expectancy)[0];
  const bestSession = [...bySession].sort((a, b) => b.stats.totalR - a.stats.totalR)[0];
  const worstSession = [...bySession].sort((a, b) => a.stats.totalR - b.stats.totalR)[0];
  const aplus = byQuality.find((x) => x.key === "A+");
  const emotional = trades.filter((t) => t.psychTags.length > 0);
  const emoStats = computeStats(emotional);
  const htf = trades.filter((t) => t.ictTags.includes("HTF aligned"));
  const counter = trades.filter((t) => t.ictTags.includes("counter-trend"));
  const missedWin = missed.filter((m) => m.wouldHaveWon).length;
  const [now, setNow] = useState<string>("");
  useEffect(() => { setNow(new Date().toLocaleString()); }, []);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Performance Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Live snapshot of your edge across {stats.total} trades.</p>
        </div>
        <div className="text-xs text-muted-foreground font-mono" suppressHydrationWarning>Updated {now || "—"}</div>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-3">
        <StatCard label="Trades" value={stats.total} />
        <StatCard label="Win Rate" value={`${(stats.winRate * 100).toFixed(1)}%`} accent={stats.winRate >= 0.5 ? "bull" : "bear"} />
        <StatCard label="Expectancy" value={`${stats.expectancy >= 0 ? "+" : ""}${stats.expectancy.toFixed(2)}R`} accent={stats.expectancy >= 0 ? "bull" : "bear"} />
        <StatCard label="Avg R" value={`${stats.avgR >= 0 ? "+" : ""}${stats.avgR.toFixed(2)}R`} accent={stats.avgR >= 0 ? "bull" : "bear"} />
        <StatCard label="Profit Factor" value={isFinite(stats.profitFactor) ? stats.profitFactor.toFixed(2) : "∞"} accent="primary" />
        <StatCard label="Max Drawdown" value={`-${stats.maxDrawdown.toFixed(2)}R`} accent="bear" />
        <StatCard label="Avg Win" value={`+${stats.avgWin.toFixed(2)}R`} accent="bull" />
        <StatCard label="Avg Loss" value={`${stats.avgLoss.toFixed(2)}R`} accent="bear" />
        <StatCard label="Net R" value={`${stats.totalR >= 0 ? "+" : ""}${stats.totalR.toFixed(2)}R`} accent={stats.totalR >= 0 ? "bull" : "bear"} />
      </section>

      <section className="grid lg:grid-cols-3 gap-4">
        <ChartCard title="Equity Curve" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={eq}>
              <defs>
                <linearGradient id="eqg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_PRIMARY} stopOpacity={0.5} />
                  <stop offset="100%" stopColor={CHART_PRIMARY} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.30 0.02 260 / 0.3)" />
              <XAxis dataKey="i" stroke={CHART_MUTED} fontSize={11} />
              <YAxis stroke={CHART_MUTED} fontSize={11} />
              <Tooltip {...tooltipStyle} />
              <Area type="monotone" dataKey="equity" stroke={CHART_PRIMARY} fill="url(#eqg)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Win / Loss">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={winLoss} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={3}>
                {winLoss.map((d) => <Cell key={d.name} fill={d.color} />)}
              </Pie>
              <Tooltip {...tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-around text-xs mt-2">
            {winLoss.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: d.color }} /> {d.name}: <span className="font-mono font-semibold">{d.value}</span>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Drawdown">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={eq}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.30 0.02 260 / 0.3)" />
              <XAxis dataKey="i" stroke={CHART_MUTED} fontSize={11} />
              <YAxis stroke={CHART_MUTED} fontSize={11} />
              <Tooltip {...tooltipStyle} />
              <Area type="monotone" dataKey="drawdown" stroke={CHART_BEAR} fill={CHART_BEAR} fillOpacity={0.2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Performance by Session">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={bySession.map((s) => ({ name: s.key, R: Number(s.stats.totalR.toFixed(2)) }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.30 0.02 260 / 0.3)" />
              <XAxis dataKey="name" stroke={CHART_MUTED} fontSize={11} />
              <YAxis stroke={CHART_MUTED} fontSize={11} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="R" radius={[6, 6, 0, 0]}>
                {bySession.map((s) => <Cell key={s.key as string} fill={s.stats.totalR >= 0 ? CHART_BULL : CHART_BEAR} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Win Rate by Setup Quality">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byQuality.map((q) => ({ name: q.key, wr: Number((q.stats.winRate * 100).toFixed(1)) }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.30 0.02 260 / 0.3)" />
              <XAxis dataKey="name" stroke={CHART_MUTED} fontSize={11} />
              <YAxis stroke={CHART_MUTED} fontSize={11} unit="%" />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="wr" fill={CHART_PRIMARY} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      <section className="grid lg:grid-cols-2 gap-4">
        <ChartCard title="Expectancy by Tag (top 10)">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[...byTag].filter((t) => t.count >= 3).sort((a, b) => b.stats.expectancy - a.stats.expectancy).slice(0, 10).map((t) => ({ name: t.key, exp: Number(t.stats.expectancy.toFixed(2)) }))} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.30 0.02 260 / 0.3)" />
              <XAxis type="number" stroke={CHART_MUTED} fontSize={11} />
              <YAxis type="category" dataKey="name" stroke={CHART_MUTED} fontSize={11} width={110} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="exp" radius={[0, 6, 6, 0]}>
                {byTag.slice(0, 10).map((t) => <Cell key={t.key as string} fill={t.stats.expectancy >= 0 ? CHART_BULL : CHART_BEAR} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Monthly Performance">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.30 0.02 260 / 0.3)" />
              <XAxis dataKey="month" stroke={CHART_MUTED} fontSize={11} />
              <YAxis stroke={CHART_MUTED} fontSize={11} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="r" radius={[6, 6, 0, 0]}>
                {monthly.map((m) => <Cell key={m.month} fill={m.r >= 0 ? CHART_BULL : CHART_BEAR} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Insight label="Best Setup" value={bestSetup?.key as string ?? "—"} sub={bestSetup ? `+${bestSetup.stats.expectancy.toFixed(2)}R exp` : ""} good />
        <Insight label="Worst Setup" value={worstSetup?.key as string ?? "—"} sub={worstSetup ? `${worstSetup.stats.expectancy.toFixed(2)}R exp` : ""} bad />
        <Insight label="Best Session" value={bestSession?.key as string ?? "—"} sub={bestSession ? `+${bestSession.stats.totalR.toFixed(2)}R` : ""} good />
        <Insight label="Worst Session" value={worstSession?.key as string ?? "—"} sub={worstSession ? `${worstSession.stats.totalR.toFixed(2)}R` : ""} bad />
        <Insight label="Emotional Trades" value={`${emotional.length}`} sub={`${(emoStats.winRate * 100).toFixed(0)}% WR · ${emoStats.expectancy.toFixed(2)}R`} bad={emoStats.expectancy < 0} />
        <Insight label="Missed Trades" value={`${missed.length}`} sub={`${missedWin} would have won`} />
        <Insight label="A+ Setups" value={aplus ? `${aplus.count}` : "0"} sub={aplus ? `${(aplus.stats.winRate * 100).toFixed(0)}% WR · ${aplus.stats.expectancy.toFixed(2)}R` : ""} good />
        <Insight label="HTF Aligned" value={`${htf.length}`} sub={htf.length ? `${computeStats(htf).expectancy.toFixed(2)}R exp` : ""} good />
        <Insight label="Counter-trend" value={`${counter.length}`} sub={counter.length ? `${computeStats(counter).expectancy.toFixed(2)}R exp` : ""} />
      </section>
    </div>
  );
}

function ChartCard({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl glass p-4 ${className ?? ""}`}>
      <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-semibold mb-3">{title}</div>
      {children}
    </div>
  );
}

function Insight({ label, value, sub, good, bad }: { label: string; value: string; sub?: string; good?: boolean; bad?: boolean }) {
  return (
    <div className="rounded-xl glass p-4">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-1.5 text-base font-semibold ${good ? "text-bull" : bad ? "text-bear" : "text-foreground"}`}>{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-0.5 font-mono">{sub}</div>}
    </div>
  );
}
