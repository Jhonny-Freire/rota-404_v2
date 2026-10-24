import type { CSSProperties, ReactNode } from "react";
import { DEFAULT_RATIO } from "./types";
import { cssVars, cx, round } from "./util";
import styles from "./SceneCanvas.module.css";

export type SceneCanvasProps = {
  children?: ReactNode;
  /** nome acessível da área (role="group") */
  label?: string;
  /** largura/altura; padrão 16/9 (o palco do shell já é 16:9) */
  ratio?: number;
  /** fundo decorativo: nenhum (padrão), grade sutil, ou piso em perspectiva */
  backdrop?: "none" | "grid" | "floor";
  className?: string;
  style?: CSSProperties;
};

/**
 * Área relativa da cena. Filhos posicionados com <Place x y> em % (0–100).
 * Define a unidade do kit `--kit-u` = 1% da largura do canvas: todo `size` do kit é medido nela.
 */
export function SceneCanvas({ children, label, ratio = DEFAULT_RATIO, backdrop = "none", className, style }: SceneCanvasProps) {
  const safeRatio = ratio > 0 ? ratio : DEFAULT_RATIO;
  return (
    <div
      className={cx(styles.canvas, backdrop !== "none" && styles[backdrop], className)}
      role={label ? "group" : undefined}
      aria-label={label}
      style={cssVars({ "--kit-ratio": round(safeRatio, 5), "--kit-vu": `calc(1cqw * ${round(1 / safeRatio, 5)})` }, style)}
    >
      {children}
    </div>
  );
}

export default SceneCanvas;
