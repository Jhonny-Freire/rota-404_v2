"use client";

import { useParams } from "next/navigation";
import type { ReactNode } from "react";
import type { BonziBuddyProps } from "@/components/bonzi/BonziBuddy";
import { AppShell } from "@/components/layout/AppShell";
import { StatusView } from "@/components/layout/StatusView";
import { SpaceMap, type SpaceMapNode } from "@/components/space/SpaceMap";
import { SystemNode } from "@/components/space/SystemNode";
import { Sprite } from "@/components/ui/Sprite";
import { galaxySprite } from "@/config/assets";
import { ROUTES } from "@/config/routes";
import { useAsync } from "@/hooks/useAsync";
import { useProgress } from "@/hooks/useProgress";
import { sortPlanets } from "@/lib/planetSlots";
import { aggregateState } from "@/lib/progress";
import { getErrorMessage } from "@/services/apiClient";
import { getGalaxy } from "@/services/catalogService";
import styles from "./page.module.css";

function pathPosition(index: number, count: number) {
  if (count === 1) return { x: 50, y: 50 };
  return { x: 12 + (76 * index) / (count - 1), y: index % 2 === 0 ? 68 : 32 };
}

export default function GalaxyPage() {
  const { galaxySlug } = useParams<{ galaxySlug: string }>();
  const { data: galaxy, loading, error, notFound, notImplemented, reload } = useAsync(
    () => getGalaxy(galaxySlug),
    [galaxySlug],
    { cacheKey: `galaxy:${galaxySlug}` },
  );
  const progress = useProgress();

  const breadcrumbs = [
    { label: "Início", href: ROUTES.home },
    { label: "Galáxias", href: ROUTES.galaxies },
    { label: galaxy?.name ?? (notFound ? "Não encontrada" : "Galáxia") },
  ];

  let bonzi: BonziBuddyProps | null = null;
  if (galaxy) bonzi = { state: "speaking", message: `Bem-vindo à galáxia ${galaxy.name}! Escolha um sistema planetário.` };
  else if (notFound) bonzi = { state: "warning", message: "Hmm, essa galáxia não está no mapa." };
  else if (error && !notImplemented) bonzi = { state: "warning", message: "Perdi o contato com a base. Vamos tentar de novo?" };

  let content: ReactNode;
  if (loading) {
    content = <StatusView kind="loading" />;
  } else if (notFound) {
    content = (
      <StatusView
        kind="not-found"
        title="Galáxia não encontrada"
        message="Esta galáxia não existe no mapa do Rota 404."
        action={{ label: "Voltar ao mapa", href: ROUTES.galaxies }}
      />
    );
  } else if (notImplemented) {
    content = <StatusView kind="coming-soon" />;
  } else if (error || !galaxy) {
    content = <StatusView kind="error" message={getErrorMessage(error)} onRetry={reload} />;
  } else {
    const systems = [...galaxy.systems].sort((a, b) => a.order_index - b.order_index);
    const summaries = systems.map((system) => {
      const planets = sortPlanets(system.planets ?? []);
      const ids = planets.map((planet) => planet.id);
      return {
        system,
        ratio: progress.hydrated && ids.length > 0 ? progress.completionRatio(ids) : 0,
        state: progress.hydrated && ids.length > 0 ? aggregateState(ids.map((id) => progress.planetState(id, ids))) : ("available" as const),
      };
    });
    const nodes: SpaceMapNode[] = summaries.map(({ system, ratio, state }, index) => ({
      id: system.id,
      ...pathPosition(index, systems.length),
      content: (
        <SystemNode system={system} index={index} state={state} href={ROUTES.system(system.slug)} progress={ratio} />
      ),
    }));
    const rocketSystem = summaries.find((summary) => summary.ratio < 1)?.system ?? systems[0];

    content = (
      <>
        <header className={styles.header}>
          <span className={styles.galaxyArt}>
            <Sprite src={galaxySprite(galaxy.slug)} alt="" decorative className={styles.galaxySprite} />
          </span>
          <div className={styles.headerText}>
            <span className={styles.rangeTag}>{galaxy.age_range.name}</span>
            <h1 className={styles.title}>{galaxy.name}</h1>
            {galaxy.description && <p className={styles.description}>{galaxy.description}</p>}
          </div>
        </header>

        {systems.length === 0 ? (
          <StatusView
            kind="empty"
            title="Nenhum sistema"
            message="Esta galáxia ainda não tem sistemas planetários."
            action={{ label: "Voltar ao mapa", href: ROUTES.galaxies }}
          />
        ) : (
          <SpaceMap
            nodes={nodes}
            rocketAt={rocketSystem?.id}
            aspectRatio={2.1}
            ariaLabel={`Sistemas planetários da galáxia ${galaxy.name}`}
            className={styles.map}
          />
        )}
      </>
    );
  }

  return (
    <AppShell breadcrumbs={breadcrumbs} bonzi={bonzi}>
      {content}
    </AppShell>
  );
}
