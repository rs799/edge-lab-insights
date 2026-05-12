import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  AreaChart, Area, BarChart, Bar, Cell, PieChart, Pie, Legend,
} from "recharts";
import { ShieldAlert, Play, AlertTriangle, Info } from "lucide-react";

export const Route = createFileRoute("/risk-lab")({
  head: () => ({
    meta: [
      { title: "Risk Lab — EdgeLab" },
      { name: "description", content: "Risk visualization, Monte Carlo simulation, and funded account probability simulator." },
    ],
  }),
  component: RiskLab,
});

const CHART_PRIMARY = "oklch(0.70 0.18 250)";
const CHART_BULL = "oklch(0.74 0.18 152)";
const CHART_BEAR = "oklch(0.66 0.22 25)";
const CHART_MUTED = "oklch(0.50 0.02 260)";
const CHART_PURPLE = "oklch(0.65 0.20 295)";
const tip = { contentStyle: { background: "oklch(0.20 0.02 260)", border: "1px solid oklch(0.30 0.02 260)", borderRadius: 8, fontSize: 12 } };

type TabKey = "strategy" | "sizing" | "simulation" | "funded";

function RiskLab() {
  const [tab, setTab] = useState<TabKey>("strategy");
  const tabs: { k: TabKey; label: string }[] = [
    { k: "strategy", label: "Strategy" },
    { k: "sizing", label: "Sizing" },
    { k: "simulation", label: "Simulation" },
    { k: "funded", label: "Funded Accounts" },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight flex items-center gap-3">
            <span className="h-9 w-9 rounded-xl gradient-primary flex items-center justify-center glow-primary">
              <ShieldAlert className="h-5 w-5 text-primary-foreground" />
            </span>
            Risk Lab
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Probability simulation for sizing, drawdown, and funded evaluations.
          </p>
        </div>
      </header>

      <div className="rounded-xl glass p-1 inline-flex flex-wrap gap-1">
        {tabs.map((t) => (
          <button key={t.k} onClick={() => setTab(t.k)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              tab === t.k ? "bg-primary text-primary-foreground glow-primary" : "text-muted-foreground hover:text-foreground"
            )}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "strategy" && <StrategyTab />}
      {tab === "sizing" && <SizingTab />}
      {tab === "simulation" && <SimulationTab />}
      {tab === "funded" && <FundedTab />}

      <div className="rounded-xl border border-border/60 bg-muted/20 p-4 text-xs text-muted-foreground flex gap-2">
        <Info className="h-4 w-4 shrink-0 mt-0.5" />
        <span>Simulation only. Real results depend on execution, psychology, slippage, and market conditions.</span>
      </div>
    </div>
  );
}

/* ======================== UI helpers ======================== */

function Card({ title, value, sub, accent, hint }: {
  title: string; value: React.ReactNode; sub?: React.ReactNode;
  accent?: "bull" | "bear" | "primary" | "warn" | "muted"; hint?: string;
}) {
  const color =
    accent === "bull" ? "text-bull" :
    accent === "bear" ? "text-bear" :
    accent === "primary" ? "text-primary" :
    accent === "warn" ? "text-yellow-400" : "text-foreground";
  return (
    <div className="rounded-xl glass p-4">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{title}</div>
      <div className={cn("mt-2 text-2xl font-bold font-mono tabular-nums", color)}>{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
      {hint && <div className="text-[11px] text-muted-foreground/80 mt-2 leading-snug">{hint}</div>}
    </div>
  );
}

function NumField({ label, value, onChange, min, max, step = 1, suffix }: {
  label: string; value: number; onChange: (n: number) => void;
  min?: number; max?: number; step?: number; suffix?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}{suffix && <span className="ml-1 text-muted-foreground/70">({suffix})</span>}</Label>
      <Input type="number" value={Number.isFinite(value) ? value : 0}
        min={min} max={max} step={step}
        onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}

function SliderField({ label, value, onChange, min, max, step = 1, suffix }: {
  label: string; value: number; onChange: (n: number) => void;
  min: number; max: number; step?: number; suffix?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <Input type="number" value={value} min={min} max={max} step={step}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-7 w-24 text-right font-mono text-sm" />
      </div>
      <Slider value={[value]} min={min} max={max} step={step}
        onValueChange={(v) => onChange(v[0])} />
      <div className="flex justify-between text-[10px] text-muted-foreground/70 font-mono">
        <span>{min}{suffix}</span><span>{max}{suffix}</span>
      </div>
    </div>
  );
}

function Section({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-xl glass p-5", className)}>
      <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-semibold mb-4">{title}</div>
      {children}
    </section>
  );
}

/* ======================== Math ======================== */

function streakAvg(prob: number) {
  // Expected length of a run with probability p of continuing: 1/(1-p)
  if (prob <= 0) return 0;
  if (prob >= 1) return Infinity;
  return 1 / (1 - prob);
}

// seeded rng for reproducibility (mulberry32)
function rng(seed = Date.now()) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function quantile(sorted: number[], q: number) {
  if (!sorted.length) return 0;
  const i = (sorted.length - 1) * q;
  const lo = Math.floor(i), hi = Math.ceil(i);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
}

/* ======================== Tab 1: Strategy ======================== */

function StrategyTab() {
  const [winRate, setWinRate] = useState(50);
  const [rr, setRR] = useState(2);
  const [avgLossR, setAvgLossR] = useState(1);
  const [commission, setCommission] = useState(0.05);
  const [trades, setTrades] = useState(100);

  const wr = winRate / 100;
  const expectancy = wr * rr - (1 - wr) * avgLossR - commission;
  const profitFactor = (1 - wr) * avgLossR > 0 ? (wr * rr) / ((1 - wr) * avgLossR) : Infinity;
  const breakeven = rr / (rr + avgLossR) * 100;
  const avgWinStreak = streakAvg(wr);
  const avgLossStreak = streakAvg(1 - wr);
  const expReturn = expectancy * trades;

  return (
    <div className="space-y-5">
      <Section title="Inputs">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          <SliderField label="Win Rate %" value={winRate} onChange={setWinRate} min={1} max={99} suffix="%" />
          <SliderField label="Risk-to-Reward" value={rr} onChange={setRR} min={0.25} max={10} step={0.25} suffix="R" />
          <SliderField label="Average Loss in R" value={avgLossR} onChange={setAvgLossR} min={0.25} max={3} step={0.05} suffix="R" />
          <SliderField label="Commission / Slippage" value={commission} onChange={setCommission} min={0} max={1} step={0.01} suffix="R" />
          <SliderField label="Number of Trades" value={trades} onChange={setTrades} min={10} max={2000} step={10} />
        </div>
      </Section>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card title="Expectancy" value={`${expectancy >= 0 ? "+" : ""}${expectancy.toFixed(3)}R`}
          accent={expectancy >= 0 ? "bull" : "bear"}
          hint="Average R you should expect per trade. Positive = edge." />
        <Card title="Profit Factor" value={isFinite(profitFactor) ? profitFactor.toFixed(2) : "∞"}
          accent={profitFactor >= 1.5 ? "bull" : profitFactor >= 1 ? "warn" : "bear"}
          hint="Gross profit ÷ gross loss. >1.5 is healthy." />
        <Card title="Breakeven Win Rate" value={`${breakeven.toFixed(1)}%`}
          accent="primary"
          hint="Minimum win rate needed at this RR to not lose money." />
        <Card title="Avg Win Streak" value={avgWinStreak.toFixed(2)}
          hint="Expected consecutive winners." />
        <Card title="Avg Loss Streak" value={avgLossStreak.toFixed(2)}
          accent="warn"
          hint="Expected consecutive losers — plan tilt management around this." />
        <Card title={`Expected Return / ${trades} trades`} value={`${expReturn >= 0 ? "+" : ""}${expReturn.toFixed(1)}R`}
          accent={expReturn >= 0 ? "bull" : "bear"}
          hint="Total R expected across the trade window." />
      </div>

      <Section title="Formula">
        <code className="block font-mono text-sm p-3 rounded-lg bg-muted/30 text-foreground">
          Expectancy = (WinRate × RR) − (LossRate × AvgLoss) − Commission
        </code>
        <code className="block font-mono text-xs p-3 mt-2 rounded-lg bg-muted/20 text-muted-foreground">
          = ({wr.toFixed(2)} × {rr}) − ({(1 - wr).toFixed(2)} × {avgLossR}) − {commission} = <span className={expectancy >= 0 ? "text-bull" : "text-bear"}>{expectancy.toFixed(3)}R</span>
        </code>
      </Section>
    </div>
  );
}

/* ======================== Tab 2: Sizing ======================== */

function SizingTab() {
  const [balance, setBalance] = useState(50000);
  const [riskPct, setRiskPct] = useState(1);
  const [maxDD, setMaxDD] = useState(15);
  const [maxStreak, setMaxStreak] = useState(8);
  const [propLimit, setPropLimit] = useState(0);
  const [calculated, setCalculated] = useState(false);

  const result = useMemo(() => {
    const compoundLossFactor = 1 - Math.pow(1 - riskPct / 100, maxStreak);
    const estDDpct = compoundLossFactor * 100;
    const recommendedRisk = Math.max(0.1,
      (1 - Math.pow(1 - maxDD / 100, 1 / maxStreak)) * 100
    );
    const buffer = maxDD - estDDpct;
    const propBuffer = propLimit > 0 ? propLimit - estDDpct : null;

    let level: "safe" | "moderate" | "danger" = "safe";
    if (estDDpct > maxDD * 0.9) level = "danger";
    else if (estDDpct > maxDD * 0.6) level = "moderate";

    return {
      recommendedRisk,
      estDDpct,
      estDDdollars: balance * compoundLossFactor,
      buffer,
      propBuffer,
      level,
      streakImpact: balance * compoundLossFactor,
    };
  }, [balance, riskPct, maxDD, maxStreak, propLimit]);

  const levelStyle =
    result.level === "safe" ? "text-bull border-bull/40 bg-bull/10" :
    result.level === "moderate" ? "text-yellow-400 border-yellow-500/40 bg-yellow-500/10" :
    "text-bear border-bear/40 bg-bear/10";

  return (
    <div className="space-y-5">
      <Section title="Account & Risk Inputs">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <NumField label="Starting Account Balance" value={balance} onChange={setBalance} suffix="$" step={500} />
          <NumField label="Risk Per Trade" value={riskPct} onChange={setRiskPct} suffix="%" step={0.1} min={0.1} max={20} />
          <NumField label="Max Drawdown Tolerance" value={maxDD} onChange={setMaxDD} suffix="%" step={1} min={1} max={90} />
          <NumField label="Max Losing Streak Tolerance" value={maxStreak} onChange={setMaxStreak} step={1} min={1} max={50} />
          <NumField label="Prop Firm Drawdown Limit (optional)" value={propLimit} onChange={setPropLimit} suffix="%" step={1} min={0} max={50} />
        </div>
        <div className="mt-5">
          <Button onClick={() => setCalculated(true)} className="gradient-primary text-primary-foreground glow-primary">
            Calculate Recommended Risk
          </Button>
        </div>
      </Section>

      {calculated && (
        <>
          <div className={cn("rounded-xl border p-4 flex items-start gap-3", levelStyle)}>
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-sm uppercase tracking-wider">
                {result.level === "safe" && "Safe risk profile"}
                {result.level === "moderate" && "Moderate risk — proceed with caution"}
                {result.level === "danger" && "Aggressive — high blow-up probability"}
              </div>
              <div className="text-xs mt-1 opacity-90">
                {result.level === "safe" && "Your sizing leaves comfortable buffer against your defined drawdown."}
                {result.level === "moderate" && "A bad streak gets uncomfortably close to your tolerance."}
                {result.level === "danger" && "Consider lowering risk per trade — a normal losing streak nearly breaches your max drawdown."}
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card title="Recommended Risk" value={`${result.recommendedRisk.toFixed(2)}%`} accent="primary"
              hint={`Risk per trade that keeps a ${maxStreak}-loss streak inside your ${maxDD}% tolerance.`} />
            <Card title="Estimated Drawdown" value={`${result.estDDpct.toFixed(2)}%`}
              accent={result.level === "safe" ? "bull" : result.level === "moderate" ? "warn" : "bear"}
              sub={`≈ $${result.estDDdollars.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
            <Card title="Losing-Streak Impact" value={`-$${result.streakImpact.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
              accent="bear" hint={`Loss after ${maxStreak} consecutive losers at ${riskPct}% risk.`} />
            <Card title="Drawdown Buffer" value={`${result.buffer.toFixed(2)}%`}
              accent={result.buffer > 0 ? "bull" : "bear"}
              hint="Headroom between expected streak loss and your max drawdown." />
            {result.propBuffer != null && (
              <Card title="Prop Firm Buffer" value={`${result.propBuffer.toFixed(2)}%`}
                accent={result.propBuffer > 0 ? "bull" : "bear"}
                hint="Headroom against the firm's hard drawdown limit." />
            )}
            <Card title="Risk Level" value={result.level.toUpperCase()}
              accent={result.level === "safe" ? "bull" : result.level === "moderate" ? "warn" : "bear"} />
          </div>
        </>
      )}
    </div>
  );
}

/* ======================== Tab 3: Simulation ======================== */

interface SimRun {
  curve: number[];
  drawdownCurve: number[];
  finalBalance: number;
  maxDD: number;
  longestLossStreak: number;
  profitFactor: number;
  ruined: boolean;
}

function runMonteCarlo(opts: {
  startBalance: number; winRate: number; rr: number;
  riskPct: number; trades: number; sims: number; commission: number;
  ruinThresholdPct?: number;
}): SimRun[] {
  const { startBalance, winRate, rr, riskPct, trades, sims, commission, ruinThresholdPct = 50 } = opts;
  const r = rng(Math.floor(Math.random() * 1e9));
  const ruinFloor = startBalance * (1 - ruinThresholdPct / 100);
  const runs: SimRun[] = [];

  for (let s = 0; s < sims; s++) {
    let bal = startBalance;
    let peak = bal;
    let maxDD = 0;
    let lossStreak = 0;
    let longestLossStreak = 0;
    let grossWin = 0;
    let grossLoss = 0;
    let ruined = false;
    const curve: number[] = [bal];
    const dd: number[] = [0];

    for (let t = 0; t < trades; t++) {
      const riskAmt = bal * (riskPct / 100);
      const com = riskAmt * commission;
      const win = r() < winRate;
      const pnl = win ? riskAmt * rr - com : -riskAmt - com;
      bal += pnl;
      if (win) { grossWin += pnl; lossStreak = 0; }
      else { grossLoss += -pnl; lossStreak += 1; if (lossStreak > longestLossStreak) longestLossStreak = lossStreak; }
      if (bal > peak) peak = bal;
      const ddPct = peak > 0 ? (peak - bal) / peak * 100 : 0;
      if (ddPct > maxDD) maxDD = ddPct;
      curve.push(bal);
      dd.push(-ddPct);
      if (bal <= ruinFloor) { ruined = true; }
    }

    runs.push({
      curve, drawdownCurve: dd, finalBalance: bal, maxDD,
      longestLossStreak,
      profitFactor: grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? Infinity : 0,
      ruined,
    });
  }
  return runs;
}

function SimulationTab() {
  const [balance, setBalance] = useState(50000);
  const [winRate, setWinRate] = useState(50);
  const [rr, setRR] = useState(2);
  const [riskPct, setRiskPct] = useState(1);
  const [trades, setTrades] = useState(200);
  const [sims, setSims] = useState(500);
  const [commission, setCommission] = useState(0.02);
  const [results, setResults] = useState<SimRun[] | null>(null);
  const [running, setRunning] = useState(false);

  const run = () => {
    setRunning(true);
    setTimeout(() => {
      const runs = runMonteCarlo({
        startBalance: balance, winRate: winRate / 100, rr,
        riskPct, trades, sims: Math.min(sims, 2000), commission,
      });
      setResults(runs);
      setRunning(false);
    }, 30);
  };

  const summary = useMemo(() => {
    if (!results) return null;
    const finals = results.map((r) => r.finalBalance).sort((a, b) => a - b);
    const dds = results.map((r) => r.maxDD);
    const streaks = results.map((r) => r.longestLossStreak);
    const pfs = results.map((r) => r.profitFactor).filter((x) => isFinite(x));
    const ruinedCount = results.filter((r) => r.ruined).length;
    const meanFinal = finals.reduce((s, v) => s + v, 0) / finals.length;
    const variance = finals.reduce((s, v) => s + (v - meanFinal) ** 2, 0) / finals.length;
    return {
      best: Math.max(...finals),
      worst: Math.min(...finals),
      median: quantile(finals, 0.5),
      maxDD: Math.max(...dds),
      avgDD: dds.reduce((s, v) => s + v, 0) / dds.length,
      ruinPct: (ruinedCount / results.length) * 100,
      longestStreak: Math.max(...streaks),
      pf: pfs.length ? pfs.reduce((s, v) => s + v, 0) / pfs.length : 0,
      vol: Math.sqrt(variance) / balance * 100,
    };
  }, [results, balance]);

  const chartData = useMemo(() => {
    if (!results) return [];
    const len = results[0].curve.length;
    // Sample up to 60 paths for background visualization
    const sample = results.slice(0, 60);
    // Find best/worst by final value
    const sorted = [...results].sort((a, b) => a.finalBalance - b.finalBalance);
    const worstRun = sorted[0];
    const bestRun = sorted[sorted.length - 1];
    return Array.from({ length: len }, (_, i) => {
      const point: Record<string, number> = { i };
      sample.forEach((s, idx) => { point[`p${idx}`] = s.curve[i]; });
      // average across all
      const avg = results.reduce((acc, r) => acc + r.curve[i], 0) / results.length;
      point.avg = avg;
      point.best = bestRun.curve[i];
      point.worst = worstRun.curve[i];
      return point;
    });
  }, [results]);

  const ddChartData = useMemo(() => {
    if (!results) return [];
    const len = results[0].drawdownCurve.length;
    return Array.from({ length: len }, (_, i) => {
      const avg = results.reduce((acc, r) => acc + r.drawdownCurve[i], 0) / results.length;
      const worst = Math.min(...results.map((r) => r.drawdownCurve[i]));
      return { i, avg, worst };
    });
  }, [results]);

  const spreadData = useMemo(() => {
    if (!results) return [];
    const finals = results.map((r) => r.finalBalance);
    const min = Math.min(...finals), max = Math.max(...finals);
    const buckets = 20;
    const width = (max - min) / buckets || 1;
    const arr = Array.from({ length: buckets }, (_, i) => ({
      label: `$${Math.round((min + width * i) / 1000)}k`,
      count: 0,
      mid: min + width * (i + 0.5),
    }));
    finals.forEach((v) => {
      let idx = Math.min(buckets - 1, Math.floor((v - min) / width));
      if (idx < 0) idx = 0;
      arr[idx].count += 1;
    });
    return arr;
  }, [results]);

  return (
    <div className="space-y-5">
      <Section title="Simulation Parameters">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <NumField label="Starting Balance" value={balance} onChange={setBalance} suffix="$" step={1000} />
          <SliderField label="Win Rate %" value={winRate} onChange={setWinRate} min={1} max={99} suffix="%" />
          <SliderField label="Risk-to-Reward" value={rr} onChange={setRR} min={0.25} max={10} step={0.25} suffix="R" />
          <SliderField label="Risk %" value={riskPct} onChange={setRiskPct} min={0.1} max={10} step={0.1} suffix="%" />
          <SliderField label="Number of Trades" value={trades} onChange={setTrades} min={20} max={2000} step={10} />
          <SliderField label="Simulations" value={sims} onChange={setSims} min={50} max={2000} step={50} />
          <SliderField label="Commission / Slippage" value={commission} onChange={setCommission} min={0} max={0.5} step={0.01} suffix="R" />
        </div>
        <div className="mt-5 flex gap-3">
          <Button onClick={run} disabled={running} className="gradient-primary text-primary-foreground glow-primary">
            <Play className="h-4 w-4" />
            {running ? "Running…" : "Run Simulation"}
          </Button>
          {results && <span className="text-xs text-muted-foreground self-center">{results.length} simulations × {trades} trades</span>}
        </div>
      </Section>

      {summary && (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <Card title="Best Final" value={`$${Math.round(summary.best).toLocaleString()}`} accent="bull" />
            <Card title="Median Final" value={`$${Math.round(summary.median).toLocaleString()}`} accent="primary" />
            <Card title="Worst Final" value={`$${Math.round(summary.worst).toLocaleString()}`} accent="bear" />
            <Card title="Max Drawdown" value={`${summary.maxDD.toFixed(1)}%`} accent="bear" />
            <Card title="Avg Drawdown" value={`${summary.avgDD.toFixed(1)}%`} accent="warn" />
            <Card title="Risk of Ruin" value={`${summary.ruinPct.toFixed(1)}%`}
              accent={summary.ruinPct > 5 ? "bear" : summary.ruinPct > 1 ? "warn" : "bull"}
              hint="% of paths losing 50%+ of starting balance" />
            <Card title="Longest Loss Streak" value={summary.longestStreak} accent="warn" />
            <Card title="Avg Profit Factor" value={summary.pf.toFixed(2)}
              accent={summary.pf >= 1.5 ? "bull" : summary.pf >= 1 ? "warn" : "bear"} />
            <Card title="Volatility Score" value={`${summary.vol.toFixed(1)}%`}
              hint="Std deviation of final balances ÷ starting balance" />
          </div>

          <Section title="Equity Curves">
            <ResponsiveContainer width="100%" height={360}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.30 0.02 260 / 0.2)" />
                <XAxis dataKey="i" stroke={CHART_MUTED} fontSize={11} />
                <YAxis stroke={CHART_MUTED} fontSize={11} tickFormatter={(v) => `$${Math.round(v / 1000)}k`} />
                <Tooltip {...tip} formatter={(v: number) => `$${Math.round(v).toLocaleString()}`} />
                {Array.from({ length: Math.min(60, chartData[0] ? Object.keys(chartData[0]).filter((k) => k.startsWith("p")).length : 0) }).map((_, i) => (
                  <Line key={i} dataKey={`p${i}`} dot={false} stroke={CHART_PRIMARY} strokeOpacity={0.08} strokeWidth={1} isAnimationActive={false} />
                ))}
                <Line dataKey="best" dot={false} stroke={CHART_BULL} strokeWidth={2} />
                <Line dataKey="worst" dot={false} stroke={CHART_BEAR} strokeWidth={2} />
                <Line dataKey="avg" dot={false} stroke={CHART_PURPLE} strokeWidth={2.5} />
              </LineChart>
            </ResponsiveContainer>
          </Section>

          <div className="grid lg:grid-cols-2 gap-5">
            <Section title="Drawdown Profile">
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={ddChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.30 0.02 260 / 0.2)" />
                  <XAxis dataKey="i" stroke={CHART_MUTED} fontSize={11} />
                  <YAxis stroke={CHART_MUTED} fontSize={11} tickFormatter={(v) => `${v}%`} />
                  <Tooltip {...tip} formatter={(v: number) => `${v.toFixed(2)}%`} />
                  <Area dataKey="worst" stroke={CHART_BEAR} fill={CHART_BEAR} fillOpacity={0.2} />
                  <Area dataKey="avg" stroke={CHART_PURPLE} fill={CHART_PURPLE} fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </Section>

            <Section title="Final Balance Distribution">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={spreadData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.30 0.02 260 / 0.2)" />
                  <XAxis dataKey="label" stroke={CHART_MUTED} fontSize={10} />
                  <YAxis stroke={CHART_MUTED} fontSize={11} />
                  <Tooltip {...tip} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {spreadData.map((d, i) => (
                      <Cell key={i} fill={d.mid >= balance ? CHART_BULL : CHART_BEAR} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Section>
          </div>
        </>
      )}
    </div>
  );
}

/* ======================== Tab 4: Funded Accounts ======================== */

interface FundedSimResult {
  passed: boolean;
  trades: number;
  days: number;
  resets: number;
  attempts: number;
  totalCost: number;
  equityCurve: number[];
}

function simulateFundedAccount(opts: {
  accountSize: number; profitTarget: number; maxDrawdown: number;
  dailyLoss: number; trailing: boolean; consistency: boolean; consistencyMaxPct: number;
  maxTradingDays: number; evalCost: number; resetCost: number;
  winRate: number; rr: number; riskPerTrade: number; tradesPerDay: number;
  rand: () => number;
}): FundedSimResult {
  const { accountSize, profitTarget, maxDrawdown, dailyLoss, trailing,
    consistency, consistencyMaxPct, maxTradingDays, evalCost, resetCost,
    winRate, rr, riskPerTrade, tradesPerDay, rand } = opts;

  let attempts = 0;
  let resets = 0;
  let totalCost = 0;
  let equityCurve: number[] = [];

  // Limit attempts to prevent infinite loops
  for (let attempt = 0; attempt < 50; attempt++) {
    attempts++;
    if (attempt === 0) totalCost += evalCost;
    else { totalCost += resetCost; resets++; }

    let equity = 0; // P&L tracked from 0
    let peak = 0;
    let totalTrades = 0;
    let day = 0;
    let breached = false;
    let passed = false;
    const dailyProfits: number[] = [];
    equityCurve = [accountSize];

    while (day < maxTradingDays && !breached && !passed) {
      day++;
      let dayPnL = 0;
      let dayBreached = false;

      for (let t = 0; t < tradesPerDay && !dayBreached; t++) {
        totalTrades++;
        const win = rand() < winRate;
        const pnl = win ? riskPerTrade * rr : -riskPerTrade;
        equity += pnl;
        dayPnL += pnl;
        if (equity > peak) peak = equity;

        // Trailing drawdown: floor moves up with peak (locks at profit target typically, here we use peak)
        const ddRef = trailing ? peak : 0;
        const ddBreach = (ddRef - equity) >= maxDrawdown;
        const dailyBreach = -dayPnL >= dailyLoss;

        if (ddBreach || dailyBreach) {
          breached = true;
          dayBreached = true;
        }
        equityCurve.push(accountSize + equity);

        if (equity >= profitTarget) { passed = true; break; }
      }
      if (dayPnL > 0) dailyProfits.push(dayPnL);
    }

    // Consistency rule applied at pass time
    if (passed && consistency && dailyProfits.length > 0) {
      const totalProfit = dailyProfits.reduce((s, v) => s + v, 0);
      const maxDay = Math.max(...dailyProfits);
      if (totalProfit > 0 && maxDay / totalProfit > consistencyMaxPct) {
        breached = true;
        passed = false;
      }
    }

    if (passed) {
      return { passed: true, trades: totalTrades, days: day, resets, attempts, totalCost, equityCurve };
    }
  }
  return { passed: false, trades: 0, days: 0, resets, attempts, totalCost, equityCurve };
}

const FUNDED_PRESETS = {
  "$25k": { accountSize: 25000, profitTarget: 1500, maxDrawdown: 1500, dailyLoss: 500, evalCost: 150, resetCost: 80 },
  "$50k": { accountSize: 50000, profitTarget: 3000, maxDrawdown: 2500, dailyLoss: 1100, evalCost: 200, resetCost: 100 },
  "$100k": { accountSize: 100000, profitTarget: 6000, maxDrawdown: 3000, dailyLoss: 2200, evalCost: 350, resetCost: 150 },
} as const;

function FundedTab() {
  // Account
  const [preset, setPreset] = useState<string>("$50k");
  const [accountSize, setAccountSize] = useState(50000);
  const [evalCost, setEvalCost] = useState(200);
  const [resetCost, setResetCost] = useState(100);
  const [profitTarget, setProfitTarget] = useState(3000);
  const [maxDrawdown, setMaxDrawdown] = useState(2500);
  const [dailyLoss, setDailyLoss] = useState(1100);
  const [trailing, setTrailing] = useState(true);
  const [consistency, setConsistency] = useState(false);
  const [consistencyMaxPct, setConsistencyMaxPct] = useState(30);
  const [maxTradingDays, setMaxTradingDays] = useState(60);
  const [maxContracts, setMaxContracts] = useState(5);

  // Strategy
  const [winRate, setWinRate] = useState(55);
  const [rr, setRR] = useState(2);
  const [riskPerTrade, setRiskPerTrade] = useState(300);
  const [tradesPerDay, setTradesPerDay] = useState(3);
  const [sims, setSims] = useState(500);

  const [results, setResults] = useState<FundedSimResult[] | null>(null);
  const [running, setRunning] = useState(false);

  const applyPreset = (key: string) => {
    setPreset(key);
    if (key === "Custom") return;
    const p = FUNDED_PRESETS[key as keyof typeof FUNDED_PRESETS];
    if (p) {
      setAccountSize(p.accountSize);
      setProfitTarget(p.profitTarget);
      setMaxDrawdown(p.maxDrawdown);
      setDailyLoss(p.dailyLoss);
      setEvalCost(p.evalCost);
      setResetCost(p.resetCost);
    }
  };

  const run = () => {
    setRunning(true);
    setTimeout(() => {
      const r = rng(Math.floor(Math.random() * 1e9));
      const out: FundedSimResult[] = [];
      const N = Math.min(sims, 1500);
      for (let i = 0; i < N; i++) {
        out.push(simulateFundedAccount({
          accountSize, profitTarget, maxDrawdown, dailyLoss,
          trailing, consistency, consistencyMaxPct: consistencyMaxPct / 100,
          maxTradingDays, evalCost, resetCost,
          winRate: winRate / 100, rr, riskPerTrade, tradesPerDay,
          rand: r,
        }));
      }
      setResults(out);
      setRunning(false);
    }, 30);
  };

  const summary = useMemo(() => {
    if (!results) return null;
    const passed = results.filter((r) => r.passed);
    const passRate = passed.length / results.length * 100;
    const costs = results.map((r) => r.totalCost).sort((a, b) => a - b);
    const passedDays = passed.map((r) => r.days);
    const passedTrades = passed.map((r) => r.trades);
    const passedAttempts = passed.map((r) => r.attempts - 1);
    const passedResets = passed.map((r) => r.resets);
    const ev = passed.length
      ? (passed.reduce((s, r) => s + (profitTarget - r.totalCost), 0) / results.length)
        - (results.filter((r) => !r.passed).reduce((s, r) => s + r.totalCost, 0) / results.length)
      : -costs.reduce((s, v) => s + v, 0) / costs.length;
    return {
      passRate,
      breachRate: 100 - passRate,
      avgFails: passed.length ? passedAttempts.reduce((s, v) => s + v, 0) / passedAttempts.length : Infinity,
      avgCost: passed.length ? passed.reduce((s, r) => s + r.totalCost, 0) / passed.length : Infinity,
      avgResets: passed.length ? passedResets.reduce((s, v) => s + v, 0) / passedResets.length : Infinity,
      avgTrades: passed.length ? passedTrades.reduce((s, v) => s + v, 0) / passedTrades.length : 0,
      avgDays: passed.length ? passedDays.reduce((s, v) => s + v, 0) / passedDays.length : 0,
      bestCost: costs[0],
      worstCost: costs[costs.length - 1],
      medianCost: quantile(costs, 0.5),
      ev,
    };
  }, [results, profitTarget]);

  const pieData = useMemo(() => {
    if (!summary) return [];
    return [
      { name: "Passed", value: summary.passRate, color: CHART_BULL },
      { name: "Breached", value: summary.breachRate, color: CHART_BEAR },
    ];
  }, [summary]);

  const costDist = useMemo(() => {
    if (!results) return [];
    const costs = results.map((r) => r.totalCost);
    const min = Math.min(...costs), max = Math.max(...costs);
    const buckets = 15;
    const w = (max - min) / buckets || 1;
    return Array.from({ length: buckets }, (_, i) => {
      const lo = min + w * i;
      const hi = min + w * (i + 1);
      return {
        label: `$${Math.round(lo)}`,
        count: costs.filter((c) => c >= lo && c < hi + (i === buckets - 1 ? 1 : 0)).length,
      };
    });
  }, [results]);

  const daysDist = useMemo(() => {
    if (!results) return [];
    const passed = results.filter((r) => r.passed).map((r) => r.days);
    if (!passed.length) return [];
    const max = Math.max(...passed);
    const buckets = Math.min(20, max);
    const w = max / buckets || 1;
    return Array.from({ length: buckets }, (_, i) => {
      const lo = w * i, hi = w * (i + 1);
      return {
        label: `${Math.round(lo)}d`,
        count: passed.filter((d) => d >= lo && d < hi + (i === buckets - 1 ? 1 : 0)).length,
      };
    });
  }, [results]);

  const sampleCurves = useMemo(() => {
    if (!results) return [];
    const sample = results.slice(0, 20);
    const maxLen = Math.max(...sample.map((s) => s.equityCurve.length));
    return Array.from({ length: maxLen }, (_, i) => {
      const point: Record<string, number> = { i };
      sample.forEach((s, idx) => {
        if (i < s.equityCurve.length) point[`s${idx}`] = s.equityCurve[i];
      });
      point.target = accountSize + profitTarget;
      point.dd = accountSize - maxDrawdown;
      return point;
    });
  }, [results, accountSize, profitTarget, maxDrawdown]);

  return (
    <div className="space-y-5">
      <Section title="Presets">
        <div className="flex flex-wrap gap-2">
          {(["$25k", "$50k", "$100k", "Custom"] as const).map((k) => (
            <button key={k} onClick={() => applyPreset(k)}
              className={cn("px-4 py-2 rounded-lg text-sm border transition-all",
                preset === k ? "bg-primary text-primary-foreground border-primary glow-primary" : "border-border text-muted-foreground hover:text-foreground"
              )}>
              {k} Evaluation
            </button>
          ))}
        </div>
      </Section>

      <div className="grid lg:grid-cols-2 gap-5">
        <Section title="Account Settings">
          <div className="grid sm:grid-cols-2 gap-3">
            <NumField label="Account Size" value={accountSize} onChange={setAccountSize} suffix="$" step={1000} />
            <NumField label="Profit Target" value={profitTarget} onChange={setProfitTarget} suffix="$" step={100} />
            <NumField label="Max Drawdown" value={maxDrawdown} onChange={setMaxDrawdown} suffix="$" step={100} />
            <NumField label="Daily Loss Limit" value={dailyLoss} onChange={setDailyLoss} suffix="$" step={50} />
            <NumField label="Evaluation Cost" value={evalCost} onChange={setEvalCost} suffix="$" step={10} />
            <NumField label="Reset Cost" value={resetCost} onChange={setResetCost} suffix="$" step={10} />
            <NumField label="Max Trading Days" value={maxTradingDays} onChange={setMaxTradingDays} step={1} min={1} max={365} />
            <NumField label="Max Contracts" value={maxContracts} onChange={setMaxContracts} step={1} min={1} max={50} />
          </div>
          <div className="mt-4 grid sm:grid-cols-2 gap-3">
            <label className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <div className="text-sm font-medium">Trailing Drawdown</div>
                <div className="text-xs text-muted-foreground">Drawdown floor follows the equity peak.</div>
              </div>
              <Switch checked={trailing} onCheckedChange={setTrailing} />
            </label>
            <label className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <div className="text-sm font-medium">Consistency Rule</div>
                <div className="text-xs text-muted-foreground">No single day &gt; {consistencyMaxPct}% of total profits.</div>
              </div>
              <Switch checked={consistency} onCheckedChange={setConsistency} />
            </label>
            {consistency && (
              <div className="sm:col-span-2">
                <SliderField label="Max single-day % of total profits" value={consistencyMaxPct}
                  onChange={setConsistencyMaxPct} min={10} max={90} step={5} suffix="%" />
              </div>
            )}
          </div>
        </Section>

        <Section title="Strategy Settings">
          <div className="grid sm:grid-cols-2 gap-4">
            <SliderField label="Win Rate %" value={winRate} onChange={setWinRate} min={1} max={99} suffix="%" />
            <SliderField label="Risk-to-Reward" value={rr} onChange={setRR} min={0.25} max={10} step={0.25} suffix="R" />
            <NumField label="Risk Per Trade" value={riskPerTrade} onChange={setRiskPerTrade} suffix="$" step={25} />
            <SliderField label="Trades Per Day" value={tradesPerDay} onChange={setTradesPerDay} min={1} max={20} />
            <div className="sm:col-span-2">
              <SliderField label="Number of Monte Carlo Simulations" value={sims} onChange={setSims} min={50} max={1500} step={50} />
            </div>
          </div>
          <div className="mt-5">
            <Button onClick={run} disabled={running} size="lg"
              className="w-full gradient-primary text-primary-foreground glow-primary text-base">
              <Play className="h-5 w-5" />
              {running ? "Running…" : "Run Funded Simulation"}
            </Button>
          </div>
        </Section>
      </div>

      {summary && results && (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <Card title="Chance of Passing" value={`${summary.passRate.toFixed(1)}%`}
              accent={summary.passRate >= 50 ? "bull" : summary.passRate >= 25 ? "warn" : "bear"} />
            <Card title="Chance of Breaching" value={`${summary.breachRate.toFixed(1)}%`} accent="bear" />
            <Card title="Avg Failed Accounts → Pass" value={isFinite(summary.avgFails) ? summary.avgFails.toFixed(2) : "—"} accent="warn" />
            <Card title="Avg Cost Before Pass" value={isFinite(summary.avgCost) ? `$${Math.round(summary.avgCost).toLocaleString()}` : "—"} accent="primary" />
            <Card title="Avg Resets Before Pass" value={isFinite(summary.avgResets) ? summary.avgResets.toFixed(2) : "—"} />
            <Card title="Avg Trades to Pass" value={summary.avgTrades.toFixed(0)} />
            <Card title="Avg Days to Pass" value={summary.avgDays.toFixed(1)} />
            <Card title="Best Case Cost" value={`$${Math.round(summary.bestCost).toLocaleString()}`} accent="bull" />
            <Card title="Worst Case Cost" value={`$${Math.round(summary.worstCost).toLocaleString()}`} accent="bear" />
            <Card title="Median Cost" value={`$${Math.round(summary.medianCost).toLocaleString()}`} accent="primary" />
            <Card title="Expected Value" value={`${summary.ev >= 0 ? "+" : ""}$${Math.round(summary.ev).toLocaleString()}`}
              accent={summary.ev >= 0 ? "bull" : "bear"}
              hint="Profit target − costs, weighted by pass/fail probability" />
          </div>

          <div className="grid lg:grid-cols-2 gap-5">
            <Section title="Pass vs Breach">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={2}>
                    {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip {...tip} formatter={(v: number) => `${v.toFixed(1)}%`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Section>

            <Section title="Total Cost Distribution">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={costDist}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.30 0.02 260 / 0.2)" />
                  <XAxis dataKey="label" stroke={CHART_MUTED} fontSize={10} />
                  <YAxis stroke={CHART_MUTED} fontSize={11} />
                  <Tooltip {...tip} />
                  <Bar dataKey="count" fill={CHART_PURPLE} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Section>

            <Section title="Days to Pass Distribution">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={daysDist}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.30 0.02 260 / 0.2)" />
                  <XAxis dataKey="label" stroke={CHART_MUTED} fontSize={10} />
                  <YAxis stroke={CHART_MUTED} fontSize={11} />
                  <Tooltip {...tip} />
                  <Bar dataKey="count" fill={CHART_BULL} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Section>

            <Section title="Sample Funded Equity Curves">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={sampleCurves}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.30 0.02 260 / 0.2)" />
                  <XAxis dataKey="i" stroke={CHART_MUTED} fontSize={11} />
                  <YAxis stroke={CHART_MUTED} fontSize={11} tickFormatter={(v) => `$${Math.round(v / 1000)}k`} />
                  <Tooltip {...tip} formatter={(v: number) => `$${Math.round(v).toLocaleString()}`} />
                  {sampleCurves[0] && Object.keys(sampleCurves[0]).filter((k) => k.startsWith("s")).map((k, i) => (
                    <Line key={k} dataKey={k} dot={false} stroke={CHART_PRIMARY} strokeOpacity={0.25} strokeWidth={1} isAnimationActive={false} />
                  ))}
                  <Line dataKey="target" dot={false} stroke={CHART_BULL} strokeWidth={2} strokeDasharray="5 5" />
                  <Line dataKey="dd" dot={false} stroke={CHART_BEAR} strokeWidth={2} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><span className="h-0.5 w-3 bg-bull" /> Profit target</span>
                <span className="flex items-center gap-1"><span className="h-0.5 w-3 bg-bear" /> Drawdown limit</span>
              </div>
            </Section>
          </div>
        </>
      )}
    </div>
  );
}
