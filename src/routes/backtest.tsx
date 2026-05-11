import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatCard } from "@/components/StatCard";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/backtest")({
  head: () => ({ meta: [{ title: "Backtest Lab — EdgeLab" }, { name: "description", content: "Lightweight strategy experimentation sandbox." }] }),
  component: Backtest,
});

const tip = { contentStyle: { background: "oklch(0.20 0.02 260)", border: "1px solid oklch(0.30 0.02 260)", borderRadius: 8, fontSize: 12 } };

interface BTTrade { i: number; r: number; date: string; }

function Backtest() {
  const [instrument, setInstrument] = useState("NQ");
  const [tf, setTf] = useState("5m");
  const [stop, setStop] = useState(1);
  const [tp, setTp] = useState(2.5);
  const [direction, setDirection] = useState("long");
  const [session, setSession] = useState("any");
  const [trades, setTrades] = useState<BTTrade[] | null>(null);

  const equity = useMemo(() => {
    if (!trades) return [];
    let eq = 0;
    return trades.map((t) => { eq += t.r; return { i: t.i, equity: Number(eq.toFixed(2)) }; });
  }, [trades]);

  const stats = useMemo(() => {
    if (!trades) return null;
    const wins = trades.filter((t) => t.r > 0);
    const losses = trades.filter((t) => t.r < 0);
    const winSum = wins.reduce((s, t) => s + t.r, 0);
    const lossSum = Math.abs(losses.reduce((s, t) => s + t.r, 0));
    const wr = trades.length ? wins.length / trades.length : 0;
    let peak = 0, eq = 0, dd = 0;
    for (const t of trades) { eq += t.r; if (eq > peak) peak = eq; if (peak - eq > dd) dd = peak - eq; }
    return {
      total: trades.length, winRate: wr,
      expectancy: trades.length ? trades.reduce((s, t) => s + t.r, 0) / trades.length : 0,
      pf: lossSum ? winSum / lossSum : Infinity,
      netR: trades.length ? trades.reduce((s, t) => s + t.r, 0) : 0,
      dd,
    };
  }, [trades]);

  const run = () => {
    const ratio = tp / stop;
    // Reasonable mock baseline win rate that produces a slightly +EV system
    const baseWr = 0.5 - (ratio - 1) * 0.05;
    const sessionMod = session === "NY AM" ? 0.05 : session === "Asia" ? -0.05 : 0;
    const wr = Math.max(0.2, Math.min(0.85, baseWr + sessionMod));
    const arr: BTTrade[] = [];
    const start = Date.now() - 200 * 86400000;
    for (let i = 1; i <= 200; i++) {
      const win = Math.random() < wr;
      arr.push({
        i, date: new Date(start + i * 86400000).toISOString().slice(0, 10),
        r: win ? ratio * (0.85 + Math.random() * 0.3) : -1 * (0.85 + Math.random() * 0.25),
      });
    }
    setTrades(arr);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Backtest Lab</h1>
          <p className="text-sm text-muted-foreground mt-1">Quick strategy experimentation. Drop in CSV data or use the simulator.</p>
        </div>
      </header>

      <div className="rounded-xl glass p-5 grid md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Field label="Instrument">
          <Select value={instrument} onValueChange={setInstrument}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{["ES", "NQ", "GC", "CL", "YM", "RTY"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Timeframe">
          <Select value={tf} onValueChange={setTf}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{["1m", "5m", "15m", "1h", "4h"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Stop (R)"><Input type="number" step="0.1" value={stop} onChange={(e) => setStop(+e.target.value)} /></Field>
        <Field label="Take Profit (R)"><Input type="number" step="0.1" value={tp} onChange={(e) => setTp(+e.target.value)} /></Field>
        <Field label="Direction">
          <Select value={direction} onValueChange={setDirection}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="long">Long</SelectItem><SelectItem value="short">Short</SelectItem><SelectItem value="both">Both</SelectItem></SelectContent>
          </Select>
        </Field>
        <Field label="Session">
          <Select value={session} onValueChange={setSession}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{["any", "Asia", "London", "NY AM", "NY Lunch", "NY PM"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <div className="md:col-span-3 lg:col-span-6 flex gap-2">
          <input type="file" accept=".csv" className="text-xs text-muted-foreground" onChange={() => {}} />
          <Button onClick={run} className="ml-auto gradient-primary text-primary-foreground">Run Backtest</Button>
        </div>
      </div>

      {stats && (
        <>
          <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <StatCard label="Trades" value={stats.total} />
            <StatCard label="Win Rate" value={`${(stats.winRate * 100).toFixed(1)}%`} accent={stats.winRate >= 0.5 ? "bull" : "bear"} />
            <StatCard label="Expectancy" value={`${stats.expectancy >= 0 ? "+" : ""}${stats.expectancy.toFixed(2)}R`} accent={stats.expectancy >= 0 ? "bull" : "bear"} />
            <StatCard label="Profit Factor" value={isFinite(stats.pf) ? stats.pf.toFixed(2) : "∞"} accent="primary" />
            <StatCard label="Max DD" value={`-${stats.dd.toFixed(2)}R`} accent="bear" />
          </section>

          <div className="rounded-xl glass p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-semibold mb-3">Equity Curve</div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={equity}>
                <defs>
                  <linearGradient id="bteq" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.70 0.18 250)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="oklch(0.70 0.18 250)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.30 0.02 260 / 0.3)" />
                <XAxis dataKey="i" stroke="oklch(0.50 0.02 260)" fontSize={11} />
                <YAxis stroke="oklch(0.50 0.02 260)" fontSize={11} />
                <Tooltip {...tip} />
                <Area type="monotone" dataKey="equity" stroke="oklch(0.70 0.18 250)" fill="url(#bteq)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-xl glass overflow-hidden">
            <div className="px-4 py-3 border-b border-border text-xs uppercase tracking-[0.18em] text-muted-foreground font-semibold">Trade List</div>
            <div className="max-h-80 overflow-y-auto scrollbar-thin">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card">
                  <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-2">#</th><th className="px-4 py-2">Date</th><th className="px-4 py-2 text-right">R</th>
                  </tr>
                </thead>
                <tbody>
                  {trades?.map((t) => (
                    <tr key={t.i} className="border-t border-border/60">
                      <td className="px-4 py-1.5 font-mono text-muted-foreground">{t.i}</td>
                      <td className="px-4 py-1.5 font-mono">{t.date}</td>
                      <td className={`px-4 py-1.5 text-right font-mono font-semibold ${t.r >= 0 ? "text-bull" : "text-bear"}`}>{t.r >= 0 ? "+" : ""}{t.r.toFixed(2)}R</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <div className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground flex items-center gap-3">
        <Sparkles className="h-4 w-4 text-primary" />
        Advanced ICT automation (FVG detection, sweep filters, displacement triggers) coming later.
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">{label}</Label>{children}</div>;
}
