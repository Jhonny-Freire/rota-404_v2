"use client";

import type { LessonEngineMeta, LessonEngineProps } from "@/components/learning/runtime";
import { SceneCanvas } from "@/components/learning/kit";
import { Starfield } from "../_api/parts";
import { SceneClosing, SceneDemo, SceneIntents, SceneMatch } from "./Scenes";
import styles from "./GetPostPutEDelete.module.css";

export const meta: LessonEngineMeta = {
  kind: "lesson",
  scenes: ["Os quatro métodos", "Demonstração", "Microinteração", "Fechamento"],
  hints: [
    "Conheça a intenção de cada método.",
    "Toque em cada método para ver o que acontece com o catálogo.",
    "Ligue cada pedido ao seu método.",
    "Revise o resumo dos métodos.",
  ],
};

const SCENE_LABELS = [
  "Cena 1: GET, POST, PUT e DELETE e a intenção de cada um",
  "Demonstração: os métodos no catálogo fictício de produtos",
  "Microinteração: ligue cada pedido ao seu método",
  "Fechamento: resumo dos métodos",
];

/** Aula 2.2 (Galáxia 2) — GET, POST, PUT e DELETE (faixa14-completa.md, Assunto 2, Planeta 2.2) */
export default function GetPostPutEDelete({ scene, say, setCanAdvance, setHint, next, reducedMotion }: LessonEngineProps) {
  const common = { say, setCanAdvance, setHint, next, reducedMotion };

  return (
    <SceneCanvas className={styles.canvas} label={SCENE_LABELS[scene]}>
      <Starfield />
      {scene === 0 && <SceneIntents key="intents" {...common} />}
      {scene === 1 && <SceneDemo key="demo" {...common} />}
      {scene === 2 && <SceneMatch key="match" {...common} />}
      {scene === 3 && <SceneClosing key="closing" {...common} />}
    </SceneCanvas>
  );
}
