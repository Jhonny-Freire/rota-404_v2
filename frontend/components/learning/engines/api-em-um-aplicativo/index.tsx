"use client";

import type { LessonEngineMeta, LessonEngineProps } from "@/components/learning/runtime";
import { SceneCanvas } from "@/components/learning/kit";
import { Starfield } from "../_api/parts";
import { SceneClosing, SceneLimits, SceneMany, SceneQuiz, SceneShared, SceneSplit } from "./Scenes";
import styles from "./ApiEmUmAplicativo.module.css";

export const meta: LessonEngineMeta = {
  kind: "lesson",
  scenes: ["Várias funções, vários serviços", "Separando as comunicações", "Uma API, diferentes clientes", "Limites da API", "Microinteração", "Fechamento"],
  hints: [
    "Observe as funções do app de viagem.",
    "Acompanhe cada pedido: cliente, API e serviço.",
    "Veja dois apps usando a mesma API.",
    "Veja o que a API oferece e o que ela não oferece.",
    "Ligue as solicitações aos serviços e monte o diagrama.",
    "Revise como as APIs conectam aplicações e serviços.",
  ],
};

const SCENE_LABELS = [
  "Cena 1: um app de viagem com mapa, previsão e pagamento",
  "Cena 2: três pedidos, cada um com sua API e seu serviço",
  "Cena 3: dois apps usando a mesma API meteorológica",
  "Cena 4: uma consulta oferecida e outra não oferecida pela API",
  "Microinteração: solicitações, serviços e o diagrama",
  "Fechamento: APIs conectam aplicações a serviços",
];

/** Aula 4.1 (Galáxia 2) — API em um aplicativo (faixa14-completa.md, Assunto 4, Planeta 4.1) */
export default function ApiEmUmAplicativo({ scene, say, setCanAdvance, setHint, next, reducedMotion }: LessonEngineProps) {
  const common = { say, setCanAdvance, setHint, next, reducedMotion };

  return (
    <SceneCanvas className={styles.canvas} label={SCENE_LABELS[scene]}>
      <Starfield />
      {scene === 0 && <SceneMany key="many" {...common} />}
      {scene === 1 && <SceneSplit key="split" {...common} />}
      {scene === 2 && <SceneShared key="shared" {...common} />}
      {scene === 3 && <SceneLimits key="limits" {...common} />}
      {scene === 4 && <SceneQuiz key="quiz" {...common} />}
      {scene === 5 && <SceneClosing key="closing" {...common} />}
    </SceneCanvas>
  );
}
