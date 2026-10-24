"use client";

import { useState, type ReactNode } from "react";
import type { BonziBuddyProps } from "@/components/bonzi/BonziBuddy";
import { AppShell } from "@/components/layout/AppShell";
import { FitToHeight } from "@/components/layout/FitToHeight";
import { StatusView } from "@/components/layout/StatusView";
import { ProgressStateBadge } from "@/components/progress/ProgressStateBadge";
import { GalaxyNode } from "@/components/space/GalaxyNode";
import { SpaceMap, type SpaceMapNode } from "@/components/space/SpaceMap";
import { ROUTES } from "@/config/routes";
import { useAsync } from "@/hooks/useAsync";
import { useExplorer } from "@/hooks/useExplorer";
import { useProgress } from "@/hooks/useProgress";
import { galaxyPlanetIds } from "@/lib/planetSlots";
import { galaxyStateForExplorer } from "@/lib/progress";
import { getErrorMessage } from "@/services/apiClient";
import { getAgeRanges, getGalaxies, getGalaxyDetails } from "@/services/catalogService";
import type { ProgressState } from "@/types/domain";
import styles from "./page.module.css";

/** vaga da nave à esquerda de cada galáxia (sprite de 220 px) */
const GALAXY_DOCK = { x: -164, y: 72, size: 48, tilt: 30 };

const BREADCRUMBS = [{ label: "Início", href: ROUTES.home }, { label: "Galáxias" }];
const LEGEND: ProgressState[] = ["available", "locked", "in_progress", "completed"];

export default function GalaxiesPage() {
  const { explorer, hydrated } = useExplorer();
  const [lockedHint, setLockedHint] = useState(false);
  const { data, loading, error, notImplemented, reload } = useAsync(
    () => Promise.all([getGalaxies(), getAgeRanges()]),
    [],
    { cacheKey: "galaxies+age-ranges" },
  );
  const progress = useProgress();
  const galaxySlugs = (data?.[0] ?? []).map((galaxy) => galaxy.slug);
  const details = useAsync(() => getGalaxyDetails(galaxySlugs), [data], {
    cacheKey: data ? `galaxy-details:${galaxySlugs.join(",")}` : undefined,
  });

  const galaxyProgress = (galaxyId: string): number => {
    const detail = details.data?.find((d) => d?.id === galaxyId);
    if (!detail || !progress.hydrated) return 0;
    const ids = galaxyPlanetIds(detail);
    return ids.length > 0 ? progress.completionRatio(ids) : 0;
  };

  const ageRanges = data?.[1] ?? [];
  const currentRange = ageRanges.find((range) => range.slug === explorer.ageRangeSlug);
  const needsRange = hydrated && !explorer.ageRangeSlug;

  let bonzi: BonziBuddyProps;
  if (error && !notImplemented) bonzi = { state: "warning", message: "Perdi o contato com a base. Vamos tentar de novo?" };
  else if (lockedHint) bonzi = { state: "warning", message: "Esta galáxia é de outro universo: o quanto você já sabe escolheu a sua." };
  else if (needsRange) bonzi = { state: "help", message: "Não consegui achar a sua faixa etária, então todas as galáxias estão abertas." };
  else bonzi = { state: "speaking", message: "Escolha uma galáxia e vamos decolar!" };

  let content: ReactNode;
  if (loading) {
    content = <StatusView kind="loading" />;
  } else if (notImplemented) {
    content = <StatusView kind="coming-soon" />;
  } else if (error || !data) {
    content = <StatusView kind="error" message={getErrorMessage(error)} onRetry={reload} />;
  } else if (data[0].length === 0) {
    content = <StatusView kind="empty" title="Nenhuma galáxia" message="Ainda não há galáxias neste mapa." />;
  } else {
    const galaxies = data[0];
    const count = galaxies.length;
    const items = galaxies.map((galaxy, index) => ({
      galaxy,
      state: galaxyStateForExplorer(galaxy, ageRanges, hydrated ? explorer.ageRangeSlug : null),
      x: ((index + 0.5) / count) * 100,
      y: count > 1 ? (index % 2 === 0 ? 46 : 54) : 50,
    }));
    const firstAvailable = items.find((item) => item.state !== "locked");

    const nodes: SpaceMapNode[] = items.map(({ galaxy, state, x, y }) => ({
      id: galaxy.id,
      x,
      y,
      locked: state === "locked",
      title: galaxy.name,
      kicker: "Galáxia",
      href: ROUTES.galaxy(galaxy.slug),
      content: (
        <div className={styles.galaxy}>
          <GalaxyNode
            galaxy={galaxy}
            state={state}
            href={ROUTES.galaxy(galaxy.slug)}
            progress={galaxyProgress(galaxy.id)}
            onLockedClick={() => setLockedHint(true)}
            highlight={hydrated && !needsRange && state !== "locked"}
          />
          {galaxy.description && <p className={styles.description}>{galaxy.description}</p>}
        </div>
      ),
    }));

    content = (
      <>
        <FitToHeight>
          <SpaceMap
            nodes={nodes}
            edges={[]}
            rocketAt={firstAvailable?.galaxy.id}
            mapId="galaxias"
            dock={GALAXY_DOCK}
            aspectRatio={2.2}
            ariaLabel="Mapa das galáxias"
            className={styles.map}
          />
        </FitToHeight>
        <ul className={styles.legend} aria-label="Legenda dos estados">
          {LEGEND.map((state) => (
            <li key={state}>
              <ProgressStateBadge state={state} size={18} />
            </li>
          ))}
        </ul>
      </>
    );
  }

  return (
    <AppShell breadcrumbs={BREADCRUMBS} bonzi={bonzi} fit>
      <header className={styles.header}>
        <h1 className={styles.heading}>Mapa das galáxias</h1>
        <div className={styles.universe}>
          {currentRange && (
            <span className={styles.rangeTag}>
              <span className={styles.rangeLabel}>Universo</span>
              {currentRange.name}
            </span>
          )}
        </div>
      </header>

      {content}
    </AppShell>
  );
}
