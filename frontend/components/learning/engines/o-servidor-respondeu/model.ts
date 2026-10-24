import type { ElementKey, KitTone } from "@/components/learning/kit";

export type Phase = "order" | "replay" | "open" | "fail" | "question" | "done";

/** Índices de meta.steps (as 4 etapas do .md). */
export const STEP = { order: 0, replay: 1, open: 2, fail: 3 } as const;

export type CardId = "envia" | "processa" | "responde" | "recebe";

/**
 * Etapa 1 (.md): os 4 cartões, na ordem certa. `why` explica a etapa quando ela está fora de ordem (o Feedback do
 * .md pede que o sistema explique cada etapa fora de ordem) — texto criado.
 */
export const CARDS: { id: CardId; label: string; element: ElementKey; why: string }[] = [
  { id: "envia", label: "cliente envia pedido", element: "mail", why: "Tudo começa quando o cliente envia o pedido." },
  { id: "processa", label: "servidor processa", element: "server", why: "O servidor só pode processar depois de receber o pedido." },
  { id: "responde", label: "servidor envia resposta", element: "boxGold", why: "A resposta só sai depois que o servidor processa o pedido." },
  { id: "recebe", label: "cliente recebe o resultado", element: "cellphone", why: "O cliente só recebe o resultado no fim, quando a resposta chega." },
];

/** Etapa 2: em que passo do mundo (ApiWorld) cada cartão acontece. */
export const CARD_AT_STEP: Record<CardId, number[]> = {
  envia: [0, 1, 2],
  processa: [3, 4],
  responde: [5, 6, 7],
  recebe: [8],
};

/** Etapa 3 (.md): o conteúdo das mensagens — sem métodos HTTP, URLs ou JSON. */
export const MESSAGES = {
  request: { title: "REQUISIÇÃO", text: "Consultar produto 42" },
  response: { title: "RESPOSTA", text: "Produto encontrado" },
};

/** Etapa 4 (.md): o que está faltando. A certa é a do .md; as outras são criadas. */
export const MISSING = [
  { id: "resposta", text: "o cliente ainda não recebeu a resposta", correct: true },
  { id: "pedido", text: "o cliente ainda não enviou o pedido", correct: false, why: "O pedido foi enviado: ele chegou ao servidor." },
  { id: "servidor", text: "o servidor não processou o pedido", correct: false, why: "O servidor processou o pedido e mandou uma resposta." },
];

/* falas e textos criados: o .md do 1.4 descreve as etapas sem falas; a conclusão segue o texto "Conclusão" do .md */
export const TEXT = {
  intro: "Estas etapas estão fora de ordem. Organize a comunicação do começo ao fim.",
  introFb: "Toque em dois cartões para trocar de lugar. Depois toque em Verificar.",
  wrongFb: (why: string) => `Esse cartão está fora de ordem. ${why}`,
  right: "Ordem certa! Agora acompanhe a comunicação acontecendo.",
  replayFb: "Acompanhe cada etapa: pedido, processamento, resposta e resultado.",
  open: "Agora abra as duas mensagens: toque na requisição e na resposta.",
  openFb: "Toque na REQUISIÇÃO e na RESPOSTA, no palco, para ver o que cada uma diz.",
  opened: (left: number) => (left === 1 ? "Falta abrir 1 mensagem." : "Abra as duas mensagens."),
  failIntro: "Agora veja outra rodada. Observe com atenção o que acontece com a resposta.",
  failFb: "Observe a nova rodada.",
  question: "A resposta não chegou. O que está faltando?",
  questionFb: "Escolha o que está faltando na área de interação.",
  wrongMissing: (why: string) => `Ainda não. ${why}`,
  rightMissing: "Isso! O cliente ainda não recebeu a resposta, então não pode exibir um resultado que não chegou.",
  done: "Você diferenciou pedido e resposta e entendeu a ordem da comunicação. Agora está pronto para aprender como as requisições são escritas!",
  doneFb: "Pedido e resposta, cada um no seu tempo: sem resposta, não há resultado.",
} as const;

export type BannerSpec = { text: string; tone: KitTone; icon: ElementKey };

export const BANNER: Record<string, BannerSpec> = {
  order: { text: "Coloque as etapas em ordem", tone: "warning", icon: "box" },
  wrong: { text: "Etapa fora de ordem", tone: "danger", icon: "error" },
  replay: { text: "Acompanhe a comunicação", tone: "info", icon: "mail" },
  open: { text: "Abra as mensagens", tone: "warning", icon: "magnifier" },
  fail: { text: "Outra rodada", tone: "info", icon: "mail" },
  lost: { text: "A resposta não chegou!", tone: "danger", icon: "error" },
  question: { text: "O que está faltando?", tone: "warning", icon: "question" },
  done: { text: "Sem resposta, sem resultado", tone: "success", icon: "ok" },
};

export const TIMING = {
  /** passos 0–8 do mundo na Etapa 2 */
  replay: [800, 1000, 1000, 900, 900, 900, 1000, 1000, 1400],
  /** Etapa 4: passos 0–6 (a resposta se perde no 6) */
  fail: [800, 1000, 1000, 800, 800, 900, 1200],
  finish: 3200,
};
