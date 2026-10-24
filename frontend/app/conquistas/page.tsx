"use client";

import { useId } from "react";
import { AchievementBadge, RARITY_LABELS } from "@/components/gamification/AchievementBadge";
import { AppShell } from "@/components/layout/AppShell";
import { StatusView } from "@/components/layout/StatusView";
import { ProgressBar } from "@/components/progress/ProgressBar";
import { Sprite } from "@/components/ui/Sprite";
import { cx } from "@/components/ui/cx";
import { BADGES, SPRITES, badgeSprite } from "@/config/assets";
import { ROUTES } from "@/config/routes";
import { useAsync } from "@/hooks/useAsync";
import { getErrorMessage, isNotImplemented } from "@/services/apiClient";
import { getAchievements, getMyAchievements } from "@/services/gamificationService";
import type { Achievement, AchievementRarity, UserAchievement } from "@/types/domain";
import styles from "./page.module.css";

type BadgeView = {
  id: string;
  name: string;
  sprite: string;
  rarity: AchievementRarity;
  description: string | null;
  unlocked: boolean;
};

const RARITIES: AchievementRarity[] = ["comum", "rara", "lenda"];

async function loadAchievements(): Promise<BadgeView[]> {
  let achievements: Achievement[];
  try {
    achievements = await getAchievements();
  } catch (error) {
    if (!isNotImplemented(error)) throw error;
    return BADGES.map((b) => ({
      id: b.slug,
      name: "???",
      sprite: b.sprite,
      rarity: b.rarity,
      description: null,
      unlocked: false,
    }));
  }

  let mine: UserAchievement[] = [];
  try {
    mine = await getMyAchievements();
  } catch (error) {
    if (!isNotImplemented(error)) throw error;
  }

  const unlockedIds = new Set(mine.map((m) => m.achievement_id));
  return achievements.map((a) => ({
    id: a.id,
    name: a.name,
    sprite: badgeSprite(a.sprite_key),
    rarity: a.rarity,
    description: a.description,
    unlocked: unlockedIds.has(a.id),
  }));
}

export default function AchievementsPage() {
  const result = useAsync(loadAchievements, []);
  const ids = useId();
  const badges = result.data ?? [];
  const unlocked = badges.filter((b) => b.unlocked);
  const locked = badges.filter((b) => !b.unlocked);

  return (
    <AppShell
      breadcrumbs={[{ label: "Início", href: ROUTES.home }, { label: "Conquistas" }]}
      bonzi={{ state: "thinking", message: "Cada missão concluída pode revelar uma conquista nova." }}
    >
      <header className={styles.header}>
        <div className={styles.heading}>
          <Sprite src={SPRITES.ui.achievements} alt="" decorative size={56} className={styles.medal} />
          <h1 className={styles.title}>Conquistas</h1>
        </div>
        {result.data && (
          <div className={styles.counter}>
            <p className={styles.count}>
              <span aria-hidden="true">
                <span className={styles.countValue}>{unlocked.length}</span> / {badges.length}
              </span>
              <span className="sr-only">
                {unlocked.length} de {badges.length} conquistas desbloqueadas
              </span>
            </p>
            <ProgressBar
              value={badges.length > 0 ? unlocked.length / badges.length : 0}
              label="Conquistas desbloqueadas"
              segments={Math.max(1, badges.length)}
            />
          </div>
        )}
      </header>

      {result.loading && <StatusView kind="loading" title="Abrindo o cofre" />}

      {result.error !== undefined && (
        <StatusView kind="error" message={getErrorMessage(result.error)} onRetry={result.reload} />
      )}

      {result.data && (
        <>
          <section className={styles.section} aria-labelledby={`${ids}-unlocked`}>
            <h2 id={`${ids}-unlocked`} className={styles.sectionTitle}>
              Desbloqueadas
            </h2>
            {unlocked.length === 0 ? (
              <StatusView kind="empty" title="Nenhuma ainda" message="Conclua missões para ganhar conquistas." />
            ) : (
              <ul className={styles.grid}>
                {unlocked.map((b) => (
                  <li key={b.id}>
                    <AchievementBadge name={b.name} sprite={b.sprite} rarity={b.rarity} description={b.description} unlocked />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={styles.section} aria-labelledby={`${ids}-locked`}>
            <h2 id={`${ids}-locked`} className={styles.sectionTitle}>
              Bloqueadas
            </h2>
            {locked.length === 0 && <p className={styles.note}>Todas as conquistas foram desbloqueadas.</p>}
            {RARITIES.map((rarity) => {
              const group = locked.filter((b) => b.rarity === rarity);
              if (group.length === 0) return null;
              return (
                <div key={rarity} className={cx(styles.group, styles[rarity])}>
                  <h3 className={styles.groupTitle}>
                    {RARITY_LABELS[rarity]}
                    <span className={styles.groupCount}>{group.length}</span>
                  </h3>
                  <ul className={styles.grid}>
                    {group.map((b) => (
                      <li key={b.id}>
                        <AchievementBadge name={b.name} sprite={b.sprite} rarity={b.rarity} unlocked={false} />
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </section>
        </>
      )}
    </AppShell>
  );
}
