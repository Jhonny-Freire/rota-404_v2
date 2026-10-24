import { planetHref, sortPlanets } from "@/lib/planetSlots";
import { LAB_SCORE } from "@/lib/progress";
import { isApiError, isNotFound, isNotImplemented } from "@/services/apiClient";
import { getSystem } from "@/services/catalogService";
import { getLab, getLesson } from "@/services/learningService";
import type { LabDetail, LessonDetail, Planet, PlanetType, PlanetarySystemDetail } from "@/types/domain";
import type { NextPlanetLink } from "./types";

export type PlanetContext = {
  kind: PlanetType;
  /** título sem o prefixo de código */
  title: string;
  /** "1.1", "2.3"… */
  code: string | null;
  /** chave do motor (content.engine / config.engine / slug do planeta) */
  engineKey: string | null;
  maxScore: number;
  planet: Planet | null;
  system: PlanetarySystemDetail | null;
  orderedPlanets: Planet[];
  nextPlanet: NextPlanetLink | null;
  /** "api": detalhe da API · "catalog": API indisponível (501/404), dados do sistema · "preview": sem dados */
  source: "api" | "catalog" | "preview";
};

const CODE_PREFIX = /^(\d+(?:\.\d+)+)\s+/;
const RETRY_DELAY_MS = 450;

/** Repete uma vez quando a base responde 503 (instabilidade momentânea). */
async function withRetry<T>(request: () => Promise<T>): Promise<T> {
  try {
    return await request();
  } catch (error) {
    if (!isApiError(error) || error.status !== 503) throw error;
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    return request();
  }
}

function splitCode(name: string): [string | null, string] {
  const match = CODE_PREFIX.exec(name);
  return match ? [match[1], name.slice(match[0].length)] : [null, name];
}

type DetailResult = { detail: LessonDetail | LabDetail | null; error: unknown };

/** Chave de cache (useAsync) do contexto de um planeta. */
export function planetContextKey(kind: PlanetType, ref: string, systemSlug?: string): string {
  return `planet:${kind}:${ref}:${systemSlug ?? ""}`;
}

/**
 * Detalhe de uma aula/laboratório + sistema (ordem dos planetas). Se a API de aulas/labs ainda responder 501
 * (ou 404 para um planeta que existe no catálogo), usa o planeta do sistema (`?sistema=`) e o slug como motor.
 * Com `?sistema=` na URL, o sistema é pedido junto com a aula/lab (em paralelo, não em cascata).
 */
export async function loadPlanetContext(kind: PlanetType, ref: string, systemSlug?: string): Promise<PlanetContext> {
  const detailRequest: Promise<DetailResult> = withRetry<LessonDetail | LabDetail>(() =>
    kind === "lesson" ? getLesson(ref) : getLab(ref),
  ).then(
    (detail) => ({ detail, error: null }),
    (error: unknown) => ({ detail: null, error }),
  );
  const hintedSystem: Promise<PlanetarySystemDetail | null> | null = systemSlug
    ? withRetry(() => getSystem(systemSlug)).catch(() => null)
    : null;

  const { detail, error: apiError } = await detailRequest;
  if (apiError && !isNotImplemented(apiError) && !isNotFound(apiError)) throw apiError;

  const systemRef = detail?.system.slug ?? systemSlug;
  let system: PlanetarySystemDetail | null = null;
  // o ?sistema= da URL normalmente é o sistema do planeta (já pedido acima); se não for (link antigo), busca o certo
  if (hintedSystem && systemRef === systemSlug) system = await hintedSystem;
  else if (systemRef) system = await withRetry(() => getSystem(systemRef)).catch(() => null);

  const orderedPlanets = system ? sortPlanets(system.planets) : [];
  const planet = detail?.planet ?? orderedPlanets.find((p) => p.id === ref || p.slug === ref) ?? null;

  if (!detail && !planet) {
    if (isNotFound(apiError) && !/^previa-\d+$/.test(ref)) throw apiError;
    const number = /^previa-(\d+)$/.exec(ref)?.[1];
    return {
      kind,
      title: kind === "lesson" ? "Aula em preparação" : "Laboratório em preparação",
      code: number ?? null,
      engineKey: null,
      maxScore: LAB_SCORE.max,
      planet: null,
      system,
      orderedPlanets,
      nextPlanet: null,
      source: "preview",
    };
  }

  const [nameCode, plainName] = splitCode(planet?.name ?? "");
  const [titleCode, plainTitle] = splitCode(detail?.title ?? "");
  const extra = detail ? ("content" in detail ? detail.content : detail.config) : null;
  const engineKey = extra?.engine ?? planet?.slug ?? null;
  const index = planet ? orderedPlanets.findIndex((p) => p.id === planet.id) : -1;
  const next = index >= 0 ? orderedPlanets[index + 1] : undefined;

  return {
    kind,
    title: plainTitle || plainName || (kind === "lesson" ? "Aula" : "Laboratório"),
    code: extra?.code ?? titleCode ?? nameCode,
    engineKey,
    maxScore: detail && "max_score" in detail && detail.max_score > 0 ? detail.max_score : LAB_SCORE.max,
    planet,
    system,
    orderedPlanets,
    nextPlanet: next && system ? { href: planetHref(next.type, next.id, system.slug), name: next.name } : null,
    source: detail ? "api" : "catalog",
  };
}
