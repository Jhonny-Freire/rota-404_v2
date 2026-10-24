"use client";

import type { LessonEngineMeta, LessonEngineProps } from "@/components/learning/runtime";
import { SceneCanvas } from "@/components/learning/kit";
import { Starfield } from "../_api/parts";
import { SceneClosing, SceneFields, SceneList, SceneNested, SceneQuiz, SceneReceive } from "./Scenes";
import styles from "./LendoUmaResposta.module.css";

export const meta: LessonEngineMeta = {
  kind: "lesson",
  scenes: ["Recebendo dados", "Encontrando campos", "Dados dentro de dados", "Lista de itens", "Microinteração", "Fechamento"],
  hints: [
    "Observe a resposta que chegou.",
    "Veja cada campo e o tipo do valor.",
    "Veja um objeto dentro de outro.",
    "Abra um item da lista.",
    "Toque no valor que responde a cada pergunta.",
    "Veja os dados virarem informação na tela.",
  ],
};

const SCENE_LABELS = [
  "Cena 1: uma resposta JSON com id, nome, cidade e ativo",
  "Cena 2: os campos da resposta e seus tipos",
  "Cena 3: o objeto produto dentro de um objeto maior",
  "Cena 4: a lista produtos",
  "Microinteração: perguntas sobre a resposta",
  "Fechamento: a resposta vira informação no aplicativo",
];

/** Aula 3.2 (Galáxia 2) — Lendo uma resposta (faixa14-completa.md, Assunto 3, Planeta 3.2) */
export default function LendoUmaResposta({ scene, say, setCanAdvance, setHint, next, reducedMotion }: LessonEngineProps) {
  const common = { say, setCanAdvance, setHint, next, reducedMotion };

  return (
    <SceneCanvas className={styles.canvas} label={SCENE_LABELS[scene]}>
      <Starfield />
      {scene === 0 && <SceneReceive key="receive" {...common} />}
      {scene === 1 && <SceneFields key="fields" {...common} />}
      {scene === 2 && <SceneNested key="nested" {...common} />}
      {scene === 3 && <SceneList key="list" {...common} />}
      {scene === 4 && <SceneQuiz key="quiz" {...common} />}
      {scene === 5 && <SceneClosing key="closing" {...common} />}
    </SceneCanvas>
  );
}
