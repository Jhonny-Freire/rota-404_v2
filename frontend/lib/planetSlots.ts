import { ROUTES } from "@/config/routes";
import type { GalaxyDetail, Planet, PlanetType, PlanetarySystemDetail, ProgressState } from "@/types/domain";

export type PlanetSlot = {
  id: string;
  name: string;
  type: PlanetType;
  /** slug do planeta: escolhe a arte (PLANET_SPRITES); null nas prévias */
  slug: string | null;
  preview: boolean;
  href: string;
  state: ProgressState;
};

export type PlanetStateResolver = (planetId: string, orderedPlanetIds: string[]) => ProgressState;

const PREVIEW_TYPES: PlanetType[] = ["lesson", "lesson", "lab", "lab"];

export function planetHref(type: PlanetType, id: string, systemSlug?: string): string {
  return type === "lesson" ? ROUTES.lesson(id, systemSlug) : ROUTES.lab(id, systemSlug);
}

export function sortPlanets(planets: Planet[]): Planet[] {
  return [...planets].sort((a, b) => a.order_index - b.order_index);
}

/** Ids de todos os planetas de uma galáxia (quando o detalhe traz `systems[].planets`). */
export function galaxyPlanetIds(galaxy: GalaxyDetail): string[] {
  return galaxy.systems.flatMap((system) => (system.planets ?? []).map((planet) => planet.id));
}

export function buildPlanetSlots(system: PlanetarySystemDetail, stateOf?: PlanetStateResolver): PlanetSlot[] {
  if (system.planets.length > 0) {
    const ordered = sortPlanets(system.planets);
    const orderedIds = ordered.map((planet) => planet.id);
    return ordered.map((planet) => ({
      id: planet.id,
      name: planet.name,
      type: planet.type,
      slug: planet.slug,
      preview: false,
      href: planetHref(planet.type, planet.id, system.slug),
      state: stateOf ? stateOf(planet.id, orderedIds) : "available",
    }));
  }

  return PREVIEW_TYPES.map((type, i) => {
    const id = `previa-${i + 1}`;
    return {
      id,
      name: `Planeta ${i + 1}`,
      type,
      slug: null,
      preview: true,
      href: planetHref(type, id, system.slug),
      state: "available",
    };
  });
}
