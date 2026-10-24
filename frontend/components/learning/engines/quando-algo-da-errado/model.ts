import type { ElementKey } from "@/components/learning/kit";
import type { LessonEngineProps } from "@/components/learning/runtime";
import type { HttpMethod } from "../_api/http";

export type SceneProps = Pick<LessonEngineProps, "say" | "setCanAdvance" | "setHint" | "reducedMotion" | "next">;

export type StatusCase = {
  id: string;
  title: string;
  method: HttpMethod;
  path: string;
  /** detalhe da requisição (corpo vazio, sem login...) */
  note?: string;
  code: number;
  text: string;
  /** fala LITERAL do .md */
  line: string;
  serverElement: ElementKey;
  serverBadge?: ElementKey;
  /** o que o cliente mostra quando a resposta chega */
  shows: string;
};

/** Cenas 1 a 5 (faixa14-completa.md, Planeta 4.2): requisições, status e falas LITERAIS. */
export const CASES: StatusCase[] = [
  {
    id: "200",
    title: "Uma resposta de sucesso",
    method: "GET",
    path: "/users/10",
    code: 200,
    text: "OK",
    line: "O código de status é um número enviado na resposta HTTP. Ele resume o resultado da requisição. 200 significa que o pedido foi atendido com sucesso.",
    serverElement: "server",
    shows: "Usuário 10: Caio",
  },
  {
    id: "400",
    title: "O pedido tem um problema",
    method: "POST",
    path: "/users",
    note: "nome: (vazio)",
    code: 400,
    text: "Bad Request",
    line: "400 indica que o pedido enviado tem algo inválido ou não pode ser entendido como foi enviado.",
    serverElement: "server",
    shows: "Pedido inválido",
  },
  {
    id: "401",
    title: "É preciso provar a identidade",
    method: "GET",
    path: "/minha-conta",
    note: "sem login",
    code: 401,
    text: "Unauthorized",
    line: "401 indica que falta uma autenticação válida. Autenticação é provar quem você é, por exemplo, entrando na sua conta.",
    serverElement: "server",
    serverBadge: "lockClosed",
    shows: "Entre na sua conta",
  },
  {
    id: "404",
    title: "O recurso não existe",
    method: "GET",
    path: "/users/999",
    code: 404,
    text: "Not Found",
    line: "404 significa que o recurso solicitado não foi encontrado naquele endereço.",
    serverElement: "server",
    shows: "Usuário não encontrado",
  },
  {
    id: "500",
    title: "Falha no serviço",
    method: "GET",
    path: "/users/10",
    code: 500,
    text: "Internal Server Error",
    line: "500 indica uma falha interna no servidor. Nem todo erro é causado por quem fez o pedido.",
    serverElement: "serverError",
    shows: "Erro no serviço",
  },
];

/* falas criadas: Microinteração e Fechamento (o Fechamento segue o texto do .md) */
export const EXTRA_LINES = {
  match: "Ligue cada situação ao código de status que combina com ela.",
  matchDone: "Muito bem! Você reconheceu os códigos mais comuns.",
  closing: "Esses são exemplos comuns, não a lista completa dos status HTTP. O código descreve o resultado da requisição, mas não revela necessariamente todos os detalhes da causa.",
} as const;

/** Microinteração (.md): situações → status, com uma explicação a cada escolha. */
export const SITUATIONS = [
  { id: "sit-200", label: "Pedido atendido com sucesso", zone: "z-200", why: "200: o pedido foi atendido com sucesso." },
  { id: "sit-400", label: "Pedido com dados inválidos", zone: "z-400", why: "400: o pedido tem algo inválido, como um campo obrigatório vazio." },
  { id: "sit-401", label: "Falta autenticação válida", zone: "z-401", why: "401: falta provar quem você é, entrando na conta." },
  { id: "sit-404", label: "Recurso não encontrado", zone: "z-404", why: "404: não existe esse recurso naquele endereço." },
  { id: "sit-500", label: "Falha interna no servidor", zone: "z-500", why: "500: o problema aconteceu dentro do servidor, não no pedido." },
];
export const STATUS_ZONES = [
  { id: "z-200", name: "200 OK", need: "200 é sucesso: o pedido foi atendido." },
  { id: "z-400", name: "400 Bad Request", need: "400 é para um pedido inválido." },
  { id: "z-401", name: "401 Unauthorized", need: "401 é quando falta uma autenticação válida." },
  { id: "z-404", name: "404 Not Found", need: "404 é quando o recurso não foi encontrado." },
  { id: "z-500", name: "500 Internal Server Error", need: "500 é uma falha interna no servidor." },
];
