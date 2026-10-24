"use client";

import type { ReactNode } from "react";
import { ExplorerProvider } from "@/hooks/useExplorer";
import { ProgressProvider } from "@/hooks/useProgress";
import { SettingsProvider } from "@/hooks/useSettings";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SettingsProvider>
      <ExplorerProvider>
        <ProgressProvider>{children}</ProgressProvider>
      </ExplorerProvider>
    </SettingsProvider>
  );
}

export default Providers;
