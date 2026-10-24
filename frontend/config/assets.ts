import type { AchievementRarity, BonziState, PlanetType } from "@/types/domain";

const element = (name: string) => `/sprites/elements/${name}.png`;

export const SPRITES = {
  brand: {
    logo: "/sprites/brand/logo.png",
    logoSmall: "/sprites/brand/logo-small.png",
    mark: "/sprites/brand/compass.png",
  },
  ui: {
    home: "/sprites/ui/home.png",
    map: "/sprites/ui/map.png",
    profile: "/sprites/ui/profile.png",
    settings: "/sprites/ui/settings.png",
    back: "/sprites/ui/back.png",
    next: "/sprites/ui/next.png",
    close: "/sprites/ui/close.png",
    soundOn: "/sprites/ui/sound-on.png",
    soundOff: "/sprites/ui/sound-off.png",
    play: "/sprites/ui/play.png",
    separator: "/sprites/ui/separator.png",
    toggleOn: "/sprites/ui/toggle-on.png",
    toggleOff: "/sprites/ui/toggle-off.png",
    achievements: "/sprites/rewards/medal-gold.png",
    ranking: "/sprites/rewards/trophy.png",
  },
  status: {
    locked: "/sprites/status/locked.png",
    available: "/sprites/status/available.png",
    inProgress: "/sprites/status/in-progress.png",
    completed: element("ok"),
    error: element("error"),
  },
  rewards: {
    star: "/sprites/rewards/star.png",
    trophy: "/sprites/rewards/trophy.png",
    medalGold: "/sprites/rewards/medal-gold.png",
    medalSilver: "/sprites/rewards/medal-silver.png",
    medalBronze: "/sprites/rewards/medal-bronze.png",
  },
  space: {
    trailDot: "/sprites/space/trail-dot.png",
    tagLesson: "/sprites/space/tag-lesson.png",
    tagLab: "/sprites/space/tag-lab.png",
  },
  objects: {
    door404: element("door"),
    vault: "/sprites/objects/vault.png",
    request: "/sprites/objects/request.png",
    deployUp: element("cloud-upload"),
  },
  placeholder: "/sprites/placeholder.png",
} as const;

export const ELEMENTS = {
  box: element("box"),
  boxGold: element("yellow-box"),
  boxEmpty: element("box-null"),
  cellphone: element("cellphone"),
  tablet: element("tablet"),
  notebook: element("notebook"),
  pc: element("pc"),
  monitor: element("monitor"),
  setup: element("setup"),
  printer: element("printer"),
  server: element("server"),
  serverError: element("error-server"),
  router: element("router"),
  wifi: element("wifi"),
  cable: element("cable"),
  internet: element("network-icon"),
  cloudUpload: element("cloud-upload"),
  webpage: element("webpage"),
  mail: element("mail-message"),
  photo: element("photo"),
  house: element("house"),
  pin: element("location-pin"),
  magnifier: element("magnifying-glass"),
  question: element("red-question-mark"),
  ok: element("ok"),
  error: element("error"),
  lockClosed: element("green-lock"),
  lockOpen: element("opened-lock"),
  key: element("key"),
  gateClosed: element("closed-gate"),
  gateOpen: element("open-gate"),
  door: element("door"),
  hacker: element("hacker"),
  robot: element("robot-waiter"),
  person: element("person"),
  camera: element("camera"),
  microphone: element("microphone"),
} as const;

export type ElementKey = keyof typeof ELEMENTS;

export const BACKGROUNDS = {
  starfield: "/backgrounds/starfield.png",
  starfieldFar: "/backgrounds/starfield-far.png",
} as const;

export const ROCKET_FRAMES: string[] = [0, 1, 2, 3, 4, 5].map((i) => `/sprites/rocket/rocket-${i}.png`);

const bonzi = (n: number) => `/characters/bonzi/bonzi-${n}.png`;

export const BONZI_FRAMES: Record<BonziState, string[]> = {
  idle: [bonzi(0)],
  speaking: [bonzi(0), bonzi(4)],
  happy: [bonzi(3)],
  thinking: [bonzi(1), bonzi(2)],
  warning: [bonzi(2)],
  help: [bonzi(4)],
};

export const AVATAR_NATIVE_SIZE = 32;

export type AvatarOption = { slug: string; name: string; sprite: string; native?: number };

export const AVATARS: AvatarOption[] = [
  { slug: "castor", name: "Castor" },
  { slug: "ghost-spec", name: "Fantasma" },
  { slug: "piaba", name: "Piaba", native: 34 },
  { slug: "pucca", name: "Pucca" },
  { slug: "stormtrooper", name: "Trooper" },
  { slug: "tigrinho", name: "Tigrinho" },
].map((a) => ({ ...a, sprite: `/characters/avatars/${a.slug}.png` }));

export type BadgeAsset = { slug: string; rarity: AchievementRarity; sprite: string };

const BADGE_COUNTS: Record<AchievementRarity, number> = { comum: 7, rara: 5, lenda: 4 };

export const BADGES: BadgeAsset[] = (Object.keys(BADGE_COUNTS) as AchievementRarity[]).flatMap((rarity) =>
  Array.from({ length: BADGE_COUNTS[rarity] }, (_, i) => {
    const slug = `${rarity}-${i + 1}`;
    return { slug, rarity, sprite: `/sprites/badges/${slug}.png` };
  }),
);

export const GALAXY_SPRITES: Record<string, string> = {
  "internet-e-web": "/galaxies/internet-e-web.png",
  "api-rest": "/galaxies/api-rest.png",
};

export const DEFAULT_GALAXY_SPRITE = "/galaxies/default.png";

const planet = (n: number) => `/planets/planet-${n}.png`;

export const PLANET_SPRITES = {
  api: planet(0),
  deploy: planet(7),
  dns: planet(4),
  erro404: planet(8),
  hashing: planet(3),
  https: planet(1),
  "planet-0": planet(0),
  "planet-1": planet(1),
  "planet-3": planet(3),
  "planet-4": planet(4),
  "planet-5": planet(5),
  "planet-6": planet(6),
  "planet-7": planet(7),
  "planet-8": planet(8),
  "planet-9": planet(9),
  "planet-10": planet(10),
} as const;

export type PlanetSpriteKey = keyof typeof PLANET_SPRITES;

export const PLANET_PLACEHOLDERS: Record<PlanetType, string> = {
  lesson: "/planets/placeholder-lesson.png",
  lab: "/planets/placeholder-lab.png",
};

// Sistemas usam planetas que nenhum dos seus planetas usa (planetas: api, https, deploy, erro404, dns, hashing).
export const SYSTEM_SPRITES: Record<string, string> = {
  "dispositivos-e-conexao": PLANET_SPRITES["planet-3"],
  "enderecos-e-sites": PLANET_SPRITES["planet-9"],
  "navegador-e-paginas-web": PLANET_SPRITES["planet-10"],
  "comunicacao-e-seguranca": PLANET_SPRITES["planet-5"],
  "conhecendo-uma-api": PLANET_SPRITES["planet-6"],
  "requisicoes-http": PLANET_SPRITES["planet-5"],
  "entendendo-os-dados": PLANET_SPRITES["planet-10"],
  "api-em-situacoes-reais": PLANET_SPRITES["planet-9"],
};

const SYSTEM_SPRITE_CYCLE: PlanetSpriteKey[] = ["planet-3", "planet-9", "planet-10", "planet-5", "planet-6"];

const isPlanetSpriteKey = (key: string): key is PlanetSpriteKey =>
  Object.prototype.hasOwnProperty.call(PLANET_SPRITES, key);

export function galaxySprite(slug: string): string {
  return GALAXY_SPRITES[slug] ?? DEFAULT_GALAXY_SPRITE;
}

export function systemSprite(slug: string, index: number): string {
  const fallback = SYSTEM_SPRITE_CYCLE[Math.abs(Math.trunc(index)) % SYSTEM_SPRITE_CYCLE.length];
  return SYSTEM_SPRITES[slug] ?? PLANET_SPRITES[fallback];
}

/** Aceita "planet-<n>", "planet-<nome>" (ex.: "planet-dns") e "<nome>". */
export function planetSprite(spriteKey: string | null | undefined, type: PlanetType): string {
  const raw = spriteKey?.trim().toLowerCase();
  if (raw) {
    const name = raw.replace(/^planet[-_]/, "");
    for (const key of [raw.replace("_", "-"), name, `planet-${name}`]) {
      if (isPlanetSpriteKey(key)) return PLANET_SPRITES[key];
    }
  }
  return PLANET_PLACEHOLDERS[type];
}

export function avatarSprite(slug: string): string {
  return AVATARS.find((a) => a.slug === slug)?.sprite ?? SPRITES.placeholder;
}

export function badgeSprite(slug: string | null | undefined): string {
  return BADGES.find((b) => b.slug === slug)?.sprite ?? SPRITES.placeholder;
}
