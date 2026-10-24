import { LAB_SCORE, type PlanetProgress } from "@/lib/progress";
import type { GalaxyDetail, Planet } from "@/types/domain";

/*
 * Regras das conquistas (config/achievements.ts). Interpretações registradas no histórico (24/10/2026):
 * - "sem cometer nenhum erro" num sistema/galáxia = todos os planetas concluídos e cada laboratório concluído pelo
 *   menos uma vez com 0 erros (aulas não contam erros);
 * - "refazer" = concluir de novo um laboratório já concluído; "todos os laboratórios" = os de uma galáxia;
 * - "ranking geral" = ranking da galáxia (o app tem ranking por galáxia e por sistema);
 * - "sem erro" e "refazer" só existem a partir desta versão e ficam neste aparelho (o servidor guarda só a melhor
 *   pontuação); as conquistas em si ficam na conta.
 */

export type AchievementInput = {
  planets: Record<string, PlanetProgress>;
  /** galáxias com `systems[].planets` (sem elas, só as regras de laboratório valem) */
  galaxies: GalaxyDetail[];
  nickname: string | null;
  avatarSlug: string;
};

const COMMON_SCORE = 7000;
const RARE_SCORE = 9000;

export function earnedFromProgress({ planets, galaxies, nickname, avatarSlug }: AchievementInput): string[] {
  const done = (id: string) => planets[id]?.status === "completed";
  const best = (id: string) => planets[id]?.bestPoints ?? 0;
  const flawless = (id: string) => done(id) && planets[id]?.flawless === true;
  const replayed = (id: string) => (planets[id]?.completions ?? 0) >= 2;
  // laboratórios: pelo catálogo; antes de ele chegar, quem tem pontos é laboratório
  const catalogLabs = galaxies.flatMap((g) => g.systems.flatMap((s) => (s.planets ?? []).filter(isLab)));
  const labIds = catalogLabs.length > 0 ? catalogLabs.map((p) => p.id) : Object.keys(planets).filter((id) => planets[id]?.bestPoints !== undefined);

  const groups = (planetLists: Planet[][]) => planetLists.filter((list) => list.length > 0);
  const systems = groups(galaxies.flatMap((g) => g.systems.map((s) => s.planets ?? [])));
  const wholeGalaxies = groups(galaxies.map((g) => g.systems.flatMap((s) => s.planets ?? [])));
  const allDone = (list: Planet[]) => list.every((p) => done(p.id));
  const labsOf = (list: Planet[]) => list.filter(isLab).map((p) => p.id);
  const cleanRun = (list: Planet[]) => allDone(list) && labsOf(list).every(flawless);

  const rules: Record<string, boolean> = {
    "c-02": Object.keys(planets).some(done),
    "c-03": systems.some(allDone),
    "c-04": labIds.some(flawless),
    "c-05": labIds.some((id) => best(id) > COMMON_SCORE),
    "c-06": labIds.some(replayed),
    "r-02": labIds.some((id) => best(id) > RARE_SCORE),
    "r-03": systems.some(cleanRun),
    "l-01": labIds.some((id) => best(id) >= LAB_SCORE.max),
    "l-02": systems.some((list) => labsOf(list).length > 0 && labsOf(list).every((id) => best(id) >= LAB_SCORE.max)),
    "l-03": wholeGalaxies.some(allDone),
    "b-01": wholeGalaxies.some(cleanRun),
    "b-02": wholeGalaxies.some((list) => labsOf(list).length > 0 && labsOf(list).every(replayed)),
    "s-01": nickname?.trim().toLowerCase() === "piaba" && avatarSlug === "piaba",
  };
  return Object.keys(rules).filter((slug) => rules[slug]);
}

/** Posições da conta nos rankings (null = fora do ranking). */
export function earnedFromRanking(systemPosition: number | null, galaxyPosition: number | null): string[] {
  const earned: string[] = [];
  if (systemPosition !== null && systemPosition <= 3) earned.push("r-04");
  if (galaxyPosition !== null && galaxyPosition <= 10) earned.push("r-05");
  if (galaxyPosition !== null && galaxyPosition <= 3) earned.push("l-04");
  return earned;
}

function isLab(planet: Planet): boolean {
  return planet.type === "lab";
}
