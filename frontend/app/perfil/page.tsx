"use client";

import { useId } from "react";
import { AvatarPicker } from "@/components/avatar/AvatarPicker";
import { Avatar } from "@/components/avatar/Avatar";
import { AchievementBadge } from "@/components/gamification/AchievementBadge";
import { ScoreCounter } from "@/components/gamification/ScoreCounter";
import { AppShell } from "@/components/layout/AppShell";
import { StatusView } from "@/components/layout/StatusView";
import { ProgressBar } from "@/components/progress/ProgressBar";
import { ProgressStateBadge } from "@/components/progress/ProgressStateBadge";
import { PixelPanel } from "@/components/ui/PixelPanel";
import { Sprite } from "@/components/ui/Sprite";
import { SpriteButton } from "@/components/ui/SpriteButton";
import { cx } from "@/components/ui/cx";
import { BADGES, SPRITES, galaxySprite } from "@/config/assets";
import { ROUTES } from "@/config/routes";
import { useAsync } from "@/hooks/useAsync";
import { explorerDisplayName, useExplorer } from "@/hooks/useExplorer";
import { useProgress } from "@/hooks/useProgress";
import { galaxyPlanetIds } from "@/lib/planetSlots";
import { galaxyStateForExplorer } from "@/lib/progress";
import { getErrorMessage } from "@/services/apiClient";
import { getAgeRanges, getGalaxies, getGalaxyDetails } from "@/services/catalogService";
import styles from "./page.module.css";

const PREVIEW_BADGES = BADGES.filter((b) => ["comum-1", "comum-2", "rara-1", "lenda-1"].includes(b.slug));

export default function ProfilePage() {
  const { explorer, setName, setAvatar, hydrated } = useExplorer();
  const nameId = useId();

  const progress = useProgress();
  const catalog = useAsync(() => Promise.all([getAgeRanges(), getGalaxies()]), [], { cacheKey: "age-ranges+galaxies" });
  const galaxySlugs = (catalog.data?.[1] ?? []).map((g) => g.slug);
  const details = useAsync(() => getGalaxyDetails(galaxySlugs), [catalog.data], {
    cacheKey: catalog.data ? `galaxy-details:${galaxySlugs.join(",")}` : undefined,
  });

  const ageRanges = catalog.data?.[0] ?? [];
  const galaxies = catalog.data?.[1] ?? [];
  const ageRange = ageRanges.find((r) => r.slug === explorer.ageRangeSlug);
  const totalPoints = progress.hydrated ? progress.totalPoints() : null;
  const completedPlanets = progress.hydrated ? progress.completedCount() : null;
  const galaxyRatio = (galaxyId: string): number => {
    const detail = details.data?.find((d) => d?.id === galaxyId);
    const ids = detail ? galaxyPlanetIds(detail) : [];
    return progress.hydrated && ids.length > 0 ? progress.completionRatio(ids) : 0;
  };
  const sortedGalaxies = [...galaxies].sort(
    (a, b) =>
      (ageRanges.find((r) => r.id === a.age_range_id)?.min_age ?? 0) -
      (ageRanges.find((r) => r.id === b.age_range_id)?.min_age ?? 0),
  );

  let ageRangeLabel = "Ainda não escolhida";
  if (explorer.ageRangeSlug) {
    if (catalog.loading) ageRangeLabel = "Carregando...";
    else ageRangeLabel = ageRange?.name ?? "Indisponível";
  }

  return (
    <AppShell
      breadcrumbs={[{ label: "Início", href: ROUTES.home }, { label: "Perfil" }]}
      bonzi={{ state: "happy", message: "Escolha um personagem e dê um nome ao seu explorador!" }}
    >
      <section className={styles.hero} aria-labelledby={`${nameId}-title`}>
        <div className={styles.portrait}>
          <span className={styles.orbit} aria-hidden="true" />
          <span className={styles.pad} aria-hidden="true" />
          <Avatar slug={explorer.avatarSlug} size={176} framed className={styles.avatar} />
        </div>

        <div className={styles.identity}>
          <p className={styles.eyebrow}>Ficha do explorador</p>
          <h1 id={`${nameId}-title`} className={styles.name}>
            {explorerDisplayName(explorer)}
          </h1>

          <div className={styles.field}>
            <label htmlFor={nameId} className={styles.fieldLabel}>
              Nome do explorador
            </label>
            <input
              id={nameId}
              type="text"
              className={styles.input}
              value={explorer.name}
              maxLength={24}
              placeholder="Explorador"
              autoComplete="off"
              spellCheck={false}
              disabled={!hydrated}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className={styles.facts}>
            <div className={styles.fact}>
              <span className={styles.factLabel}>Faixa etária</span>
              <strong className={styles.factValue}>{ageRangeLabel}</strong>
              <SpriteButton
                sprite={SPRITES.ui.map}
                label={explorer.ageRangeSlug ? "Trocar faixa" : "Escolher faixa"}
                href={ROUTES.ageRanges}
                size={20}
              />
            </div>
            <div className={styles.fact}>
              <span className={styles.factLabel}>Planetas concluídos</span>
              <strong className={styles.factValue}>{completedPlanets ?? "..."}</strong>
            </div>
            <div className={styles.fact}>
              <ScoreCounter points={totalPoints} label="Pontuação total" size="lg" />
            </div>
          </div>
        </div>
      </section>

      <PixelPanel title="Escolha seu personagem">
        <AvatarPicker value={explorer.avatarSlug} onChange={setAvatar} />
      </PixelPanel>

      <div className={styles.columns}>
        <PixelPanel title="Progresso por galáxia">
          {catalog.loading && <StatusView kind="loading" title="Buscando galáxias" />}
          {catalog.error !== undefined && (
            <StatusView kind="error" message={getErrorMessage(catalog.error)} onRetry={catalog.reload} />
          )}
          {catalog.data && (
            <ul className={styles.galaxies}>
              {sortedGalaxies.map((galaxy) => {
                const state = galaxyStateForExplorer(galaxy, ageRanges, explorer.ageRangeSlug);
                const range = ageRanges.find((r) => r.id === galaxy.age_range_id);
                return (
                  <li key={galaxy.id} className={cx(styles.galaxy, state === "locked" && styles.galaxyLocked)}>
                    <Sprite src={galaxySprite(galaxy.slug)} alt="" decorative size={72} className={styles.galaxySprite} />
                    <div className={styles.galaxyInfo}>
                      <div className={styles.galaxyHead}>
                        <h3 className={styles.galaxyName}>{galaxy.name}</h3>
                        <ProgressStateBadge state={state} size={16} />
                      </div>
                      {range && <span className={styles.galaxyRange}>{range.name}</span>}
                      <ProgressBar value={galaxyRatio(galaxy.id)} label="Planetas concluídos" showValue />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </PixelPanel>

        <PixelPanel title="Conquistas">
          <ul className={styles.badges}>
            {PREVIEW_BADGES.map((badge) => (
              <li key={badge.slug}>
                <AchievementBadge name="???" sprite={badge.sprite} rarity={badge.rarity} unlocked={false} />
              </li>
            ))}
          </ul>
          <div className={styles.more}>
            <SpriteButton sprite={SPRITES.ui.achievements} label="Ver conquistas" href={ROUTES.achievements} size={24} />
          </div>
        </PixelPanel>
      </div>
    </AppShell>
  );
}
