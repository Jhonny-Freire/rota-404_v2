import type { CSSProperties, ReactNode } from "react";
import type { KitTone } from "./types";
import { cssVars, cx } from "./util";
import styles from "./Callout.module.css";

export type CalloutProps = {
  children: ReactNode;
  /** cor da borda/realce */
  tone?: KitTone;
  /** ponteiro saindo da caixa na direção indicada (aponta para o alvo). Padrão "none" */
  tail?: "none" | "up" | "down" | "left" | "right";
  size?: "sm" | "md" | "lg";
  /** largura máxima em unidades do kit. Padrão 34 */
  maxWidth?: number;
  /** anuncia o texto a leitores de tela quando muda */
  live?: boolean;
  className?: string;
  style?: CSSProperties;
};

/** Caixa de texto curta sobre a cena (explicação, nome de etapa, resultado). */
export function Callout({ children, tone = "default", tail = "none", size = "md", maxWidth = 34, live = false, className, style }: CalloutProps) {
  return (
    <div
      className={cx(styles.callout, styles[tone], styles[size], tail !== "none" && cx(styles.tail, styles[`tail-${tail}`]), className)}
      style={cssVars({ "--mw": maxWidth }, style)}
      role={live ? "status" : undefined}
      aria-live={live ? "polite" : undefined}
    >
      {children}
    </div>
  );
}

export type BalloonProps = {
  children: ReactNode;
  /** de onde sai o rabicho do balão. Padrão "bottom-left" */
  tail?: "bottom-left" | "bottom-right" | "top-left" | "top-right" | "left" | "right" | "none";
  /** balão de pensamento (rabicho de bolinhas) */
  thought?: boolean;
  tone?: "light" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  /** largura máxima em unidades do kit. Padrão 30 */
  maxWidth?: number;
  live?: boolean;
  className?: string;
  style?: CSSProperties;
};

/** Balão de fala/mensagem claro (ex.: pergunta de um personagem, conteúdo de uma mensagem). */
export function Balloon({
  children,
  tail = "bottom-left",
  thought = false,
  tone = "light",
  size = "md",
  maxWidth = 30,
  live = false,
  className,
  style,
}: BalloonProps) {
  return (
    <div
      className={cx(
        styles.balloon,
        styles[`b-${tone}`],
        styles[size],
        tail !== "none" && cx(styles.btail, styles[`b-${tail}`]),
        thought && styles.thought,
        className,
      )}
      style={cssVars({ "--mw": maxWidth }, style)}
      role={live ? "status" : undefined}
      aria-live={live ? "polite" : undefined}
    >
      {children}
    </div>
  );
}

export default Callout;
