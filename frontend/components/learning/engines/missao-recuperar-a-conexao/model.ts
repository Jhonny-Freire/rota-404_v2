import type { ElementKey } from "@/config/assets";
import { pathLength, type KitTone, type LinkState, type PlaceAnchor, type ScenePoint } from "@/components/learning/kit";

/** Falhas possíveis (lab1-4.md, Etapa 3). O id da falha é também o id da ação que a corrige. */
export type FaultId = "wifi" | "cable" | "router" | "target";
/** Componentes que o aluno pode investigar (Etapa 2). */
export type PartId = "pc" | "wifi" | "router" | "internet";
export type SegmentId = "pc-wifi" | "pc-printer" | "wifi-router" | "router-cable" | "cable-internet" | "internet-site";

export const FAULTS: readonly FaultId[] = ["wifi", "cable", "router", "target"];
export const PARTS: readonly PartId[] = ["pc", "wifi", "router", "internet"];

/** Cada falha mora em um componente diferente. */
export const FAULT_PART: Record<FaultId, PartId> = {
  target: "pc",
  wifi: "wifi",
  router: "router",
  cable: "internet",
};

/** Sprite do palco em que cada ação mexe (o cabo é do componente "internet"). */
export const TOOL_SPRITE: Record<FaultId, "pc" | "wifi" | "router" | "cable"> = {
  target: "pc",
  wifi: "wifi",
  router: "router",
  cable: "cable",
};

export const PART_NAME: Record<PartId, string> = {
  pc: "Computador",
  wifi: "Wi-Fi",
  router: "Roteador",
  internet: "Internet",
};

/** Resultado da investigação da peça com falha (painel Feedback). */
export const FAULT_TEXT: Record<FaultId, string> = {
  wifi: "Wi-Fi desligado.",
  cable: "Cabo desconectado.",
  router: "Roteador fora da rede de casa.",
  target: "Conexão apontando para o lugar errado: o computador está ligado na impressora.",
};

/** Selo vermelho que fica embaixo da peça com falha (embaixo do nome dela). */
export const FAULT_TAG: Record<FaultId, string> = {
  wifi: "Desligado",
  cable: "Cabo solto",
  router: "Fora de casa",
  target: "Na impressora",
};

/** Ações de correção: verbo curto + ícone da peça. `native` = largura nativa do sprite (ícone exibido em ×2). */
export const TOOLS: Record<FaultId, { label: string; element: ElementKey; native: number }> = {
  wifi: { label: "Ligar o Wi-Fi", element: "wifi", native: 15 },
  cable: { label: "Encaixar o cabo", element: "cable", native: 16 },
  router: { label: "Trazer o roteador para casa", element: "router", native: 16 },
  target: { label: "Ligar o PC no Wi-Fi", element: "pc", native: 12 },
};

/**
 * Falas do Bonzi: a instrução do momento (a mesma ideia da faixa do palco).
 * Mensagens do painel Feedback: só resultados (o que aconteceu), nunca a instrução repetida.
 */
export const TEXT = {
  intro: "A conexão quebrou. Encontre o problema. Comece apertando Ligar conexão.",
  watch: "Olhe o pacote. Onde ele para?",
  rewatch: "Olhe o pacote. Agora ele chega ao site?",
  investigate: "O pacote parou! Toque nas peças para investigar.",
  sameStopLook: "Parou no mesmo lugar. Toque nas peças para investigar.",
  sameStopFix: "Parou no mesmo lugar. Escolha uma ação para consertar.",
  found: "Achou a peça com problema! Agora escolha uma ação para consertar.",
  retest: "Funcionou? Aperte Ligar conexão para testar de novo.",
  tryOther: "Não resolveu. Tente outra ação.",
  success: "Achou o problema!",
  // painel Feedback (resultados)
  start: "O computador não consegue abrir o site.",
  stopped: "O pacote parou antes de chegar ao site.",
  sameStop: "O pacote parou no mesmo lugar.",
  chose: "Você escolheu:",
  error: "Isso mudou a rede, mas a conexão ainda não funciona.",
  arrived: "O pacote atravessou a rede e chegou ao site.",
  site: "O site é o destino do pacote.",
  printer: "A impressora não está no caminho até o site.",
} as const;

/** Faixa de instrução no alto do palco (StageBanner). */
export type BannerSpec = { text: string; tone: KitTone; icon: ElementKey };

type BannerKey =
  | "start"
  | "watch"
  | "found"
  | "sameStop"
  | "ready"
  | "failed"
  | "success"
  | "waitPacket"
  | "waitAction"
  | "pressFirst"
  | "pressNow"
  | "tried";

export const BANNER: Record<BannerKey, BannerSpec> = {
  start: { text: "Aperte Ligar conexão", tone: "info", icon: "box" },
  watch: { text: "Olhe o pacote!", tone: "info", icon: "box" },
  found: { text: "Achou! Agora conserte.", tone: "success", icon: "magnifier" },
  // testou de novo sem consertar (a peça com problema já foi achada)
  sameStop: { text: "Parou de novo. Escolha uma ação", tone: "warning", icon: "error" },
  ready: { text: "Funcionou? Teste de novo!", tone: "warning", icon: "box" },
  failed: { text: "Não resolveu. Tente outra ação", tone: "danger", icon: "error" },
  success: { text: "Conexão recuperada!", tone: "success", icon: "ok" },
  // respostas a toques fora de hora (nenhum toque fica sem resposta)
  pressFirst: { text: "Primeiro aperte Ligar conexão", tone: "warning", icon: "box" },
  waitPacket: { text: "Espere o pacote", tone: "warning", icon: "box" },
  waitAction: { text: "Espere um instante", tone: "warning", icon: "magnifier" },
  pressNow: { text: "Agora aperte Ligar conexão", tone: "warning", icon: "box" },
  tried: { text: "Essa não resolveu. Tente outra", tone: "warning", icon: "error" },
};

/** Contador da investigação: "Toque nas peças: 1 de 4". */
export const checkedBanner = (checked: number): BannerSpec => ({
  text: `Toque nas peças: ${checked} de ${PARTS.length}`,
  tone: "info",
  icon: "magnifier",
});

export const TIMING = {
  /** ms por unidade de caminho do pacote principal */
  packetPerUnit: 34,
  /** viagem mínima do pacote (dá tempo de olhar para o palco depois de apertar o botão) */
  minTravel: 1700,
  /** pausa com o pacote parado na falha antes da próxima instrução (mantida com movimento reduzido) */
  stopHold: 1000,
  /** brilho da peça investigada enquanto a animação curta roda */
  inspectHold: 1900,
  /** animação da ação de correção */
  action: 1000,
  /** pausa antes da tela de conclusão */
  finishHold: 2600,
  /** deslocamento do roteador/cabo ao serem consertados */
  move: 800,
} as const;

/** 1% da altura do canvas 16:9 em unidades do kit (1 = 1% da largura). */
export const VU = 9 / 16;

/** Tamanho nativo (px) dos sprites do palco: [largura, altura]. */
const NATIVE = {
  pc: [12, 15],
  printer: [13, 11],
  wifi: [15, 10],
  router: [16, 11],
  cable: [16, 11],
  internet: [14, 14],
  webpage: [15, 13],
} as const satisfies Record<string, readonly [number, number]>;

export type SpriteId = keyof typeof NATIVE;

/** Escala única do palco: unidades do kit por pixel nativo (todas as peças com o mesmo tamanho de pixel). */
const PIXEL = 0.5;

/** Largura do sprite em unidades do kit. */
export const spriteSize = (id: SpriteId) => NATIVE[id][0] * PIXEL;
/** Altura/largura nativa do sprite. */
export const spriteAspect = (id: SpriteId) => NATIVE[id][1] / NATIVE[id][0];
/** Meia altura do sprite em % do canvas. */
const halfHeight = (id: SpriteId) => (NATIVE[id][1] * PIXEL) / 2 / VU;

/**
 * Fileira do caminho (y em % do canvas), na ordem da aula 1.2: Computador → Wi-Fi → Roteador → Cabo → Internet → Site.
 * Medidas conferidas com o palco a 560 e 900 px, contando o anel verde/vermelho do kit (0,7u + 4 px em volta do sprite):
 * acima da fileira cabem a faixa, o nome da rede de casa e a impressora (com anel e legenda) sem encostar no anel do
 * computador; abaixo, as legendas, o selo vermelho e (na falha do roteador) o roteador fora de casa com anel, legenda e selo.
 */
const ROW = 53.5;

/** Área tracejada da rede de casa (% do canvas): só computador, impressora, Wi-Fi e roteador. O topo fica livre para a faixa. */
export const ZONE = { left: 1.5, top: 19.5, width: 49.5, height: 54.4 } as const;

export const POS = {
  pc: { x: 12.5, y: ROW },
  wifi: { x: 28, y: ROW },
  router: { x: 43, y: ROW },
  plug: { x: 58.5, y: ROW },
  internet: { x: 74, y: ROW },
  // um pouco mais longe da Internet: os selos dos dois ("Cabo solto" e "Sem conexão") ficam lado a lado
  site: { x: 90.5, y: ROW },
  // dentro de casa, logo acima do computador (embaixo da fileira fica o lado de fora da casa)
  printer: { x: 12.5, y: 32 },
  // fora de casa: bem abaixo do lugar dele na fileira, depois da parede de baixo (o anel vermelho não encosta nela)
  routerOut: { x: 43, y: 82.1 },
  // o plugue sai da tomada e pende logo abaixo da fileira; a queda é rasa para o cabo não encostar na legenda do roteador
  loose: { x: 61, y: ROW + 11 },
} satisfies Record<string, ScenePoint>;

/** Lugar vazio do roteador na fileira (contorno tracejado), em unidades do kit. */
export const SLOT = { width: spriteSize("router") + 2, height: spriteSize("router") * spriteAspect("router") + 2 } as const;

export type NetFlags = { wifiOn: boolean; routerIn: boolean; plugged: boolean; aimWifi: boolean };

export function flagsFor(fault: FaultId, fixed: boolean): NetFlags {
  return {
    wifiOn: fault !== "wifi" || fixed,
    routerIn: fault !== "router" || fixed,
    plugged: fault !== "cable" || fixed,
    aimWifi: fault !== "target" || fixed,
  };
}

export const routerPos = (f: NetFlags): ScenePoint => (f.routerIn ? POS.router : POS.routerOut);
export const cablePos = (f: NetFlags): ScenePoint => (f.plugged ? POS.plug : POS.loose);

export const SEGMENTS: readonly SegmentId[] = ["pc-wifi", "pc-printer", "wifi-router", "router-cable", "cable-internet", "internet-site"];

export const FULL_SEGMENTS: readonly SegmentId[] = ["pc-wifi", "wifi-router", "router-cable", "cable-internet", "internet-site"];

/** As linhas do roteador ficam sempre na fileira: sem roteador, elas chegam ao lugar vazio dele (e ficam desligadas). */
export function segmentEnds(id: SegmentId, f: NetFlags): [ScenePoint, ScenePoint] {
  switch (id) {
    case "pc-wifi":
      return [POS.pc, POS.wifi];
    case "pc-printer":
      return [POS.pc, POS.printer];
    case "wifi-router":
      return [POS.wifi, POS.router];
    case "router-cable":
      return [POS.router, cablePos(f)];
    case "cable-internet":
      return [cablePos(f), POS.internet];
    case "internet-site":
      return [POS.internet, POS.site];
  }
}

/** Estado da linha sem teste em andamento (null = linha não existe). */
export function baseLinkState(id: SegmentId, f: NetFlags): LinkState | null {
  switch (id) {
    case "pc-wifi":
      if (!f.aimWifi) return null;
      return f.wifiOn ? "idle" : "off";
    case "pc-printer":
      return f.aimWifi ? null : "idle";
    case "wifi-router":
      return f.wifiOn && f.routerIn ? "idle" : "off";
    case "router-cable":
      return f.routerIn ? "idle" : "off";
    case "cable-internet":
      return f.plugged ? "idle" : null;
    case "internet-site":
      return "idle";
  }
}

export const FULL_PATH: ScenePoint[] = [POS.pc, POS.wifi, POS.router, POS.plug, POS.internet, POS.site];

/** Caminho do pacote quando a falha ainda existe: para no ponto da falha. */
export const FAILURE: Record<FaultId, { path: ScenePoint[]; traversed: readonly SegmentId[]; failing: SegmentId }> = {
  // para no Wi-Fi desligado
  wifi: { path: [POS.pc, POS.wifi], traversed: [], failing: "pc-wifi" },
  // chega ao lugar vazio do roteador e para ali
  router: { path: [POS.pc, POS.wifi, POS.router], traversed: ["pc-wifi"], failing: "wifi-router" },
  // desce pelo cabo até o plugue solto
  cable: {
    path: [POS.pc, POS.wifi, POS.router, POS.loose],
    traversed: ["pc-wifi", "wifi-router", "router-cable"],
    failing: "cable-internet",
  },
  // sobe para a impressora
  target: { path: [POS.pc, POS.printer], traversed: ["pc-printer"], failing: "pc-printer" },
};

/** Folga (% da altura) entre o ponto do Place e a ponta do rabicho do balão (12 px do kit). */
const TAIL = 3;
/** Espaço da legenda embaixo do sprite (% da altura), no palco de 560 px, onde a fonte mínima a deixa mais alta. */
const LABEL_SPACE = 6.6;

/**
 * Balão de erro junto da peça com problema, com o rabicho apontando para ela. Nas falhas do Wi-Fi, do roteador e do
 * cabo o pacote para na própria peça ("Parou aqui!"). Na falha do computador o pacote vai até a impressora, mas o
 * problema é o computador (é nele que se conserta): o balão fica nele (revisão de 23/10/2026: na impressora, as
 * crianças achavam que a impressora estava quebrada).
 * Cada lugar foi escolhido no espaço livre ao redor da fileira, sem cobrir legendas, selos, linhas nem a parede da casa.
 */
export const STOP_CALLOUT: Record<FaultId, { at: ScenePoint; anchor: PlaceAnchor; tail: "left" | "up" | "down"; text: string }> = {
  // acima do Wi-Fi, um pouco à direita para não encostar na legenda da impressora e um pouco mais alto para não
  // encostar no anel do roteador já investigado
  wifi: { at: { x: POS.wifi.x + 2, y: POS.wifi.y - halfHeight("wifi") - TAIL - 1 }, anchor: "bottom", tail: "down", text: "Parou aqui!" },
  // acima do lugar vazio, um pouco à esquerda para não encostar na parede da casa
  router: { at: { x: POS.router.x - 1.5, y: POS.router.y - SLOT.height / 2 / VU - TAIL }, anchor: "bottom", tail: "down", text: "Parou aqui!" },
  // embaixo da legenda do cabo solto: acima ficaria entre as linhas, à direita sobre o selo da Internet
  cable: { at: { x: POS.loose.x, y: POS.loose.y + halfHeight("cable") + LABEL_SPACE + TAIL }, anchor: "top", tail: "up", text: "Parou aqui!" },
  // à direita do computador, acima do Wi-Fi e abaixo da legenda da impressora: o rabicho chega perto do anel dele
  target: {
    at: { x: POS.pc.x + spriteSize("pc") / 2 + 3.25, y: POS.pc.y - halfHeight("pc") - 3 },
    anchor: "left",
    tail: "left",
    text: "Caminho errado!",
  },
};

export const travelMs = (path: ScenePoint[]) =>
  Math.max(TIMING.minTravel, Math.round(pathLength(path) * TIMING.packetPerUnit));
