"use client";

import { useEffect } from "react";
import { RARITY_LABELS } from "@/components/gamification/AchievementBadge";
import { Sprite } from "@/components/ui/Sprite";
import { cx } from "@/components/ui/cx";
import { achievementBySlug } from "@/config/achievements";
import styles from "./AchievementToasts.module.css";

export type AchievementToastItem = { key: number; slugs: string[] };

const VISIBLE_MS = 5000;

/** Aviso escrito (sem fala do Bonzi) de conquista nova, no canto de cima; some sozinho e não bloqueia toques. */
export function AchievementToasts({ items, onDone }: { items: AchievementToastItem[]; onDone: (key: number) => void }) {
  return (
    <div className={styles.stack} role="status" aria-live="polite">
      {items.slice(0, 3).map((item) => (
        <Toast key={item.key} item={item} onDone={onDone} />
      ))}
    </div>
  );
}

function Toast({ item, onDone }: { item: AchievementToastItem; onDone: (key: number) => void }) {
  useEffect(() => {
    const timer = window.setTimeout(() => onDone(item.key), VISIBLE_MS);
    return () => window.clearTimeout(timer);
  }, [item.key, onDone]);

  const first = achievementBySlug(item.slugs[0]);
  if (!first) return null;
  const many = item.slugs.length > 1;

  return (
    <div className={cx(styles.toast, styles[first.rarity])}>
      <Sprite src={first.sprite} alt="" decorative size={64} className={styles.sprite} />
      <div className={styles.text}>
        <span className={styles.label}>{many ? `${item.slugs.length} conquistas desbloqueadas!` : "Conquista desbloqueada!"}</span>
        <strong className={styles.name}>{many ? item.slugs.map((s) => achievementBySlug(s)?.name).join(", ") : first.name}</strong>
        {!many && <span className={styles.rarity}>{RARITY_LABELS[first.rarity]}</span>}
      </div>
    </div>
  );
}

export default AchievementToasts;
