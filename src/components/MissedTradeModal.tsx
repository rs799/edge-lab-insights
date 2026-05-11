import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ICT_TAGS, SESSIONS, type MissedTrade, type SetupQuality, type Session } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Upload, X } from "lucide-react";

const QUALITIES: SetupQuality[] = ["A+", "A", "B", "C"];

export function MissedTradeModal({ open, onOpenChange, onSave }: { open: boolean; onOpenChange: (o: boolean) => void; onSave: (m: MissedTrade) => void }) {
  const [form, setForm] = useState<MissedTrade>(empty());
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (open) setForm(empty()); }, [open]);

  const setF = <K extends keyof MissedTrade>(k: K, v: MissedTrade[K]) => setForm((p) => ({ ...p, [k]: v }));
  const onFile = (f?: File) => {
    if (!f) return;
    const r = new FileReader();
    r.onload = () => setF("screenshot", r.result as string);
    r.readAsDataURL(f);
  };
  const toggleTag = (t: string) =>
    setForm((p) => ({ ...p, ictTags: p.ictTags.includes(t) ? p.ictTags.filter((x) => x !== t) : [...p.ictTags, t] }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-thin">
        <DialogHeader><DialogTitle>Log Missed Trade</DialogTitle></DialogHeader>

        <div className="space-y-5 py-2">
          <div
            className="relative rounded-xl border-2 border-dashed border-border hover:border-primary/50 aspect-video bg-surface overflow-hidden cursor-pointer"
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files?.[0]); }}
          >
            {form.screenshot ? (
              <>
                <img src={form.screenshot} className="absolute inset-0 h-full w-full object-cover" alt="" />
                <button onClick={(e) => { e.stopPropagation(); setF("screenshot", undefined); }} className="absolute top-2 right-2 h-7 w-7 rounded-full bg-background/80 flex items-center justify-center"><X className="h-4 w-4" /></button>
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                <Upload className="h-8 w-8 mb-2" /><div className="text-sm">Add chart screenshot</div>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <F label="Instrument"><Input value={form.instrument} onChange={(e) => setF("instrument", e.target.value)} /></F>
            <F label="Date"><Input type="date" value={form.date} onChange={(e) => setF("date", e.target.value)} /></F>
            <F label="Time"><Input type="time" value={form.time} onChange={(e) => setF("time", e.target.value)} /></F>
            <F label="Session">
              <Select value={form.session} onValueChange={(v) => setF("session", v as Session)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{SESSIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </F>
            <F label="Estimated R"><Input type="number" step="any" value={form.estimatedR || ""} onChange={(e) => setF("estimatedR", +e.target.value)} /></F>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Setup Quality</Label>
            <div className="grid grid-cols-4 gap-2 mt-1.5">
              {QUALITIES.map((q) => (
                <button key={q} onClick={() => setF("quality", q)}
                  className={cn("h-10 rounded-lg font-bold border transition-all",
                    form.quality === q ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground")}>{q}</button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Setup Tags</Label>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {ICT_TAGS.map((t) => {
                const on = form.ictTags.includes(t);
                return <button key={t} onClick={() => toggleTag(t)}
                  className={cn("px-2.5 py-1 rounded-md text-xs border transition-all",
                    on ? "bg-primary/20 text-primary border-primary/40" : "border-border text-muted-foreground hover:text-foreground")}>{t}</button>;
              })}
            </div>
          </div>

          <F label="Why was this trade missed?"><Textarea rows={2} value={form.reason} onChange={(e) => setF("reason", e.target.value)} /></F>
          <F label="Emotional state"><Input value={form.emotion} onChange={(e) => setF("emotion", e.target.value)} /></F>
          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
            <Label className="text-sm">Would it have won?</Label>
            <Switch checked={form.wouldHaveWon} onCheckedChange={(v) => setF("wouldHaveWon", v)} />
          </div>
          <F label="Lesson learned"><Textarea rows={2} value={form.lesson} onChange={(e) => setF("lesson", e.target.value)} /></F>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => { onSave({ ...form, createdAt: new Date().toISOString() }); onOpenChange(false); }} className="gradient-primary text-primary-foreground">Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">{label}</Label>{children}</div>;
}

function empty(): MissedTrade {
  return {
    id: `m_${Math.random().toString(36).slice(2, 10)}`,
    instrument: "", date: new Date().toISOString().slice(0, 10),
    time: new Date().toTimeString().slice(0, 5), session: "NY AM",
    quality: "A", ictTags: [], reason: "", emotion: "",
    wouldHaveWon: false, estimatedR: 2, lesson: "", createdAt: "",
  };
}
