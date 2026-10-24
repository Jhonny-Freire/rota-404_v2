import type { ElementKey, ScenePoint } from "@/components/learning/kit";
import type { Say } from "@/components/learning/runtime";

export type SceneProps = {
  say: Say;
  setCanAdvance: (ready: boolean) => void;
  /** instrução "O que fazer" do shell (null volta para a dica da cena) */
  setHint: (text: string | null) => void;
  reducedMotion: boolean;
};

export type DeviceId = "computer" | "cellphone" | "tablet" | "printer" | "notebook";

export type Device = {
  id: DeviceId;
  element: ElementKey;
  label: string;
  /** largura nativa do sprite em pixels (para ampliar todos na mesma escala) */
  native: number;
  feminine?: boolean;
};

export const DEVICES: Record<DeviceId, Device> = {
  computer: { id: "computer", element: "setup", label: "Computador", native: 19 },
  cellphone: { id: "cellphone", element: "cellphone", label: "Celular", native: 9 },
  tablet: { id: "tablet", element: "tablet", label: "Tablet", native: 15 },
  printer: { id: "printer", element: "printer", label: "Impressora", native: 13, feminine: true },
  notebook: { id: "notebook", element: "notebook", label: "Notebook", native: 14 },
};

/** Os quatro aparelhos das cenas 1 a 3, na ordem de leitura (e de foco). */
export const NETWORK: DeviceId[] = ["computer", "cellphone", "tablet", "printer"];

/** Posição (centro do sprite) de cada aparelho nas cenas 1 a 3. */
export const SPOTS: Record<DeviceId, ScenePoint> = {
  computer: { x: 22, y: 30 },
  cellphone: { x: 78, y: 30 },
  tablet: { x: 22, y: 71 },
  printer: { x: 78, y: 71 },
  notebook: { x: 50, y: 50 },
};

export const CENTER: ScenePoint = { x: 50, y: 51 };

/** unidades do kit por pixel nativo do sprite */
export const PIXEL = 0.8;

/** deslocamento vertical (% do canvas) para o centro do sprite cair no ponto quando há legenda */
export const LABEL_SHIFT = 2.5;

/** duração do "desenho" de uma nova ligação */
export const DRAW_MS = 600;

export type Pair = readonly [DeviceId, DeviceId];

export const DEFAULT_LINK: Pair = ["computer", "cellphone"];

export function samePair(a: Pair, b: Pair): boolean {
  return (a[0] === b[0] && a[1] === b[1]) || (a[0] === b[1] && a[1] === b[0]);
}

export function pairKey(pair: Pair): string {
  return [...pair].sort().join("-");
}

export function neighbors(id: DeviceId, links: readonly Pair[]): DeviceId[] {
  const out: DeviceId[] = [];
  for (const [a, b] of links) {
    if (a === id) out.push(b);
    else if (b === id) out.push(a);
  }
  return out;
}

/** Aparelhos alcançáveis a partir de `start` seguindo as ligações. */
export function reachable(start: DeviceId, links: readonly Pair[]): Set<DeviceId> {
  const seen = new Set<DeviceId>([start]);
  const queue: DeviceId[] = [start];
  while (queue.length > 0) {
    const current = queue.shift() as DeviceId;
    for (const next of neighbors(current, links)) {
      if (!seen.has(next)) {
        seen.add(next);
        queue.push(next);
      }
    }
  }
  return seen;
}

export function selectedText(id: DeviceId): string {
  const device = DEVICES[id];
  return `${device.label} ${device.feminine ? "selecionada" : "selecionado"}. Toque em outro dispositivo.`;
}

export function linkedText([a, b]: Pair): string {
  return `${DEVICES[a].label} e ${DEVICES[b].label} estão conectados.`;
}

/** Instrução da cena 3 conforme quantos aparelhos ainda estão fora da rede. */
export function missingText(missing: number): string {
  const count = missing === 1 ? "Falta 1 aparelho" : `Faltam ${missing} aparelhos`;
  return `${count}. Toque em um aparelho de fora e depois em um da rede.`;
}
