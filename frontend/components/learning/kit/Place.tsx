import type { CSSProperties, ReactNode } from "react";
import { cssVars, cx } from "./util";
import styles from "./Place.module.css";

export type PlaceAnchor =
  | "center"
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

export type PlaceProps = {
  /** posição horizontal em % do SceneCanvas (0–100) */
  x: number;
  /** posição vertical em % do SceneCanvas (0–100) */
  y: number;
  children?: ReactNode;
  /** que ponto do filho fica em (x, y). Padrão "center" */
  anchor?: PlaceAnchor;
  /** empilhamento (Link = 1, Place = 2, Packet = 3 por padrão) */
  z?: number;
  /** largura fixa em unidades do kit (% da largura do canvas) */
  width?: number;
  /** anima mudanças de x/y (transform) em ms; 0 = salta. Padrão 0 */
  moveMs?: number;
  /** esconde com fade (fica inerte e fora da árvore de acessibilidade) */
  hidden?: boolean;
  className?: string;
  style?: CSSProperties;
};

const ANCHORS: Record<PlaceAnchor, [string, string]> = {
  center: ["-50%", "-50%"],
  top: ["-50%", "0%"],
  bottom: ["-50%", "-100%"],
  left: ["0%", "-50%"],
  right: ["-100%", "-50%"],
  "top-left": ["0%", "0%"],
  "top-right": ["-100%", "0%"],
  "bottom-left": ["0%", "-100%"],
  "bottom-right": ["-100%", "-100%"],
};

/** Posiciona o filho em (x%, y%) dentro de um <SceneCanvas>. */
export function Place({ x, y, children, anchor = "center", z, width, moveMs = 0, hidden = false, className, style }: PlaceProps) {
  const [ax, ay] = ANCHORS[anchor];
  return (
    <div
      className={cx(styles.place, hidden && styles.hidden, width !== undefined && styles.fixed, className)}
      style={cssVars({ "--x": x, "--y": y, "--ax": ax, "--ay": ay, "--z": z, "--w": width, "--move": `${Math.max(0, moveMs)}ms` }, style)}
      aria-hidden={hidden || undefined}
      inert={hidden || undefined}
    >
      {children}
    </div>
  );
}

export default Place;
