"use client";

import { ROCKET_FRAMES } from "@/config/assets";
import { AnimatedSprite } from "@/components/ui/AnimatedSprite";
import { cx } from "@/components/ui/cx";
import styles from "./Rocket.module.css";

export type RocketProps = {
  size?: number;
  flying?: boolean;
  angle?: number;
  className?: string;
};

export function Rocket({ size = 64, flying = true, angle = 0, className }: RocketProps) {
  return (
    <span
      className={cx(styles.rocket, flying && styles.flying, className)}
      style={{ width: size, transform: angle ? `rotate(${angle}deg)` : undefined }}
    >
      <span className={styles.body}>
        <AnimatedSprite frames={ROCKET_FRAMES} fps={10} playing={flying} alt="Foguete do explorador" size={size} />
      </span>
      {flying && <span className={styles.glow} aria-hidden="true" />}
    </span>
  );
}

export default Rocket;
