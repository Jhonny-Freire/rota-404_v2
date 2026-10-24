import type { ElementKey, KitTone, SeededRandom } from "@/components/learning/kit";
import type { HttpMethod } from "../_api/http";
import type { JsonValue } from "../_api/Json";

export type Option = { id: string; label: string; correct?: boolean; why: string };

export type Fix = "check" | "field" | "login" | "retry";

export type Case = {
  id: "404" | "400" | "401" | "500";
  title: string;
  method: HttpMethod;
  path: string;
  /** dados enviados (POST); o campo vazio é o que o aluno precisa achar */
  body?: Record<string, string>;
  /** "sem login" etc. */
  note?: string;
  code: number;
  text: string;
  response: JsonValue;
  causes: Option[];
  /** a próxima ação (.md) */
  fix: Fix;
  actions?: Option[];
  /** explicação do .md: por que o status combina com a situação */
  explain: string;
  /** depois de corrigir (400 e 401): a nova resposta */
  after?: { code: number; text: string; response: JsonValue; message: string };
};

/** Os 4 casos do .md, em ordem, com dados fictícios que mudam a cada "Jogar de novo". */
export function buildCases(rand: SeededRandom): Case[] {
  const missingId = rand.pick([999, 777, 850], "id");
  const user = rand.pick([{ nome: "Bia", email: "bia@exemplo.test" }, { nome: "Leo", email: "leo@exemplo.test" }, { nome: "Rafa", email: "rafa@exemplo.test" }], "user");
  const emptyField = rand.pick(["email", "nome"] as const, "vazio");
  const existing = rand.pick([10, 12, 21], "existe");
  const body: Record<string, string> = { nome: user.nome, email: user.email };
  body[emptyField] = "";
  return [
    {
      id: "404",
      title: "Recurso inexistente",
      method: "GET",
      path: `/users/${missingId}`,
      code: 404,
      text: "Not Found",
      response: { erro: "Recurso não encontrado" },
      causes: [
        { id: "metodo", label: "Método incorreto", why: "GET é o método certo para consultar. O problema não está no método." },
        { id: "nao-encontrado", label: "Usuário não encontrado", correct: true, why: `404 significa que o recurso não existe naquele endereço: não há usuário ${missingId}.` },
        { id: "json", label: "JSON inválido", why: "A requisição GET não enviou JSON, e a resposta chegou bem formada." },
      ],
      fix: "check",
      actions: [
        { id: "conferir", label: "Verificar se o identificador e o endpoint estão corretos", correct: true, why: "Isso! O próximo passo é conferir o ID e o endpoint." },
        { id: "post", label: "Trocar o método para POST", why: "POST cria algo novo; a missão era consultar. Trocar o método não resolve um recurso inexistente." },
        { id: "repetir", label: "Repetir o mesmo pedido várias vezes", why: "O mesmo pedido vai receber o mesmo 404: o usuário continua não existindo." },
      ],
      explain: "Um 404 indica que o recurso pedido não foi encontrado naquele endereço.",
    },
    {
      id: "400",
      title: "Pedido inválido",
      method: "POST",
      path: "/users",
      body,
      code: 400,
      text: "Bad Request",
      response: { erro: "Dados inválidos" },
      causes: [
        { id: "dados", label: "Os dados enviados precisam ser corrigidos", correct: true, why: "400 indica que o pedido tem algo inválido: um campo obrigatório está vazio." },
        { id: "servidor", label: "O servidor teve uma falha interna", why: "Uma falha interna seria um 500. O 400 aponta um problema no pedido." },
        { id: "login", label: "Falta entrar na conta", why: "Falta de autenticação seria um 401. Aqui o problema está nos dados enviados." },
      ],
      fix: "field",
      explain: "O 400 mostra que o problema está no pedido: os dados precisam ser corrigidos antes de enviar de novo.",
      after: { code: 200, text: "OK", response: { mensagem: "Usuário registrado", nome: user.nome }, message: "Com o campo preenchido, o pedido foi aceito: 200 OK." },
    },
    {
      id: "401",
      title: "Autenticação necessária",
      method: "GET",
      path: "/minha-conta",
      note: "sem login",
      code: 401,
      text: "Unauthorized",
      response: { erro: "Autenticação necessária" },
      causes: [
        { id: "login", label: "Falta uma autenticação válida", correct: true, why: "401 indica que falta provar quem você é: é preciso entrar na conta." },
        { id: "nao-existe", label: "A conta não existe", why: "Recurso inexistente seria um 404. O 401 aponta falta de autenticação." },
        { id: "falha", label: "O serviço caiu", why: "Uma falha interna seria um 500. O serviço respondeu normalmente pedindo autenticação." },
      ],
      fix: "login",
      explain: "Com o 401, o caminho é entrar na conta (simulada) e repetir o pedido.",
      after: { code: 200, text: "OK", response: { conta: user.nome, pontos: 1500 }, message: "Depois de entrar na conta simulada, o mesmo pedido recebeu 200 OK." },
    },
    {
      id: "500",
      title: "Falha interna",
      method: "GET",
      path: `/users/${existing}`,
      code: 500,
      text: "Internal Server Error",
      response: { erro: "Erro interno" },
      causes: [
        { id: "interna", label: "Uma falha interna do serviço", correct: true, why: "500 indica uma falha dentro do servidor: o pedido era válido." },
        { id: "pedido", label: "O pedido está inválido", why: "Um pedido inválido receberia 400. Aqui o pedido era válido." },
        { id: "nao-encontrado", label: "O usuário não existe", why: "Um recurso inexistente receberia 404. O 500 é uma falha do serviço." },
      ],
      fix: "retry",
      actions: [
        { id: "tentar", label: "Tentar novamente ou informar o problema", correct: true, why: "Isso! Nem todo erro se corrige do lado do cliente." },
        { id: "metodo", label: "Trocar o método para DELETE", why: "Mudar o método aleatoriamente não resolve uma falha do servidor (e DELETE removeria o recurso)." },
        { id: "dados", label: "Mudar os dados ao acaso", why: "O pedido estava certo. Alterar os dados não conserta uma falha interna." },
      ],
      explain: "No 500, o problema é do serviço: tente novamente ou avise quem cuida dele, sem mudar o pedido ao acaso.",
    },
  ];
}

/* falas e textos criados (o .md descreve os casos sem falas); a conclusão segue o texto "Conclusão" do .md */
export const TEXT = {
  intro: "Uma operação deu errado. Abra a requisição e a resposta, examine os dados e diga o que aconteceu.",
  open: "Toque em REQUISIÇÃO e RESPOSTA para examinar. Depois responda: o que aconteceu?",
  caseStart: (n: number, title: string) => `Caso ${n} de 4: ${title}. Examine e diga o que aconteceu.`,
  causeRight: "Diagnóstico certo!",
  actionAsk: "E agora, qual é a próxima ação?",
  fieldAsk: "Toque no campo que está faltando, na requisição. Depois envie de novo.",
  fieldWrong: "Esse campo já está preenchido. Procure o que está vazio.",
  fieldFixed: "Campo preenchido com um dado fictício. Agora envie de novo.",
  loginAsk: "Entre na conta simulada e repita o pedido. Nenhuma senha real é usada.",
  done: "Você relacionou requisição e resposta para descobrir a causa provável de cada problema, sem supor que todo erro se corrige do lado do cliente.",
  doneFb: "Você diagnosticou 404, 400, 401 e 500 e escolheu a ação certa para cada um.",
} as const;

export type BannerSpec = { text: string; tone: KitTone; icon: ElementKey };

export const BANNER: Record<string, BannerSpec> = {
  examine: { text: "O que aconteceu?", tone: "warning", icon: "magnifier" },
  wrong: { text: "Releia o código de status", tone: "danger", icon: "error" },
  right: { text: "Diagnóstico certo!", tone: "success", icon: "ok" },
  action: { text: "Qual é a próxima ação?", tone: "warning", icon: "question" },
  fixed: { text: "Problema resolvido!", tone: "success", icon: "ok" },
  done: { text: "Diagnósticos completos!", tone: "success", icon: "ok" },
};

export const TIMING = { resend: 1200, nextCase: 3200, finish: 3000 };
