import type { BonziState, PlanetType } from "@/types/domain";

const element = (name: string) => `/sprites/elements/${name}.png`;

export const SPRITES = {
  brand: {
    logo: "/sprites/brand/logo.png",
    /** só o letreiro da logo (sem foguete e estrelas), arte nativa de 157x31: barra do topo */
    logoBar: "/sprites/brand/logo-bar.png",
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
    /** easter egg (arte de 10x19): o suco de abacaxi que às vezes passa pelo espaço; tocar dá a conquista S-03 */
    pineappleJuice: "/pineapple-juice.png",
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
  /* Galáxia 2 "API REST" */
  weather: element("weather"),
  card: element("card"),
  map: element("map"),
  gamepad: element("gamepad"),
  plug: element("plug"),
  store: element("store"),
  receipt: element("receipt"),
} as const;

export type ElementKey = keyof typeof ELEMENTS;

export const BACKGROUNDS = {
  starfield: "/backgrounds/starfield.png",
  starfieldFar: "/backgrounds/starfield-far.png",
} as const;

export const ROCKET_FRAMES: string[] = [0, 1, 2, 3, 4, 5].map((i) => `/sprites/rocket/rocket-${i}.png`);

const bonzi = (n: number) => `/characters/bonzi/bonzi-${n}.png`;

/**
 * Poses do Bonzi por estado. São sprites parados, não uma animação: a primeira pose é a principal e as outras
 * entram de vez em quando (troca direta a cada BONZI_POSE_MS, sem movimento). Pose repetida = fica mais tempo.
 */
export const BONZI_FRAMES: Record<BonziState, string[]> = {
  idle: [bonzi(0), bonzi(0), bonzi(1)],
  speaking: [bonzi(0), bonzi(4)],
  happy: [bonzi(3)],
  thinking: [bonzi(1), bonzi(2)],
  warning: [bonzi(2)],
  help: [bonzi(4)],
};

/** tempo de cada pose do Bonzi antes de trocar pela seguinte */
export const BONZI_POSE_MS = 3000;

export const AVATAR_NATIVE_SIZE = 32;

/** `file`: nome do PNG quando difere do slug (o servidor só aceita a-z, 0-9 e hífen no slug) */
export type AvatarOption = { slug: string; name: string; sprite: string; native?: number; file?: string };

export const AVATARS: AvatarOption[] = [
  { slug: "castor", name: "Castor" },
  { slug: "ghost-spec", name: "Gustavo Pereira" },
  { slug: "piaba", name: "Piaba", native: 34 },
  { slug: "pucca", name: "Pucca" },
  { slug: "stormtrooper", name: "Trooper" },
  { slug: "tigrinho", name: "Tigrinho" },
  { slug: "amogus", name: "Amogus" },
  { slug: "hello-kitty", name: "Hello Kitty", file: "hello_kitty" },
  { slug: "six-seven", name: "Six Seven" },
].map((a: Omit<AvatarOption, "sprite">) => ({ ...a, sprite: `/characters/avatars/${a.file ?? a.slug}.png` }));

const badge = (name: string) => `/sprites/badges/${name}.png`;

/**
 * Arte das conquistas (32x32): só as medalhas originais de public/sprites/badges. Comum, rara e lendária usam cada
 * original no máximo uma vez; Brutal (vermelha) e Secreta (verde-água) são originais com a cor trocada (as que sobraram e
 * repetidas), geradas por scripts/gerar-conquistas.py (b-01.png, b-02.png, s-01..s-03.png).
 */
export const BADGE_ART: Record<string, string> = {
  "c-01": badge("comum-2"),
  "c-02": badge("comum-1"),
  "c-03": badge("comum-3"),
  "c-04": badge("comum-5"),
  "c-05": badge("comum-6"),
  "c-06": badge("comum-7"),
  "r-02": badge("rara-1"),
  "r-03": badge("rara-5"),
  "r-04": badge("rara-3"),
  "r-05": badge("rara-2"),
  "l-01": badge("lenda-1"),
  "l-02": badge("lenda-2"),
  "l-03": badge("lenda-4"),
  "l-04": badge("lenda-3"),
  "b-01": badge("b-01"),
  "b-02": badge("b-02"),
  "s-01": badge("s-01"),
  "s-02": badge("s-02"),
  "s-03": badge("s-03"),
};

export const GALAXY_SPRITES: Record<string, string> = {
  "internet-e-web": "/galaxies/internet-e-web.png",
  "api-rest": "/galaxies/api-rest.png",
};

export const DEFAULT_GALAXY_SPRITE = "/galaxies/default.png";

/**
 * Arte de cada planeta, na ordem do catálogo: planet_g<galáxia>s<sistema>p<planeta>.png (G1 = Internet e Web,
 * G2 = API REST; sistemas e planetas por order_index). Chave = slug do planeta.
 */
const PLANET_ORDER: string[][][] = [
  [
    ["o-que-e-uma-rede", "como-meu-dispositivo-chega-a-internet", "conectando-uma-rede", "missao-recuperar-a-conexao"],
    ["todo-dispositivo-precisa-de-um-endereco", "ip-dominio-e-site", "encontrando-o-destino", "missao-encontrar-o-servidor"],
    ["o-que-acontece-quando-acesso-um-site", "html-os-blocos-de-uma-pagina", "monte-sua-pagina", "conserte-a-pagina"],
    ["como-as-informacoes-viajam", "http-e-https", "detetive-digital", "missao-navegacao-segura"],
  ],
  [
    ["sistemas-que-conversam", "cliente-servidor-e-api", "faca-uma-pergunta-ao-servidor", "o-servidor-respondeu"],
    ["como-pedir-uma-informacao", "get-post-put-e-delete", "qual-metodo-devo-usar", "encontre-o-problema"],
    ["o-que-e-json", "lendo-uma-resposta", "caca-ao-dado", "monte-a-resposta"],
    ["api-em-um-aplicativo", "quando-algo-da-errado", "diagnostico-da-api", "desafio-final-missao-api"],
  ],
];

/** Sol de cada sistema (centro do sistema e nó no mapa da galáxia): sun_g<galáxia>s<sistema>.png */
const SYSTEM_ORDER: string[][] = [
  ["dispositivos-e-conexao", "enderecos-e-sites", "navegador-e-paginas-web", "comunicacao-e-seguranca"],
  ["conhecendo-uma-api", "requisicoes-http", "entendendo-os-dados", "api-em-situacoes-reais"],
];

export const PLANET_SPRITES: Record<string, string> = Object.fromEntries(
  PLANET_ORDER.flatMap((systems, g) =>
    systems.flatMap((planets, s) => planets.map((slug, p) => [slug, `/planets/planet_g${g + 1}s${s + 1}p${p + 1}.png`])),
  ),
);

export const SYSTEM_SPRITES: Record<string, string> = Object.fromEntries(
  SYSTEM_ORDER.flatMap((systems, g) => systems.map((slug, s) => [slug, `/suns/sun_g${g + 1}s${s + 1}.png`])),
);

const SYSTEM_SPRITE_CYCLE = Object.values(SYSTEM_SPRITES);

export const PLANET_PLACEHOLDERS: Record<PlanetType, string> = {
  lesson: "/planets/placeholder-lesson.png",
  lab: "/planets/placeholder-lab.png",
};

export function galaxySprite(slug: string): string {
  return GALAXY_SPRITES[slug] ?? DEFAULT_GALAXY_SPRITE;
}

export function systemSprite(slug: string, index: number): string {
  return SYSTEM_SPRITES[slug] ?? SYSTEM_SPRITE_CYCLE[Math.abs(Math.trunc(index)) % SYSTEM_SPRITE_CYCLE.length];
}

/** Arte do planeta pelo slug (ordem do catálogo); planeta desconhecido usa o marcador de aula/lab. */
export function planetSprite(slug: string | null | undefined, type: PlanetType): string {
  return (slug && PLANET_SPRITES[slug]) || PLANET_PLACEHOLDERS[type];
}

export function avatarSprite(slug: string): string {
  return AVATARS.find((a) => a.slug === slug)?.sprite ?? SPRITES.placeholder;
}

export function badgeSprite(slug: string | null | undefined): string {
  return (slug && BADGE_ART[slug]) || SPRITES.placeholder;
}
