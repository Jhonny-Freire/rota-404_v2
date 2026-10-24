import { readFileSync } from "node:fs";
import path from "node:path";

type Seed = {
  galaxies: { slug: string }[];
  planetary_systems: { slug: string }[];
  planets: { id: string; kind: "lesson" | "lab" }[];
};

/**
 * Parâmetros das rotas dinâmicas no build (o site estático do Render gera um HTML por galáxia, sistema e planeta).
 * Fonte: backend/app/data/seed.json, cópia fiel do catálogo do Supabase. Planeta novo = motor novo = novo deploy.
 */
function readSeed(): Seed {
  const file = path.join(process.cwd(), "..", "backend", "app", "data", "seed.json");
  return JSON.parse(readFileSync(file, "utf-8")) as Seed;
}

export function galaxyParams() {
  return readSeed().galaxies.map(({ slug }) => ({ galaxySlug: slug }));
}

export function systemParams() {
  return readSeed().planetary_systems.map(({ slug }) => ({ systemSlug: slug }));
}

export function planetParams(kind: "lesson" | "lab") {
  return readSeed()
    .planets.filter((planet) => planet.kind === kind)
    .map(({ id }) => ({ id }));
}
