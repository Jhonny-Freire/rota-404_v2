"use client";

import { useState } from "react";
import type { LessonEngineMeta, LessonEngineProps } from "@/components/learning/runtime";
import { SceneCanvas } from "@/components/learning/kit";
import type { Pair } from "./devices";
import { Starfield } from "./NetworkParts";
import { SceneIntro } from "./SceneIntro";
import { SceneFirstLink } from "./SceneFirstLink";
import { SceneManyLinks } from "./SceneManyLinks";
import { SceneExample } from "./SceneExample";
import { SceneQuiz } from "./SceneQuiz";
import { SceneClosing } from "./SceneClosing";
import styles from "./OQueEUmaRede.module.css";

export const meta: LessonEngineMeta = {
  kind: "lesson",
  scenes: ["Apresentação", "Criando a conexão", "Vários dispositivos", "Exemplo concreto", "Microteste", "Encerramento"],
  hints: [
    "Toque em um aparelho para ele enviar uma mensagem.",
    "Toque em dois aparelhos para ligar um ao outro.",
    "Ligue os aparelhos que estão de fora até todos estarem na rede.",
    "Observe o celular enviar uma foto para o computador.",
    "Toque no exemplo em que existe uma rede.",
    "Observe os aparelhos se ligarem e formarem uma rede.",
  ],
};

/** Aula 1.1 — O que é uma rede? (G1 - Internet e Web/S1 - Dispositivos e conexão/aula1-1.md) */
export default function OQueEUmaRede({ scene, say, setCanAdvance, setHint, reducedMotion }: LessonEngineProps) {
  const [firstLink, setFirstLink] = useState<Pair | null>(null);
  const common = { say, setCanAdvance, setHint, reducedMotion };

  return (
    <SceneCanvas className={styles.canvas}>
      <Starfield />
      {scene === 0 && <SceneIntro key="intro" {...common} />}
      {scene === 1 && <SceneFirstLink key="first-link" {...common} onLinked={setFirstLink} />}
      {scene === 2 && <SceneManyLinks key="many-links" {...common} initial={firstLink} />}
      {scene === 3 && <SceneExample key="example" {...common} />}
      {scene === 4 && <SceneQuiz key="quiz" {...common} />}
      {scene === 5 && <SceneClosing key="closing" {...common} />}
    </SceneCanvas>
  );
}
