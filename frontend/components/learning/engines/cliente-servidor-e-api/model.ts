import type { ElementKey } from "@/components/learning/kit";
import type { LessonEngineProps } from "@/components/learning/runtime";
import type { RoleId } from "../_api/World";

export type SceneProps = Pick<LessonEngineProps, "say" | "setCanAdvance" | "setHint" | "reducedMotion" | "next">;

/** Falas do Bonzi: LITERAIS de faixa14-completa.md (Planeta 1.2). */
export const LINES = {
  client: "Cliente é o sistema que inicia o pedido. Pode ser um aplicativo, um site ou outro programa.",
  api: "A API define as regras e os caminhos disponíveis para fazer pedidos. Ela não é necessariamente um computador separado.",
  server: "Servidor é o sistema que recebe pedidos e fornece dados ou executa operações. Ele pode funcionar em um computador remoto.",
  messages: "Requisição é a mensagem que pede algo. Resposta é a mensagem de retorno com o resultado ou uma informação sobre o que aconteceu.",
} as const;

/*
 * Falas criadas: a Cena 5 do .md só diz o que explicar ("em um sistema real, a API costuma ser disponibilizada pelo
 * serviço no servidor; o desenho separa os elementos para facilitar a compreensão") e a Microinteração e o Fechamento
 * não têm falas. As frases abaixo seguem esse texto o mais de perto possível.
 */
export const EXTRA_LINES = {
  roles: "Vamos conferir os papéis. Em um sistema real, a API costuma ser disponibilizada pelo serviço, no servidor. O desenho separa os elementos para facilitar a compreensão.",
  quiz: "Agora é com você. Toque na parte certa para cada pergunta.",
  quizRight: "Isso mesmo!",
  messages: "Agora olhe as duas mensagens.",
  quizDone: "Muito bem! Você reconheceu todos os papéis da comunicação.",
  closing: "Cliente pede, a API define como pedir e o servidor processa. A requisição é o pedido e a resposta é o retorno.",
} as const;

export const CITY = "Osasco";
export const TEMP = "24 °C";

/**
 * Microinteração, parte 1: as três perguntas do .md e a resposta de cada uma. `why`: o motivo do acerto, só ESCRITO
 * no palco (criado; sem fala nova do Bonzi, que é dublado).
 */
export const ROLE_QUESTIONS: { question: string; answer: RoleId; retry: string; why: string }[] = [
  { question: "Quem pede?", answer: "client", retry: "Ainda não. Pense em quem começa a conversa.", why: "O cliente começa a conversa: é ele que faz o pedido." },
  { question: "Quem define a forma de comunicação?", answer: "api", retry: "Ainda não. Procure quem tem as regras e os caminhos para pedir.", why: "A API tem as regras e os caminhos para pedir." },
  { question: "Quem processa o pedido?", answer: "server", retry: "Ainda não. Procure quem recebe o pedido e consulta os dados.", why: "O servidor recebe o pedido e consulta os dados." },
];

export type MessageId = "request" | "response";

/** Microinteração, parte 2: qual mensagem é a requisição e qual é a resposta. */
export const MESSAGE_QUESTIONS: { question: string; answer: MessageId; retry: string; why: string }[] = [
  { question: "Qual mensagem é a requisição?", answer: "request", retry: "Ainda não. A requisição é a mensagem que pede algo.", why: "A requisição vai até o servidor pedindo a temperatura." },
  { question: "Qual mensagem é a resposta?", answer: "response", retry: "Ainda não. A resposta é a mensagem que volta com o resultado.", why: "A resposta volta para o cliente com o resultado: 24 °C." },
];

/** Fechamento: o resumo visual do .md. */
export const SUMMARY: { term: string; meaning: string; element: ElementKey }[] = [
  { term: "Cliente", meaning: "pede", element: "cellphone" },
  { term: "API", meaning: "define como pedir", element: "plug" },
  { term: "Servidor", meaning: "processa", element: "server" },
  { term: "Requisição", meaning: "pedido", element: "mail" },
  { term: "Resposta", meaning: "retorno", element: "boxGold" },
];
