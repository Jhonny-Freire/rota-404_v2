import type { ElementKey, ScenePoint } from "@/components/learning/kit";
import type { LessonEngineProps } from "@/components/learning/runtime";

export type SceneProps = Pick<LessonEngineProps, "say" | "setCanAdvance" | "setHint" | "reducedMotion">;

export type PartId = "phone" | "wifi" | "router" | "internet" | "site";

export type Part = {
  id: PartId;
  label: string;
  element: ElementKey;
  /** o que a parte representa no caminho (cena 5) */
  role: string;
  speech: string;
};

/** Caminho da aula, na ordem: Celular → Wi-Fi → Roteador → Internet → Site. */
export const PARTS: Part[] = [
  { id: "phone", label: "Celular", element: "cellphone", role: "Dispositivo", speech: "Celular: o dispositivo." },
  { id: "wifi", label: "Wi-Fi", element: "wifi", role: "Conexão sem fio", speech: "Wi-Fi: a conexão sem fio." },
  { id: "router", label: "Roteador", element: "router", role: "Equipamento", speech: "Roteador: o equipamento." },
  { id: "internet", label: "Internet", element: "cloudUpload", role: "Rede externa", speech: "Internet: a rede externa." },
  { id: "site", label: "Site", element: "webpage", role: "Destino", speech: "Site: o destino." },
];

export const PATH_LABEL = "Caminho: Celular, Wi-Fi, Roteador, Internet, Site";

/** Posições do "mundo" usado nas cenas 4, 5 e 7 (% do SceneCanvas). */
export const WORLD: Record<PartId, ScenePoint> = {
  phone: { x: 9, y: 46 },
  wifi: { x: 24, y: 36 },
  router: { x: 39, y: 50 },
  internet: { x: 70, y: 42 },
  site: { x: 73, y: 45 },
};

export const WORLD_SIZE: Record<PartId, number> = { phone: 7, wifi: 9, router: 11, internet: 34, site: 9 };

/** Trajeto do pacote no mundo: índice i = parte PARTS[i] (a Internet é a entrada da nuvem). */
export const WORLD_PATH: ScenePoint[] = [
  WORLD.phone,
  WORLD.wifi,
  WORLD.router,
  { x: 57, y: 51 },
  WORLD.site,
];

export const CABLE = { from: { x: 44, y: 51 }, to: { x: 58, y: 51 } };

export const RETRY_MS = 1200;

/**
 * Pausa de leitura entre o fim da interação (Wi-Fi tocado, todas as partes tocadas, acerto) e a liberação de
 * "Próxima cena": o aluno vê o resultado antes de o foco ir para o botão.
 */
export const READY_PAUSE_MS = 1400;
