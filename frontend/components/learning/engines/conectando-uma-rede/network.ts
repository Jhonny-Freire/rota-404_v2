import type { ElementKey } from "@/config/assets";
import type { ScenePoint } from "@/components/learning/kit";

export type NodeId = "pc" | "phone" | "wifi" | "router" | "internet";
export type SlotId = "s0" | "s1" | "s2" | "s3" | "s4" | "s5";
/** ligação sem direção: "a|b" com os ids em ordem alfabética */
export type EdgeKey = string;

/** rank = posição no caminho até a internet (dispositivo 0 → internet 3) */
export const NODES: Record<NodeId, { label: string; element: ElementKey; rank: number }> = {
  pc: { label: "Computador", element: "pc", rank: 0 },
  phone: { label: "Celular", element: "cellphone", rank: 0 },
  wifi: { label: "Wi-Fi", element: "wifi", rank: 1 },
  router: { label: "Roteador", element: "router", rank: 2 },
  internet: { label: "Internet", element: "internet", rank: 3 },
};

export type Variant = {
  id: string;
  /** peças que aparecem à esquerda */
  pieces: NodeId[];
  /** dispositivos que precisam chegar à internet */
  devices: NodeId[];
};

/**
 * Sempre UM aparelho + Wi-Fi + Roteador + Internet (decisão da equipe, 23/10/2026: com dois aparelhos, ou sem o Wi-Fi,
 * as crianças se confundiam). A variação é só o aparelho.
 */
export const VARIANTS: Variant[] = [
  { id: "computador", pieces: ["pc", "wifi", "router", "internet"], devices: ["pc"] },
  { id: "celular", pieces: ["phone", "wifi", "router", "internet"], devices: ["phone"] },
];

export const AREA_ZONE = "area";

/** espaço da área "Monte a rede": `stage` = lugar no caminho (0 aparelhos, 1 Wi-Fi, 2 roteador, 3 internet) */
export type Slot = { id: SlotId; x: number; y: number; name: string; stage: number };

export type Layout = { slots: Slot[]; columns: { stage: number; x: number }[] };

/** colunas da esquerda (aparelho) para a direita (internet), abaixo da faixa de instrução (% do palco) */
const COLUMN_X0 = 38;
const COLUMN_X1 = 89;
const ROW_Y = 58;

/**
 * A área é o caminho: uma coluna por lugar do caminho, na ordem aparelho → Wi-Fi → roteador → internet.
 * Cada peça só entra na coluna do seu lugar (a ordem importa).
 */
export function layoutFor(pieces: NodeId[]): Layout {
  const stages = [...new Set(pieces.map((id) => NODES[id].rank))].sort((a, b) => a - b);
  const step = stages.length > 1 ? (COLUMN_X1 - COLUMN_X0) / (stages.length - 1) : 0;
  const columns = stages.map((stage, index) => ({ stage, x: COLUMN_X0 + step * index }));
  const slots: Slot[] = columns.map((column, index) => ({
    id: `s${index}` as SlotId,
    x: column.x,
    y: ROW_Y,
    stage: column.stage,
    name: `Lugar ${index + 1} do caminho`,
  }));
  return { slots, columns };
}

export const RING_CENTER: ScenePoint = { x: 64, y: 58 };

export function isSlotId(value: string): value is SlotId {
  return /^s[0-5]$/.test(value);
}

export function isNodeId(value: string | undefined | null): value is NodeId {
  return Boolean(value && Object.prototype.hasOwnProperty.call(NODES, value));
}

export function edgeKey(a: NodeId, b: NodeId): EdgeKey {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

/** pontas da ligação no sentido do caminho (dispositivo → internet) */
export function edgeEnds(key: EdgeKey): [NodeId, NodeId] {
  const [a, b] = key.split("|") as [NodeId, NodeId];
  return NODES[a].rank <= NODES[b].rank ? [a, b] : [b, a];
}

export function isWireless(key: EdgeKey): boolean {
  return edgeEnds(key).includes("wifi");
}

/** próximo trecho permitido a partir de cada peça */
const FORWARD: Record<NodeId, NodeId[]> = {
  pc: ["wifi"],
  phone: ["wifi"],
  wifi: ["router"],
  router: ["internet"],
  internet: [],
};

const VALID = new Set<EdgeKey>(
  (Object.keys(FORWARD) as NodeId[]).flatMap((from) => FORWARD[from].map((to) => edgeKey(from, to))),
);

export function isValidEdge(key: EdgeKey): boolean {
  return VALID.has(key);
}

/** grupos de peças ligadas entre si (por quaisquer ligações, certas ou erradas) */
function groups(pieces: NodeId[], edges: EdgeKey[]): NodeId[][] {
  const left = new Set(pieces);
  const result: NodeId[][] = [];
  for (const start of pieces) {
    if (!left.has(start)) continue;
    left.delete(start);
    const group = [start];
    for (let i = 0; i < group.length; i++) {
      for (const key of edges) {
        const [a, b] = edgeEnds(key);
        const other = a === group[i] ? b : b === group[i] ? a : null;
        if (other && left.has(other)) {
          left.delete(other);
          group.push(other);
        }
      }
    }
    result.push(group);
  }
  return result;
}

/**
 * Bloco principal da montagem: o maior grupo de peças ligadas (no empate, o que tem a Internet).
 * As peças fora dele estão "soltas" — pulsam e aparecem em "Falta ligar". Todas no bloco = rede montada,
 * com ligações certas ou erradas: quem julga o caminho é `evaluate` (no Testar).
 */
export function mainBlock(pieces: NodeId[], edges: EdgeKey[]): Set<NodeId> {
  let best: NodeId[] = [];
  for (const group of groups(pieces, edges)) {
    if (group.length > best.length || (group.length === best.length && group.includes("internet"))) best = group;
  }
  return new Set(best);
}

/**
 * Primeiro ponto incorreto: uma ligação errada ou a peça onde o caminho parou.
 * `path`: peças que o pacote percorreu do aparelho até `at` (para animar o pacote até o ponto de parada).
 */
export type Fault =
  | { kind: "edge"; at: NodeId; edge: EdgeKey; path: NodeId[] }
  | { kind: "node"; at: NodeId; path: NodeId[] };

export type Verdict = { ok: true; routes: NodeId[][] } | { ok: false; fault: Fault };

/**
 * Leva um pacote de cada dispositivo até a internet seguindo só ligações válidas.
 * Para no primeiro problema do caminho (sem revelar os seguintes).
 */
export function evaluate(devices: NodeId[], edges: EdgeKey[]): Verdict {
  const sorted = [...new Set(edges)].sort();
  const present = new Set(sorted);
  const wrongAt = (at: NodeId) => sorted.find((key) => !VALID.has(key) && edgeEnds(key).includes(at));

  const trace = (path: NodeId[]): { route?: NodeId[]; fault?: Fault } => {
    const at = path[path.length - 1];
    if (at === "internet") return { route: path };
    const wrong = wrongAt(at);
    if (wrong) return { fault: { kind: "edge", at, edge: wrong, path } };
    const options = FORWARD[at].filter((next) => present.has(edgeKey(at, next)) && !path.includes(next));
    if (options.length === 0) return { fault: { kind: "node", at, path } };
    let first: Fault | undefined;
    for (const next of options) {
      const result = trace([...path, next]);
      if (result.route) return result;
      first = first ?? result.fault;
    }
    return { fault: first ?? { kind: "node", at, path } };
  };

  const routes: NodeId[][] = [];
  for (const device of devices) {
    const result = trace([device]);
    if (!result.route) return { ok: false, fault: result.fault ?? { kind: "node", at: device, path: [device] } };
    routes.push(result.route);
  }

  const leftover = sorted.find((key) => !VALID.has(key));
  if (leftover) {
    const at = edgeEnds(leftover)[0];
    return { ok: false, fault: { kind: "edge", at, edge: leftover, path: [at] } };
  }

  return { ok: true, routes };
}

/**
 * Pista de conceito quando o caminho para de novo no mesmo ponto (sobre a peça, sem dar a rota inteira).
 * A internet nunca é o ponto de parada.
 */
export const CONCEPT_HINTS: Partial<Record<NodeId, string>> = {
  phone: "O celular não usa cabo: ele se conecta pelo Wi-Fi.",
  wifi: "O Wi-Fi leva o sinal até o roteador.",
  router: "É o roteador que leva até a internet.",
  pc: "O computador se liga ao Wi-Fi, e o Wi-Fi leva até o roteador.",
};
