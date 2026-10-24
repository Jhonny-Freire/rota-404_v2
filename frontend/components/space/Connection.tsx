import type { CSSProperties } from "react";
import { SPRITES } from "@/config/assets";
import { cx } from "@/components/ui/cx";
import styles from "./Connection.module.css";

export type Point = { x: number; y: number };

/** Sprite dos pontos para o ::before animado (ver Connection.module.css). */
const TRAIL = `url(${SPRITES.space.trailDot})`;

export type ConnectionProps = {
  from: Point;
  to: Point;
  state?: "active" | "locked";
};

export function Connection({ from, to, state = "active" }: ConnectionProps) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);
  if (length < 1) return null;
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

  return (
    <span
      className={cx(styles.connection, state === "locked" && styles.locked)}
      aria-hidden="true"
      style={
        {
          left: from.x,
          top: from.y,
          width: length,
          transform: `translateY(-50%) rotate(${angle}deg)`,
          "--trail": TRAIL,
        } as CSSProperties
      }
    />
  );
}

export default Connection;
