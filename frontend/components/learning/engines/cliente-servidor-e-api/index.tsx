"use client";

import type { LessonEngineMeta, LessonEngineProps } from "@/components/learning/runtime";
import { SceneCanvas } from "@/components/learning/kit";
import { Starfield } from "../_api/parts";
import { SceneApiRole, SceneClient, SceneRoles, SceneRoundTrip, SceneServer, SceneSummary } from "./Scenes";
import { SceneQuiz } from "./SceneQuiz";
import styles from "./ClienteServidorEApi.module.css";

export const meta: LessonEngineMeta = {
  kind: "lesson",
  scenes: ["Quem inicia?", "A entrada definida", "Quem processa?", "Ida e volta", "Conferindo os papéis", "Microinteração", "Fechamento"],
  hints: [
    "Observe quem começa o pedido.",
    "Veja o pedido passar pela API.",
    "Veja o pedido chegar ao servidor.",
    "Acompanhe a requisição e a resposta.",
    "Confira o papel de cada parte.",
    "Responda às perguntas tocando na parte certa.",
    "Revise o resumo da comunicação.",
  ],
};

const SCENE_LABELS = [
  "Cena 1: o app de clima, o cliente, inicia o pedido",
  "Cena 2: o pedido passa pela API",
  "Cena 3: o pedido chega ao servidor",
  "Cena 4: a requisição vai e a resposta volta",
  "Cena 5: os papéis de cliente, API e servidor",
  "Microinteração: quem pede, quem define, quem processa; requisição e resposta",
  "Fechamento: resumo da comunicação",
];

/** Aula 1.2 (Galáxia 2) — Cliente, servidor e API (faixa14-completa.md, Assunto 1, Planeta 1.2) */
export default function ClienteServidorEApi({ scene, say, setCanAdvance, setHint, next, reducedMotion }: LessonEngineProps) {
  const common = { say, setCanAdvance, setHint, next, reducedMotion };

  return (
    <SceneCanvas className={styles.canvas} label={SCENE_LABELS[scene]}>
      <Starfield />
      {scene === 0 && <SceneClient key="client" {...common} />}
      {scene === 1 && <SceneApiRole key="api" {...common} />}
      {scene === 2 && <SceneServer key="server" {...common} />}
      {scene === 3 && <SceneRoundTrip key="trip" {...common} />}
      {scene === 4 && <SceneRoles key="roles" {...common} />}
      {scene === 5 && <SceneQuiz key="quiz" {...common} />}
      {scene === 6 && <SceneSummary key="summary" {...common} />}
    </SceneCanvas>
  );
}
