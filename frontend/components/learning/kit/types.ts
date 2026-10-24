import type { ElementKey } from "@/config/assets";

export type { ElementKey };

/** Ponto na cena em % do SceneCanvas: x 0–100 (esquerda → direita), y 0–100 (topo → base). */
export type ScenePoint = { x: number; y: number };

export type KitTone = "default" | "info" | "success" | "danger" | "warning" | "muted";

/** Marca de correção usada por cartões, peças e blocos. */
export type MarkStatus = "correct" | "wrong" | null | undefined;

/** Proporção padrão do SceneCanvas (16:9). */
export const DEFAULT_RATIO = 16 / 9;
