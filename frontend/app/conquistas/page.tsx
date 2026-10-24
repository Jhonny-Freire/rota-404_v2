"use client";

import { useState } from "react";
import { AchievementBadge, RARITY_LABELS } from "@/components/gamification/AchievementBadge";
import { AppShell } from "@/components/layout/AppShell";
import { FitToHeight } from "@/components/layout/FitToHeight";
import { StatusView } from "@/components/layout/StatusView";
import { ProgressBar } from "@/components/progress/ProgressBar";
import { Sprite } from "@/components/ui/Sprite";
import { cx } from "@/components/ui/cx";
import { ACHIEVEMENTS, ACHIEVEMENT_RARITIES, achievementBySlug } from "@/config/achievements";
import { SPRITES } from "@/config/assets";
import { ROUTES } from "@/config/routes";
import { useAchievements } from "@/hooks/useAchievements";
import { useSession } from "@/hooks/useSession";
import styles from "./page.module.css";

function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("pt-BR");
}

export default function AchievementsPage() {
  const { ready, unlocked } = useAchievements();
  const { status } = useSession();
  const [picked, setPicked] = useState<string | null>(null);
  const total = ACHIEVEMENTS.length;
  const count = ACHIEVEMENTS.filter((a) => unlocked[a.slug]).length;
  // sem escolha: a mais recente; sem nenhuma, a primeira a buscar
  const latest = ACHIEVEMENTS.filter((a) => unlocked[a.slug]).sort((a, b) => unlocked[b.slug].localeCompare(unlocked[a.slug]))[0];
  const current = (picked && achievementBySlug(picked)) || latest || ACHIEVEMENTS[0];
  const currentUnlocked = Boolean(unlocked[current.slug]);
  const currentHidden = current.secret && !currentUnlocked;

  return (
    <AppShell
      fit
      breadcrumbs={[{ label: "Início", href: ROUTES.home }, { label: "Conquistas" }]}
      bonzi={{ state: "thinking", message: "Cada missão concluída pode revelar uma conquista nova." }}
    >
      <header className={styles.header}>
        <div className={styles.heading}>
          <Sprite src={SPRITES.ui.achievements} alt="" decorative size={56} className={styles.medal} />
          <h1 className={styles.title}>Conquistas</h1>
        </div>
        {ready && (
          <div className={styles.counter}>
            <p className={styles.count}>
              <span aria-hidden="true">
                <span className={styles.countValue}>{count}</span> / {total}
              </span>
              <span className="sr-only">
                {count} de {total} conquistas desbloqueadas
              </span>
            </p>
            <ProgressBar value={count / total} label="Conquistas desbloqueadas" segments={total} />
          </div>
        )}
      </header>

      {!ready && <StatusView kind="loading" title="Abrindo o cofre" />}

      {ready && (
        <FitToHeight align="top">
          <div className={styles.board}>
            {/* uma grade só, na ordem das raridades (a cor e a etiqueta de cada medalha dizem a raridade): cabe na janela */}
            <div className={styles.collection}>
              <ul className={styles.legend} aria-label="Conquistas por raridade">
                {ACHIEVEMENT_RARITIES.map((rarity) => {
                  const list = ACHIEVEMENTS.filter((a) => a.rarity === rarity);
                  return (
                    <li key={rarity} className={cx(styles.chip, styles[rarity])}>
                      {RARITY_LABELS[rarity]}
                      <span className={styles.chipCount}>
                        {list.filter((a) => unlocked[a.slug]).length}/{list.length}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <ul className={styles.grid}>
                {ACHIEVEMENTS.map((a) => (
                  <li key={a.slug}>
                    <button
                      type="button"
                      className={cx(styles.pick, a.slug === current.slug && styles.picked)}
                      onClick={() => setPicked(a.slug)}
                      aria-pressed={a.slug === current.slug}
                    >
                      <AchievementBadge name={a.name} sprite={a.sprite} rarity={a.rarity} secret={a.secret} unlocked={Boolean(unlocked[a.slug])} compact />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <aside className={cx(styles.detail, styles[current.rarity])} aria-live="polite" aria-label="Detalhes da conquista">
              <Sprite
                src={current.sprite}
                alt=""
                decorative
                size={128}
                className={cx(styles.detailArt, !currentUnlocked && styles.detailLocked, currentHidden && styles.detailHidden)}
              />
              <span className={styles.detailRarity}>{RARITY_LABELS[current.rarity]}</span>
              <h2 className={styles.detailName}>{currentHidden ? "???" : current.name}</h2>
              <p className={styles.detailText}>
                {currentHidden ? "Conquista secreta: continue explorando para descobrir." : current.description}
              </p>
              <p className={cx(styles.detailStatus, currentUnlocked && styles.detailDone)}>
                {currentUnlocked ? `Desbloqueada em ${formatDate(unlocked[current.slug])}` : "Ainda bloqueada"}
              </p>
              <p className={styles.note}>
                {status === "guest"
                  ? "Jogando sem conta: as conquistas ficam só neste aparelho e as de ranking não valem."
                  : "Toque numa conquista para ver como ganhar. Algumas são secretas!"}
              </p>
            </aside>
          </div>
        </FitToHeight>
      )}
    </AppShell>
  );
}
