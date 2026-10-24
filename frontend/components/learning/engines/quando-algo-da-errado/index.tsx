"use client";

import type { LessonEngineMeta, LessonEngineProps } from "@/components/learning/runtime";
import { SceneCanvas } from "@/components/learning/kit";
import { Starfield } from "../_api/parts";
import { CASES } from "./model";
import { SceneClosing, SceneQuiz, SceneStatus } from "./Scenes";
import styles from "./QuandoAlgoDaErrado.module.css";

export const meta: LessonEngineMeta = {
  kind: "lesson",
  scenes: [...CASES.map((c) => c.title), "Microinteração", "Fechamento"],
  hints: [
    "Veja a resposta 200 OK.",
    "Veja a resposta 400 Bad Request.",
    "Veja a resposta 401 Unauthorized.",
    "Veja a resposta 404 Not Found.",
    "Veja a resposta 500 Internal Server Error.",
    "Ligue cada situação ao seu código de status.",
    "Revise os códigos de status.",
  ],
};

const SCENE_LABELS = [
  ...CASES.map((c, i) => `Cena ${i + 1}: ${c.method} ${c.path} e a resposta ${c.code} ${c.text}`),
  "Microinteração: situações e códigos de status",
  "Fechamento: alguns códigos de status comuns",
];

/** Aula 4.2 (Galáxia 2) — Quando algo dá errado (faixa14-completa.md, Assunto 4, Planeta 4.2) */
export default function QuandoAlgoDaErrado({ scene, say, setCanAdvance, setHint, next, reducedMotion }: LessonEngineProps) {
  const common = { say, setCanAdvance, setHint, next, reducedMotion };
  const statusCase = scene < CASES.length ? CASES[scene] : null;

  return (
    <SceneCanvas className={styles.canvas} label={SCENE_LABELS[scene]}>
      <Starfield />
      {statusCase && <SceneStatus key={statusCase.id} statusCase={statusCase} {...common} />}
      {scene === CASES.length && <SceneQuiz key="quiz" {...common} />}
      {scene === CASES.length + 1 && <SceneClosing key="closing" {...common} />}
    </SceneCanvas>
  );
}
