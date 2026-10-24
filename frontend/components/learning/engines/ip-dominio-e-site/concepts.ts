import type { ElementKey, ScenePoint } from "@/components/learning/kit";
import type { Say } from "@/components/learning/runtime";

export type SceneProps = {
  say: Say;
  setCanAdvance: (ready: boolean) => void;
  /** troca a instrução "O que fazer" do shell (null = `meta.hints` da cena) */
  setHint: (text: string | null) => void;
  reducedMotion: boolean;
};

export type ConceptId = "ip" | "domain" | "page";

export type Concept = {
  id: ConceptId;
  /** texto do cartão */
  value: string;
  /** nome da caixa / do conceito */
  name: string;
  element: ElementKey;
  /** largura nativa do sprite em pixels */
  native: number;
  /** texto monoespaçado (IP e domínio) */
  mono: boolean;
};

export const CONCEPTS: Record<ConceptId, Concept> = {
  ip: { id: "ip", value: "192.0.2.10", name: "IP", element: "pin", native: 11, mono: true },
  domain: { id: "domain", value: "exemplo.com", name: "Domínio", element: "internet", native: 14, mono: true },
  page: { id: "page", value: "Página inicial", name: "Página", element: "webpage", native: 15, mono: false },
};

/** Ordem dos cartões na Cena 1 (e das caixas na Cena 6). */
export const CONCEPT_ORDER: readonly ConceptId[] = ["ip", "domain", "page"];

export const IP = CONCEPTS.ip.value;
export const DOMAIN = CONCEPTS.domain.value;
export const PAGE = CONCEPTS.page.value;

/** Falas do Bonzi (aula2-2.md). As da Cena 6 são extras curtas: o .md não define falas para ela. */
export const LINES = {
  cards: "Qual é qual?",
  ip: "IP: endereço usado na comunicação.",
  domain: "Domínio: um nome fácil de lembrar que serve como IP.",
  page: "Site: o conteúdo que você acessa.",
  chain: "O domínio aponta para o IP. O IP conecta à página.",
  sort: "Arraste cada cartão para a caixa certa.",
  sortRight: "Isso!",
  sortDone: "Muito bem! Cada cartão está na caixa certa.",
} as const;

/*
 * Tempos das cenas passivas (useSequence): passo numérico = ANIMAÇÃO (vira 0 com movimento reduzido);
 * { hold } = pausa de LEITURA (fica). A soma dos holds de cada cena cobre a fala do Bonzi (~65 ms por
 * caractere), para "Próxima cena" não ser liberada (com anel e foco) antes de a fala terminar.
 */

/** Instruções do painel "O que fazer" na Cena 6 (progresso e nova tentativa, sem revelar a caixa certa). */
export const SORT_GUIDE = {
  picked: "Agora toque na caixa certa para esse cartão.",
  retry: "Ainda não. Tente esse cartão em outra caixa.",
  done: "Isso! Todos os cartões estão nas caixas certas.",
  more: (left: number) => (left === 1 ? "Isso! Agora arraste o último cartão." : `Isso! Agora arraste outro cartão. Faltam ${left}.`),
};

/**
 * Faixa do palco na Cena 6: o que fazer AGORA, onde a criança está olhando. Textos de até ~22 caracteres para
 * caber numa linha também no celular (a faixa ocupa o topo; o monte de cartões fica logo abaixo dela).
 */
export const SORT_BANNER = {
  count: (placed: number, total: number) => `Nas caixas: ${placed} de ${total}`,
  picked: "Agora toque na caixa",
  /** tocou numa caixa sem ter escolhido um cartão */
  first: "Escolha um cartão",
  wrong: "Tente outra caixa",
  done: "Tudo certo!",
};

/** Altura (% do canvas) do centro da faixa de instrução (StageBanner) das cenas 1 e 6. */
export const BANNER_Y = 8;

/** Dica ao errar a caixa: lembra o que a caixa guarda, sem dizer qual é a caixa certa do cartão. */
export const SORT_HINTS: Record<ConceptId, string> = {
  ip: "IP é o endereço usado na comunicação.",
  domain: "Domínio é um nome fácil de lembrar.",
  page: "Página é o conteúdo que você acessa.",
};

/** Posição horizontal (%) de cada cartão nas cenas 1 a 4. */
export const CARD_X: Record<ConceptId, number> = { ip: 17, domain: 50, page: 83 };

/** Fileira de cartões no meio (Cena 1) ou no alto, menor (cenas 2 a 4). */
export type RowLayout = "center" | "top";

export const ROW_Y: Record<RowLayout, number> = { center: 52, top: 19 };

/** Tempo da fileira subindo para o alto. */
export const ROW_MOVE_MS = 700;

/** deslocamento vertical (% do canvas) para o centro do sprite cair no ponto quando há legenda */
export const LABEL_SHIFT = 2.5;

/** Leva um ponto do centro do sprite para o ponto do <Place> de um sprite com legenda. */
export function labeled(at: ScenePoint): ScenePoint {
  return { x: at.x, y: at.y + LABEL_SHIFT };
}
