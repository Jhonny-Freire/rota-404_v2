import { cx } from "@/components/ui/cx";
import styles from "./ProgressBar.module.css";

export type ProgressBarProps = {
  value: number;
  label?: string;
  segments?: number;
  showValue?: boolean;
};

export function ProgressBar({ value, label, segments = 10, showValue = false }: ProgressBarProps) {
  const ratio = Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
  const percent = Math.round(ratio * 100);
  const total = Math.max(1, Math.round(segments));
  const filled = Math.round(ratio * total);

  return (
    <span className={styles.wrapper}>
      {(label || showValue) && (
        <span className={styles.header}>
          {label && <span className={styles.label}>{label}</span>}
          {showValue && <span className={styles.value}>{percent}%</span>}
        </span>
      )}
      <span
        className={cx(styles.track, ratio >= 1 && styles.complete)}
        role="progressbar"
        aria-label={label ?? "Progresso"}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-valuetext={`${percent}%`}
      >
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={cx(styles.segment, i < filled && styles.filled)} />
        ))}
      </span>
    </span>
  );
}

export default ProgressBar;
