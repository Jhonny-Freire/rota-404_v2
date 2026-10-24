"use client";

import type { LessonEngineMeta, LessonEngineProps } from "@/components/learning/runtime";
import { SceneCanvas } from "@/components/learning/kit";
import { SceneAccess, ScenePage, SceneRequest, SceneResponse, SceneServer } from "./JourneyScenes";
import { SceneExplore } from "./SceneExplore";
import { SceneClosing } from "./SceneClosing";
import { Starfield } from "./World";
import styles from "./OQueAconteceQuandoAcessoUmSite.module.css";

export const meta: LessonEngineMeta = {
  kind: "lesson",
  scenes: [
    "Quero acessar um site",
    "Fazendo o pedido",
    "Conhecendo o servidor",
    "Enviando a resposta",
    "O site aparece!",
    "Microinteração",
    "Fechamento",
  ],
  hints: [
    "Toque em Acessar para abrir o site jogos.com.",
    "Observe o pedido sair do navegador e viajar pela internet.",
    "Observe o que o servidor guarda.",
    "Observe a resposta voltar até o navegador.",
    "Observe o site aparecer na tela.",
    "Toque em cada parte e depois organize as etapas.",
    "Observe o caminho completo, do pedido até a página.",
  ],
};

const SCENE_LABELS = [
  "Cena 1: o computador com o navegador aberto em jogos.com",
  "Cena 2: o navegador envia um pedido pela internet",
  "Cena 3: o servidor e os arquivos do site",
  "Cena 4: o servidor envia a resposta",
  "Cena 5: o site aparece na tela",
  "Microinteração: as partes do caminho e as etapas",
  "Fechamento: o caminho completo do pedido até a página",
];

/** Aula 3.1 — O que acontece quando acesso um site? (G1 - Internet e Web/S3 - Navegador e páginas Web/aula3-1.md) */
export default function OQueAconteceQuandoAcessoUmSite({ scene, say, setCanAdvance, setHint, reducedMotion }: LessonEngineProps) {
  const common = { say, setCanAdvance, setHint, reducedMotion };

  return (
    <SceneCanvas className={styles.canvas} label={SCENE_LABELS[scene]}>
      <Starfield />
      {scene === 0 && <SceneAccess key="access" {...common} />}
      {scene === 1 && <SceneRequest key="request" {...common} />}
      {scene === 2 && <SceneServer key="server" {...common} />}
      {scene === 3 && <SceneResponse key="response" {...common} />}
      {scene === 4 && <ScenePage key="page" {...common} />}
      {scene === 5 && <SceneExplore key="explore" {...common} />}
      {scene === 6 && <SceneClosing key="closing" {...common} />}
    </SceneCanvas>
  );
}
