import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useTrades } from "@/lib/store";
import { TradeCard } from "@/components/TradeCard";
import { TradeModal } from "@/components/TradeModal";
import { TradeReview } from "@/components/TradeReview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Trade } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/journal")({
  head: () => ({ meta: [{ title: "Journal — EdgeLab" }, { name: "description", content: "Review and log every trade with screenshots, ICT tags and execution notes." }] }),
  component: Journal,
});

function Journal() {
  const { trades, add, update, remove } = useTrades();
  const [open, setOpen] = useState(false);
  const [reviewing, setReviewing] = useState<Trade | null>(null);
  const [editing, setEditing] = useState<Trade | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    return trades.filter((t) => {
      if (filter === "win" && t.outcome !== "win") return false;
      if (filter === "loss" && t.outcome !== "loss") return false;
      if (filter === "long" && t.direction !== "long") return false;
      if (filter === "short" && t.direction !== "short") return false;
      if (q && !`${t.ticker} ${t.instrument} ${t.session} ${t.ictTags.join(" ")}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [trades, filter, q]);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Trade Journal</h1>
          <p className="text-sm text-muted-foreground mt-1">{filtered.length} of {trades.length} trades</p>
        </div>
        <Button onClick={() => { setEditing(null); setOpen(true); }} className="gradient-primary text-primary-foreground glow-primary">
          <Plus className="h-4 w-4 mr-1" /> New Trade
        </Button>
      </header>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search ticker, tag, session…" className="pl-9" />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All trades</SelectItem>
            <SelectItem value="win">Wins only</SelectItem>
            <SelectItem value="loss">Losses only</SelectItem>
            <SelectItem value="long">Longs only</SelectItem>
            <SelectItem value="short">Shorts only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl glass p-12 text-center text-muted-foreground">
          No trades yet. Click <span className="text-foreground">New Trade</span> to log your first one.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((t) => <TradeCard key={t.id} trade={t} onClick={() => setReviewing(t)} />)}
        </div>
      )}

      <TradeModal
        open={open}
        onOpenChange={setOpen}
        initial={editing}
        onSave={(t) => {
          if (editing) { update(t); toast.success("Trade updated"); }
          else { add(t); toast.success("Trade saved"); }
          setEditing(null);
        }}
      />

      <TradeReview
        trade={reviewing}
        open={!!reviewing}
        onOpenChange={(o) => { if (!o) setReviewing(null); }}
        onEdit={(t) => { setEditing(t); setReviewing(null); setOpen(true); }}
        onDelete={(id) => { remove(id); toast.success("Trade deleted"); }}
        onDuplicate={(t) => { add({ ...t, id: `t_${Math.random().toString(36).slice(2, 10)}`, createdAt: new Date().toISOString() }); toast.success("Duplicated"); }}
      />
    </div>
  );
}
