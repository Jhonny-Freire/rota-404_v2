"use client";

import type { LessonEngineMeta, LessonEngineProps } from "@/components/learning/runtime";
import { SceneCanvas } from "@/components/learning/kit";
import { Starfield } from "../_api/parts";
import { SceneApi, SceneClosing, SceneProblem, SceneRest, SceneResult, SceneUses } from "./Scenes";
import { SceneMatch } from "./SceneMatch";
import styles from "./SistemasQueConversam.module.css";

export const meta: LessonEngineMeta = {
  kind: "lesson",
  scenes: [
    "Dois sistemas, duas funções",
    "A API entra na comunicação",
    "Pedido e resultado",
    "Outros usos",
    "O que significa REST?",
    "Microinteração",
    "Fechamento",
  ],
  hints: [
    "Observe o aplicativo e o serviço meteorológico.",
    "Veja a API entrar entre os dois sistemas.",
    "Acompanhe o pedido e a resposta.",
    "Veja outros aplicativos usando APIs.",
    "Conheça os recursos de uma API REST.",
    "Ligue cada aplicativo ao serviço que ele poderia usar.",
    "Observe a comunicação completa.",
  ],
};

const SCENE_LABELS = [
  "Cena 1: o app de clima sem os dados e o serviço meteorológico",
  "Cena 2: aplicativo, API e serviço meteorológico",
  "Cena 3: o app pede a temperatura e recebe a resposta pela API",
  "Cena 4: mapa, loja e jogo usando APIs",
  "Cena 5: uma API REST com os recursos usuários, produtos e pedidos",
  "Microinteração: ligue cada aplicativo ao seu serviço",
  "Fechamento: aplicativo, API e serviço",
];

/** Aula 1.1 (Galáxia 2) — Sistemas que conversam (faixa14-completa.md, Assunto 1, Planeta 1.1) */
export default function SistemasQueConversam({ scene, say, setCanAdvance, setHint, next, reducedMotion }: LessonEngineProps) {
  const common = { say, setCanAdvance, setHint, next, reducedMotion };

  return (
    <SceneCanvas className={styles.canvas} label={SCENE_LABELS[scene]}>
      <Starfield />
      {scene === 0 && <SceneProblem key="problem" {...common} />}
      {scene === 1 && <SceneApi key="api" {...common} />}
      {scene === 2 && <SceneResult key="result" {...common} />}
      {scene === 3 && <SceneUses key="uses" {...common} />}
      {scene === 4 && <SceneRest key="rest" {...common} />}
      {scene === 5 && <SceneMatch key="match" {...common} />}
      {scene === 6 && <SceneClosing key="closing" {...common} />}
    </SceneCanvas>
  );
}
