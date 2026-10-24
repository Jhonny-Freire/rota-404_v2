"use client";

import type { LessonEngineMeta, LessonEngineProps } from "@/components/learning/runtime";
import { SceneCanvas } from "@/components/learning/kit";
import { cx } from "@/components/ui/cx";
import { Starfield } from "./parts";
import { SceneWhich } from "./SceneWhich";
import { SceneLabels } from "./SceneLabels";
import { SceneCompare } from "./SceneCompare";
import { SceneDestination } from "./SceneDestination";
import { SceneQuiz } from "./SceneQuiz";
import styles from "./TodoDispositivoPrecisaDeUmEndereco.module.css";

export const meta: LessonEngineMeta = {
  kind: "lesson",
  scenes: ["Para qual deles?", "Endereços", "Comparação", "Destino", "Microteste"],
  hints: [
    "Observe: a mensagem não sabe para qual computador ir.",
    "Observe as etiquetas de endereço e para onde a mensagem vai.",
    "Compare a casa e o computador: cada um tem um endereço.",
    "Observe a mensagem viajar até o endereço escrito nela.",
    "Digite o IP do dispositivo com borda verde e toque em Enviar.",
  ],
};

const SCENE_LABELS = [
  "Uma mensagem e dois computadores iguais",
  "Computadores com etiquetas de endereço",
  "Casa com endereço e computador com endereço IP",
  "A mensagem vai até o destino",
  "Microteste: enviar a mensagem digitando o IP",
];

/** Aula 2.1 — Todo dispositivo precisa de um endereço (G1 - Internet e Web/S2 - Endereços e sites/aula2-1.md) */
export default function TodoDispositivoPrecisaDeUmEndereco({ scene, say, setCanAdvance, setHint, reducedMotion }: LessonEngineProps) {
  const common = { say, setCanAdvance, setHint, reducedMotion };

  return (
    <SceneCanvas className={cx(styles.canvas, reducedMotion && styles.reduced)} label={SCENE_LABELS[scene]}>
      <Starfield />
      {scene === 0 && <SceneWhich key="which" {...common} />}
      {scene === 1 && <SceneLabels key="labels" {...common} />}
      {scene === 2 && <SceneCompare key="compare" {...common} />}
      {scene === 3 && <SceneDestination key="destination" {...common} />}
      {scene === 4 && <SceneQuiz key="quiz" {...common} />}
    </SceneCanvas>
  );
}
