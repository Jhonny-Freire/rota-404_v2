"use client";

import { useEffect } from "react";
import { StatusView } from "@/components/layout/StatusView";
import { useProgress } from "@/hooks/useProgress";
import { LabShell } from "../LabShell";
import { PREVIEW_LAB_META, PreviewLabEngine } from "./placeholders";
import { isLabModule, type NextPlanetLink } from "./types";
import { useEngineModule } from "./useEngineModule";

export type LabRuntimeProps = {
  /** config.engine (ou slug do planeta); ausente/desconhecido = modo prévia */
  engineKey: string | null | undefined;
  /** id do planeta para o progresso local (omitido em prévias) */
  planetId?: string | null;
  title: string;
  tags?: string[];
  /** labs.max_score. Padrão 100 */
  maxScore?: number;
  preview?: boolean;
  backHref: string;
  backLabel?: string;
  nextPlanet?: NextPlanetLink | null;
};

/** Carrega o motor de laboratório pelo registro e roda o LabShell (marca início e conclusão com pontos). */
export function LabRuntime({ engineKey, planetId, title, tags, maxScore = 100, preview = false, backHref, backLabel, nextPlanet }: LabRuntimeProps) {
  const engine = useEngineModule(engineKey);
  const { hydrated, markStarted, markCompleted, getPlanet } = useProgress();
  const mod = engine.module && isLabModule(engine.module) ? engine.module : null;
  // Prévias (planeta sem motor) não entram no progresso nem liberam o próximo planeta.
  const trackedId = mod ? planetId : null;

  useEffect(() => {
    if (trackedId && hydrated) markStarted(trackedId);
  }, [trackedId, hydrated, markStarted]);

  if (engine.status === "loading") return <StatusView kind="loading" title="Montando o laboratório" />;

  const bestPoints = trackedId ? (getPlanet(trackedId)?.bestPoints ?? null) : null;

  return (
    <LabShell
      title={title}
      tags={tags}
      preview={preview || !mod}
      meta={mod?.meta ?? PREVIEW_LAB_META}
      Engine={mod?.default ?? PreviewLabEngine}
      maxScore={maxScore > 0 ? maxScore : 100}
      bestPoints={bestPoints}
      backHref={backHref}
      backLabel={backLabel}
      nextPlanet={nextPlanet}
      onFinish={(points) => {
        if (trackedId) markCompleted(trackedId, points);
      }}
    />
  );
}

export default LabRuntime;
