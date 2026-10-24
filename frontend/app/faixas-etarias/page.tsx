"use client";

import { useRouter } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";
import type { BonziBuddyProps } from "@/components/bonzi/BonziBuddy";
import { AppShell } from "@/components/layout/AppShell";
import { StatusView } from "@/components/layout/StatusView";
import { Sprite } from "@/components/ui/Sprite";
import { SpriteButton } from "@/components/ui/SpriteButton";
import { cx } from "@/components/ui/cx";
import { DEFAULT_GALAXY_SPRITE, SPRITES, galaxySprite } from "@/config/assets";
import { ROUTES } from "@/config/routes";
import { useAsync } from "@/hooks/useAsync";
import { useExplorer } from "@/hooks/useExplorer";
import { getErrorMessage } from "@/services/apiClient";
import { getAgeRanges, getGalaxies } from "@/services/catalogService";
import type { Galaxy } from "@/types/domain";
import styles from "./page.module.css";

const BREADCRUMBS = [{ label: "Início", href: ROUTES.home }, { label: "Faixas etárias" }];
const ACCENTS = ["var(--cyan)", "var(--orange)", "var(--bonzi)", "var(--green)"];

export default function AgeRangesPage() {
  const router = useRouter();
  const { explorer, setAgeRange, hydrated } = useExplorer();
  const { data, loading, error, notImplemented, reload } = useAsync(
    () => Promise.all([getAgeRanges(), getGalaxies()]),
    [],
    { cacheKey: "age-ranges+galaxies" },
  );

  const bonzi: BonziBuddyProps = error
    ? { state: "warning", message: "Perdi o contato com a base. Vamos tentar de novo?" }
    : { state: "thinking", message: "Escolha seu universo de aprendizagem!" };

  const choose = (slug: string) => {
    setAgeRange(slug);
    router.push(ROUTES.galaxies);
  };

  let content: ReactNode;
  if (loading) {
    content = <StatusView kind="loading" />;
  } else if (notImplemented) {
    content = <StatusView kind="coming-soon" />;
  } else if (error || !data) {
    content = <StatusView kind="error" message={getErrorMessage(error)} onRetry={reload} />;
  } else if (data[0].length === 0) {
    content = <StatusView kind="empty" title="Nenhum universo" message="Ainda não há faixas etárias cadastradas." />;
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
                  Selecionada
                </span>
              )}
              <h2 id={titleId} className={styles.rangeName}>
                {range.name}
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

              <SpriteButton
                sprite={SPRITES.ui.play}
                label={`Escolher ${range.name}`}
                onClick={() => choose(range.slug)}
                variant="primary"
                size={26}
                className={styles.choose}
              />
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <AppShell breadcrumbs={BREADCRUMBS} bonzi={bonzi}>
      <div className={styles.page}>
        <h1 className={styles.heading}>Escolha seu universo</h1>
        {content}
      </div>
    </AppShell>
  );
}
