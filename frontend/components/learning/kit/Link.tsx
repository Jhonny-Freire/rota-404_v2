"use client";

import type { ReactNode } from "react";
import { ELEMENTS } from "@/config/assets";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { DEFAULT_RATIO, type ScenePoint } from "./types";
import { cssVars, cx, midpoint, round, sceneAngle, sceneDistance } from "./util";
import styles from "./Link.module.css";

export type LinkState = "idle" | "active" | "broken" | "off";

export type LinkProps = {
  /** início da linha (mesmas coordenadas % usadas no <Place>) */
  from: ScenePoint;
  /** fim da linha */
  to: ScenePoint;
  /** idle: ligada e parada · active: pontos de dados correndo · broken: interrompida (vermelha) · off: desligada (cinza) */
  state?: LinkState;
  /** pontos correm de `to` para `from` */
  reverse?: boolean;
  /** espessura em unidades do kit. Padrão 0.8 */
  thickness?: number;
  /** tempo (ms) para um ponto atravessar a linha. Padrão 1400 */
  speedMs?: number;
  /** quantidade de pontos no estado active. Padrão 3 */
  dots?: number;
  /** etiqueta no meio da linha (ex.: <Tag>Wi-Fi</Tag>) */
  label?: ReactNode;
  /** mostra o sprite de erro no ponto da quebra (broken). Padrão true */
  breakMark?: boolean;
  /** proporção do SceneCanvas, se não for 16:9 */
  ratio?: number;
  /** empilhamento. Padrão 1 (abaixo dos sprites) */
  z?: number;
  className?: string;
};

/** Linha pixelada entre dois pontos do SceneCanvas. Use dentro de <SceneCanvas>, antes dos <Place>. */
export function Link({
  from,
  to,
  state = "idle",
  reverse = false,
  thickness = 0.8,
  speedMs = 1400,
  dots = 3,
  label,
  breakMark = true,
  ratio = DEFAULT_RATIO,
  z,
  className,
}: LinkProps) {
  const reducedMotion = useReducedMotion();
  const length = sceneDistance(from, to, ratio);
  const angle = sceneAngle(from, to, ratio);
  const mid = midpoint(from, to);
  const count = Math.max(1, Math.round(dots));
  const animated = state === "active" && !reducedMotion;

  return (
    <>
      <div
        className={cx(styles.link, styles[state], reverse && styles.reverse, className)}
        style={cssVars({
          "--x": round(from.x),
          "--y": round(from.y),
          "--len": round(length),
          "--angle": `${round(angle, 5)}rad`,
          "--t": thickness,
          "--speed": `${Math.max(200, speedMs)}ms`,
          "--n": count,
          "--z": z,
        })}
        aria-hidden="true"
      >
        <span className={styles.line} />
        {state === "active" &&
          Array.from({ length: count }, (_, i) => (
            <span
              key={i}
              className={cx(styles.dot, animated && styles.flowing)}
              style={cssVars({ "--i": i, "--pos": round((i + 0.5) / count, 4) })}
            />
          ))}
      </div>
      {state === "broken" && breakMark && (
        <span className={styles.mark} style={cssVars({ "--x": round(mid.x), "--y": round(mid.y), "--z": (z ?? 1) + 1 })} aria-hidden="true">
          <img src={ELEMENTS.error} alt="" draggable={false} />
        </span>
      )}
      {label !== undefined && label !== null && (
        <span className={styles.label} style={cssVars({ "--x": round(mid.x), "--y": round(mid.y), "--z": (z ?? 1) + 1 })}>
          {label}
        </span>
      )}
    </>
  );
}

export { Link as SceneLink };

export default Link;
