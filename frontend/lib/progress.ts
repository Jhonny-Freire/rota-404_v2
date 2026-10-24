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

/** Registro de um planeta (cópia local em `rota404.progress`; com conta, também no servidor). */
export type PlanetProgress = {
  status: "in_progress" | "completed";
  bestPoints?: number;
  lastPoints?: number;
  completedAt?: string;
  /** laboratório já concluído alguma vez sem nenhum erro (só neste aparelho; vale para as conquistas) */
  flawless?: boolean;
  /** quantas vezes foi concluído (só neste aparelho; "refazer" nas conquistas) */
  completions?: number;
};

export type ProgressData = {
  /** dono deste progresso (id da conta ou "guest:<id>" do visitante, ver useSession); outro dono no aparelho começa do zero */
  owner?: string;
  planets: Record<string, PlanetProgress>;
};

export const EMPTY_PROGRESS: ProgressData = { planets: {} };

/** Junta dois registros do mesmo planeta: o estado mais avançado e a melhor pontuação. */
export function mergePlanet(a: PlanetProgress | undefined, b: PlanetProgress | undefined): PlanetProgress | undefined {
  if (!a || !b) return a ?? b;
  const best = Math.max(a.bestPoints ?? -1, b.bestPoints ?? -1);
  return {
    status: a.status === "completed" || b.status === "completed" ? "completed" : "in_progress",
    bestPoints: best >= 0 ? best : undefined,
    lastPoints: a.lastPoints ?? b.lastPoints,
    completedAt: a.completedAt ?? b.completedAt,
    flawless: a.flawless || b.flawless || undefined,
    completions: Math.max(a.completions ?? 0, b.completions ?? 0) || undefined,
  };
}

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
        flawless: entry.flawless === true || undefined,
        completions: validPoints(entry.completions) || undefined,
      };
    }
  }
  const owner = raw && typeof raw === "object" ? (raw as { owner?: unknown }).owner : undefined;
  return typeof owner === "string" && owner ? { owner, planets } : { planets };
}

/**
 * Estado de um planeta: registro local primeiro (completed/in_progress);
 * senão `available` se for o 1º do sistema, se o anterior estiver concluído, se um planeta seguinte já tiver registro ou se
 * `unlockAll`; senão `locked`.
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
  if (planets[orderedPlanetIds[index - 1]]?.status === "completed") return "available";
  // um planeta depois deste já foi começado ("Liberar todos" desligado depois, por exemplo): sem buraco bloqueado no meio
  return orderedPlanetIds.slice(index + 1).some((id) => planets[id]) ? "available" : "locked";
}

/**
 * Sistema liberado na galáxia (`systemsPlanetIds`: ids dos planetas de cada sistema, na ordem): um sol de cada vez.
 * O 1º sempre; os outros com o anterior concluído, com `unlockAll` ou se já tiverem progresso (para não esconder o que a
 * criança começou antes desta regra).
 */
export function isSystemUnlocked(
  planets: Record<string, PlanetProgress>,
  systemsPlanetIds: string[][],
  index: number,
  unlockAll: boolean,
): boolean {
  if (unlockAll || index <= 0) return true;
  if (systemsPlanetIds[index]?.some((id) => planets[id])) return true;
  return (systemsPlanetIds[index - 1] ?? []).every((id) => planets[id]?.status === "completed");
}

/** Estado agregado (sistema/galáxia) a partir dos estados dos planetas. */
export function aggregateState(states: ProgressState[]): ProgressState {
  if (states.length === 0) return "available";
  if (states.every((s) => s === "completed")) return "completed";
  if (states.some((s) => s === "completed" || s === "in_progress")) return "in_progress";
  return "available";
}

/**
 * Pontuação de laboratório da equipe (10.000 por lab; 80.000 por galáxia de 8 labs):
 * 1.000 por concluir + até 4.000 pelos erros (−1.000 cada) + até 5.000 pelo tempo (duas metades de 2.500).
 */
export const LAB_SCORE = {
  max: 10000,
  completion: 1000,
  errors: 4000,
  perError: 1000,
  timeHalf: 2500,
} as const;

export type LabScore = { completion: number; errors: number; time: number; total: number };

const clamp = (value: number, max: number) => Math.min(max, Math.max(0, value));

/**
 * Fórmula da equipe ("calculo da pontuacao.txt"): seg = tempo gasto; min = até aqui o tempo não desconta;
 * med = tempo médio. 1ª metade do bônus cai de min até med; 2ª metade cai de med até 2 × med.
 * Interpretação registrada: no texto, a 2ª metade usava IIF(seg < min, 0, seg − med), o que passava de 2.500 (e de
 * 10.000 no total) entre min e med; aqui ela só desconta depois de med, e cada metade fica entre 0 e 2.500.
 * `maxScore` (labs.max_score) escala o total: com 10.000 o resultado é exatamente a fórmula.
 */
export function labScore(
  mistakes: number,
  seconds: number,
  timing: { min: number; avg: number },
  maxScore: number = LAB_SCORE.max,
): LabScore {
  const { min, avg } = timing;
  const errors = clamp(LAB_SCORE.errors - LAB_SCORE.perError * Math.max(0, mistakes), LAB_SCORE.errors);
  const first = clamp(LAB_SCORE.timeHalf - (LAB_SCORE.timeHalf / (avg - min)) * Math.max(0, seconds - min), LAB_SCORE.timeHalf);
  const second = clamp(LAB_SCORE.timeHalf - (LAB_SCORE.timeHalf / avg) * Math.max(0, seconds - avg), LAB_SCORE.timeHalf);
  const scale = maxScore > 0 ? maxScore / LAB_SCORE.max : 1;
  // como no texto: INT(1000 + score_err + score_tmp1 + score_tmp2)
  const total = Math.floor((LAB_SCORE.completion + errors + first + second) * scale);
  const completion = Math.floor(LAB_SCORE.completion * scale);
  const errorPart = Math.floor(errors * scale);
  return { completion, errors: errorPart, time: total - completion - errorPart, total };
}

/** "2:05" */
export function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
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
