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
};

export function AvatarPicker({ value, onChange }: AvatarPickerProps) {
  const name = useId();

  return (
    <div role="radiogroup" aria-label="Escolha seu avatar" className={styles.grid}>
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
              <Avatar slug={avatar.slug} size={96} label="" className={styles.avatar} />
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
