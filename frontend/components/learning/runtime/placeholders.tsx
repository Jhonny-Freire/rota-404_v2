"use client";

import { useEffect, useState } from "react";
import { ELEMENTS, PLANET_PLACEHOLDERS, SPRITES } from "@/config/assets";
import { ActionButton, Callout, Place, SceneCanvas, SceneSprite, Tag, useSequence } from "../kit";
import type { LabEngineMeta, LabEngineProps, LessonEngineMeta, LessonEngineProps } from "./types";
import styles from "./placeholders.module.css";

export const PREVIEW_LESSON_META: LessonEngineMeta = { kind: "lesson", scenes: ["Abertura", "Exploração", "Desafio"] };
export const PREVIEW_LAB_META: LabEngineMeta = { kind: "lab", steps: ["Observar", "Testar", "Concluir"] };

type PlaceholderLessonProps = LessonEngineProps & { meta: LessonEngineMeta; code?: string };

function LessonPlaceholderScene({
  scene,
  total,
  title,
  code,
  setCanAdvance,
}: {
  scene: number;
  total: number;
  title: string;
  code?: string;
  setCanAdvance: (ready: boolean) => void;
}) {
  const { done } = useSequence([900], { onDone: () => setCanAdvance(true) });
  return (
    <SceneCanvas backdrop="floor" label={`Cena ${scene + 1}: ${title}`}>
      <Place x={50} y={38}>
        <SceneSprite src={PLANET_PLACEHOLDERS.lesson} size={20} pulse={!done} />
      </Place>
      <Place x={50} y={72}>
        <Callout tone="info" size="lg">
          Cena em construção
        </Callout>
      </Place>
      <Place x={50} y={88}>
        <Tag tone="muted" size="sm">
          {code ? `${code} - ` : ""}Cena {scene + 1} de {total}: {title}
        </Tag>
      </Place>
    </SceneCanvas>
  );
}

/** Motor de aula provisório: mostra "Cena em construção" e libera o avanço após ~1 s. */
export function PlaceholderLessonEngine({ scene, say, setCanAdvance, meta, code }: PlaceholderLessonProps) {
  const title = meta.scenes[scene] ?? `Cena ${scene + 1}`;

  useEffect(() => {
    say(`Cena ${scene + 1}: ${title}. Esta parte ainda está sendo construída.`, "help");
  }, [scene, title, say]);

  return (
    <LessonPlaceholderScene
      key={scene}
      scene={scene}
      total={meta.scenes.length}
      title={title}
      code={code}
      setCanAdvance={setCanAdvance}
    />
  );
}

type PlaceholderLabProps = LabEngineProps & { meta: LabEngineMeta; code?: string };

/** Motor de laboratório provisório: percorre as etapas com um botão e permite simular erro. */
export function PlaceholderLabEngine({ say, feedback, setStep, mistake, finish, Stage, Interaction, meta, code }: PlaceholderLabProps) {
  const [step, setLocalStep] = useState(0);
  const steps = meta.steps.length > 0 ? meta.steps : PREVIEW_LAB_META.steps;
  const last = step >= steps.length - 1;

  useEffect(() => {
    say("Este laboratório ainda está sendo montado. Avance pelas etapas para testar.", "help");
  }, [say]);

  useEffect(() => {
    setStep(step);
  }, [step, setStep]);

  const advance = () => {
    if (last) {
      feedback({ tone: "success", message: "Todas as etapas concluídas!" });
      finish();
      return;
    }
    feedback({ tone: "info", message: `Etapa ${step + 2}: ${steps[step + 1]}` });
    setLocalStep(step + 1);
  };

  return (
    <>
      <Stage>
        <SceneCanvas backdrop="floor" label="Laboratório em construção">
          <Place x={50} y={38}>
            <SceneSprite src={PLANET_PLACEHOLDERS.lab} size={20} pulse />
          </Place>
          <Place x={50} y={72}>
            <Callout tone="info" size="lg">
              Laboratório em construção
            </Callout>
          </Place>
          <Place x={50} y={88}>
            <Tag tone="muted" size="sm">
              {code ? `${code} - ` : ""}Etapa {step + 1} de {steps.length}: {steps[step]}
            </Tag>
          </Place>
        </SceneCanvas>
      </Stage>
      <Interaction>
        <div className={styles.actions}>
          <ActionButton
            label={last ? "Concluir" : "Próxima etapa"}
            sprite={last ? SPRITES.rewards.trophy : SPRITES.ui.next}
            onClick={advance}
            attention
          />
          <ActionButton
            label="Simular erro"
            variant="default"
            sprite={ELEMENTS.error}
            onClick={() => {
              mistake();
              feedback({ tone: "error", message: "Erro simulado: menos 10 pontos." });
            }}
          />
        </div>
      </Interaction>
    </>
  );
}

/** Motor usado quando a aula não tem motor registrado (modo prévia). */
export function PreviewLessonEngine(props: LessonEngineProps) {
  return <PlaceholderLessonEngine {...props} meta={PREVIEW_LESSON_META} />;
}

/** Motor usado quando o laboratório não tem motor registrado (modo prévia). */
export function PreviewLabEngine(props: LabEngineProps) {
  return <PlaceholderLabEngine {...props} meta={PREVIEW_LAB_META} />;
}
