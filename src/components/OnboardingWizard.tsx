import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  TrendingUp, ArrowRight, ArrowLeft, Check, Sparkles, Plus, X, Search,
  Target, Brain, Layers, Clock, BarChart3, Rocket,
} from "lucide-react";
import { DEFAULT_PREFS, type Preferences, writePrefs } from "@/lib/preferences";

type Props = { open: boolean; initial?: Preferences; onClose: () => void };

const STYLES = [
  "ICT / Smart Money Concepts", "Price Action", "Scalping", "Intraday Futures",
  "Swing Trading", "Options", "Forex", "Crypto", "Other",
];
const POPULAR_SYMBOLS = ["NQ", "MNQ", "ES", "MES", "GC", "MGC", "CL", "EURUSD", "GBPUSD", "BTC", "ETH"];
const SESSIONS = [
  { name: "Asia", time: "18:00 – 03:00 EST" },
  { name: "London", time: "03:00 – 08:00 EST" },
  { name: "NY AM", time: "08:00 – 11:00 EST" },
  { name: "NY Lunch", time: "11:00 – 13:00 EST" },
  { name: "NY PM", time: "13:00 – 16:00 EST" },
];
const CONFLUENCES = [
  "FVG", "iFVG", "liquidity sweep", "SMT divergence", "OTE", "BOS", "CHOCH",
  "displacement", "order block", "breaker", "mitigation block", "liquidity run",
  "session sweep", "equilibrium", "Judas swing", "HTF bias", "continuation",
  "reversal", "market structure shift",
];
const PSYCH = [
  "hesitation", "revenge trading", "emotional entries", "FOMO", "overtrading",
  "bad risk management", "poor bias", "entering too early", "entering too late",
  "inconsistent execution", "skipping valid setups", "forcing trades",
];
const GOALS = [
  "consistency", "discipline", "execution", "profitability",
  "psychology", "setup quality", "patience", "risk management",
];

export function OnboardingWizard({ open, initial, onClose }: Props) {
  const [step, setStep] = useState(0);
  const [prefs, setPrefs] = useState<Preferences>(initial ?? DEFAULT_PREFS);

  useEffect(() => { if (open) { setStep(0); setPrefs(initial ?? DEFAULT_PREFS); } }, [open, initial]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open, onClose]);

  if (!open) return null;

  const steps = [
    "Welcome", "Style", "Symbols", "Sessions", "Confluences", "Psychology", "Goals", "Ready",
  ];
  const total = steps.length;
  const progress = ((step + 1) / total) * 100;

  const finish = (skip = false) => {
    writePrefs({ ...prefs, completed: true, completedAt: new Date().toISOString() });
    if (skip) {
      // intentionally save minimal state
    }
    onClose();
  };

  const next = () => setStep((s) => Math.min(s + 1, total - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <div className="fixed inset-0 z-[80] flex items-stretch justify-center bg-background/85 backdrop-blur-md animate-in fade-in duration-300">
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
      <div className="relative w-full h-full md:h-auto md:my-auto md:max-w-3xl md:rounded-2xl md:border md:border-border md:shadow-2xl bg-[var(--surface)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 md:px-8 pt-6 pb-4 border-b border-border flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl gradient-primary flex items-center justify-center glow-primary">
            <TrendingUp className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold tracking-tight">EdgeLab Setup</div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Step {step + 1} of {total} · {steps[step]}
            </div>
          </div>
          <button onClick={() => finish(true)} className="text-xs text-muted-foreground hover:text-foreground transition">
            Skip setup
          </button>
        </div>

        {/* Progress */}
        <div className="h-1 w-full bg-muted/40">
          <div className="h-full gradient-primary transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 md:px-10 py-8 md:py-10">
          <div key={step} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {step === 0 && <Welcome onStart={next} onSkip={() => finish(true)} />}
            {step === 1 && (
              <ChipStep
                icon={<Sparkles className="h-5 w-5" />}
                title="What best describes your trading style?"
                subtitle="Select all that apply. We'll tailor analytics to your approach."
                options={STYLES}
                value={prefs.styles}
                onChange={(v) => setPrefs({ ...prefs, styles: v })}
              />
            )}
            {step === 2 && (
              <SymbolsStep
                value={prefs.symbols}
                onChange={(v) => setPrefs({ ...prefs, symbols: v })}
              />
            )}
            {step === 3 && (
              <SessionsStep
                value={prefs.sessions}
                onChange={(v) => setPrefs({ ...prefs, sessions: v })}
              />
            )}
            {step === 4 && (
              <ConfluenceStep
                value={prefs.confluences}
                onChange={(v) => setPrefs({ ...prefs, confluences: v })}
              />
            )}
            {step === 5 && (
              <ChipStep
                icon={<Brain className="h-5 w-5" />}
                title="What are your biggest trading challenges?"
                subtitle="Honesty here unlocks the psychology tracker. Pick the patterns you fight most."
                options={PSYCH}
                value={prefs.psychology}
                onChange={(v) => setPrefs({ ...prefs, psychology: v })}
              />
            )}
            {step === 6 && (
              <ChipStep
                icon={<Target className="h-5 w-5" />}
                title="What do you want to improve most?"
                subtitle="We'll surface insights aligned with your goals."
                options={GOALS}
                value={prefs.goals}
                onChange={(v) => setPrefs({ ...prefs, goals: v })}
              />
            )}
            {step === 7 && <Summary prefs={prefs} />}
          </div>
        </div>

        {/* Footer */}
        {step > 0 && (
          <div className="px-6 md:px-8 py-4 border-t border-border flex items-center justify-between gap-3 bg-[var(--surface-elevated)]">
            <Button variant="ghost" size="sm" onClick={back} className="gap-1.5">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <div className="flex items-center gap-2">
              {step < total - 1 && (
                <Button variant="ghost" size="sm" onClick={next} className="text-muted-foreground">
                  Skip
                </Button>
              )}
              {step < total - 1 ? (
                <Button onClick={next} className="gradient-primary text-primary-foreground gap-1.5">
                  Continue <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={() => finish(false)} className="gradient-primary text-primary-foreground gap-1.5">
                  <Rocket className="h-4 w-4" /> Launch Dashboard
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Welcome({ onStart, onSkip }: { onStart: () => void; onSkip: () => void }) {
  return (
    <div className="max-w-xl mx-auto text-center py-6 md:py-10">
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] uppercase tracking-[0.18em] bg-primary/10 text-primary border border-primary/20">
        <Sparkles className="h-3 w-3" /> Welcome
      </div>
      <h1 className="mt-5 text-3xl md:text-5xl font-bold tracking-tight">
        Welcome to <span className="bg-gradient-to-r from-primary to-[oklch(0.78_0.18_290)] bg-clip-text text-transparent">EdgeLab</span>
      </h1>
      <p className="mt-3 text-base md:text-lg text-muted-foreground">
        Build consistency. Review execution. Find your edge.
      </p>
      <div className="mt-8 grid sm:grid-cols-2 gap-2.5 text-left">
        {[
          { icon: BarChart3, t: "Review every trade", d: "Tag setups, sessions and confluences." },
          { icon: Brain, t: "Track your psychology", d: "Surface the emotions costing you R." },
          { icon: Layers, t: "Analyze your setups", d: "Expectancy by tag, session and quality." },
          { icon: Target, t: "Improve execution", d: "Pattern recognition turns logs into edge." },
        ].map((f) => (
          <div key={f.t} className="rounded-xl glass p-3.5 flex gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <f.icon className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-semibold">{f.t}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{f.d}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-8 flex flex-col sm:flex-row gap-2 justify-center">
        <Button onClick={onStart} size="lg" className="gradient-primary text-primary-foreground gap-1.5">
          Get Started <ArrowRight className="h-4 w-4" />
        </Button>
        <Button onClick={onSkip} variant="ghost" size="lg">Skip setup</Button>
      </div>
    </div>
  );
}

function StepHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="mb-6 max-w-xl">
      <div className="inline-flex items-center justify-center h-9 w-9 rounded-lg bg-primary/10 text-primary border border-primary/20">
        {icon}
      </div>
      <h2 className="mt-3 text-2xl md:text-3xl font-bold tracking-tight">{title}</h2>
      {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative px-3.5 py-2 rounded-lg text-sm font-medium border transition-all duration-200 flex items-center gap-1.5",
        active
          ? "bg-primary/15 border-primary/50 text-foreground shadow-[0_0_0_1px_var(--primary)] glow-primary"
          : "bg-[var(--surface-elevated)] border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
      )}
    >
      {active && <Check className="h-3.5 w-3.5 text-primary" />}
      {children}
    </button>
  );
}

function ChipStep({ icon, title, subtitle, options, value, onChange }: {
  icon: React.ReactNode; title: string; subtitle?: string;
  options: readonly string[]; value: string[]; onChange: (v: string[]) => void;
}) {
  const toggle = (o: string) => onChange(value.includes(o) ? value.filter((x) => x !== o) : [...value, o]);
  return (
    <div>
      <StepHeader icon={icon} title={title} subtitle={subtitle} />
      <div className="flex flex-wrap gap-2">
        {options.map((o) => <Chip key={o} active={value.includes(o)} onClick={() => toggle(o)}>{o}</Chip>)}
      </div>
    </div>
  );
}

function SymbolsStep({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(
    () => POPULAR_SYMBOLS.filter((s) => s.toLowerCase().includes(q.toLowerCase())),
    [q]
  );
  const toggle = (s: string) => onChange(value.includes(s) ? value.filter((x) => x !== s) : [...value, s]);
  const addCustom = () => {
    const s = q.trim().toUpperCase();
    if (!s || value.includes(s)) return;
    onChange([...value, s]);
    setQ("");
  };
  return (
    <div>
      <StepHeader
        icon={<BarChart3 className="h-5 w-5" />}
        title="What markets do you trade most?"
        subtitle="Search popular instruments or add your own."
      />
      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } }}
          placeholder="Search or add a custom ticker…"
          className="pl-9 pr-20 h-10 bg-[var(--surface-elevated)]"
        />
        {q.trim() && !POPULAR_SYMBOLS.includes(q.trim().toUpperCase()) && (
          <button
            type="button"
            onClick={addCustom}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 px-2.5 rounded-md text-xs font-medium bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25"
          >
            <Plus className="h-3 w-3 inline -mt-0.5 mr-1" />Add
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2 mb-5">
        {filtered.map((s) => <Chip key={s} active={value.includes(s)} onClick={() => toggle(s)}>{s}</Chip>)}
      </div>
      {value.length > 0 && (
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-2">Selected ({value.length})</div>
          <div className="flex flex-wrap gap-1.5">
            {value.map((s) => (
              <span key={s} className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-mono bg-primary/15 text-primary border border-primary/30">
                {s}
                <button onClick={() => toggle(s)} className="hover:text-foreground"><X className="h-3 w-3" /></button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SessionsStep({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const toggle = (s: string) => onChange(value.includes(s) ? value.filter((x) => x !== s) : [...value, s]);
  return (
    <div>
      <StepHeader
        icon={<Clock className="h-5 w-5" />}
        title="Which sessions do you trade?"
        subtitle="We'll group performance and surface session-specific patterns."
      />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {SESSIONS.map((s) => {
          const active = value.includes(s.name);
          return (
            <button
              key={s.name}
              onClick={() => toggle(s.name)}
              className={cn(
                "text-left p-4 rounded-xl border transition-all duration-200",
                active
                  ? "bg-primary/10 border-primary/50 glow-primary"
                  : "bg-[var(--surface-elevated)] border-border hover:border-primary/40"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="font-semibold">{s.name}</div>
                {active && <Check className="h-4 w-4 text-primary" />}
              </div>
              <div className="text-xs text-muted-foreground mt-1 font-mono">{s.time}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ConfluenceStep({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [custom, setCustom] = useState("");
  const all = useMemo(() => {
    const extras = value.filter((v) => !CONFLUENCES.includes(v));
    return [...CONFLUENCES, ...extras];
  }, [value]);
  const toggle = (s: string) => onChange(value.includes(s) ? value.filter((x) => x !== s) : [...value, s]);
  const add = () => {
    const s = custom.trim();
    if (!s || value.includes(s)) return;
    onChange([...value, s]);
    setCustom("");
  };
  return (
    <div>
      <StepHeader
        icon={<Layers className="h-5 w-5" />}
        title="Which confluences do you use?"
        subtitle="The setups you select here will pre-populate your journal tags."
      />
      <div className="flex flex-wrap gap-2 mb-5">
        {all.map((s) => <Chip key={s} active={value.includes(s)} onClick={() => toggle(s)}>{s}</Chip>)}
      </div>
      <div className="flex gap-2 max-w-md">
        <Input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder="Add custom confluence…"
          className="h-10 bg-[var(--surface-elevated)]"
        />
        <Button onClick={add} variant="outline" className="gap-1.5"><Plus className="h-4 w-4" />Add</Button>
      </div>
    </div>
  );
}

function Summary({ prefs }: { prefs: Preferences }) {
  const sections: { label: string; values: string[] }[] = [
    { label: "Trading style", values: prefs.styles },
    { label: "Symbols", values: prefs.symbols },
    { label: "Sessions", values: prefs.sessions },
    { label: "Confluences", values: prefs.confluences },
    { label: "Psychology focus", values: prefs.psychology },
    { label: "Goals", values: prefs.goals },
  ];
  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex h-12 w-12 rounded-2xl gradient-primary items-center justify-center glow-primary mb-4">
          <Check className="h-6 w-6 text-primary-foreground" strokeWidth={3} />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Your EdgeLab workspace is ready.</h2>
        <p className="mt-2 text-sm text-muted-foreground">We'll prioritize the analytics and tags below across the app.</p>
      </div>
      <div className="space-y-3">
        {sections.map((s) => (
          <div key={s.label} className="rounded-xl glass p-4">
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-2">{s.label}</div>
            {s.values.length === 0 ? (
              <div className="text-sm text-muted-foreground italic">None selected</div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {s.values.map((v) => (
                  <span key={v} className="px-2 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20">{v}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
