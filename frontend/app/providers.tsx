"use client";

import type { ReactNode } from "react";
import { SessionGate } from "@/components/auth/SessionGate";
import { AchievementsProvider } from "@/hooks/useAchievements";
import { ExplorerProvider } from "@/hooks/useExplorer";
import { ProgressProvider } from "@/hooks/useProgress";
import { SessionProvider } from "@/hooks/useSession";
import { SettingsProvider } from "@/hooks/useSettings";
import { FlightProvider } from "@/components/space/FlightProvider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SettingsProvider>
      <ExplorerProvider>
        <SessionProvider>
          <ProgressProvider>
            <AchievementsProvider>
              <FlightProvider>
                <SessionGate>{children}</SessionGate>
              </FlightProvider>
            </AchievementsProvider>
          </ProgressProvider>
        </SessionProvider>
      </ExplorerProvider>
    </SettingsProvider>
  );
}

export default Providers;
