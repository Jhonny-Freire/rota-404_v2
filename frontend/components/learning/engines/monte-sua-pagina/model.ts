import type { ElementKey } from "@/config/assets";
import type { BlockKind, KitTone, SeededRandom } from "@/components/learning/kit";

/** Os 4 blocos do lab3-3.md ("Tela", à esquerda), na ordem das etapas 1 a 4. */
export type PageKind = Extract<BlockKind, "title" | "text" | "image" | "button">;

export const BUILD_ORDER: PageKind[] = ["title", "text", "image", "button"];

/**
 * build: colocar o bloco pedido (Etapas 1 a 4) · ready: todos colocados, falta "Ver página" (Etapa 5) ·
 * view: a estrutura vira página e o código aparece · done: espera a tela de conclusão.
 */
export type Phase = "build" | "ready" | "view" | "done";

/** Índices de meta.steps. */
export const STEP = { title: 0, text: 1, image: 2, button: 3, view: 4 } as const;

export type ImageOption = { element: ElementKey; name: string; file: string };

export type Theme = {
  id: string;
  url: string;
  title: string;
  text: string;
  button: string;
  /** a 1ª é a escolhida no começo */
  images: ImageOption[];
};

const IMG = {
  robot: { element: "robot", name: "Robô", file: "robo.png" },
  photo: { element: "photo", name: "Paisagem", file: "paisagem.png" },
  house: { element: "house", name: "Casa", file: "casa.png" },
  camera: { element: "camera", name: "Câmera", file: "camera.png" },
  cellphone: { element: "cellphone", name: "Celular", file: "celular.png" },
  pc: { element: "pc", name: "Computador", file: "computador.png" },
} satisfies Record<string, ImageOption>;

/* texto criado: combinações de conteúdo do .md ("Variação: liberar diferentes combinações de conteúdo") */
export const THEMES: Theme[] = [
  { id: "robo", url: "meurobo.com", title: "Meu robô", text: "Ele me ajuda a arrumar o quarto.", button: "Conhecer", images: [IMG.robot, IMG.pc, IMG.cellphone] },
  { id: "viagem", url: "minhaviagem.com", title: "Minha viagem", text: "Fui à praia e tirei muitas fotos.", button: "Ver fotos", images: [IMG.photo, IMG.camera, IMG.house] },
  { id: "casa", url: "minhacasa.com", title: "Minha casa", text: "Aqui moro eu e a minha família.", button: "Visitar", images: [IMG.house, IMG.photo, IMG.robot] },
  { id: "jogos", url: "clubedejogos.com", title: "Clube de jogos", text: "Toda sexta tem campeonato novo.", button: "Participar", images: [IMG.pc, IMG.cellphone, IMG.camera] },
];

export type PageColor = { id: string; name: string };

/* pequenas escolhas visuais do .md: a cor da página (só muda o visual, nunca dá erro) */
export const COLORS: PageColor[] = [
  { id: "blue", name: "Azul" },
  { id: "green", name: "Verde" },
  { id: "purple", name: "Roxo" },
];

export type Plan = {
  theme: Theme;
  /** ordem dos blocos na coluna da esquerda: nunca a ordem das etapas */
  palette: PageKind[];
};

/** Tema por tentativa: avança com o attempt a partir de um início sorteado na visita (sempre muda no "Jogar de novo"). */
export function buildPlan(session: SeededRandom, rand: SeededRandom, attempt: number): Plan {
  const start = session.int(0, THEMES.length - 1, "theme");
  return {
    theme: THEMES[(start + attempt) % THEMES.length],
    palette: rand.shuffle(BUILD_ORDER, "palette", true),
  };
}

export const KIND_NAMES: Record<PageKind, string> = { title: "Título", text: "Texto", image: "Imagem", button: "Botão" };

/** "um título", "uma imagem"... */
const WITH_ARTICLE: Record<PageKind, string> = { title: "um título", text: "um texto", image: "uma imagem", button: "um botão" };

export function contentOf(theme: Theme, kind: PageKind): string | undefined {
  if (kind === "title") return theme.title;
  if (kind === "text") return theme.text;
  if (kind === "button") return theme.button;
  return undefined;
}

/** Linha de código HTML de cada bloco (recompensa visual depois de "Ver página"). */
export function codeLine(kind: PageKind, theme: Theme, image: ImageOption): string {
  if (kind === "title") return `<h1>${theme.title}</h1>`;
  if (kind === "text") return `<p>${theme.text}</p>`;
  if (kind === "image") return `<img src="${image.file}">`;
  return `<button>${theme.button}</button>`;
}

export const TEXT = {
  /** lab3-3.md, Etapa 1 (literal) */
  title: "Coloque um título.",
  /* falas criadas: o .md só escreve o pedido da Etapa 1 */
  text: "Agora coloque um texto.",
  image: "Agora coloque uma imagem.",
  button: "Agora coloque um botão.",
  ready: "Sua página tem todos os blocos! Toque em Ver página.",
  view: "Olha a sua página pronta! Cada bloco virou uma parte dela.",
  code: "E este é o código HTML da sua página. Cada linha é um bloco que você colocou!",
  wrongSay: (needed: PageKind) => `Esse não é o bloco certo. Agora a página precisa de ${WITH_ARTICLE[needed]}.`,
  notReady: (needed: PageKind) => `Antes, coloque ${WITH_ARTICLE[needed]} na página.`,

  // painel Feedback (o "como fazer" ou o resultado)
  how: (needed: PageKind) =>
    `Arraste o bloco ${KIND_NAMES[needed]} da coluna Blocos até a área de edição. Também dá para tocar no bloco e depois na área.`,
  placed: (kind: PageKind, next: PageKind | null) =>
    next
      ? `${KIND_NAMES[kind]} colocado! Veja a prévia à direita. Agora falta ${WITH_ARTICLE[next]}.`
      : `${KIND_NAMES[kind]} colocado! A página tem título, texto, imagem e botão.`,
  pickImage: "Quer outra imagem ou outra cor? Escolha aqui embaixo. Depois toque em Ver página.",
  wrong: (got: PageKind, needed: PageKind) => `Esse é o bloco ${KIND_NAMES[got]}. Agora a página precisa de ${WITH_ARTICLE[needed]}.`,
  viewing: "A estrutura virou uma página de verdade.",
  coded: "Cada bloco que você colocou virou uma linha de código HTML. Você não precisou digitar nada!",
};

/** Faixa do palco: o que fazer agora (~22 a 36 caracteres). */
export type BannerSpec = { text: string; tone: KitTone; icon: ElementKey };

const spec = (text: string, tone: KitTone, icon: ElementKey): BannerSpec => ({ text, tone, icon });

export const BANNER = {
  need: (kind: PageKind) => spec(`Coloque ${WITH_ARTICLE[kind]}`, "info", "webpage"),
  wrong: (kind: PageKind) => spec(`Procure o bloco ${KIND_NAMES[kind]}`, "danger", "error"),
  ready: spec("Toque em Ver página", "warning", "magnifier"),
  view: spec("Sua página está pronta!", "success", "ok"),
  code: spec("Veja o código HTML", "success", "ok"),
};

export const TIMING = {
  /** pausa após colocar um bloco antes do próximo pedido (hold: deixa ver a prévia) */
  nextAsk: 900,
  /** página pronta antes do código (hold, cobre a fala view) */
  viewHold: 3900,
  /** cada linha de código (hold) */
  codeLine: 700,
  /** depois do código, antes da conclusão (cobre a fala code, ~79 caracteres) */
  finishHold: 5200,
};

/** a mesma fala pedida de novo dentro deste tempo não recomeça (só a faixa salta) */
export const REPEAT_LINE_MS = 4000;
