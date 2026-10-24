import type { CSSProperties, ReactNode } from "react";
import type { ElementKey } from "@/config/assets";
import type { KitTone } from "./types";
import { cx, resolveSprite } from "./util";
import styles from "./Tag.module.css";

export type TagProps = {
  children: ReactNode;
  /** cor: default (roxo), info (ciano), success (verde), danger (vermelho), warning (amarelo), muted (apagado) */
  tone?: KitTone;
  /** tamanho do texto (escala com o canvas). Padrão "md" */
  size?: "sm" | "md" | "lg";
  /** anel amarelo piscando para chamar atenção */
  highlighted?: boolean;
  /** texto riscado (ex.: endereço errado) */
  strike?: boolean;
  /** sprite pequeno antes do texto (chave de ELEMENTS) */
  icon?: ElementKey;
  /** ou caminho de sprite de config/assets */
  iconSrc?: string;
  /** torna a etiqueta um botão */
  onClick?: () => void;
  pressed?: boolean;
  disabled?: boolean;
  /** nome acessível alternativo */
  ariaLabel?: string;
  className?: string;
  style?: CSSProperties;
};

/** Etiqueta pixel monoespaçada: IPs, domínios, "Sem conexão", "<h1>", "REQUISIÇÃO"… */
export function Tag({
  children,
  tone = "default",
  size = "md",
  highlighted = false,
  strike = false,
  icon,
  iconSrc,
  onClick,
  pressed,
  disabled = false,
  ariaLabel,
  className,
  style,
}: TagProps) {
  const classes = cx(
    styles.tag,
    styles[tone],
    styles[size],
    highlighted && styles.highlighted,
    strike && styles.strike,
    onClick && styles.clickable,
    className,
  );
  const content = (
    <>
      {(icon || iconSrc) && <img src={resolveSprite(icon, iconSrc)} alt="" draggable={false} className={styles.icon} />}
      <span className={styles.text}>{children}</span>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        className={classes}
        style={style}
        onClick={onClick}
        aria-pressed={pressed}
        aria-label={ariaLabel}
        disabled={disabled}
      >
        {content}
      </button>
    );
  }

  return (
    <span className={classes} style={style} aria-label={ariaLabel} role={ariaLabel ? "note" : undefined}>
      {content}
    </span>
  );
}

export default Tag;
