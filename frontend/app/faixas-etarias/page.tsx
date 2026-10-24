"use client";

import { useRouter } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";
import type { BonziBuddyProps } from "@/components/bonzi/BonziBuddy";
import { AppShell } from "@/components/layout/AppShell";
import { FitToHeight } from "@/components/layout/FitToHeight";
import { StatusView } from "@/components/layout/StatusView";
import { Sprite } from "@/components/ui/Sprite";
import { SpriteButton } from "@/components/ui/SpriteButton";
import { cx } from "@/components/ui/cx";
import { DEFAULT_GALAXY_SPRITE, SPRITES, galaxySprite } from "@/config/assets";
import { ROUTES } from "@/config/routes";
import { useAsync } from "@/hooks/useAsync";
import { useExplorer } from "@/hooks/useExplorer";
import { trackName } from "@/lib/galaxyTrack";
import { getErrorMessage } from "@/services/apiClient";
import { getAgeRanges, getGalaxies } from "@/services/catalogService";
import type { Galaxy } from "@/types/domain";
import styles from "./page.module.css";

const BREADCRUMBS = [{ label: "Início", href: ROUTES.home }, { label: "Universos" }];
const ACCENTS = ["var(--cyan)", "var(--orange)", "var(--bonzi)", "var(--green)"];

export default function AgeRangesPage() {
  const router = useRouter();
  // a faixa vem do nível de conhecimento da conta (useSession): aqui só se entra no próprio universo
  const { explorer, hydrated } = useExplorer();
  const { data, loading, error, notImplemented, reload } = useAsync(
    () => Promise.all([getAgeRanges(), getGalaxies()]),
    [],
    { cacheKey: "age-ranges+galaxies" },
  );

  const bonzi: BonziBuddyProps = error
    ? { state: "warning", message: "Perdi o contato com a base. Vamos tentar de novo?" }
    : { state: "thinking", message: "O quanto você já sabe escolheu o seu universo. Vamos entrar nele?" };

  let content: ReactNode;
  if (loading) {
    content = <StatusView kind="loading" />;
  } else if (notImplemented) {
    content = <StatusView kind="coming-soon" />;
  } else if (error || !data) {
    content = <StatusView kind="error" message={getErrorMessage(error)} onRetry={reload} />;
  } else if (data[0].length === 0) {
    content = <StatusView kind="empty" title="Nenhum universo" message="Ainda não há universos cadastrados." />;
  } else {
    const [ageRanges, galaxies] = data;
    const byRange = new Map<string, Galaxy[]>();
    for (const galaxy of galaxies) {
      byRange.set(galaxy.age_range_id, [...(byRange.get(galaxy.age_range_id) ?? []), galaxy]);
    }

    content = (
      <ul className={styles.portals}>
        {ageRanges.map((range, index) => {
          const rangeGalaxies = byRange.get(range.id) ?? [];
          const selected = hydrated && explorer.ageRangeSlug === range.slug;
          const titleId = `faixa-${range.slug}`;
          return (
            <li
              key={range.id}
              className={cx(styles.portal, selected && styles.selected)}
              style={{ "--accent": ACCENTS[index % ACCENTS.length] } as CSSProperties}
              aria-labelledby={titleId}
            >
              {selected && (
                <span className={styles.selectedTag}>
                  <Sprite src={SPRITES.status.completed} alt="" decorative size={18} />
                  Seu universo
                </span>
              )}
              <h2 id={titleId} className={styles.rangeName}>
                {trackName(range)}
              </h2>

              <div className={cx(styles.galaxies, rangeGalaxies.length > 1 && styles.compact)}>
                {rangeGalaxies.length === 0 ? (
                  <div className={cx(styles.galaxy, styles.empty)}>
                    <span className={styles.vortex}>
                      <Sprite src={DEFAULT_GALAXY_SPRITE} alt="" decorative className={styles.galaxySprite} />
                    </span>
                    <span className={styles.galaxyName}>Galáxia em breve</span>
                  </div>
                ) : (
                  rangeGalaxies.map((galaxy) => (
                    <div key={galaxy.id} className={styles.galaxy}>
                      <span className={styles.vortex}>
                        <Sprite src={galaxySprite(galaxy.slug)} alt="" decorative className={styles.galaxySprite} />
                      </span>
                      <span className={styles.galaxyName}>
                        <span className="sr-only">Galáxia </span>
                        {galaxy.name}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {selected || !explorer.ageRangeSlug ? (
                <SpriteButton
                  sprite={SPRITES.ui.play}
                  label="Entrar no meu universo"
                  onClick={() => router.push(ROUTES.galaxies)}
                  variant="primary"
                  size={26}
                  className={styles.choose}
                />
              ) : (
                <p className={styles.otherRange}>
                  <Sprite src={SPRITES.status.locked} alt="" decorative size={18} />
                  Não é o seu universo.
                </p>
              )}
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <AppShell breadcrumbs={BREADCRUMBS} bonzi={bonzi} fit>
      <div className={styles.page}>
        <h1 className={styles.heading}>Seu universo</h1>
        <FitToHeight>{content}</FitToHeight>
      </div>
    </AppShell>
  );
}
