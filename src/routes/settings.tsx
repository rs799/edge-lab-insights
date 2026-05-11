import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { exportAll, importAll, clearAll } from "@/lib/store";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Download, Upload, Trash2, Database, Sparkles } from "lucide-react";
import { readPrefs } from "@/lib/preferences";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — EdgeLab" }] }),
  component: Settings,
});

function Settings() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("edgelab.theme");
    const isDark = saved !== "light";
    setDark(isDark);
    document.documentElement.classList.toggle("light", !isDark);
  }, []);

  const toggleTheme = (v: boolean) => {
    setDark(v);
    document.documentElement.classList.toggle("light", !v);
    localStorage.setItem("edgelab.theme", v ? "dark" : "light");
  };

  const onExport = () => {
    const data = exportAll();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `edgelab-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click(); URL.revokeObjectURL(url);
    toast.success("Backup downloaded");
  };

  const onImport = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try { importAll(reader.result as string); toast.success("Imported"); }
      catch { toast.error("Invalid backup file"); }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-6 lg:p-8 max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Theme, data and account preferences.</p>
      </header>

      <Section title="Appearance">
        <Row>
          <div>
            <Label>Dark mode</Label>
            <p className="text-xs text-muted-foreground mt-0.5">Recommended for chart-heavy interfaces.</p>
          </div>
          <Switch checked={dark} onCheckedChange={toggleTheme} />
        </Row>
      </Section>

      <Section title="Data">
        <Row>
          <div>
            <Label>Export journal</Label>
            <p className="text-xs text-muted-foreground mt-0.5">Download all trades and missed setups as JSON.</p>
          </div>
          <Button variant="outline" onClick={onExport}><Download className="h-4 w-4 mr-1.5" /> Export</Button>
        </Row>
        <Row>
          <div>
            <Label>Import journal</Label>
            <p className="text-xs text-muted-foreground mt-0.5">Restore from a previous backup file.</p>
          </div>
          <label className="cursor-pointer">
            <input type="file" accept="application/json" className="hidden" onChange={(e) => onImport(e.target.files?.[0])} />
            <span className="inline-flex items-center justify-center px-3 h-9 rounded-md border border-input text-sm hover:bg-accent">
              <Upload className="h-4 w-4 mr-1.5" /> Import
            </span>
          </label>
        </Row>
        <Row>
          <div>
            <Label className="text-bear">Clear all data</Label>
            <p className="text-xs text-muted-foreground mt-0.5">Permanently delete every trade and missed setup.</p>
          </div>
          <Button variant="outline" className="text-bear hover:text-bear" onClick={() => { if (confirm("Delete all data?")) { clearAll(); toast.success("Cleared"); } }}>
            <Trash2 className="h-4 w-4 mr-1.5" /> Clear
          </Button>
        </Row>
      </Section>

      <Section title="Personalization">
        <Row>
          <div>
            <Label>Onboarding preferences</Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              {(() => {
                const p = typeof window !== "undefined" ? readPrefs() : null;
                if (!p?.completed) return "Walk through setup to personalize EdgeLab.";
                const counts = [p.styles, p.symbols, p.sessions, p.confluences, p.psychology, p.goals].reduce((a, b) => a + b.length, 0);
                return `${counts} preferences saved across style, symbols, sessions and goals.`;
              })()}
            </p>
          </div>
          <Button variant="outline" onClick={() => window.dispatchEvent(new CustomEvent("edgelab:open-onboarding"))}>
            <Sparkles className="h-4 w-4 mr-1.5" /> Edit setup
          </Button>
        </Row>
      </Section>

      <Section title="Account">
        <Row>
          <div>
            <Label>Display name</Label>
            <p className="text-xs text-muted-foreground mt-0.5">Shown across the dashboard.</p>
          </div>
          <Input defaultValue="Trader" className="max-w-[220px]" />
        </Row>
        <Row>
          <div>
            <Label>Storage</Label>
            <p className="text-xs text-muted-foreground mt-0.5">Currently using browser local storage.</p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><Database className="h-3.5 w-3.5" /> Local</span>
        </Row>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl glass divide-y divide-border/60">
      <div className="px-5 py-3 text-xs uppercase tracking-[0.18em] text-muted-foreground font-semibold">{title}</div>
      {children}
    </div>
  );
}
function Row({ children }: { children: React.ReactNode }) {
  return <div className="px-5 py-4 flex items-center justify-between gap-3">{children}</div>;
}
