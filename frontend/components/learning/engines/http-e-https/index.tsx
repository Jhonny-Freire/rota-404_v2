"use client";

import { useState } from "react";
import type { LessonEngineMeta, LessonEngineProps } from "@/components/learning/runtime";
import { SceneCanvas } from "@/components/learning/kit";
import { DEFAULT_INFO } from "./model";
import { SceneClosing, SceneCompare, SceneHttps, SceneLock, SceneSend } from "./Scenes";
import { Starfield } from "./parts";
import styles from "./HttpEHttps.module.css";

export const meta: LessonEngineMeta = {
  kind: "lesson",
  /* revisão de UX: "Enviando uma informação" e "Sem proteção" viraram uma cena contínua */
  scenes: ["Enviando uma informação", "Protegendo a comunicação", "HTTP e HTTPS", "O cadeado", "Encerramento"],
  hints: [
    "Digite um apelido inventado, toque em Enviar e observe a viagem com HTTP.",
    "Observe a mensagem viajar com HTTPS.",
    "Compare os dois lados e o começo dos endereços.",
    "Observe o cadeado no endereço.",
    "Observe as duas formas de comunicação.",
  ],
};

const SCENE_LABELS = [
  "Cena 1: envie uma informação inventada e veja a comunicação com HTTP, sem proteção",
  "Cena 2: comunicação com HTTPS, protegida",
  "Cena 3: HTTP e HTTPS lado a lado",
  "Cena 4: o cadeado no endereço",
  "Encerramento: HTTP e HTTPS",
];

/** Aula 4.2 — HTTP e HTTPS (G1 - Internet e Web/S4 - Comunicação e segurança/aula4-2.md) */
export default function HttpEHttps({ scene, say, setCanAdvance, setHint, reducedMotion }: LessonEngineProps) {
  /* a informação fictícia digitada na cena 1 é a que viaja (e que o hacker tenta ler) nas outras cenas */
  const [info, setInfo] = useState(DEFAULT_INFO);
  const common = { say, setCanAdvance, setHint, reducedMotion, info };

  return (
    <SceneCanvas className={styles.canvas} label={SCENE_LABELS[scene]}>
      <Starfield />
      {scene === 0 && <SceneSend key="send" {...common} onInfo={setInfo} />}
      {scene === 1 && <SceneHttps key="https" {...common} />}
      {scene === 2 && <SceneCompare key="compare" {...common} />}
      {scene === 3 && <SceneLock key="lock" {...common} />}
      {scene === 4 && <SceneClosing key="closing" {...common} />}
    </SceneCanvas>
  );
}
