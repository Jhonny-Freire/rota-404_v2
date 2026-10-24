import { Sprite } from "@/components/ui/Sprite";
import { cx } from "@/components/ui/cx";
import { PROGRESS_LABELS, PROGRESS_SPRITES } from "@/lib/progress";
import type { ProgressState } from "@/types/domain";
import styles from "./ProgressStateBadge.module.css";

export type ProgressStateBadgeProps = {
  state: ProgressState;
  showLabel?: boolean;
  size?: number;
};

export function ProgressStateBadge({ state, showLabel = true, size = 20 }: ProgressStateBadgeProps) {
  const label = PROGRESS_LABELS[state];

  return (
    <span className={cx(styles.badge, styles[state], !showLabel && styles.iconOnly)}>
      <span className={styles.icon} style={{ width: size, height: size }}>
        <Sprite src={PROGRESS_SPRITES[state]} alt={showLabel ? "" : label} decorative={showLabel} className={styles.sprite} />
      </span>
      {showLabel && <span className={styles.label}>{label}</span>}
    </span>
  );
}

export default ProgressStateBadge;
