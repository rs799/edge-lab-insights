import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Trade } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Pencil, Trash2, Copy, ArrowDown, ArrowUp } from "lucide-react";

export function TradeReview({
  trade, open, onOpenChange, onEdit, onDelete, onDuplicate,
}: {
  trade: Trade | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onEdit: (t: Trade) => void;
  onDelete: (id: string) => void;
  onDuplicate: (t: Trade) => void;
}) {
  if (!trade) return null;
  const isWin = trade.outcome === "win";
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto scrollbar-thin p-0">
        <div className="grid lg:grid-cols-[1.4fr_1fr]">
          <div className="bg-surface aspect-video lg:aspect-auto lg:min-h-[480px] relative overflow-hidden">
            {trade.screenshot ? (
              <img src={trade.screenshot} alt="" className="absolute inset-0 h-full w-full object-contain" />
            ) : (
              <div className="absolute inset-0 grid-bg flex items-center justify-center text-6xl font-mono font-bold text-muted-foreground/30">
                {trade.ticker}
              </div>
            )}
          </div>

          <div className="p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold">{trade.ticker}</div>
                  <span className={cn("px-2 py-0.5 rounded text-xs font-semibold uppercase",
                    trade.direction === "long" ? "bg-bull/20 text-bull" : "bg-bear/20 text-bear")}>
                    {trade.direction === "long" ? <ArrowUp className="inline h-3 w-3" /> : <ArrowDown className="inline h-3 w-3" />} {trade.direction}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground mt-0.5">{trade.instrument} · {trade.date} {trade.time} · {trade.session}</div>
              </div>
              <div className={cn("text-2xl font-mono font-bold", isWin ? "text-bull" : trade.outcome === "loss" ? "text-bear" : "text-muted-foreground")}>
                {trade.rResult > 0 ? "+" : ""}{trade.rResult.toFixed(2)}R
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 text-xs">
              {[["Entry", trade.entry], ["Stop", trade.stop], ["Target", trade.target], ["Exit", trade.exit]].map(([l, v]) => (
                <div key={l as string} className="rounded-lg bg-surface p-2">
                  <div className="text-muted-foreground">{l}</div>
                  <div className="font-mono font-semibold mt-0.5">{Number(v).toFixed(2)}</div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Quality</span>
              <span className="px-2 py-0.5 rounded bg-primary/20 text-primary text-sm font-bold">{trade.quality}</span>
            </div>

            <Block title="ICT Tags">
              <div className="flex flex-wrap gap-1.5">
                {trade.ictTags.map((t) => <span key={t} className="px-2 py-0.5 rounded text-xs bg-primary/15 text-primary">{t}</span>)}
              </div>
            </Block>

            {trade.psychTags.length > 0 && (
              <Block title="Psychology">
                <div className="flex flex-wrap gap-1.5">
                  {trade.psychTags.map((t) => <span key={t} className="px-2 py-0.5 rounded text-xs bg-bear/15 text-bear">{t}</span>)}
                </div>
              </Block>
            )}

            {trade.reasoning && <Block title="Setup reasoning"><p className="text-sm leading-relaxed">{trade.reasoning}</p></Block>}
            {trade.execution && <Block title="Execution review"><p className="text-sm leading-relaxed">{trade.execution}</p></Block>}
            {trade.mistakes && <Block title="Mistakes"><p className="text-sm leading-relaxed text-bear">{trade.mistakes}</p></Block>}
            {trade.lesson && <Block title="Lesson"><p className="text-sm leading-relaxed">{trade.lesson}</p></Block>}
            {trade.emotion && <Block title="Emotional state"><p className="text-sm">{trade.emotion}</p></Block>}

            <div className="flex gap-2 pt-2 border-t border-border">
              <Button size="sm" variant="outline" onClick={() => onEdit(trade)}><Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit</Button>
              <Button size="sm" variant="outline" onClick={() => onDuplicate(trade)}><Copy className="h-3.5 w-3.5 mr-1.5" /> Duplicate</Button>
              <Button size="sm" variant="outline" className="text-bear hover:text-bear" onClick={() => { onDelete(trade.id); onOpenChange(false); }}>
                <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-1.5 font-semibold">{title}</div>
      {children}
    </div>
  );
}
