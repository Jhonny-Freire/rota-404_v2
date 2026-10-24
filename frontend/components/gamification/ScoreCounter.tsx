import { SPRITES } from "@/config/assets";
import { Sprite } from "@/components/ui/Sprite";
import { cx } from "@/components/ui/cx";
import styles from "./ScoreCounter.module.css";

export type ScoreCounterProps = {
  points: number | null;
  label?: string;
  size?: "sm" | "md" | "lg";
};

const STAR_SIZE = { sm: 20, md: 32, lg: 48 };

export function formatPoints(points: number): string {
  const value = Math.max(0, Math.round(points));
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function ScoreCounter({ points, label, size = "md" }: ScoreCounterProps) {
  const value = points === null || !Number.isFinite(points) ? null : formatPoints(points);

  return (
    <span className={cx(styles.score, styles[size], value === null && styles.empty)}>
      <Sprite src={SPRITES.rewards.star} alt="" decorative size={STAR_SIZE[size]} className={styles.star} />
      <span className={styles.text}>
        <span className={styles.value}>
          {value ?? (
            <>
              <span aria-hidden="true">--</span>
              <span className="sr-only">Sem pontuação</span>
            </>
          )}
        </span>
        {label && <span className={styles.label}>{label}</span>}
      </span>
    </span>
  );
}

export default ScoreCounter;
