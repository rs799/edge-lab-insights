import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet, createRootRouteWithContext, useRouter, HeadContent, Scripts, Link,
} from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { AppSidebar, MobileTopBar } from "@/components/AppSidebar";
import { OnboardingGate } from "@/components/OnboardingGate";
import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center">
        <h1 className="text-7xl font-bold font-mono text-primary">404</h1>
        <p className="mt-3 text-muted-foreground">This route doesn't exist.</p>
        <Link to="/" className="mt-5 inline-flex rounded-md gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground">Back to Dashboard</Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Something broke</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button onClick={() => { router.invalidate(); reset(); }} className="mt-5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Try again</button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "EdgeLab — Trading Journal & Execution Analytics" },
      { name: "description", content: "Premium trading journal and execution analytics for discretionary futures traders using ICT concepts." },
      { property: "og:title", content: "EdgeLab — Trading Journal" },
      { property: "og:description", content: "Track, review and improve your discretionary trading edge." },
    ],
    links: [{ rel: "stylesheet", href: appCss }, { rel: "preconnect", href: "https://fonts.googleapis.com" }, { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen flex flex-col md:flex-row bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <MobileTopBar />
          <main className="flex-1 min-w-0">
            <Outlet />
          </main>
        </div>
        <Toaster />
        <OnboardingGate />
      </div>
    </QueryClientProvider>
  );
}
