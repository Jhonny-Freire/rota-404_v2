"use client";

import { ROUTES } from "@/config/routes";
import { useAsync } from "@/hooks/useAsync";
import { useExplorer } from "@/hooks/useExplorer";
import { useProgress } from "@/hooks/useProgress";
import { planetHref, sortPlanets } from "@/lib/planetSlots";
import { galaxyStateForExplorer } from "@/lib/progress";
import { getAgeRanges, getGalaxies, getGalaxy } from "@/services/catalogService";

export type Journey = {
  /** galáxia da faixa da criança; sem faixa (ou antes de carregar), a lista de galáxias */
  mapHref: string;
  /** próximo planeta a fazer (o primeiro não concluído, sistema por sistema); sem ele, o mapa */
  nextHref: string;
};

/**
 * Atalhos da viagem: a criança só tem uma galáxia liberada (a do nível de conhecimento), então "Mapa" e "Continuar viagem" pulam a
 * lista de galáxias. Usa os mesmos caches de catálogo das páginas de mapa. `withNext` busca o detalhe da galáxia.
 */
export function useJourney({ withNext = false }: { withNext?: boolean } = {}): Journey {
  const { explorer, hydrated } = useExplorer();
  const progress = useProgress();
  const catalog = useAsync(() => Promise.all([getGalaxies(), getAgeRanges()]), [], { cacheKey: "galaxies+age-ranges" });

  const rangeSlug = hydrated ? explorer.ageRangeSlug : null;
  const [galaxies = [], ageRanges = []] = catalog.data ?? [];
  const own = rangeSlug ? galaxies.filter((galaxy) => galaxyStateForExplorer(galaxy, ageRanges, rangeSlug) !== "locked") : [];
  const slug = own.length === 1 ? own[0].slug : null;

  const detail = useAsync(() => (withNext && slug ? getGalaxy(slug) : Promise.resolve(null)), [withNext, slug], {
    cacheKey: withNext && slug ? `galaxy:${slug}` : undefined,
  });

  const mapHref = slug ? ROUTES.galaxy(slug) : ROUTES.galaxies;
  let nextHref = mapHref;
  if (detail.data && progress.hydrated) {
    const systems = [...detail.data.systems].sort((a, b) => a.order_index - b.order_index);
    for (const system of systems) {
      const planets = sortPlanets(system.planets ?? []);
      const ids = planets.map((planet) => planet.id);
      const next = planets.find((planet) => {
        const state = progress.planetState(planet.id, ids);
        return state === "available" || state === "in_progress";
      });
      if (next) {
        nextHref = planetHref(next.type, next.id, system.slug);
        break;
      }
    }
  }
  return { mapHref, nextHref };
}
