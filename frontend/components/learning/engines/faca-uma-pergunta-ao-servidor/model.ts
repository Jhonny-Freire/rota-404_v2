import type { ElementKey, KitTone } from "@/components/learning/kit";

export type Phase = "choose" | "ready" | "sending" | "receiving" | "identify" | "done";

/** Índices de meta.steps (as 4 etapas do .md). */
export const STEP = { choose: 0, send: 1, receive: 2, identify: 3 } as const;

export type QueryId = "clima" | "produto" | "jogador";

export type Query = {
  id: QueryId;
  /** opção da Etapa 1 */
  option: string;
  icon: ElementKey;
  app: string;
  appIcon: ElementKey;
  badge: ElementKey;
  service: string;
  request: string;
  /** dados predefinidos (variam por tentativa); [0] é o exemplo do .md no clima */
  data: { caption: string; value: string; response: string; rows: string[] }[];
};

/** Etapa 1 (.md): consultar clima, buscar um produto ou ver a pontuação de um jogador. Dados fictícios. */
export const QUERIES: Query[] = [
  {
    id: "clima",
    option: "Consultar clima",
    icon: "weather",
    app: "App de clima",
    appIcon: "cellphone",
    badge: "weather",
    service: "Serviço de clima",
    request: "TEMPERATURA?",
    data: [
      { caption: "Cidade: Osasco", value: "Temperatura: 24 °C", response: "24 °C", rows: ["Osasco", "Temperatura"] },
      { caption: "Cidade: Recife", value: "Temperatura: 30 °C", response: "30 °C", rows: ["Recife", "Temperatura"] },
      { caption: "Cidade: Curitiba", value: "Temperatura: 17 °C", response: "17 °C", rows: ["Curitiba", "Temperatura"] },
    ],
  },
  {
    id: "produto",
    option: "Buscar um produto",
    icon: "box",
    app: "Loja on-line",
    appIcon: "store",
    badge: "box",
    service: "Serviço da loja",
    request: "PRODUTO 42?",
    data: [
      { caption: "Produto: Teclado", value: "Preço: R$ 120", response: "TECLADO", rows: ["Produto 42", "Preço"] },
      { caption: "Produto: Mouse", value: "Preço: R$ 60", response: "MOUSE", rows: ["Produto 42", "Preço"] },
      { caption: "Produto: Fone", value: "Preço: R$ 90", response: "FONE", rows: ["Produto 42", "Preço"] },
    ],
  },
  {
    id: "jogador",
    option: "Ver a pontuação de um jogador",
    icon: "gamepad",
    app: "Jogo",
    appIcon: "gamepad",
    badge: "gamepad",
    service: "Servidor do jogo",
    request: "PONTOS?",
    data: [
      { caption: "Jogador: Nave42", value: "Pontos: 1500", response: "1500", rows: ["Nave42", "Pontos"] },
      { caption: "Jogador: Cometa", value: "Pontos: 980", response: "980", rows: ["Cometa", "Pontos"] },
      { caption: "Jogador: Astro", value: "Pontos: 2210", response: "2210", rows: ["Astro", "Pontos"] },
    ],
  },
];

export type LabelId = "cliente" | "api" | "servidor" | "requisicao" | "resposta";

/**
 * Etapa 4: as 5 etiquetas do .md e os lugares onde elas vão. `wrong` é a explicação do Bonzi quando outra etiqueta
 * cai nesse lugar (Feedback do .md: "explica a função daquele componente", sem dizer o nome).
 */
export const LABELS: { id: LabelId; text: string; zone: string; wrong: string }[] = [
  { id: "cliente", text: "cliente", zone: "Lugar do aplicativo", wrong: "Ainda não. Essa parte é quem inicia o pedido." },
  { id: "api", text: "API", zone: "Lugar da peça do meio", wrong: "Ainda não. Essa parte define as regras e os caminhos para pedir." },
  { id: "servidor", text: "servidor", zone: "Lugar do computador da direita", wrong: "Ainda não. Essa parte recebe o pedido e consulta os dados." },
  { id: "requisicao", text: "requisição", zone: "Lugar da mensagem que vai", wrong: "Ainda não. Essa mensagem vai do aplicativo até o servidor, pedindo algo." },
  { id: "resposta", text: "resposta", zone: "Lugar da mensagem que volta", wrong: "Ainda não. Essa mensagem volta do servidor com o resultado." },
];

/* falas e textos criados: o .md do 1.3 não define falas; a conclusão segue o texto "Conclusão" do .md */
export const TEXT = {
  intro: "Vamos fazer uma pergunta ao servidor! Escolha uma consulta.",
  introFb: "Escolha uma das consultas na área de interação.",
  chosen: "Boa escolha! Agora toque em CONSULTAR para enviar o pedido.",
  chosenFb: "Toque em CONSULTAR.",
  sending: "O aplicativo é o cliente: ele envia a requisição pela API até o servidor.",
  sendingFb: "A requisição está indo até o servidor.",
  received: "O servidor respondeu com dados predefinidos, e a informação apareceu na tela!",
  receivedFb: "A resposta chegou e a informação apareceu no aplicativo.",
  identify: "Agora arraste cada etiqueta até a parte certa da comunicação.",
  identifyFb: "Arraste cada etiqueta (ou toque nela e depois no lugar) até a parte certa.",
  right: "Isso!",
  rightFb: (left: number) => (left === 1 ? "Certo! Falta 1 etiqueta." : `Certo! Faltam ${left} etiquetas.`),
  done: "Você completou uma consulta simulada e identificou quem pediu, quem processou e qual foi a resposta.",
  doneFb: "Consulta completa: você identificou cliente, API, servidor, requisição e resposta.",
} as const;

export type BannerSpec = { text: string; tone: KitTone; icon: ElementKey };

export const BANNER: Record<string, BannerSpec> = {
  choose: { text: "Escolha uma consulta", tone: "warning", icon: "question" },
  ready: { text: "Toque em CONSULTAR", tone: "warning", icon: "mail" },
  sending: { text: "A requisição está indo", tone: "info", icon: "mail" },
  receiving: { text: "A resposta está voltando", tone: "info", icon: "boxGold" },
  received: { text: "A informação chegou!", tone: "success", icon: "ok" },
  identify: { text: "Coloque as etiquetas", tone: "warning", icon: "plug" },
  wrong: { text: "Veja o que essa parte faz", tone: "danger", icon: "error" },
  done: { text: "Fluxo identificado!", tone: "success", icon: "ok" },
};

export const TIMING = {
  /** passos 0–4 (pedido indo e o servidor consultando) e 5–8 (resposta voltando e aparecendo) */
  send: [700, 1000, 1000, 900, 900],
  receive: [900, 1000, 1000],
  /** depois de a informação aparecer, antes de pedir as etiquetas */
  readResult: 2600,
  wrongMs: 1600,
  finish: 2600,
};
