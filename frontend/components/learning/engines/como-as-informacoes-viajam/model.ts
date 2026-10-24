import type { ElementKey, ScenePoint, SequenceStep } from "@/components/learning/kit";
import type { LessonEngineProps } from "@/components/learning/runtime";

export type SceneProps = Pick<LessonEngineProps, "say" | "setCanAdvance" | "setHint" | "reducedMotion" | "next">;

/* texto criado: o site e a conta fictícios da página de login */
export const SITE = "escola.com";
export const USER = "aluno123";

/** Falas do Bonzi: LITERAIS do aula4-1.md. */
export const LINES = {
  login: "Quando você clica em entrar, o navegador precisa enviar informações para verificar seu acesso!",
  request: "Essa mensagem é uma requisição: um pedido enviado de um sistema para outro.",
  server: "O servidor recebeu o pedido e está verificando as informações.",
  response: "Depois de processar o pedido, o servidor envia uma resposta dizendo o que aconteceu.",
  result: "O navegador recebeu a resposta e mostrou o resultado na tela!",
  closing:
    "Sempre que sistemas precisam trocar informações, eles podem enviar pedidos e receber respostas. É assim que muitas ações na internet funcionam!",
} as const;

/* fala criada: o .md não define falas para a Microinteração nem para a outra tentativa da Cena 5 */
export const EXTRA_LINES = {
  explore: "Toque em cada parte da comunicação para descobrir o que ela faz.",
  order: "Agora coloque as etapas na ordem certa.",
  orderWrong: "Ainda não. Pense no que acontece primeiro quando você clica em Entrar.",
  orderRight: "Isso! Veja a comunicação completa acontecendo.",
  wrongTry: "Desta vez a senha estava errada, e a resposta avisou o problema!",
} as const;

/** Textos visíveis da página de login. */
export const LOGIN_OK = "Login realizado!";
/* texto criado: o .md diz só "a resposta pode indicar que os dados estão incorretos" */
export const LOGIN_FAIL = "Usuário ou senha incorretos.";

/** Nomes das mensagens: o .md as identifica como `REQUISIÇÃO` e `RESPOSTA` (escritos na fonte do corpo). */
export const MESSAGES = {
  request: { label: "REQUISIÇÃO", element: "mail" as ElementKey, alt: "Requisição" },
  response: { label: "RESPOSTA", element: "boxGold" as ElementKey, alt: "Resposta" },
};

export type MessageKind = keyof typeof MESSAGES;

export type PartId = "request" | "server" | "response" | "browser";

/** As 4 partes da Microinteração: textos LITERAIS do .md. */
export const PARTS: { id: PartId; name: string; text: string }[] = [
  { id: "request", name: "Requisição", text: "Requisição: mensagem enviada para fazer um pedido." },
  { id: "server", name: "Servidor", text: "Servidor: recebe e processa o pedido." },
  { id: "response", name: "Resposta", text: "Resposta: mensagem enviada de volta com o resultado." },
  { id: "browser", name: "Navegador", text: "Navegador: recebe a resposta e apresenta o resultado ao usuário." },
];

export type StepId = "send" | "process" | "show";

/** Os 3 cartões da Microinteração, na ordem certa (o aluno os recebe embaralhados). */
export const ORDER_STEPS: { id: StepId; label: string; element: ElementKey }[] = [
  { id: "send", label: "Navegador envia pedido", element: "mail" },
  { id: "process", label: "Servidor processa", element: "server" },
  { id: "show", label: "Navegador mostra resultado", element: "webpage" },
];

/* Mundo das cenas (% do SceneCanvas): navegador à esquerda, internet no meio, servidor à direita, na altura LINE_Y. */
export const LINE_Y = 50;
export const INTERNET_AT: ScenePoint = { x: 63, y: LINE_Y };
export const SERVER_AT: ScenePoint = { x: 87, y: LINE_Y };
export const STOPS = {
  client: { x: 51.5, y: LINE_Y },
  internet: { x: 63, y: LINE_Y },
  server: { x: 77, y: LINE_Y },
} satisfies Record<string, ScenePoint>;
export const WIRES = {
  a: { from: { x: 47, y: LINE_Y }, to: { x: 58.5, y: LINE_Y } },
  b: { from: { x: 67.5, y: LINE_Y }, to: { x: 82, y: LINE_Y } },
};
/** Microinteração: a requisição e a resposta paradas abaixo dos fios (na linha, as legendas se cruzam no celular) */
export const EXPLORE_AT = {
  request: { x: 53, y: 72 },
  response: { x: 75, y: 72 },
} satisfies Record<string, ScenePoint>;

export const READY_PAUSE_MS = 1400;
export const MOVE_MS = 1000;
const MS_PER_CHAR = 65;

export function speechMs(line: string): number {
  return line.length * MS_PER_CHAR;
}

/** Fases de uma cena passiva: pausas de LEITURA ({ hold }); a última cresce até a soma cobrir a fala. */
export function phases(holds: readonly number[], line: string): SequenceStep[] {
  const total = holds.reduce((sum, ms) => sum + ms, 0);
  const extra = Math.max(0, speechMs(line) - total);
  return holds.map((ms, index) => ({ hold: index === holds.length - 1 ? ms + extra : ms }));
}
