import { cn } from "@/lib/utils";
import type { Trade } from "@/lib/types";
import { ArrowDown, ArrowUp } from "lucide-react";

export function TradeCard({ trade, onClick }: { trade: Trade; onClick?: () => void }) {
  const isWin = trade.outcome === "win";
  const isLoss = trade.outcome === "loss";
  return (
    <button
      onClick={onClick}
      className={cn(
        "group text-left rounded-xl bg-card border border-border overflow-hidden transition-all hover:-translate-y-0.5",
        isWin && "hover:glow-bull",
        isLoss && "hover:glow-bear",
      )}
    >
      <div className="relative aspect-video bg-surface overflow-hidden">
        {trade.screenshot ? (
          <img src={trade.screenshot} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full grid-bg flex items-center justify-center">
            <div className="text-3xl font-bold font-mono text-muted-foreground/40">{trade.ticker}</div>
          </div>
        )}
        <div className={cn(
          "absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider backdrop-blur",
          trade.direction === "long" ? "bg-bull/20 text-bull" : "bg-bear/20 text-bear"
        )}>
          {trade.direction === "long" ? <ArrowUp className="inline h-3 w-3 mr-0.5" /> : <ArrowDown className="inline h-3 w-3 mr-0.5" />}
          {trade.direction}
        </div>
        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-background/70 backdrop-blur">
          {trade.quality}
        </div>
        <div className={cn(
          "absolute bottom-2 right-2 px-2.5 py-1 rounded-md font-mono text-sm font-bold backdrop-blur",
          isWin && "bg-bull/20 text-bull",
          isLoss && "bg-bear/20 text-bear",
          !isWin && !isLoss && "bg-muted text-muted-foreground",
        )}>
          {trade.rResult > 0 ? "+" : ""}{trade.rResult.toFixed(2)}R
        </div>
      </div>
      <div className="p-3">
        <div className="flex items-center justify-between">
          <div className="font-semibold text-sm">{trade.ticker} <span className="text-muted-foreground font-normal">· {trade.session}</span></div>
          <div className="text-xs text-muted-foreground font-mono">{trade.date}</div>
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {trade.ictTags.slice(0, 4).map((t) => (
            <span key={t} className="px-1.5 py-0.5 text-[10px] rounded bg-secondary text-secondary-foreground">{t}</span>
          ))}
          {trade.ictTags.length > 4 && (
            <span className="px-1.5 py-0.5 text-[10px] rounded text-muted-foreground">+{trade.ictTags.length - 4}</span>
          )}
        </div>
      </div>
    </button>
  );
}
