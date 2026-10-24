"use client";

import type { LessonEngineMeta, LessonEngineProps } from "@/components/learning/runtime";
import { SceneCanvas } from "@/components/learning/kit";
import { Starfield } from "../_api/parts";
import { SceneClosing, SceneEndpoint, SceneHttp, SceneQuiz, SceneUrl } from "./Scenes";
import styles from "./ComoPedirUmaInformacao.module.css";

export const meta: LessonEngineMeta = {
  kind: "lesson",
  scenes: ["Um endereço completo", "O que é endpoint?", "O que é HTTP?", "Microinteração", "Fechamento"],
  hints: [
    "Observe as partes da URL.",
    "Compare os dois endpoints.",
    "Veja as partes de uma requisição.",
    "Digite o caminho para buscar o produto 42 e toque em Buscar.",
    "Revise o resumo.",
  ],
};

const SCENE_LABELS = [
  "Cena 1: a URL https://api.exemplo.test/users/42 e suas partes",
  "Cena 2: endpoints /users/42 e /products/42",
  "Cena 3: a requisição GET /users/42",
  "Microinteração: digite o caminho para buscar o produto 42",
  "Fechamento: URL, endpoint e HTTP",
];

/** Aula 2.1 (Galáxia 2) — Como pedir uma informação (faixa14-completa.md, Assunto 2, Planeta 2.1) */
export default function ComoPedirUmaInformacao({ scene, say, setCanAdvance, setHint, next, reducedMotion }: LessonEngineProps) {
  const common = { say, setCanAdvance, setHint, next, reducedMotion };

  return (
    <SceneCanvas className={styles.canvas} label={SCENE_LABELS[scene]}>
      <Starfield />
      {scene === 0 && <SceneUrl key="url" {...common} />}
      {scene === 1 && <SceneEndpoint key="endpoint" {...common} />}
      {scene === 2 && <SceneHttp key="http" {...common} />}
      {scene === 3 && <SceneQuiz key="quiz" {...common} />}
      {scene === 4 && <SceneClosing key="closing" {...common} />}
    </SceneCanvas>
  );
}
