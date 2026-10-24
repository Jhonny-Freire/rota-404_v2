const enc = encodeURIComponent;

function withSystem(path: string, systemSlug?: string): string {
  return systemSlug ? `${path}?sistema=${enc(systemSlug)}` : path;
}

/** Segmentos-base das rotas dinâmicas (sem página índice própria). */
export const ROUTE_PREFIXES = {
  system: "/sistemas",
  lesson: "/aulas",
  lab: "/laboratorios",
} as const;

export const ROUTES = {
  home: "/",
  ageRanges: "/faixas-etarias",
  galaxies: "/galaxias",
  galaxy: (slug: string) => `/galaxias/${enc(slug)}`,
  system: (slug: string) => `${ROUTE_PREFIXES.system}/${enc(slug)}`,
  lesson: (id: string, systemSlug?: string) => withSystem(`${ROUTE_PREFIXES.lesson}/${enc(id)}`, systemSlug),
  lab: (id: string, systemSlug?: string) => withSystem(`${ROUTE_PREFIXES.lab}/${enc(id)}`, systemSlug),
  profile: "/perfil",
  achievements: "/conquistas",
  ranking: "/ranking",
  settings: "/configuracoes",
} as const;
