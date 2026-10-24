"use client";

import type { KeyboardEventHandler, PointerEventHandler } from "react";
import { ELEMENTS } from "@/config/assets";
import { ActionButton } from "@/components/learning/kit";
import { cx } from "@/components/ui/cx";
import { COLORS, type ImageOption, type PageColor, type Phase, type Theme } from "./model";
import styles from "./MonteSuaPagina.module.css";

export type BuildPanelProps = {
  theme: Theme;
  phase: Phase;
  hasImage: boolean;
  image: ImageOption;
  color: PageColor;
  onImage: (option: ImageOption) => void;
  onColor: (color: PageColor) => void;
  onView: () => void;
  onKeyDown: KeyboardEventHandler<HTMLDivElement>;
  onPointerDown: PointerEventHandler<HTMLDivElement>;
};

/** Área de interação: pequenas escolhas visuais (imagem e cor, nunca dão erro) e o botão "Ver página" (Etapa 5). */
export function BuildPanel({ theme, phase, hasImage, image, color, onImage, onColor, onView, onKeyDown, onPointerDown }: BuildPanelProps) {
  const open = phase === "build" || phase === "ready";

  return (
    <div className={styles.panel} onKeyDown={onKeyDown} onPointerDown={onPointerDown}>
      <fieldset className={styles.choices} disabled={!open || !hasImage}>
        <legend className={styles.choiceTitle}>Imagem da página</legend>
        {hasImage ? (
          <div className={styles.choiceRow}>
            {theme.images.map((option) => (
              <button
                key={option.element}
                type="button"
                className={cx(styles.choice, option.element === image.element && styles.choiceOn)}
                onClick={() => onImage(option)}
                aria-pressed={option.element === image.element}
              >
                <img src={ELEMENTS[option.element]} alt="" draggable={false} className={styles.choiceImg} />
                <span>{option.name}</span>
              </button>
            ))}
          </div>
        ) : (
          <p className={styles.choiceWait}>Coloque a imagem na página para escolher qual vai aparecer.</p>
        )}
      </fieldset>

      <fieldset className={styles.choices} disabled={!open}>
        <legend className={styles.choiceTitle}>Cor da página</legend>
        <div className={styles.choiceRow}>
          {COLORS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={cx(styles.choice, option.id === color.id && styles.choiceOn)}
              onClick={() => onColor(option)}
              aria-pressed={option.id === color.id}
            >
              <span className={cx(styles.swatch, styles[`swatch-${option.id}`])} aria-hidden="true" />
              <span>{option.name}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <div className={styles.viewRow}>
        <ActionButton
          label="Ver página"
          element="webpage"
          onClick={onView}
          disabled={!open}
          variant={phase === "ready" ? "primary" : "default"}
          attention={phase === "ready"}
          focusOnAttention
        />
      </div>
    </div>
  );
}
