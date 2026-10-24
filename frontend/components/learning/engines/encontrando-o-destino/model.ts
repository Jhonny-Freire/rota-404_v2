import type { ElementKey } from "@/config/assets";
import { lerpPoint, pathLength, type KitTone, type ScenePoint, type SeededRandom } from "@/components/learning/kit";

/** Servidores do mapa (lab2-3.md, "Tela"). */
export type ServerId = "A" | "B" | "C";
export type Server = { id: ServerId; name: string; ip: string };

export const SERVERS: Record<ServerId, Server> = {
  A: { id: "A", name: "Servidor A", ip: "203.0.113.10" },
  B: { id: "B", name: "Servidor B", ip: "203.0.113.20" },
  C: { id: "C", name: "Servidor C", ip: "203.0.113.30" },
};

/** Domínio fictício; `w`/`h` = tamanho nativo do sprite (px). */
export type SiteDomain = { id: string; name: string; element: ElementKey; w: number; h: number };

export const DOMAIN_POOL: readonly SiteDomain[] = [
  { id: "fotos", name: "fotos.exemplo", element: "photo", w: 13, h: 11 },
  { id: "musica", name: "musica.exemplo", element: "microphone", w: 9, h: 16 },
  { id: "cartas", name: "cartas.exemplo", element: "mail", w: 15, h: 10 },
  { id: "videos", name: "videos.exemplo", element: "camera", w: 15, h: 12 },
  { id: "robos", name: "robos.exemplo", element: "robot", w: 17, h: 16 },
];

/** Domínios por partida: cada servidor recebe um. */
export const ROUNDS = 3;

export type Round = { domain: SiteDomain; server: Server };

export type Match = {
  /** ordem em que os domínios chegam (= ordem no painel) */
  rounds: Round[];
  /** servidores da esquerda para a direita no mapa (= ordem do Tab) */
  columns: ServerId[];
  positions: Record<ServerId, ScenePoint>;
};

/**
 * arriving: o domínio chega (Etapa 1) · waiting: espera o toque no domínio (Etapa 2) · lookup: procurando o endereço ·
 * choose: escolher o servidor (Etapa 3) · testing: a conexão viaja (Etapa 4) · connected: acertou, pausa de leitura ·
 * done: todos os domínios ligados, espera a tela de conclusão.
 */
export type Phase = "arriving" | "waiting" | "lookup" | "choose" | "testing" | "connected" | "done";

/**
 * Uma tentativa de conexão. `path`/`durationMs` são iguais em forma para o servidor certo e o errado (os dois saem do
 * domínio e passam pelo endereço): nada no palco entrega o resultado antes de o pacote chegar ou parar.
 */
export type TestRun = {
  run: number;
  server: ServerId;
  ok: boolean;
  status: "travel" | "failed" | "ok";
  path: ScenePoint[];
  durationMs: number;
};

/* ───────── Palco: coordenadas em % do SceneCanvas; tamanhos de sprite em unidades do kit (% da largura) ───────── */

/** As duas áreas tracejadas começam abaixo da faixa de instrução (StageBanner ocupa de 0 a ~17% da altura). */
export const ZONE = { top: 19, bottom: 96 } as const;
export const SITE_ZONE = { left: 2.5, width: 27 } as const;
export const MAP_ZONE = { left: 33, width: 64.5 } as const;

/** Domínio no alto da área do site; o endereço embaixo dele: a linha desce do nome até o endereço. */
export const DOMAIN_POINT: ScenePoint = { x: 16, y: 40 };
export const ADDRESS_POINT: ScenePoint = { x: 16, y: 75 };
export const DOMAIN_HEIGHT = 9;
export const ADDRESS_HEIGHT = 6.5;
export const SERVER_SIZE = 8;
export const LABEL_GAP = 2;
/** espessura das linhas (unidades do kit) */
export const LINE = 1;
/** ponto (fração da linha endereço → servidor) em que o pacote para quando o servidor está errado: antes do X da quebra */
export const FAIL_STOP = 0.36;

/**
 * Lugares dos servidores no mapa (perto em cima, meio embaixo, longe em cima). Conferido com o palco a 560 e 828 px:
 * a linha que sai do endereço até o servidor mais distante passa por baixo do nome do servidor de cima e por cima do IP
 * do servidor de baixo, então nenhuma linha atravessa outro servidor (num zigue-zague com os dois de baixo na mesma
 * fileira do endereço, a linha até o mais distante cruzaria o do meio).
 */
const SPOTS: readonly ScenePoint[] = [
  { x: 42, y: 38 },
  { x: 65, y: 75 },
  { x: 88, y: 42 },
];

/** Título "Site N de 3": no meio da borda de cima da área do site. */
export const SITE_TITLE_X = SITE_ZONE.left + SITE_ZONE.width / 2;
/** Título "Mapa": no meio da borda de cima, entre os dois servidores de cima. */
export const MAP_TITLE_X = 65;

const RATIO = 16 / 9;

/** Metade da altura (em % da altura do canvas) de um sprite com `height` unidades do kit. */
export function halfHeight(height: number): number {
  return (height / 2) * RATIO;
}

/** Largura (unidades do kit) para o sprite ficar com `height` de altura. */
export function widthFor(height: number, w: number, h: number): number {
  return (height * w) / h;
}

/**
 * Ponta direita da seta que aponta para o domínio (x em %): fica fora do sprite mesmo no maior pulso do kit (escala 1,1)
 * e fora do anel de seleção.
 */
export function pointerTip(domain: SiteDomain): number {
  return DOMAIN_POINT.x - (widthFor(DOMAIN_HEIGHT, domain.w, domain.h) * 1.1) / 2 - 1.2;
}

const PERMS: ServerId[][] = [
  ["A", "B", "C"],
  ["A", "C", "B"],
  ["B", "A", "C"],
  ["B", "C", "A"],
  ["C", "A", "B"],
  ["C", "B", "A"],
];

/**
 * Partida (lab2-3.md, "Variações"): troca a posição dos servidores e a ordem dos domínios.
 * `session` sorteia o ponto de partida da visita; `attempt` avança as permutações, então cada "Jogar de novo" muda
 * qual servidor fica em cada lugar e qual domínio mora em cada servidor. `rand` (por tentativa) sorteia os domínios
 * e um pequeno deslocamento dos servidores.
 */
export function buildMatch(session: SeededRandom, rand: SeededRandom, attempt: number): Match {
  const columns = PERMS[(session.int(0, PERMS.length - 1, "colunas") + attempt) % PERMS.length];
  const owners = PERMS[(session.int(0, PERMS.length - 1, "donos") + attempt * 5) % PERMS.length];
  const domains = rand.shuffle(DOMAIN_POOL, "dominios").slice(0, ROUNDS);
  const positions = {} as Record<ServerId, ScenePoint>;
  columns.forEach((id, i) => {
    positions[id] = { x: SPOTS[i].x + rand.int(-10, 10, `x${i}`) / 10, y: SPOTS[i].y };
  });
  return {
    rounds: domains.map((domain, i) => ({ domain, server: SERVERS[owners[i]] })),
    columns,
    positions,
  };
}

/**
 * Caminho do pacote: domínio → endereço → servidor. No servidor errado ele para no começo da linha até o servidor
 * (antes do X da quebra), "a conexão falha" (lab2-3.md, Etapa 4).
 */
export function testPath(target: ScenePoint, ok: boolean): ScenePoint[] {
  return [DOMAIN_POINT, ADDRESS_POINT, ok ? target : lerpPoint(ADDRESS_POINT, target, FAIL_STOP)];
}

/**
 * Falas do Bonzi: a instrução do momento (a mesma ideia da faixa do palco).
 * Painel Feedback: o resultado da última ação ou o "como fazer" em detalhe, nunca a faixa repetida.
 */
export const TEXT = {
  /** lab2-3.md, Etapa 1 */
  find: "Encontre onde este site está.",
  nextSite: "Chegou outro site! Encontre onde ele está.",
  whichServer: "Qual servidor tem este endereço?",
  retry: "A conexão falhou. Tente outro servidor.",
  connectedSay: "Isso! Você encontrou o destino.",
  /** rodada intermediária: avisa que a próxima chega sozinha (não há botão para apertar) */
  connectedNext: "Isso! Você encontrou o destino. Lá vem outro site!",
  /** lab2-3.md, "Objetivo didático" */
  final: "O nome do site e o endereço usado na rede são coisas diferentes.",

  // painel Feedback
  tapHint: (domain: string) =>
    `${domain} é o nome do site. Toque nele, no palco ou na lista de domínios, para descobrir o endereço IP.`,
  lookup: "A rede está procurando o endereço IP que pertence a este nome.",
  compare: (domain: string, ip: string) =>
    `O endereço de ${domain} é ${ip}. Compare com o IP escrito em cima de cada servidor do mapa.`,
  chose: (server: Server) => `Você escolheu o ${server.name}. Veja se a conexão chega até ele.`,
  /** lembra o endereço procurado sem apontar o servidor certo */
  failed: (server: Server, target: string) =>
    `A conexão falhou: o ${server.name} tem o endereço ${server.ip}, e não ${target}. Toque em outro servidor.`,
  connected: (domain: string, server: Server) => `Conectado! ${domain} está no ${server.name}, endereço ${server.ip}.`,
  allDone: "Todos os domínios estão ligados aos seus servidores.",
};

/** Faixa de instrução no alto do palco (StageBanner): o que fazer agora, até ~36 caracteres. */
export type BannerSpec = { text: string; tone: KitTone; icon: ElementKey };

const spec = (text: string, tone: KitTone, icon: ElementKey): BannerSpec => ({ text, tone, icon });

export const BANNER = {
  tapDomain: (domain: SiteDomain) => spec(`Toque no domínio ${domain.name}`, "info", "webpage"),
  lookup: spec("Procurando o endereço...", "info", "magnifier"),
  /** amarelo, como o selo do IP procurado */
  findServer: (ip: string) => spec(`Toque no servidor com IP ${ip}`, "warning", "server"),
  connecting: spec("Conectando...", "info", "box"),
  failed: spec("Não é esse. Tente outro servidor", "danger", "error"),
  connected: spec("Conectado!", "success", "ok"),
  connectedNext: spec("Conectado! Lá vem outro site", "success", "ok"),
  done: spec("Todos os sites encontrados!", "success", "ok"),
  // respostas a toques fora de hora (nenhum toque fica sem resposta)
  domainFirst: (domain: SiteDomain) => spec(`Primeiro toque em ${domain.name}`, "warning", "webpage"),
  wait: spec("Espere um instante", "warning", "magnifier"),
  waitConnection: spec("Espere a conexão", "warning", "box"),
  tried: spec("Esse já foi testado. Tente outro", "warning", "error"),
};

/** Texto da faixa dito pelo Bonzi num lembrete: termina com pontuação de frase. */
export function spokenBanner(banner: BannerSpec): string {
  return /[.!?]$/.test(banner.text) ? banner.text : `${banner.text}.`;
}

/**
 * Números = animação (encurtada com movimento reduzido); os timers com `hold` (lookup e pausas) são pausas de leitura,
 * mantidas com movimento reduzido. Pausas que esperam uma fala do Bonzi: ~65 ms por caractere.
 */
export const TIMING = {
  /** o domínio desliza para dentro do palco */
  arrive: 650,
  /** "Procurando o endereço...": o momento em que nome vira endereço (hold) */
  lookup: 1100,
  /** ms por unidade de caminho do pacote (o servidor mais longe leva mais tempo) */
  packetPerUnit: 22,
  /** viagem mínima do pacote */
  minTravel: 800,
  /** folga entre a chegada do pacote e o resultado */
  settle: 80,
  /** a linha quebrada fica no mapa antes de sumir (hold) */
  failHold: 1700,
  /** "Isso! Você encontrou o destino. Lá vem outro site!" (50 caracteres) antes do próximo domínio (hold) */
  connectedHold: 3300,
  /** último site: "Isso! Você encontrou o destino." (31 caracteres) antes da fala final (hold) */
  lastHold: 2200,
  /** fala final do Bonzi (63 caracteres) antes da tela de conclusão (hold) */
  finishHold: 4800,
};

export const travelMs = (path: ScenePoint[]) =>
  Math.max(TIMING.minTravel, Math.round(pathLength(path) * TIMING.packetPerUnit));

/** a mesma fala pedida de novo dentro deste tempo não recomeça (só a faixa salta de novo) */
export const REPEAT_LINE_MS = 4000;

export const DOMAIN_SELECTOR = '[data-focus="domain"] button';

export function serverSelector(id: ServerId): string {
  return `[data-server="${id}"] button`;
}
