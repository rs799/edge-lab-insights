import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ICT_TAGS, PSYCH_TAGS, SESSIONS, type Trade, type SetupQuality, type Direction, type Outcome, type Session } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Upload, X } from "lucide-react";

const QUALITIES: SetupQuality[] = ["A+", "A", "B", "C"];

export function TradeModal({
  open, onOpenChange, onSave, initial,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSave: (t: Trade) => void;
  initial?: Trade | null;
}) {
  const [form, setForm] = useState<Trade>(() => emptyTrade());
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setForm(initial ?? emptyTrade());
  }, [open, initial]);

  const setF = <K extends keyof Trade>(k: K, v: Trade[K]) => setForm((p) => ({ ...p, [k]: v }));

  const toggleTag = (key: "ictTags" | "psychTags", tag: string) => {
    setForm((p) => ({
      ...p,
      [key]: p[key].includes(tag) ? p[key].filter((t) => t !== tag) : [...p[key], tag],
    }));
  };

  const onFile = (f?: File) => {
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setF("screenshot", reader.result as string);
    reader.readAsDataURL(f);
  };

  const submit = () => {
    onSave({ ...form, createdAt: form.createdAt || new Date().toISOString() });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle className="text-xl">{initial ? "Edit Trade" : "New Trade"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          <Section title="Screenshot">
            <div
              className="relative rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-colors aspect-video bg-surface overflow-hidden cursor-pointer"
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files?.[0]); }}
            >
              {form.screenshot ? (
                <>
                  <img src={form.screenshot} className="absolute inset-0 h-full w-full object-cover" alt="" />
                  <button onClick={(e) => { e.stopPropagation(); setF("screenshot", undefined); }} className="absolute top-2 right-2 h-7 w-7 rounded-full bg-background/80 flex items-center justify-center">
                    <X className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                  <Upload className="h-8 w-8 mb-2" />
                  <div className="text-sm">Drop screenshot or click to upload</div>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            </div>
          </Section>

          <Section title="Basic Info">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Field label="Instrument"><Input value={form.instrument} onChange={(e) => setF("instrument", e.target.value)} /></Field>
              <Field label="Ticker"><Input value={form.ticker} onChange={(e) => setF("ticker", e.target.value.toUpperCase())} /></Field>
              <Field label="Date"><Input type="date" value={form.date} onChange={(e) => setF("date", e.target.value)} /></Field>
              <Field label="Time"><Input type="time" value={form.time} onChange={(e) => setF("time", e.target.value)} /></Field>
              <Field label="Session">
                <Select value={form.session} onValueChange={(v) => setF("session", v as Session)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SESSIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Direction">
                <div className="grid grid-cols-2 gap-2">
                  {(["long", "short"] as Direction[]).map((d) => (
                    <button key={d} type="button" onClick={() => setF("direction", d)}
                      className={cn("h-9 rounded-md text-sm font-semibold uppercase tracking-wider transition-all border",
                        form.direction === d
                          ? d === "long" ? "bg-bull/20 text-bull border-bull/40" : "bg-bear/20 text-bear border-bear/40"
                          : "border-border text-muted-foreground hover:text-foreground"
                      )}>{d}</button>
                  ))}
                </div>
              </Field>
            </div>
          </Section>

          <Section title="Trade Data">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Field label="Entry"><Input type="number" step="any" value={form.entry || ""} onChange={(e) => setF("entry", +e.target.value)} /></Field>
              <Field label="Stop Loss"><Input type="number" step="any" value={form.stop || ""} onChange={(e) => setF("stop", +e.target.value)} /></Field>
              <Field label="Take Profit"><Input type="number" step="any" value={form.target || ""} onChange={(e) => setF("target", +e.target.value)} /></Field>
              <Field label="Exit"><Input type="number" step="any" value={form.exit || ""} onChange={(e) => setF("exit", +e.target.value)} /></Field>
              <Field label="Result (R)"><Input type="number" step="any" value={form.rResult || ""} onChange={(e) => setF("rResult", +e.target.value)} /></Field>
              <Field label="Outcome">
                <div className="grid grid-cols-3 gap-1">
                  {(["win", "loss", "breakeven"] as Outcome[]).map((o) => (
                    <button key={o} type="button" onClick={() => setF("outcome", o)}
                      className={cn("h-9 rounded-md text-xs font-semibold uppercase tracking-wider transition-all border",
                        form.outcome === o
                          ? o === "win" ? "bg-bull/20 text-bull border-bull/40"
                            : o === "loss" ? "bg-bear/20 text-bear border-bear/40"
                            : "bg-muted text-foreground border-border"
                          : "border-border text-muted-foreground hover:text-foreground"
                      )}>{o}</button>
                  ))}
                </div>
              </Field>
            </div>
          </Section>

          <Section title="Setup Quality">
            <div className="grid grid-cols-4 gap-2">
              {QUALITIES.map((q) => (
                <button key={q} type="button" onClick={() => setF("quality", q)}
                  className={cn("h-12 rounded-lg font-bold text-lg border transition-all",
                    form.quality === q ? "bg-primary text-primary-foreground border-primary glow-primary" : "border-border text-muted-foreground hover:text-foreground"
                  )}>{q}</button>
              ))}
            </div>
          </Section>

          <Section title="ICT Tags">
            <TagGrid tags={ICT_TAGS as readonly string[]} selected={form.ictTags} onToggle={(t) => toggleTag("ictTags", t)} />
          </Section>

          <Section title="Psychology Tags">
            <TagGrid tags={PSYCH_TAGS as readonly string[]} selected={form.psychTags} onToggle={(t) => toggleTag("psychTags", t)} variant="psych" />
          </Section>

          <Section title="Notes">
            <div className="grid md:grid-cols-2 gap-3">
              <Field label="Setup reasoning"><Textarea rows={3} value={form.reasoning ?? ""} onChange={(e) => setF("reasoning", e.target.value)} /></Field>
              <Field label="Execution review"><Textarea rows={3} value={form.execution ?? ""} onChange={(e) => setF("execution", e.target.value)} /></Field>
              <Field label="Mistakes made"><Textarea rows={3} value={form.mistakes ?? ""} onChange={(e) => setF("mistakes", e.target.value)} /></Field>
              <Field label="Lesson learned"><Textarea rows={3} value={form.lesson ?? ""} onChange={(e) => setF("lesson", e.target.value)} /></Field>
              <Field label="Emotional state"><Input value={form.emotion ?? ""} onChange={(e) => setF("emotion", e.target.value)} /></Field>
            </div>
          </Section>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} className="gradient-primary text-primary-foreground glow-primary">Save Trade</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-2 font-semibold">{title}</div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function TagGrid({ tags, selected, onToggle, variant }: { tags: readonly string[]; selected: string[]; onToggle: (t: string) => void; variant?: "psych" }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((t) => {
        const on = selected.includes(t);
        return (
          <button key={t} type="button" onClick={() => onToggle(t)}
            className={cn(
              "px-2.5 py-1 rounded-md text-xs border transition-all",
              on
                ? variant === "psych"
                  ? "bg-bear/15 text-bear border-bear/40"
                  : "bg-primary/20 text-primary border-primary/40"
                : "border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
            )}>{t}</button>
        );
      })}
    </div>
  );
}

function emptyTrade(): Trade {
  return {
    id: `t_${Math.random().toString(36).slice(2, 10)}`,
    instrument: "",
    ticker: "",
    date: new Date().toISOString().slice(0, 10),
    time: new Date().toTimeString().slice(0, 5),
    session: "NY AM",
    direction: "long",
    entry: 0, stop: 0, target: 0, exit: 0,
    rResult: 0,
    outcome: "win",
    quality: "A",
    ictTags: [], psychTags: [],
    createdAt: "",
  };
}
