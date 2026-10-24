"use client";

import { useEffect } from "react";
import { StatusView } from "@/components/layout/StatusView";
import { useProgress } from "@/hooks/useProgress";
import { LessonShell } from "../LessonShell";
import { PREVIEW_LESSON_META, PreviewLessonEngine } from "./placeholders";
import { isLessonModule, type NextPlanetLink } from "./types";
import { useEngineModule } from "./useEngineModule";

export type LessonRuntimeProps = {
  /** content.engine (ou slug do planeta); ausente/desconhecido = modo prévia */
  engineKey: string | null | undefined;
  /** id do planeta para o progresso local (omitido em prévias) */
  planetId?: string | null;
  title: string;
  tags?: string[];
  /** força a etiqueta "Prévia" */
  preview?: boolean;
  backHref: string;
  backLabel?: string;
  nextPlanet?: NextPlanetLink | null;
};

/** Carrega o motor de aula pelo registro e roda o LessonShell (marca início e conclusão no progresso). */
export function LessonRuntime({ engineKey, planetId, title, tags, preview = false, backHref, backLabel, nextPlanet }: LessonRuntimeProps) {
  const engine = useEngineModule(engineKey);
  const { hydrated, markStarted, markCompleted, getPlanet } = useProgress();
  const mod = engine.module && isLessonModule(engine.module) ? engine.module : null;
  // Prévias (planeta sem motor) não entram no progresso nem liberam o próximo planeta.
  const trackedId = mod ? planetId : null;

  useEffect(() => {
    if (trackedId && hydrated) markStarted(trackedId);
  }, [trackedId, hydrated, markStarted]);

  if (engine.status === "loading") return <StatusView kind="loading" title="Preparando a cena" />;

  const completedBefore = trackedId ? getPlanet(trackedId)?.status === "completed" : false;

  return (
    <LessonShell
      title={title}
      tags={tags}
      preview={preview || !mod}
      meta={mod?.meta ?? PREVIEW_LESSON_META}
      Engine={mod?.default ?? PreviewLessonEngine}
      backHref={backHref}
      backLabel={backLabel}
      nextPlanet={nextPlanet}
      allScenesOpen={completedBefore}
      onComplete={() => {
        if (trackedId) markCompleted(trackedId);
      }}
    />
  );
}

export default LessonRuntime;
