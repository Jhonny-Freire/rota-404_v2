import type { CSSProperties, ReactNode } from "react";
import { ELEMENTS, type ElementKey } from "@/config/assets";
import { cssVars, cx, resolveSprite } from "./util";
import styles from "./SceneSprite.module.css";

export type SceneSpriteProps = {
  /** chave de ELEMENTS (preferida) */
  element?: ElementKey;
  /** ou um caminho vindo de config/assets (SPRITES.*, PLANET_SPRITES.*) */
  src?: string;
  /** nome acessível; padrão = `label` */
  alt?: string;
  /** legenda visível abaixo do sprite */
  label?: ReactNode;
  /** largura em unidades do kit (1 = 1% da largura do canvas; fora do canvas 1 = 8px). Padrão 10 */
  size?: number;
  /** brilho ciano + leve aumento */
  highlighted?: boolean;
  /** apagado (cinza, translúcido) */
  dimmed?: boolean;
  /** moldura amarela de seleção */
  selected?: boolean;
  /** moldura verde + marca ok */
  correct?: boolean;
  /** moldura vermelha + tremida + marca de erro */
  wrong?: boolean;
  /** pulsa chamando atenção ("toque aqui") */
  pulse?: boolean;
  /** mostra a marca ok/erro quando correct/wrong. Padrão true */
  mark?: boolean;
  /** espelha horizontalmente */
  flip?: boolean;
  /** torna o sprite um botão (toque, clique, Enter/Espaço) */
  onClick?: () => void;
  disabled?: boolean;
  /** aria-pressed para uso como alternador */
  pressed?: boolean;
  /** conteúdo sobreposto acima do sprite (ex.: <Tag>) */
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
};

/** Sprite de cena ampliado em pixel art, com estados visuais e clique acessível. */
export function SceneSprite({
  element,
  src,
  alt,
  label,
  size = 10,
  highlighted = false,
  dimmed = false,
  selected = false,
  correct = false,
  wrong = false,
  pulse = false,
  mark = true,
  flip = false,
  onClick,
  disabled = false,
  pressed,
  children,
  className,
  style,
}: SceneSpriteProps) {
  const name = alt ?? (typeof label === "string" ? label : undefined);
  const classes = cx(
    styles.root,
    highlighted && styles.highlighted,
    dimmed && styles.dimmed,
    selected && styles.selected,
    correct && styles.correct,
    wrong && styles.wrong,
    pulse && styles.pulse,
    flip && styles.flip,
    onClick && styles.clickable,
    disabled && styles.disabled,
    className,
  );
  const vars = cssVars({ "--s": size }, style);

  const content = (
    <>
      <span className={styles.frame}>
        <img src={resolveSprite(element, src)} alt="" draggable={false} className={styles.img} />
        {mark && (correct || wrong) && (
          <img src={correct ? ELEMENTS.ok : ELEMENTS.error} alt="" draggable={false} className={styles.mark} />
        )}
        {children && <span className={styles.overlay}>{children}</span>}
      </span>
      {label !== undefined && label !== null && label !== "" && <span className={styles.label}>{label}</span>}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        className={classes}
        style={vars}
        onClick={onClick}
        disabled={disabled}
        aria-pressed={pressed}
        aria-label={alt}
      >
        {content}
      </button>
    );
  }

  return (
    <span className={classes} style={vars} role={name ? "img" : undefined} aria-label={name} aria-hidden={name ? undefined : true}>
      {content}
    </span>
  );
}

export default SceneSprite;
