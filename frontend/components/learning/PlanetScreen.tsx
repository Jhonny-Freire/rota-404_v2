"use client";

import { useParams, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { StatusView } from "@/components/layout/StatusView";
import type { BonziBuddyProps } from "@/components/bonzi/BonziBuddy";
import type { BreadcrumbItem } from "@/components/navigation/Breadcrumbs";
import { ROUTES } from "@/config/routes";
import { useAsync } from "@/hooks/useAsync";
import { useProgress } from "@/hooks/useProgress";
import { sortPlanets } from "@/lib/planetSlots";
import { getErrorMessage } from "@/services/apiClient";
import { getGalaxy } from "@/services/catalogService";
import type { PlanetType } from "@/types/domain";
import { LockedPlanet } from "./LockedPlanet";
import { LabRuntime } from "./runtime/LabRuntime";
import { LessonRuntime } from "./runtime/LessonRuntime";
import { loadPlanetContext, planetContextKey } from "./runtime/planetContext";

const TEXT: Record<PlanetType, { loading: string; notFound: string; crumb: string }> = {
  lesson: { loading: "Preparando a aula", notFound: "Aula não encontrada", crumb: "Aula" },
  lab: { loading: "Montando o laboratório", notFound: "Laboratório não encontrado", crumb: "Laboratório" },
};

/** Corpo das páginas /aulas/[id] e /laboratorios/[id]. */
export function PlanetScreen({ kind }: { kind: PlanetType }) {
  const params = useParams<{ id: string }>();
  const id = String(params.id ?? "");
  const systemSlug = useSearchParams().get("sistema") ?? "";
  const progress = useProgress();
  const { data, loading, error, notFound, reload } = useAsync(
    () => loadPlanetContext(kind, id, systemSlug || undefined),
    [kind, id, systemSlug],
    { cacheKey: planetContextKey(kind, id, systemSlug || undefined) },
  );
  const text = TEXT[kind];
  const system = data?.system ?? null;
  // sistema bloqueado (o anterior da galáxia ainda não foi concluído): o detalhe da galáxia diz
  const galaxySlug = system?.galaxy.slug;
  const galaxy = useAsync(() => (galaxySlug ? getGalaxy(galaxySlug) : Promise.resolve(null)), [galaxySlug], {
    cacheKey: galaxySlug ? `galaxy:${galaxySlug}` : undefined,
  });
  let systemLocked = false;
  if (system && galaxy.data && progress.hydrated) {
    const ordered = [...galaxy.data.systems].sort((a, b) => a.order_index - b.order_index);
    const position = ordered.findIndex((s) => s.id === system.id);
    const ids = ordered.map((s) => sortPlanets(s.planets ?? []).map((planet) => planet.id));
    systemLocked = position > 0 && !progress.systemUnlocked(ids, position);
  }

  const breadcrumbs: BreadcrumbItem[] = [
    { label: "Início", href: ROUTES.home },
    { label: "Galáxias", href: ROUTES.galaxies },
    ...(system
      ? [
          { label: system.galaxy.name, href: ROUTES.galaxy(system.galaxy.slug) },
          { label: system.name, href: ROUTES.system(system.slug) },
        ]
      : []),
    { label: data?.planet?.name ?? (data ? data.title : text.crumb) },
  ];

  const backHref = system ? ROUTES.system(system.slug) : ROUTES.galaxies;
  const backLabel = system ? "Voltar ao sistema" : "Voltar às galáxias";

  let bonzi: BonziBuddyProps | null = null;
  let content: ReactNode;

  if (loading || (data && (!progress.hydrated || galaxy.loading))) {
    content = <StatusView kind="loading" title={text.loading} />;
  } else if (notFound) {
    content = <StatusView kind="not-found" title={text.notFound} action={{ label: backLabel, href: backHref }} />;
  } else if (error || !data) {
    bonzi = { state: "warning", message: "Perdemos o sinal da base. Vamos tentar de novo?" };
    content = <StatusView kind="error" message={getErrorMessage(error)} onRetry={reload} />;
  } else if (data.planet && systemLocked) {
    // fala dublada existente (o planeta anterior é o último do sistema anterior); o texto escrito explica o sistema
    bonzi = { state: "warning", message: "Conclua o planeta anterior para liberar este." };
    content = (
      <LockedPlanet title={data.planet.name} backHref={backHref} backLabel={backLabel} message="Conclua o sistema anterior para liberar este." />
    );
  } else if (data.planet && progress.planetState(data.planet.id, data.orderedPlanets.map((p) => p.id)) === "locked") {
    bonzi = { state: "warning", message: "Conclua o planeta anterior para liberar este." };
    content = <LockedPlanet title={data.planet.name} backHref={backHref} backLabel={backLabel} />;
  } else {
    const tags = data.code ? [`Planeta ${data.code}`] : [];
    const common = {
      engineKey: data.engineKey,
      planetId: data.planet?.id ?? null,
      title: data.title,
      tags,
      preview: data.source === "preview",
      backHref,
      backLabel,
      nextPlanet: data.nextPlanet,
    };
    content =
      kind === "lesson" ? (
        <LessonRuntime key={data.planet?.id ?? id} {...common} />
      ) : (
        <LabRuntime key={data.planet?.id ?? id} {...common} maxScore={data.maxScore} />
      );
  }

  return (
    <AppShell breadcrumbs={breadcrumbs} breadcrumbsCompact="hide" bonzi={bonzi} fit easterEgg={false}>
      {content}
    </AppShell>
  );
}

export default PlanetScreen;
