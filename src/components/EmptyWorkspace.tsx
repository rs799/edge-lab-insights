import { useState } from "react";
import { Plus, LineChart, Sparkles, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TradeModal } from "@/components/TradeModal";
import { MissedTradeModal } from "@/components/MissedTradeModal";
import { useTrades, useMissed } from "@/lib/store";
import { toast } from "sonner";

export function EmptyWorkspace({
  title = "No trades logged yet",
  subtitle = "Analytics will appear after trades are added. Start building your Edge.",
}: { title?: string; subtitle?: string }) {
  const [tradeOpen, setTradeOpen] = useState(false);
  const [missedOpen, setMissedOpen] = useState(false);
  const { add: addTrade } = useTrades();
  const { add: addMissed } = useMissed();

  return (
    <div className="relative rounded-2xl glass overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />
      <div
        className="absolute -top-32 -right-32 h-80 w-80 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(closest-side, oklch(0.70 0.18 250 / 0.18), transparent)" }}
      />
      <div
        className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(closest-side, oklch(0.74 0.18 152 / 0.12), transparent)" }}
      />

      <div className="relative p-10 lg:p-16 flex flex-col items-center text-center">
        <div className="h-14 w-14 rounded-2xl border border-border/60 bg-background/40 backdrop-blur grid place-items-center mb-5">
          <LineChart className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-2xl lg:text-3xl font-bold tracking-tight">{title}</h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">{subtitle}</p>

        <div className="mt-7 flex flex-wrap gap-3 justify-center">
          <Button
            size="lg"
            onClick={() => setTradeOpen(true)}
            className="gradient-primary text-primary-foreground glow-primary h-12 px-6 text-base"
          >
            <Plus className="h-5 w-5 mr-1" /> New Trade
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => setMissedOpen(true)}
            className="h-12 px-6 text-base border-border/60"
          >
            <Plus className="h-5 w-5 mr-1" /> Missed Trade
          </Button>
        </div>

        <div className="mt-10 grid sm:grid-cols-3 gap-3 w-full max-w-2xl text-left">
          <Hint icon={<Target className="h-4 w-4 text-primary" />} title="Log every rep" body="Tag setup quality, ICT confluences, and session." />
          <Hint icon={<LineChart className="h-4 w-4 text-primary" />} title="Track expectancy" body="Equity curve, win rate, and R-multiples update live." />
          <Hint icon={<Sparkles className="h-4 w-4 text-primary" />} title="Find your edge" body="Pattern recognition surfaces what's working." />
        </div>
      </div>

      <TradeModal
        open={tradeOpen}
        onOpenChange={setTradeOpen}
        initial={null}
        onSave={(t) => { addTrade(t); toast.success("Trade saved"); }}
      />
      <MissedTradeModal
        open={missedOpen}
        onOpenChange={setMissedOpen}
        onSave={(m) => { addMissed(m); toast.success("Logged"); }}
      />
    </div>
  );
}

function Hint({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-xl border border-border/50 bg-background/30 backdrop-blur p-3">
      <div className="flex items-center gap-2 mb-1">{icon}<div className="text-xs font-semibold">{title}</div></div>
      <div className="text-xs text-muted-foreground leading-relaxed">{body}</div>
    </div>
  );
}
