import type { ElementKey, ScenePoint, SequenceStep } from "@/components/learning/kit";
import type { LessonEngineProps } from "@/components/learning/runtime";

export type SceneProps = Pick<LessonEngineProps, "say" | "setCanAdvance" | "setHint" | "reducedMotion">;

/** Endereço digitado no navegador (aula3-1.md, Cena 1). */
export const SITE = "jogos.com";

/* texto criado: título do site jogos.com, o mesmo na cena 5 e na miniatura das cenas 6 e 7 (curto: cabe numa
   linha na miniatura com o palco de celular; "Mundo dos Jogos" quebrava em 3 linhas e empurrava o computador) */
export const SITE_TITLE = "Jogos";

/** Nome visível do servidor: o .md diz "identificado como `SERVIDOR`" (texto sem acento, na fonte do corpo). */
export const SERVER_NAME = "SERVIDOR";

/** Falas do Bonzi: LITERAIS do aula3-1.md (uma por cena). */
export const LINES = {
  browser: "Você usa um navegador para acessar sites. É aquele programa que permite abrir páginas da Web!",
  request: "Para encontrar o conteúdo do site, o navegador envia um pedido pela internet.",
  server: "Um servidor é um computador que pode guardar e fornecer o conteúdo de um site. Ele recebeu nosso pedido!",
  response: "O servidor encontrou o conteúdo e enviou uma resposta!",
  page: "Pronto! O navegador recebeu o conteúdo e mostrou o site na sua tela.",
  closing: "Agora você sabe! O navegador pede, o servidor responde e o navegador mostra o site.",
} as const;

/* fala criada: o .md não define falas nem feedbacks para a Microinteração (cena 6) */
export const EXPLORE_LINES = {
  intro: "Toque em cada parte para descobrir o que ela faz.",
  order: "Agora coloque as etapas na ordem certa.",
  orderWrong: "Ainda não. Pense no que acontece primeiro quando você acessa um site.",
  orderRight: "Isso! Primeiro o pedido, depois a resposta e, por fim, a página.",
} as const;

/* texto criado: instruções do painel "O que fazer" e da faixa (o .md não define) */
export const GUIDE = {
  accessed: "O navegador começou a carregar o site jogos.com.",
  explored: "Você descobriu as 4 partes! Agora vamos organizar as etapas.",
  left: (left: number) => (left === 1 ? "Falta 1 parte. Encontre e toque nela." : `Faltam ${left} partes. Toque em outra parte.`),
  order: "Toque em dois cartões para trocar de lugar. Depois toque em Verificar.",
  orderWrong: "Ainda não. Troque os cartões de lugar e toque em Verificar de novo.",
  orderRight: "Isso! As etapas estão na ordem certa.",
} as const;

export const BANNER = {
  access: "Toque em Acessar",
  loading: "Carregando jogos.com",
  explore: "Toque em cada parte",
  found: (count: number, total: number) => `Descobertas: ${count} de ${total}`,
  order: "Coloque em ordem",
  orderWrong: "Tente outra ordem",
  orderRight: "Ordem certa!",
} as const;

export type PartId = "browser" | "internet" | "server" | "response";

export type Part = {
  id: PartId;
  name: string;
  /** função da parte: texto LITERAL da Microinteração do .md */
  text: string;
};

/** As 4 partes da Microinteração, na ordem do .md (e de foco). */
export const PARTS: Part[] = [
  { id: "browser", name: "Navegador", text: "Navegador: permite acessar e visualizar sites." },
  { id: "internet", name: "Internet", text: "Internet: permite que as informações viajem entre os dispositivos." },
  { id: "server", name: "Servidor", text: "Servidor: fornece o conteúdo solicitado." },
  { id: "response", name: "Resposta", text: "Resposta: contém as informações enviadas pelo servidor." },
];

export type StepId = "request" | "response" | "page";

/** As 3 etapas a organizar (`Pedido → Resposta → Página`), com os mesmos sprites usados nas cenas. */
export const ORDER_STEPS: { id: StepId; label: string; element: ElementKey }[] = [
  { id: "request", label: "Pedido", element: "mail" },
  { id: "response", label: "Resposta", element: "boxGold" },
  { id: "page", label: "Página", element: "webpage" },
];

export const ORDER_IDS: StepId[] = ORDER_STEPS.map((step) => step.id);

/** Pedido e resposta: sprites diferentes e sempre os mesmos nas cenas 2, 4, 6 e 7. */
export type TravelerKind = "request" | "response";

export const TRAVELERS: Record<TravelerKind, { element: ElementKey; label: string }> = {
  request: { element: "mail", label: "Pedido" },
  response: { element: "boxGold", label: "Resposta" },
};

/** Arquivos que o servidor guarda (cena 3); "Textos" é desenhado em CSS. */
export const FILES: { id: string; label: string; element?: ElementKey }[] = [
  { id: "page", label: "Página", element: "webpage" },
  { id: "images", label: "Imagens", element: "photo" },
  { id: "texts", label: "Textos" },
];

/*
 * Mundo das cenas 2, 3, 4, 6 e 7 (% do SceneCanvas): navegador + computador à esquerda, internet no meio,
 * servidor à direita, todos na altura LINE_Y. Conferido com o palco a ~560 e ~900 px: o navegador lateral ocupa
 * de ~33% a ~72% da altura, então LINE_Y cai dentro dele nas duas larguras.
 */
export const LINE_Y = 48;

export type ClientLayout = "focus" | "side";

/**
 * Grupo navegador + computador (Place ancorado no topo). "focus" = cenas 1 e 5; "side" = demais. No lateral, 36
 * unidades ainda mostram "jogos.com" inteiro na barra de endereço com o palco de celular (~320 px).
 */
export const CLIENT: Record<ClientLayout, { x: number; y: number; width: number }> = {
  focus: { x: 50, y: 13, width: 54 },
  side: { x: 21, y: 27, width: 36 },
};

export const INTERNET_AT: ScenePoint = { x: 60, y: LINE_Y };
export const SERVER_AT: ScenePoint = { x: 86, y: LINE_Y };
/**
 * onde a Resposta descansa na Microinteração: abaixo do fio, entre a internet e o servidor. Na mesma linha, as
 * legendas (mínimo em px) se sobrepunham com o palco de celular (~340 px).
 */
export const RESPONSE_AT: ScenePoint = { x: 73, y: LINE_Y + 23 };

/** tamanhos em unidades do kit (os dois sprites são quadrados: 14x14 e 12x12) */
export const INTERNET_SIZE = 8;
export const SERVER_SIZE = 9;

/** paradas do pedido e da resposta */
export const STOPS = {
  client: { x: 42, y: LINE_Y },
  internet: { x: INTERNET_AT.x, y: LINE_Y },
  server: { x: 78.5, y: LINE_Y },
} satisfies Record<string, ScenePoint>;

export type StopId = keyof typeof STOPS;

/** fios: navegador ↔ internet (a) e internet ↔ servidor (b) */
export const WIRES = {
  a: { from: { x: 40, y: LINE_Y }, to: { x: 55.5, y: LINE_Y } },
  b: { from: { x: 64.5, y: LINE_Y }, to: { x: 80.5, y: LINE_Y } },
};

/** painel de arquivos acima do servidor (cenas 3, 4 e 7); alto o bastante para não cobrir a etiqueta do pedido a ~560 px */
export const FILES_AT = { x: 83, y: LINE_Y - 15, width: 28 };

/** Pausa entre o acerto e a liberação de "Próxima cena": o aluno vê o resultado antes de o foco ir ao botão. */
export const READY_PAUSE_MS = 1400;

/** viagem do pedido/resposta de uma parada à outra (cabe no hold de cada salto) */
export const MOVE_MS = 1000;

/** tempo aproximado de fala do Bonzi */
export const MS_PER_CHAR = 65;

export function speechMs(line: string): number {
  return line.length * MS_PER_CHAR;
}

/**
 * Passos de uma cena passiva: cada fase é uma pausa de LEITURA ({ hold }), então com movimento reduzido o pedido
 * e a resposta ainda vão de parada em parada no mesmo ritmo. A última fase cresce até a soma cobrir a fala
 * (~65 ms por caractere): "Próxima cena" só é liberada quando o Bonzi termina.
 */
export function phases(holds: readonly number[], line: string): SequenceStep[] {
  const total = holds.reduce((sum, ms) => sum + ms, 0);
  const extra = Math.max(0, speechMs(line) - total);
  return holds.map((ms, index) => ({ hold: index === holds.length - 1 ? ms + extra : ms }));
}
