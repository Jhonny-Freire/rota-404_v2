"use client";

import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import {
  EMPTY_PROGRESS,
  computePlanetState,
  sanitizeProgress,
  type PlanetProgress,
  type ProgressData,
} from "@/lib/progress";
import type { ProgressState } from "@/types/domain";
import { useLocalStorage } from "./useLocalStorage";
import { useSettings } from "./useSettings";

export type { PlanetProgress, ProgressData } from "@/lib/progress";

export type ProgressContextValue = {
  progress: ProgressData;
  /** true depois de ler o localStorage (progresso e ajustes) */
  hydrated: boolean;
  getPlanet: (planetId: string) => PlanetProgress | undefined;
  /** marca como em andamento (não rebaixa um planeta concluído) */
  markStarted: (planetId: string) => void;
  /** conclui; com `points` atualiza lastPoints e bestPoints (máximo) */
  markCompleted: (planetId: string, points?: number) => void;
  /** estado de exibição dentro do sistema (ids na ordem do sistema) */
  planetState: (planetId: string, orderedPlanetIds: string[]) => ProgressState;
  /** fração 0–1 de planetas concluídos */
  completionRatio: (planetIds: string[]) => number;
  completedCount: (planetIds?: string[]) => number;
  /** soma das melhores pontuações (todos os planetas se omitido) */
  totalPoints: (planetIds?: string[]) => number;
  resetProgress: () => void;
};

const STORAGE_KEY = "rota404.progress";

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const { settings, hydrated: settingsHydrated } = useSettings();
  const [stored, setStored, storageHydrated] = useLocalStorage<ProgressData>(STORAGE_KEY, EMPTY_PROGRESS);
  const progress = useMemo(() => sanitizeProgress(stored), [stored]);
  const unlockAll = settings.unlockAll;

  const markStarted = useCallback(
    (planetId: string) =>
      setStored((prev) => {
        const data = sanitizeProgress(prev);
        if (data.planets[planetId]) return prev;
        return { planets: { ...data.planets, [planetId]: { status: "in_progress" } } };
      }),
    [setStored],
  );

  const markCompleted = useCallback(
    (planetId: string, points?: number) =>
      setStored((prev) => {
        const data = sanitizeProgress(prev);
        const entry = data.planets[planetId];
        const value = points !== undefined && Number.isFinite(points) ? Math.max(0, Math.round(points)) : undefined;
        const next: PlanetProgress = {
          status: "completed",
          completedAt: new Date().toISOString(),
          lastPoints: value ?? entry?.lastPoints,
          bestPoints: value !== undefined ? Math.max(value, entry?.bestPoints ?? 0) : entry?.bestPoints,
        };
        return { planets: { ...data.planets, [planetId]: next } };
      }),
    [setStored],
  );

  const resetProgress = useCallback(() => setStored(EMPTY_PROGRESS), [setStored]);

  const value = useMemo<ProgressContextValue>(() => {
    const { planets } = progress;
    const ids = (planetIds?: string[]) => planetIds ?? Object.keys(planets);
    return {
      progress,
      hydrated: storageHydrated && settingsHydrated,
      getPlanet: (planetId) => planets[planetId],
      markStarted,
      markCompleted,
      planetState: (planetId, orderedPlanetIds) => computePlanetState(planets, planetId, orderedPlanetIds, unlockAll),
      completionRatio: (planetIds) =>
        planetIds.length === 0 ? 0 : planetIds.filter((id) => planets[id]?.status === "completed").length / planetIds.length,
      completedCount: (planetIds) => ids(planetIds).filter((id) => planets[id]?.status === "completed").length,
      totalPoints: (planetIds) => ids(planetIds).reduce((sum, id) => sum + (planets[id]?.bestPoints ?? 0), 0),
      resetProgress,
    };
  }, [progress, storageHydrated, settingsHydrated, unlockAll, markStarted, markCompleted, resetProgress]);

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const context = useContext(ProgressContext);
  if (!context) throw new Error("useProgress precisa estar dentro de <ProgressProvider>.");
  return context;
}

export default useProgress;
