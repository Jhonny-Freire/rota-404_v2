"use client";

import { useId } from "react";
import { AVATARS, SPRITES } from "@/config/assets";
import { Sprite } from "@/components/ui/Sprite";
import { cx } from "@/components/ui/cx";
import { Avatar } from "./Avatar";
import styles from "./AvatarPicker.module.css";

export type AvatarPickerProps = {
  value: string;
  onChange: (slug: string) => void;
  /** classe extra da grade (ex.: colunas do perfil em tela larga) */
  className?: string;
  /** tamanho do personagem (escala inteira da arte de 32px): 96 padrão, 64 no perfil */
  avatarSize?: 64 | 96;
};

export function AvatarPicker({ value, onChange, className, avatarSize = 96 }: AvatarPickerProps) {
  const name = useId();

  return (
    <div role="radiogroup" aria-label="Escolha seu avatar" className={cx(styles.grid, className)}>
      {AVATARS.map((avatar) => {
        const selected = avatar.slug === value;
        return (
          <label key={avatar.slug} className={cx(styles.option, selected && styles.selected)}>
            <input
              type="radio"
              name={name}
              value={avatar.slug}
              checked={selected}
              onChange={() => onChange(avatar.slug)}
              className={styles.input}
            />
            <span className={styles.card}>
              <Avatar slug={avatar.slug} size={avatarSize} label="" className={cx(styles.avatar, avatarSize === 96 && styles.large)} />
              <span className={styles.name}>{avatar.name}</span>
              {selected && <Sprite src={SPRITES.rewards.star} alt="" decorative size={24} className={styles.check} />}
            </span>
          </label>
        );
      })}
    </div>
  );
}

export default AvatarPicker;
