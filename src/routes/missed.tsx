import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useMissed, useTrades } from "@/lib/store";
import { MissedTradeModal } from "@/components/MissedTradeModal";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { computeStats } from "@/lib/analytics";
import { toast } from "sonner";

export const Route = createFileRoute("/missed")({
  head: () => ({ meta: [{ title: "Missed Trades — EdgeLab" }, { name: "description", content: "Track valid setups you didn't take and learn from hesitation." }] }),
  component: Missed,
});

function Missed() {
  const { missed, add, remove } = useMissed();
  const { trades } = useTrades();
  const [open, setOpen] = useState(false);

  const wouldWin = missed.filter((m) => m.wouldHaveWon);
  const totalEstR = useMemo(() => missed.reduce((s, m) => s + (m.wouldHaveWon ? m.estimatedR : -1), 0), [missed]);
  const winRate = missed.length ? wouldWin.length / missed.length : 0;
  const taken = computeStats(trades);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Missed Trades</h1>
          <p className="text-sm text-muted-foreground mt-1">Valid setups you didn't take. Learn what hesitation costs.</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gradient-primary text-primary-foreground glow-primary">
          <Plus className="h-4 w-4 mr-1" /> Log Missed Trade
        </Button>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Missed" value={missed.length} />
        <StatCard label="Would-have Win Rate" value={`${(winRate * 100).toFixed(1)}%`} accent={winRate >= 0.5 ? "bull" : "bear"} />
        <StatCard label="Estimated R Left" value={`${totalEstR >= 0 ? "+" : ""}${totalEstR.toFixed(2)}R`} accent="bear" />
        <StatCard label="Taken vs Missed Δ" value={`${(taken.expectancy - (winRate * 2 - (1 - winRate))).toFixed(2)}R`} accent="primary" />
      </section>

      {missed.length === 0 ? (
        <div className="rounded-xl glass p-12 text-center text-muted-foreground">No missed trades logged yet.</div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {missed.map((m) => (
            <div key={m.id} className="rounded-xl glass overflow-hidden">
              <div className="aspect-video bg-surface relative grid-bg">
                {m.screenshot && <img src={m.screenshot} alt="" className="absolute inset-0 h-full w-full object-cover" />}
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-background/70 backdrop-blur">{m.quality}</div>
                <div className={`absolute bottom-2 right-2 px-2 py-1 rounded-md text-xs font-bold backdrop-blur ${m.wouldHaveWon ? "bg-bull/20 text-bull" : "bg-bear/20 text-bear"}`}>
                  {m.wouldHaveWon ? `+${m.estimatedR}R missed` : "would lose"}
                </div>
              </div>
              <div className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-sm">{m.instrument} <span className="text-muted-foreground font-normal">· {m.session}</span></div>
                  <div className="text-xs text-muted-foreground font-mono">{m.date}</div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {m.ictTags.slice(0, 4).map((t) => <span key={t} className="px-1.5 py-0.5 text-[10px] rounded bg-secondary">{t}</span>)}
                </div>
                <div className="text-xs text-muted-foreground line-clamp-2"><span className="text-foreground">Why:</span> {m.reason}</div>
                {m.lesson && <div className="text-xs text-muted-foreground line-clamp-2"><span className="text-primary">Lesson:</span> {m.lesson}</div>}
                <button onClick={() => { remove(m.id); toast.success("Removed"); }} className="text-xs text-muted-foreground hover:text-bear inline-flex items-center gap-1 mt-1">
                  <Trash2 className="h-3 w-3" /> remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <MissedTradeModal open={open} onOpenChange={setOpen} onSave={(m) => { add(m); toast.success("Logged"); }} />
    </div>
  );
}
