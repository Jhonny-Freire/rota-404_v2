"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from "react";
import {
  EMPTY_PROGRESS,
  computePlanetState,
  isSystemUnlocked,
  mergePlanet,
  sanitizeProgress,
  type PlanetProgress,
  type ProgressData,
} from "@/lib/progress";
import { getProgress, updateProgress } from "@/services/gamificationService";
import type { ProgressState } from "@/types/domain";
import { useLocalStorage } from "./useLocalStorage";
import { useSession } from "./useSession";
import { useSettings } from "./useSettings";

export type { PlanetProgress, ProgressData } from "@/lib/progress";

export type ProgressContextValue = {
  progress: ProgressData;
  /** true depois de ler o localStorage (progresso e ajustes) e de saber de quem é a sessão */
  hydrated: boolean;
  getPlanet: (planetId: string) => PlanetProgress | undefined;
  /** marca como em andamento (não rebaixa um planeta concluído) */
  markStarted: (planetId: string) => void;
  /** conclui; com `points` atualiza lastPoints e bestPoints (máximo); `mistakes` (labs) marca "sem erro" se for 0 */
  markCompleted: (planetId: string, points?: number, mistakes?: number) => void;
  /** estado de exibição dentro do sistema (ids na ordem do sistema) */
  planetState: (planetId: string, orderedPlanetIds: string[]) => ProgressState;
  /** sistema liberado na galáxia (ids dos planetas sistema por sistema, na ordem): um sol de cada vez */
  systemUnlocked: (systemsPlanetIds: string[][], index: number) => boolean;
  /** fração 0–1 de planetas concluídos */
  completionRatio: (planetIds: string[]) => number;
  completedCount: (planetIds?: string[]) => number;
  /** soma das melhores pontuações (todos os planetas se omitido) */
  totalPoints: (planetIds?: string[]) => number;
  resetProgress: () => void;
};

const STORAGE_KEY = "rota404.progress";

const ProgressContext = createContext<ProgressContextValue | null>(null);

/** Envia ao servidor (sem esperar). Se falhar, a próxima sincronização da conta reenvia. */
function push(planetId: string, entry: PlanetProgress) {
  const points = entry.status === "completed" ? entry.bestPoints : undefined;
  updateProgress(planetId, entry.status, points).catch(() => undefined);
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const { settings, hydrated: settingsHydrated } = useSettings();
  const { status: sessionStatus, owner } = useSession();
  const [stored, setStored, storageHydrated] = useLocalStorage<ProgressData>(STORAGE_KEY, EMPTY_PROGRESS);
  const progress = useMemo(() => sanitizeProgress(stored), [stored]);
  const unlockAll = settings.unlockAll;
  const synced = sessionStatus === "signed-in";
  const progressRef = useRef(progress);
  progressRef.current = progress;

  // outra conta (ou visitante) neste aparelho: começa do zero e, com conta, busca o que está no servidor
  useEffect(() => {
    if (!storageHydrated || owner === null) return;
    if (progressRef.current.owner !== owner) setStored({ owner, planets: {} });
    if (!synced) return;
    let active = true;
    getProgress().then(
      (entries) => {
        if (!active) return;
        const server: Record<string, PlanetProgress> = {};
        for (const entry of entries) {
          server[entry.planet_id] = { status: entry.status, bestPoints: entry.best_points ?? undefined };
        }
        const local = progressRef.current.owner === owner ? progressRef.current.planets : {};
        // o que só existe aqui (feito sem conexão) volta para o servidor
        for (const [id, entry] of Object.entries(local)) {
          const remote = server[id];
          const ahead =
            !remote ||
            (entry.status === "completed" && remote.status !== "completed") ||
            (entry.bestPoints ?? 0) > (remote.bestPoints ?? 0);
          if (ahead) push(id, entry);
        }
        const planets: Record<string, PlanetProgress> = {};
        for (const id of new Set([...Object.keys(local), ...Object.keys(server)])) {
          planets[id] = mergePlanet(local[id], server[id])!;
        }
        setStored({ owner, planets });
      },
      () => undefined, // sem rede: segue com a cópia local
    );
    return () => {
      active = false;
    };
  }, [storageHydrated, owner, synced, setStored]);

  const markStarted = useCallback(
    (planetId: string) => {
      if (progressRef.current.planets[planetId]) return;
      const entry: PlanetProgress = { status: "in_progress" };
      setStored((prev) => {
        const data = sanitizeProgress(prev);
        if (data.planets[planetId]) return prev;
        return { ...data, planets: { ...data.planets, [planetId]: entry } };
      });
      if (synced) push(planetId, entry);
    },
    [setStored, synced],
  );

  const markCompleted = useCallback(
    (planetId: string, points?: number, mistakes?: number) => {
      const current = progressRef.current.planets[planetId];
      const before = current?.status === "completed" ? (current.completions ?? 1) : 0;
      const value = points !== undefined && Number.isFinite(points) ? Math.max(0, Math.round(points)) : undefined;
      const next: PlanetProgress = {
        status: "completed",
        completedAt: new Date().toISOString(),
        lastPoints: value ?? current?.lastPoints,
        bestPoints: value !== undefined ? Math.max(value, current?.bestPoints ?? 0) : current?.bestPoints,
        flawless: current?.flawless || mistakes === 0 || undefined,
        completions: before + 1,
      };
      setStored((prev) => {
        const data = sanitizeProgress(prev);
        return { ...data, planets: { ...data.planets, [planetId]: next } };
      });
      if (synced) push(planetId, next);
    },
    [setStored, synced],
  );

  /** apaga só a cópia deste aparelho (a conta no servidor continua com o progresso) */
  const resetProgress = useCallback(
    () => setStored({ owner: progressRef.current.owner, planets: {} }),
    [setStored],
  );

  const value = useMemo<ProgressContextValue>(() => {
    // até saber de quem é a sessão (e trocar o dono), o progresso guardado não vale
    const ready = storageHydrated && settingsHydrated && owner !== null && progress.owner === owner;
    const planets = ready ? progress.planets : {};
    const ids = (planetIds?: string[]) => planetIds ?? Object.keys(planets);
    return {
      progress: ready ? progress : EMPTY_PROGRESS,
      hydrated: ready,
      getPlanet: (planetId) => planets[planetId],
      markStarted,
      markCompleted,
      planetState: (planetId, orderedPlanetIds) => computePlanetState(planets, planetId, orderedPlanetIds, unlockAll),
      systemUnlocked: (systemsPlanetIds, index) => isSystemUnlocked(planets, systemsPlanetIds, index, unlockAll),
      completionRatio: (planetIds) =>
        planetIds.length === 0 ? 0 : planetIds.filter((id) => planets[id]?.status === "completed").length / planetIds.length,
      completedCount: (planetIds) => ids(planetIds).filter((id) => planets[id]?.status === "completed").length,
      totalPoints: (planetIds) => ids(planetIds).reduce((sum, id) => sum + (planets[id]?.bestPoints ?? 0), 0),
      resetProgress,
    };
  }, [progress, storageHydrated, settingsHydrated, owner, unlockAll, markStarted, markCompleted, resetProgress]);

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const context = useContext(ProgressContext);
  if (!context) throw new Error("useProgress precisa estar dentro de <ProgressProvider>.");
  return context;
}

export default useProgress;
