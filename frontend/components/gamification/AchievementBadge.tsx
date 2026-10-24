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
  /** como desbloquear */
  description?: string | null;
  /** secreta bloqueada: nome, arte e regra escondidos */
  secret?: boolean;
  /** ISO de quando foi desbloqueada */
  unlockedAt?: string | null;
  /** prévia (perfil): arte e nome, sem o texto */
  compact?: boolean;
};

export const RARITY_LABELS: Record<AchievementRarity, string> = {
  comum: "Comum",
  rara: "Rara",
  lenda: "Lendária",
  brutal: "Brutal",
  secreta: "Secreta",
};

function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("pt-BR");
}

export function AchievementBadge({ name, sprite, rarity, unlocked, description, secret = false, unlockedAt, compact = false }: AchievementBadgeProps) {
  const hidden = secret && !unlocked;
  const title = hidden ? "???" : name;
  const text = hidden ? "Conquista secreta: continue explorando para descobrir." : description;
  const date = unlocked && unlockedAt ? formatDate(unlockedAt) : "";
  const label = `${title}, conquista ${RARITY_LABELS[rarity].toLowerCase()}, ${unlocked ? `desbloqueada${date ? ` em ${date}` : ""}` : "bloqueada"}`;

  return (
    <article
      className={cx(styles.badge, styles[rarity], !unlocked && styles.locked, compact && styles.compact)}
      aria-label={label}
      title={date ? `Desbloqueada em ${date}` : undefined}
    >
      <div className={styles.art}>
        <span className={styles.halo} aria-hidden="true" />
        <Sprite src={sprite} alt="" decorative size={64} className={cx(styles.sprite, hidden && styles.hidden)} />
        {!unlocked && <Sprite src={SPRITES.status.locked} alt="" decorative size={22} className={styles.lock} />}
      </div>
      <div className={styles.body}>
        {compact && <span className={styles.rarity}>{RARITY_LABELS[rarity]}</span>}
        <h3 className={styles.name}>{title}</h3>
        {!compact && text && <p className={styles.description}>{text}</p>}
      </div>
    </article>
  );
}

export default AchievementBadge;
