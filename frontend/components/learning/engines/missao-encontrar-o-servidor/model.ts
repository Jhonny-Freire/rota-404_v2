import type { ElementKey } from "@/config/assets";
import { DEFAULT_RATIO, pathLength, type KitTone, type ScenePoint, type SeededRandom } from "@/components/learning/kit";

/* ───────── Destinos (variação por partida) ───────── */

export type Destino = { domain: string; title: string; image: ElementKey };

export const DESTINOS: readonly Destino[] = [
  { domain: "exemplo.com", title: "Página inicial", image: "house" },
  { domain: "jogos.exemplo.com", title: "Jogos", image: "robot" },
  { domain: "fotos.exemplo.com", title: "Fotos", image: "photo" },
  { domain: "musica.exemplo.com", title: "Música", image: "microphone" },
];

export const SERVER_IPS = ["203.0.113.10", "203.0.113.20", "203.0.113.30"] as const;
const SERVER_LETTERS = ["A", "B", "C"] as const;

/* ───────── Peças do mapa ───────── */

type Piece = { element: ElementKey; name: string; phrase: string };
type Device = Piece & { own: string };

const DEVICES: readonly Device[] = [
  { element: "pc", name: "Computador", phrase: "O computador", own: "Seu computador" },
  { element: "notebook", name: "Notebook", phrase: "O notebook", own: "Seu notebook" },
  { element: "cellphone", name: "Celular", phrase: "O celular", own: "Seu celular" },
];

/** outros aparelhos da casa: caminhos sem saída */
const OTHERS: readonly Piece[] = [
  { element: "printer", name: "Impressora", phrase: "A impressora" },
  { element: "tablet", name: "Tablet", phrase: "O tablet" },
  { element: "camera", name: "Câmera", phrase: "A câmera" },
];

/** etapas certas do caminho, na ordem, e quantos caminhos sem saída cada cruzamento tem */
const ROUTE_STEPS: readonly { id: string; piece: Piece; distractors: number }[] = [
  { id: "wifi", piece: { element: "wifi", name: "Wi-Fi", phrase: "O Wi-Fi" }, distractors: 2 },
  { id: "router", piece: { element: "router", name: "Roteador", phrase: "O roteador" }, distractors: 1 },
  { id: "internet", piece: { element: "internet", name: "Internet", phrase: "A internet" }, distractors: 2 },
];

export const INTERNET_ID = "internet";
export const START_ID = "start";
export const LAST_LAYER = ROUTE_STEPS.length + 1;

/** tamanho nativo dos sprites usados (px) — a cena amplia todos pelo mesmo fator */
const NATIVE: Partial<Record<ElementKey, [number, number]>> = {
  pc: [12, 15],
  notebook: [14, 11],
  cellphone: [9, 14],
  printer: [13, 11],
  tablet: [15, 18],
  camera: [15, 12],
  wifi: [15, 10],
  router: [16, 11],
  internet: [14, 14],
  server: [12, 12],
  serverError: [14, 14],
  box: [11, 11],
  webpage: [15, 13],
  mail: [15, 10],
};

/**
 * Unidades do kit por pixel nativo (o mesmo fator para todas as peças do mapa). 0.5 deixa espaço para a faixa de
 * instrução (StageBanner) e o cartão do destino no alto do palco sem apertar as três fileiras do mapa.
 */
export const PX = 0.5;
export const REQUEST_SIZE = 4;
export const RESPONSE_SIZE = 5.5;

export function spriteSize(element: ElementKey): number {
  return (NATIVE[element]?.[0] ?? 12) * PX;
}

/**
 * Largura em px para ícones fora do palco: a maior ampliação inteira (até ×3) que cabe em `maxW` × `maxH`.
 * Ex.: roteador 16×11 → ×3 (48 px); tablet 15×18 → ×2 (30 px), para os botões terem alturas parecidas.
 */
export function iconWidth(element: ElementKey, maxW = 48, maxH = 42): number {
  const [w, h] = NATIVE[element] ?? [12, 12];
  const scale = Math.max(1, Math.min(3, Math.floor(maxW / w), Math.floor(maxH / h)));
  return w * scale;
}

function spriteHeight(element: ElementKey): number {
  return (NATIVE[element]?.[1] ?? 12) * PX;
}

/* ───────── Layout (% do palco) ───────── */

/**
 * Faixa do alto do palco (conferido com o palco a 560 e 900 px de largura):
 * - StageBanner (y = 9, padrão do kit): de ~4% a ~14% da altura numa linha (textos de até ~34 caracteres);
 * - cartão do destino (DEST_Y): de ~15% a ~23%, logo abaixo da faixa ("um domínio aparece no topo");
 * - fileira de cima do mapa (ROWS[0]): o sprite mais alto (tablet) e a requisição parada em cima de uma peça
 *   começam abaixo de ~25%, sem encostar no cartão;
 * - fileira de baixo: a legenda do tablet termina antes de ~99%.
 */
export const COLS = [9, 29, 49, 69, 88] as const;
export const ROWS = [39, 61.5, 84] as const;
export const DEST_Y = 18.5;

export type MapNode = {
  id: string;
  /** 0 = início, 1..3 = etapas do caminho, 4 = servidores */
  layer: number;
  element: ElementKey;
  /** nome curto (rótulo e cadeia do caminho) */
  name: string;
  /** "O roteador", "A impressora"… para as frases de feedback */
  phrase: string;
  x: number;
  y: number;
  correct: boolean;
  ip?: string;
};

export type Mission = {
  destino: Destino;
  ip: string;
  start: MapNode;
  layers: MapNode[][];
  byId: Record<string, MapNode>;
};

/**
 * Cada camada fica na ordem do mapa (de cima para baixo). É a ordem do DOM: Tab, leitor de tela e a lista do painel
 * seguem o mapa e não entregam a resposta (a etapa certa era sempre a primeira montada).
 */
function byRow(nodes: MapNode[]): MapNode[] {
  return [...nodes].sort((a, b) => a.y - b.y);
}

/**
 * Partida. `session` (fixo na visita) sorteia o ponto de partida e `attempt` avança uma posição a cada "Jogar de novo":
 * o destino e a fileira do servidor certo sempre mudam na partida seguinte (sorteados por tentativa, repetiam em 1/4 e
 * 1/3 das vezes), como as variações do lab 2.3. O resto (aparelho, caminhos sem saída, fileiras, IPs) vem de `rand`.
 */
export function buildMission(rand: SeededRandom, session: SeededRandom, attempt: number): Mission {
  const destino = DESTINOS[(session.int(0, DESTINOS.length - 1, "destino") + attempt) % DESTINOS.length];
  const device = rand.pick(DEVICES, "aparelho");
  const pool = rand.shuffle([...OTHERS, ...DEVICES.filter((d) => d !== device)], "sem-saida");
  const start: MapNode = {
    id: START_ID,
    layer: 0,
    element: device.element,
    name: device.own,
    phrase: device.phrase,
    x: COLS[0],
    y: ROWS[1],
    correct: true,
  };
  const layers: MapNode[][] = [[start]];
  let used = 0;

  ROUTE_STEPS.forEach((step, index) => {
    const layer = index + 1;
    const rows = rand.shuffle([0, 1, 2], `linhas-${layer}`);
    const wrong = pool.slice(used, used + step.distractors);
    used += step.distractors;
    const options = [
      { id: step.id, piece: step.piece, correct: true },
      ...wrong.map((piece) => ({ id: piece.element, piece, correct: false })),
    ];
    layers.push(
      byRow(
        options.map((option, k) => ({
          id: option.id,
          layer,
          element: option.piece.element,
          name: option.piece.name,
          phrase: option.piece.phrase,
          x: COLS[layer],
          y: ROWS[rows[k]],
          correct: option.correct,
        })),
      ),
    );
  });

  const ips = rand.shuffle(SERVER_IPS, "ips");
  const ip = ips[(session.int(0, SERVER_IPS.length - 1, "servidor") + attempt) % SERVER_IPS.length];
  layers.push(
    SERVER_LETTERS.map((letter, k) => ({
      id: `servidor-${letter}`,
      layer: LAST_LAYER,
      element: "server" as const,
      name: `Servidor ${letter}`,
      phrase: `O servidor ${letter}`,
      x: COLS[LAST_LAYER],
      y: ROWS[k],
      correct: ips[k] === ip,
      ip: ips[k],
    })),
  );

  const byId: Record<string, MapNode> = {};
  for (const node of layers.flat()) byId[node.id] = node;
  return { destino, ip, start, layers, byId };
}

/* ───────── Estado da partida ───────── */

export type Phase = "intro" | "choose" | "going" | "blocked" | "returning" | "responding" | "page";

/** fases em que a requisição está num cruzamento (escolhendo, indo ou voltando) */
export const JUNCTION_PHASES: readonly Phase[] = ["choose", "going", "blocked", "returning"];

/** uma viagem da requisição: descanso, ida a uma etapa ou volta ao último ponto seguro */
export type Trip = {
  id: number;
  kind: "rest" | "go" | "back";
  target: string;
  path: ScenePoint[];
  durationMs: number;
  blocked: boolean;
};

/* ───────── Pontos de passagem da requisição ───────── */

export function center(node: MapNode): ScenePoint {
  return { x: node.x, y: node.y };
}

/** onde a requisição descansa: logo acima do sprite do ponto seguro */
export function restPoint(node: MapNode): ScenePoint {
  const lift = (spriteHeight(node.element) / 2 + REQUEST_SIZE / 2 + 1.1) * DEFAULT_RATIO;
  return { x: node.x, y: node.y - lift };
}

export function travelMs(path: ScenePoint[], perUnit: number): number {
  return Math.round(pathLength(path) * perUnit);
}

/* ───────── Textos ───────── */

/** "O roteador" -> "o roteador" (meio da frase) */
export function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

/**
 * Falas do Bonzi: a instrução do momento, a mesma ideia da faixa do palco, uma vez por momento.
 * Painel Feedback: o resultado da última ação ou o "como fazer" em detalhe, nunca a faixa repetida.
 */
export const TEXT = {
  // Bonzi
  intro: 'Sua missão: levar a requisição até o servidor certo. Toque em "Receber destino".',
  received: (domain: string) => `Destino: ${domain}! Agora escolha por onde a requisição passa primeiro.`,
  right: "Caminho certo! Qual é a próxima etapa?",
  ipFound: (domain: string, ip: string) => `O domínio ${domain} aponta para o IP ${ip}. Qual servidor tem esse IP?`,
  wrongPath: (phrase: string) => `${phrase} não leva ao servidor. A requisição volta ao último ponto seguro.`,
  wrongServer: "Esse servidor tem outro IP. A requisição volta ao último ponto seguro.",
  help: "Vou ajudar: siga a seta até o próximo passo.",
  server: (domain: string) => `Você encontrou o servidor de ${domain}!`,
  page: "O servidor respondeu e a página apareceu!",

  // painel Feedback
  introHint: 'Toque no botão "Receber destino" ou no seu aparelho, lá no mapa.',
  chooseHint: "Toque na próxima etapa do caminho, no mapa ou na lista.",
  going: (node: MapNode) => `A requisição está indo para ${lowerFirst(node.phrase)}.`,
  rightFeedback: "Caminho certo! Ele fica iluminado. Toque na próxima etapa.",
  ipFeedback: (ip: string) => `Agora toque no servidor que tem o IP ${ip}.`,
  /** a requisição voltou ao ponto seguro: a criança escolhe de novo */
  retry: "A requisição voltou ao último ponto seguro. Toque em outra etapa.",
  retryServer: (ip: string) => `Tente outro servidor. Compare o IP embaixo de cada um com ${ip}.`,
  helpFeedback: "A seta mostra o próximo passo. Toque nessa etapa.",
  serverFeedback: "Servidor certo! Veja a resposta voltar até você.",
  pageFeedback: (device: string, domain: string) => `${device} recebeu a página de ${domain}.`,
} as const;

/* ───────── Faixa de instrução do palco (StageBanner) ───────── */

/** o que fazer AGORA, até ~34 caracteres (uma linha no palco a partir de ~560 px) */
export type BannerSpec = { text: string; tone: KitTone; icon: ElementKey };

/** etapas certas até o servidor (contador da faixa: "1 de 4") */
export const ROUTE_TOTAL = LAST_LAYER;

export const BANNER = {
  receive: { text: "Aperte Receber destino", tone: "info", icon: "mail" } as BannerSpec,
  choose: (n: number): BannerSpec => ({ text: `Escolha a próxima etapa: ${n} de ${ROUTE_TOTAL}`, tone: "info", icon: "pin" }),
  /** de volta ao ponto seguro depois de um caminho sem saída */
  back: { text: "Voltou! Escolha outra etapa", tone: "warning", icon: "box" } as BannerSpec,
  /** amarelo, como o IP no cartão do destino */
  findServer: (ip: string): BannerSpec => ({ text: `Ache o servidor do IP ${ip}`, tone: "warning", icon: "server" }),
  backServer: (ip: string): BannerSpec => ({ text: `Voltou! Ache o IP ${ip}`, tone: "warning", icon: "server" }),
  /** ajuda do Bonzi ligada: a seta mostra a direção do próximo passo */
  follow: { text: "Siga a seta do Bonzi", tone: "info", icon: "pin" } as BannerSpec,
  watch: { text: "Olhe a requisição!", tone: "info", icon: "box" } as BannerSpec,
  deadEnd: { text: "Sem saída! Voltando...", tone: "danger", icon: "error" } as BannerSpec,
  wrongServer: { text: "Outro IP! Voltando...", tone: "danger", icon: "serverError" } as BannerSpec,
  responding: { text: "Servidor certo! Olhe a resposta", tone: "success", icon: "server" } as BannerSpec,
  page: { text: "Página carregada!", tone: "success", icon: "ok" } as BannerSpec,
  // respostas a toques fora de hora (nenhum toque fica sem resposta)
  wait: { text: "Espere a requisição", tone: "warning", icon: "box" } as BannerSpec,
  tried: { text: "Sem saída. Tente outra etapa", tone: "warning", icon: "error" } as BannerSpec,
  triedServer: { text: "Esse tem outro IP. Tente outro", tone: "warning", icon: "serverError" } as BannerSpec,
};

/** o mesmo lembrete pedido de novo dentro deste tempo não recomeça a fala do Bonzi (só a faixa salta de novo) */
export const REPEAT_LINE_MS = 4000;

/* ───────── Tempos ───────── */

/**
 * Números = animação (encurtada com movimento reduzido); wrongHold e finishHold são pausas de leitura
 * (timers com `hold`, mantidas com movimento reduzido).
 */
export const TIMING = {
  /** ms por unidade de caminho da requisição */
  requestPerUnit: 40,
  /** ms por unidade de caminho da resposta do servidor */
  responsePerUnit: 34,
  /** pausa no caminho sem saída antes de voltar */
  wrongHold: 1300,
  /** barra de carregamento do navegador antes da página aparecer */
  pageLoading: 700,
  /** tempo com a página na tela antes da conclusão */
  finishHold: 4200,
} as const;

/**
 * Erros totais a partir dos quais o Bonzi pode mostrar a direção do próximo passo. A seta só aparece no cruzamento em
 * que a criança acabou de errar: num cruzamento novo ela sempre tenta sozinha primeiro.
 */
export const HELP_AFTER = 2;
