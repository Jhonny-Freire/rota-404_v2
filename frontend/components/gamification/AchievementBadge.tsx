import { SPRITES } from "@/config/assets";
import { Sprite } from "@/components/ui/Sprite";
import { cx } from "@/components/ui/cx";
import type { AchievementRarity } from "@/types/domain";
import styles from "./AchievementBadge.module.css";

export type AchievementBadgeProps = {
  name: string;
  sprite: string;
  rarity: AchievementRarity;
  unlocked: boolean;
  description?: string | null;
};

export const RARITY_LABELS: Record<AchievementRarity, string> = {
  comum: "Comum",
  rara: "Rara",
  lenda: "Lenda",
};

export function AchievementBadge({ name, sprite, rarity, unlocked, description }: AchievementBadgeProps) {
  const title = unlocked ? name : "???";
  const text = unlocked ? description : "Conquista bloqueada. Continue explorando para descobrir.";

  return (
    <article
      className={cx(styles.badge, styles[rarity], !unlocked && styles.locked)}
      aria-label={unlocked ? `${name}, conquista ${RARITY_LABELS[rarity].toLowerCase()}` : "Conquista bloqueada"}
    >
      <div className={styles.art}>
        <span className={styles.halo} aria-hidden="true" />
        <Sprite src={sprite} alt="" decorative size={64} className={styles.sprite} />
        {!unlocked && <Sprite src={SPRITES.status.locked} alt="" decorative size={22} className={styles.lock} />}
      </div>
      <span className={styles.rarity}>{RARITY_LABELS[rarity]}</span>
      <h3 className={styles.name}>{title}</h3>
      {text && <p className={styles.description}>{text}</p>}
    </article>
  );
}

export default AchievementBadge;
