"use client";

import type { LessonEngineMeta, LessonEngineProps } from "@/components/learning/runtime";
import { SceneCanvas } from "@/components/learning/kit";
import { SceneCards, SceneDomain, SceneIp, ScenePage } from "./CardScenes";
import { SceneChain } from "./SceneChain";
import { SceneSort } from "./SceneSort";
import { Starfield } from "./parts";
import styles from "./IpDominioESite.module.css";

export const meta: LessonEngineMeta = {
  kind: "lesson",
  scenes: ["Três cartões", "IP", "Domínio", "Página", "Conexão entre os conceitos", "Classificação"],
  hints: [
    "Observe os 3 cartões. Vamos descobrir qual é qual!",
    "Observe a mensagem com o IP viajar até o servidor.",
    "Observe o nome exemplo.com apontar para o IP.",
    "Observe a página aparecer na tela.",
    "Observe o pacote ir do domínio até a página.",
    "Arraste cada cartão para a caixa certa.",
  ],
};

/** Aula 2.2 — IP, domínio e site (G1 - Internet e Web/S2 - Endereços e sites/aula2-2.md) */
export default function IpDominioESite({ scene, say, setCanAdvance, setHint, reducedMotion }: LessonEngineProps) {
  const common = { say, setCanAdvance, setHint, reducedMotion };

  return (
    <SceneCanvas className={styles.canvas}>
      <Starfield />
      {scene === 0 && <SceneCards key="cards" {...common} />}
      {scene === 1 && <SceneIp key="ip" {...common} />}
      {scene === 2 && <SceneDomain key="domain" {...common} />}
      {scene === 3 && <ScenePage key="page" {...common} />}
      {scene === 4 && <SceneChain key="chain" {...common} />}
      {scene === 5 && <SceneSort key="sort" {...common} />}
    </SceneCanvas>
  );
}
