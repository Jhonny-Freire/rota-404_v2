"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { AvatarPicker } from "@/components/avatar/AvatarPicker";
import { Avatar } from "@/components/avatar/Avatar";
import { AchievementBadge } from "@/components/gamification/AchievementBadge";
import { ScoreCounter } from "@/components/gamification/ScoreCounter";
import { AppShell } from "@/components/layout/AppShell";
import { FitToHeight } from "@/components/layout/FitToHeight";
import { StatusView } from "@/components/layout/StatusView";
import { ProgressBar } from "@/components/progress/ProgressBar";
import { ProgressStateBadge } from "@/components/progress/ProgressStateBadge";
import { PixelPanel } from "@/components/ui/PixelPanel";
import { Sprite } from "@/components/ui/Sprite";
import { SpriteButton } from "@/components/ui/SpriteButton";
import { cx } from "@/components/ui/cx";
import { ACHIEVEMENTS } from "@/config/achievements";
import { SPRITES, galaxySprite } from "@/config/assets";
import { ROUTES } from "@/config/routes";
import { useAchievements } from "@/hooks/useAchievements";
import { useAsync } from "@/hooks/useAsync";
import { explorerDisplayName, useExplorer } from "@/hooks/useExplorer";
import { useProgress } from "@/hooks/useProgress";
import { useSession } from "@/hooks/useSession";
import { trackName } from "@/lib/galaxyTrack";
import { unlockAchievement } from "@/lib/achievementEvents";
import { galaxyPlanetIds } from "@/lib/planetSlots";
import { galaxyStateForExplorer } from "@/lib/progress";
import { getErrorMessage } from "@/services/apiClient";
import { getAgeRanges, getGalaxies, getGalaxyDetails } from "@/services/catalogService";
import styles from "./page.module.css";

const PREVIEW_COUNT = 4;

export default function ProfilePage() {
  const router = useRouter();
  const { explorer, setAvatar } = useExplorer();
  const { status, user, updateUser, logout } = useSession();
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const nameId = useId();

  /** troca na hora (HUD e mapa) e salva na conta; se falhar, volta o anterior */
  const changeAvatar = (slug: string) => {
    const previous = explorer.avatarSlug;
    setAvatar(slug);
    if (slug !== previous) unlockAchievement("c-01");
    setAvatarError(null);
    if (status !== "signed-in" && status !== "guest") return;
    updateUser({ avatar_key: slug }).catch((error: unknown) => {
      setAvatar(previous);
      setAvatarError(getErrorMessage(error));
    });
  };

  const leave = async () => {
    await logout();
    router.replace(ROUTES.login);
  };

  const progress = useProgress();
  const { unlocked } = useAchievements();
  // prévia: as mais recentes; o resto com as próximas a buscar (as secretas por último)
  const preview = [
    ...ACHIEVEMENTS.filter((a) => unlocked[a.slug]).sort((a, b) => unlocked[b.slug].localeCompare(unlocked[a.slug])),
    ...ACHIEVEMENTS.filter((a) => !unlocked[a.slug] && !a.secret),
    ...ACHIEVEMENTS.filter((a) => !unlocked[a.slug] && a.secret),
  ].slice(0, PREVIEW_COUNT);
  const unlockedCount = ACHIEVEMENTS.filter((a) => unlocked[a.slug]).length;
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

  let universeLabel = "Não definido";
  if (explorer.ageRangeSlug) {
    if (catalog.loading) universeLabel = "Carregando...";
    else
      universeLabel =
        galaxies
          .filter((g) => g.age_range_id === ageRange?.id)
          .map((g) => g.name)
          .join(", ") || "Indisponível";
  }

  return (
    <AppShell
      fit
      breadcrumbs={[{ label: "Início", href: ROUTES.home }, { label: "Perfil" }]}
      bonzi={{ state: "happy", message: "Esta é a sua ficha. Quer trocar de personagem?" }}
    >
      <FitToHeight align="top">
        <div className={styles.board}>
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

              <div className={styles.account}>
                {status === "signed-in" ? (
                  <SpriteButton sprite={SPRITES.ui.close} label="Sair da conta" onClick={() => void leave()} size={20} />
                ) : (
                  <>
                    <span className={styles.factLabel}>Jogando sem conta: os pontos não entram no ranking.</span>
                    <SpriteButton sprite={SPRITES.ui.profile} label="Entrar ou criar conta" onClick={() => void leave()} size={20} />
                  </>
                )}
              </div>

              <div className={styles.facts}>
                {user && (
                  <div className={styles.fact}>
                    <span className={styles.factLabel}>Idade</span>
                    <strong className={styles.factValue}>{user.age} anos</strong>
                  </div>
                )}
                <div className={styles.fact}>
                  <span className={styles.factLabel}>Universo</span>
                  <strong className={styles.factValue}>{universeLabel}</strong>
                </div>
                <div className={styles.fact}>
                  <span className={styles.factLabel}>Planetas concluídos</span>
                  <strong className={styles.factValue}>{completedPlanets ?? "..."}</strong>
                </div>
                <div className={cx(styles.fact, styles.scoreFact)}>
                  <ScoreCounter points={totalPoints} label="Pontuação total" size="lg" />
                </div>
              </div>
            </div>
          </section>

          <PixelPanel title="Escolha seu personagem" className={styles.picker}>
            <AvatarPicker value={explorer.avatarSlug} onChange={changeAvatar} className={styles.avatarRow} avatarSize={64} />
            {avatarError && (
              <p role="alert" className={styles.avatarError}>
                Não deu para salvar o personagem: {avatarError}
              </p>
            )}
          </PixelPanel>

          <PixelPanel title="Progresso por galáxia" className={styles.progress}>
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
                        {range && <span className={styles.galaxyRange}>{trackName(range)}</span>}
                        <ProgressBar value={galaxyRatio(galaxy.id)} label="Planetas concluídos" showValue />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </PixelPanel>

          <PixelPanel title={`Conquistas ${unlockedCount}/${ACHIEVEMENTS.length}`} className={styles.achievements}>
            <ul className={styles.badges}>
              {preview.map((a) => (
                <li key={a.slug}>
                  <AchievementBadge name={a.name} sprite={a.sprite} rarity={a.rarity} secret={a.secret} unlocked={Boolean(unlocked[a.slug])} compact />
                </li>
              ))}
            </ul>
            <div className={styles.more}>
              <SpriteButton sprite={SPRITES.ui.achievements} label="Ver conquistas" href={ROUTES.achievements} size={24} />
            </div>
          </PixelPanel>
        </div>
      </FitToHeight>
    </AppShell>
  );
}
