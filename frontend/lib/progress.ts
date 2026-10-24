import { SPRITES } from "@/config/assets";
import type { AgeRange, Galaxy, ProgressState } from "@/types/domain";

export const PROGRESS_LABELS: Record<ProgressState, string> = {
  locked: "Bloqueado",
  available: "Disponível",
  in_progress: "Em andamento",
  completed: "Concluído",
};

export const PROGRESS_SPRITES: Record<ProgressState, string> = {
  locked: SPRITES.status.locked,
  available: SPRITES.status.available,
  in_progress: SPRITES.status.inProgress,
  completed: SPRITES.status.completed,
};

/** Registro local de um planeta (localStorage `rota404.progress`). */
export type PlanetProgress = {
  status: "in_progress" | "completed";
  bestPoints?: number;
  lastPoints?: number;
  completedAt?: string;
};

export type ProgressData = {
  planets: Record<string, PlanetProgress>;
};

export const EMPTY_PROGRESS: ProgressData = { planets: {} };

function validPoints(value: unknown): number | undefined {
  const n = Number(value);
  return value !== undefined && value !== null && Number.isFinite(n) ? Math.max(0, Math.round(n)) : undefined;
}

export function sanitizeProgress(raw: unknown): ProgressData {
  const planets: Record<string, PlanetProgress> = {};
  const source = raw && typeof raw === "object" ? (raw as { planets?: unknown }).planets : null;
  if (source && typeof source === "object") {
    for (const [id, value] of Object.entries(source as Record<string, unknown>)) {
      if (!value || typeof value !== "object") continue;
      const entry = value as Record<string, unknown>;
      if (entry.status !== "in_progress" && entry.status !== "completed") continue;
      planets[id] = {
        status: entry.status,
        bestPoints: validPoints(entry.bestPoints),
        lastPoints: validPoints(entry.lastPoints),
        completedAt: typeof entry.completedAt === "string" ? entry.completedAt : undefined,
      };
    }
  }
  return { planets };
}

/**
 * Estado de um planeta: registro local primeiro (completed/in_progress);
 * senão `available` se for o 1º do sistema, se o anterior estiver concluído ou se `unlockAll`; senão `locked`.
 */
export function computePlanetState(
  planets: Record<string, PlanetProgress>,
  planetId: string,
  orderedPlanetIds: string[],
  unlockAll: boolean,
): ProgressState {
  const entry = planets[planetId];
  if (entry?.status === "completed") return "completed";
  if (entry?.status === "in_progress") return "in_progress";
  const index = orderedPlanetIds.indexOf(planetId);
  if (unlockAll || index <= 0) return "available";
  return planets[orderedPlanetIds[index - 1]]?.status === "completed" ? "available" : "locked";
}

/** Estado agregado (sistema/galáxia) a partir dos estados dos planetas. */
export function aggregateState(states: ProgressState[]): ProgressState {
  if (states.length === 0) return "available";
  if (states.every((s) => s === "completed")) return "completed";
  if (states.some((s) => s === "completed" || s === "in_progress")) return "in_progress";
  return "available";
}

export const MISTAKE_PENALTY = 10;

/** Pontuação do laboratório: max(50% de maxScore, maxScore − 10 × erros). */
export function labPoints(maxScore: number, mistakes: number): number {
  const max = Math.max(0, Math.round(maxScore));
  return Math.max(Math.ceil(max * 0.5), max - MISTAKE_PENALTY * Math.max(0, mistakes));
}

export type Medal = "gold" | "silver" | "bronze";

/** Ouro ≥ 90%, prata ≥ 70%, bronze abaixo disso. */
export function medalFor(points: number, maxScore: number): Medal {
  const ratio = maxScore > 0 ? points / maxScore : 0;
  if (ratio >= 0.9) return "gold";
  if (ratio >= 0.7) return "silver";
  return "bronze";
}

export const MEDAL_SPRITES: Record<Medal, string> = {
  gold: SPRITES.rewards.medalGold,
  silver: SPRITES.rewards.medalSilver,
  bronze: SPRITES.rewards.medalBronze,
};

export const MEDAL_LABELS: Record<Medal, string> = {
  gold: "Medalha de ouro",
  silver: "Medalha de prata",
  bronze: "Medalha de bronze",
};

export function galaxyStateForExplorer(
  galaxy: Galaxy,
  ageRanges: AgeRange[],
  explorerAgeRangeSlug: string | null,
): ProgressState {
  if (!explorerAgeRangeSlug) return "available";
  const range = ageRanges.find((r) => r.slug === explorerAgeRangeSlug);
  if (!range) return "available";
  return galaxy.age_range_id === range.id ? "available" : "locked";
}
