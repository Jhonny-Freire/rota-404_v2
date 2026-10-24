"use client";

import type { LessonEngineMeta, LessonEngineProps } from "@/components/learning/runtime";
import { SceneCanvas } from "@/components/learning/kit";
import { Starfield } from "../_api/parts";
import { SceneClosing, SceneLoose, SceneObject, SceneQuiz, SceneValues } from "./Scenes";
import styles from "./OQueEJson.module.css";

export const meta: LessonEngineMeta = {
  kind: "lesson",
  scenes: ["Dados soltos", "Objeto JSON", "Outros valores", "Microinteração", "Fechamento"],
  hints: [
    "Observe os dados soltos.",
    "Veja como o objeto JSON organiza os dados.",
    "Conheça o booleano e a lista.",
    "Toque nas partes do JSON e depois escolha o exemplo válido.",
    "Revise o resumo do JSON.",
  ],
};

const SCENE_LABELS = [
  "Cena 1: os dados nome Ana e idade 15 soltos",
  "Cena 2: o objeto JSON com nome e idade",
  "Cena 3: booleano e lista no JSON",
  "Microinteração: partes do JSON e o exemplo válido",
  "Fechamento: objeto, propriedade e lista",
];

/** Aula 3.1 (Galáxia 2) — O que é JSON? (faixa14-completa.md, Assunto 3, Planeta 3.1) */
export default function OQueEJson({ scene, say, setCanAdvance, setHint, next, reducedMotion }: LessonEngineProps) {
  const common = { say, setCanAdvance, setHint, next, reducedMotion };

  return (
    <SceneCanvas className={styles.canvas} label={SCENE_LABELS[scene]}>
      <Starfield />
      {scene === 0 && <SceneLoose key="loose" {...common} />}
      {scene === 1 && <SceneObject key="object" {...common} />}
      {scene === 2 && <SceneValues key="values" {...common} />}
      {scene === 3 && <SceneQuiz key="quiz" {...common} />}
      {scene === 4 && <SceneClosing key="closing" {...common} />}
    </SceneCanvas>
  );
}
