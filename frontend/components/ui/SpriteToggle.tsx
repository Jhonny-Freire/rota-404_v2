"use client";

import { useId } from "react";
import { SPRITES } from "@/config/assets";
import { cx } from "./cx";
import { Sprite } from "./Sprite";
import styles from "./SpriteToggle.module.css";

export type SpriteToggleProps = {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description?: string;
  spriteOn?: string;
  spriteOff?: string;
};

export function SpriteToggle({
  checked,
  onChange,
  label,
  description,
  spriteOn = SPRITES.ui.toggleOn,
  spriteOff = SPRITES.ui.toggleOff,
}: SpriteToggleProps) {
  const id = useId();
  const labelId = `${id}-label`;
  const descriptionId = `${id}-description`;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelId}
      aria-describedby={description ? descriptionId : undefined}
      onClick={() => onChange(!checked)}
      className={cx(styles.toggle, checked && styles.on)}
    >
      <span className={styles.text}>
        <span id={labelId} className={styles.label}>
          {label}
        </span>
        {description && (
          <span id={descriptionId} className={styles.description}>
            {description}
          </span>
        )}
      </span>
      <span className={styles.control} aria-hidden="true">
        <Sprite src={checked ? spriteOn : spriteOff} alt="" decorative size={72} className={styles.sprite} />
        <span className={styles.state}>{checked ? "Ligado" : "Desligado"}</span>
      </span>
    </button>
  );
}

export default SpriteToggle;
