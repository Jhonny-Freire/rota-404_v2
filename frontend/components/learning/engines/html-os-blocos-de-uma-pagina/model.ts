import type { BlockKind, ElementKey, SequenceStep } from "@/components/learning/kit";
import type { LessonEngineProps } from "@/components/learning/runtime";

export type SceneProps = Pick<LessonEngineProps, "say" | "setCanAdvance" | "setHint" | "reducedMotion">;

/** Os 4 blocos da aula (aula3-2.md, Cena 2), na ordem da página. */
export type PageKind = Extract<BlockKind, "title" | "text" | "image" | "button">;

export const PAGE_ORDER: PageKind[] = ["title", "text", "image", "button"];

/**
 * Bandeja da separação (cenas 2 a 4): os blocos caem fora de ordem, para a Montagem (cena 4) ter o que pôr "na
 * ordem correta". Ordem fixa: a cena 4 sempre mostra a mesma arrumação.
 */
export const TRAY_ORDER: PageKind[] = ["image", "title", "button", "text"];

export type SiteContent = {
  url: string;
  title: string;
  text: string;
  image: ElementKey;
  imageAlt: string;
  button: string;
};

/* texto criado: a página-exemplo das cenas 1 a 4 (o .md só pede "título, texto, imagem e botão") */
export const SITE: SiteContent = {
  url: "planetas.com",
  title: "Planetas",
  text: "Conheça os planetas do Sistema Solar.",
  image: "photo",
  imageAlt: "Foto",
  button: "Ver mais",
};

/** Fala LITERAL do aula3-2.md (Cena 2). */
export const STRUCTURE_LINE = "Esses blocos formam a estrutura da página.";

/* fala criada: o .md só define a fala da Cena 2 */
export const LINES = {
  page: "Esta é uma página da Web. Ela tem um título, um texto, uma imagem e um botão.",
  split: "Olha só: a página está se separando em pedaços!",
  tags: "No HTML, cada bloco ganha uma etiqueta. A etiqueta diz que tipo de bloco ele é.",
  build: "Agora os blocos voltam para a página, na ordem certa: título, texto, imagem e botão.",
  quiz: "Agora é com você! Toque no bloco que é o título desta página.",
  quizRight: "Isso! Esse bloco é o título: o nome da página.",
} as const;

/* fala criada: no erro o Bonzi diz o que é o bloco tocado (ensina sem revelar qual é o título) */
export const WRONG_LINES: Record<Exclude<PageKind, "title">, string> = {
  text: "Esse bloco é um texto. O título é o nome da página. Procure de novo!",
  image: "Esse bloco é uma imagem. O título é o nome da página. Procure de novo!",
  button: "Esse bloco é um botão. O título é o nome da página. Procure de novo!",
};

/** Nome de cada etiqueta, para a cena "HTML visual" (texto criado: o .md só lista as etiquetas). */
export const TAG_MEANING: Record<PageKind, string> = {
  title: "o título",
  text: "o texto (parágrafo)",
  image: "a imagem",
  button: "o botão",
};

export const BANNER = {
  quiz: "Toque no título",
  wrong: "Esse não é o título",
  right: "Achou o título!",
} as const;

/* texto criado: páginas do microteste (variam por visita; nenhuma é a das cenas 1 a 4) */
export const QUIZ_SITES: SiteContent[] = [
  { url: "robos.com", title: "Robôs", text: "Veja robôs que ajudam as pessoas.", image: "robot", imageAlt: "Robô", button: "Ver robôs" },
  { url: "fotos.com", title: "Fotos", text: "Guarde as fotos da sua viagem.", image: "camera", imageAlt: "Câmera", button: "Enviar" },
  { url: "casas.com", title: "Casas", text: "Conheça casas de vários lugares.", image: "house", imageAlt: "Casa", button: "Ver casas" },
];

/**
 * Ordens possíveis da página do microteste: o título nem sempre é o primeiro bloco, para o aluno reconhecê-lo pela
 * aparência (texto grande, o nome da página) e não só pela posição.
 */
export const QUIZ_ORDERS: PageKind[][] = [
  ["title", "image", "text", "button"],
  ["image", "title", "text", "button"],
  ["title", "text", "image", "button"],
  ["image", "title", "button", "text"],
];

/** Pausa entre o acerto e a liberação de "Próxima cena". */
export const READY_PAUSE_MS = 1400;
/** tempo em que o bloco errado fica marcado */
export const WRONG_MS = 1300;

const MS_PER_CHAR = 65;

export function speechMs(line: string): number {
  return line.length * MS_PER_CHAR;
}

/**
 * Passos de uma cena passiva: cada fase é uma pausa de LEITURA ({ hold }), então com movimento reduzido a cena
 * segue no mesmo ritmo. A última fase cresce até a soma cobrir as falas (~65 ms por caractere).
 */
export function phases(holds: readonly number[], speech: number): SequenceStep[] {
  const total = holds.reduce((sum, ms) => sum + ms, 0);
  const extra = Math.max(0, speech - total);
  return holds.map((ms, index) => ({ hold: index === holds.length - 1 ? ms + extra : ms }));
}

export function contentOf(site: SiteContent, kind: PageKind): string | undefined {
  if (kind === "title") return site.title;
  if (kind === "text") return site.text;
  if (kind === "button") return site.button;
  return undefined;
}
