import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, BookOpen, EyeOff, BarChart3, FlaskConical, Settings, TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/journal", label: "Journal", icon: BookOpen },
  { to: "/missed", label: "Missed Trades", icon: EyeOff },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/backtest", label: "Backtest Lab", icon: FlaskConical },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppSidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <aside className="hidden md:flex md:w-64 lg:w-72 shrink-0 flex-col bg-sidebar border-r border-sidebar-border h-screen sticky top-0">
      <div className="px-6 py-6 flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl gradient-primary flex items-center justify-center glow-primary">
          <TrendingUp className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
        </div>
        <div>
          <div className="font-bold text-lg tracking-tight">EdgeLab</div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Execution Analytics</div>
        </div>
      </div>

      <nav className="px-3 mt-2 flex-1 space-y-1">
        {items.map((it) => {
          const active = it.exact ? path === it.to : path.startsWith(it.to);
          const Icon = it.icon;
          return (
            <Link
              key={it.to}
              to={it.to}
              className={cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                active
                  ? "bg-sidebar-accent text-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
              )}
            >
              <Icon className={cn("h-4 w-4 transition-colors", active && "text-primary")} />
              <span>{it.label}</span>
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary glow-primary" />}
            </Link>
          );
        })}
      </nav>

      <div className="m-3 p-4 rounded-xl glass">
        <div className="text-xs text-muted-foreground">Pro tip</div>
        <div className="text-sm mt-1 leading-snug">Review every losing trade. Patterns hide in the misses.</div>
      </div>
    </aside>
  );
}

export function MobileTopBar() {
  return (
    <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-sidebar">
      <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
        <TrendingUp className="h-4 w-4 text-primary-foreground" />
      </div>
      <div className="font-bold tracking-tight">EdgeLab</div>
      <nav className="ml-auto flex gap-1 overflow-x-auto scrollbar-thin">
        {items.map((it) => (
          <Link key={it.to} to={it.to} className="px-2 py-1 text-xs text-muted-foreground" activeProps={{ className: "text-foreground" }}>
            {it.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
