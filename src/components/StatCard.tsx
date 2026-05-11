import { cn } from "@/lib/utils";

export function StatCard({
  label, value, sub, accent, className,
}: {
  label: string; value: React.ReactNode; sub?: React.ReactNode;
  accent?: "bull" | "bear" | "primary" | "muted"; className?: string;
}) {
  const accentClass =
    accent === "bull" ? "text-bull" :
    accent === "bear" ? "text-bear" :
    accent === "primary" ? "text-primary" : "text-foreground";
  return (
    <div className={cn("relative rounded-xl glass p-4 overflow-hidden", className)}>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn("mt-2 text-2xl font-bold font-mono tabular-nums", accentClass)}>{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}
