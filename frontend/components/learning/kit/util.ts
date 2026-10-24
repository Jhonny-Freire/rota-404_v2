import type { CSSProperties } from "react";
import { ELEMENTS, SPRITES, type ElementKey } from "@/config/assets";
import { DEFAULT_RATIO, type ScenePoint } from "./types";

export { cx } from "@/components/ui/cx";

/** Monta um objeto style com variáveis CSS (ignora valores undefined). */
export function cssVars(vars: Record<string, string | number | undefined | null>, base?: CSSProperties): CSSProperties {
  const style: Record<string, string | number> = { ...(base as Record<string, string | number>) };
  for (const [key, value] of Object.entries(vars)) {
    if (value !== undefined && value !== null) style[key] = value;
  }
  return style as CSSProperties;
}

/** Caminho do sprite: `src` explícito (de config/assets) ou a chave de ELEMENTS. */
export function resolveSprite(element?: ElementKey, src?: string): string {
  if (src) return src;
  if (element) return ELEMENTS[element] ?? SPRITES.placeholder;
  return SPRITES.placeholder;
}

export function point(x: number, y: number): ScenePoint {
  return { x, y };
}

export function midpoint(a: ScenePoint, b: ScenePoint): ScenePoint {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

export function lerpPoint(a: ScenePoint, b: ScenePoint, t: number): ScenePoint {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

/** Distância entre dois pontos em "% da largura do canvas" (considera a proporção). */
export function sceneDistance(a: ScenePoint, b: ScenePoint, ratio = DEFAULT_RATIO): number {
  return Math.hypot(b.x - a.x, (b.y - a.y) / ratio);
}

/** Ângulo (radianos) do segmento a → b já corrigido pela proporção do canvas. */
export function sceneAngle(a: ScenePoint, b: ScenePoint, ratio = DEFAULT_RATIO): number {
  return Math.atan2((b.y - a.y) / ratio, b.x - a.x);
}

export function pathLength(path: ScenePoint[], ratio = DEFAULT_RATIO): number {
  let total = 0;
  for (let i = 1; i < path.length; i++) total += sceneDistance(path[i - 1], path[i], ratio);
  return total;
}

export function round(value: number, digits = 3): number {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}
