"use client";

import type { LessonEngineMeta, LessonEngineProps } from "@/components/learning/runtime";
import { SceneCanvas } from "@/components/learning/kit";
import { SceneBuild, ScenePage, SceneSplit, SceneTags } from "./PageScenes";
import { SceneQuiz } from "./SceneQuiz";
import { Starfield } from "./parts";
import styles from "./HtmlOsBlocosDeUmaPagina.module.css";

export const meta: LessonEngineMeta = {
  kind: "lesson",
  scenes: ["Página pronta", "Separação", "HTML visual", "Montagem", "Microteste"],
  hints: [
    "Observe a página pronta.",
    "Observe a página se separar em blocos.",
    "Veja a etiqueta HTML de cada bloco.",
    "Observe os blocos voltarem para a página.",
    "Toque no bloco que é o título da página.",
  ],
};

const SCENE_LABELS = [
  "Cena 1: uma página pronta com título, texto, imagem e botão",
  "Cena 2: a página se separa em blocos",
  "Cena 3: cada bloco recebe uma etiqueta HTML",
  "Cena 4: os blocos voltam para a página na ordem correta",
  "Cena 5: microteste, qual bloco é o título?",
];

/** Aula 3.2 — HTML: os blocos de uma página (G1 - Internet e Web/S3 - Navegador e páginas Web/aula3-2.md) */
export default function HtmlOsBlocosDeUmaPagina({ scene, say, setCanAdvance, setHint, reducedMotion }: LessonEngineProps) {
  const common = { say, setCanAdvance, setHint, reducedMotion };

  return (
    <SceneCanvas className={styles.canvas} label={SCENE_LABELS[scene]}>
      <Starfield />
      {scene === 0 && <ScenePage key="page" {...common} />}
      {scene === 1 && <SceneSplit key="split" {...common} />}
      {scene === 2 && <SceneTags key="tags" {...common} />}
      {scene === 3 && <SceneBuild key="build" {...common} />}
      {scene === 4 && <SceneQuiz key="quiz" {...common} />}
    </SceneCanvas>
  );
}
