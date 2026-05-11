import { useEffect, useState } from "react";
import { OnboardingWizard } from "./OnboardingWizard";
import { readPrefs, type Preferences } from "@/lib/preferences";

export function OnboardingGate() {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState<Preferences | undefined>();

  useEffect(() => {
    const p = readPrefs();
    setPrefs(p);
    if (!p.completed) setOpen(true);
    const onOpen = () => { setPrefs(readPrefs()); setOpen(true); };
    window.addEventListener("edgelab:open-onboarding", onOpen);
    return () => window.removeEventListener("edgelab:open-onboarding", onOpen);
  }, []);

  return <OnboardingWizard open={open} initial={prefs} onClose={() => setOpen(false)} />;
}
