"use client";

import type { LessonEngineMeta, LessonEngineProps } from "@/components/learning/runtime";
import { SceneCanvas } from "@/components/learning/kit";
import { SceneLogin, SceneRequest, SceneResponse, SceneResult, SceneServer } from "./JourneyScenes";
import { SceneExplore } from "./SceneExplore";
import { SceneClosing } from "./SceneClosing";
import { Starfield } from "./parts";
import styles from "./ComoAsInformacoesViajam.module.css";

export const meta: LessonEngineMeta = {
  kind: "lesson",
  scenes: [
    "Entrando em uma conta",
    "Enviando a requisição",
    "O servidor recebe o pedido",
    "O servidor responde",
    "O resultado aparece",
    "Microinteração",
    "Fechamento",
  ],
  hints: [
    "Toque em Entrar para acessar a conta.",
    "Observe a requisição viajar até o servidor.",
    "Observe o servidor verificar as informações.",
    "Observe a resposta voltar ao navegador.",
    "Veja o resultado na tela.",
    "Toque em cada parte e depois organize as etapas.",
    "Observe a comunicação completa.",
  ],
};

const SCENE_LABELS = [
  "Cena 1: a página de login com usuário, senha e o botão Entrar",
  "Cena 2: a requisição viaja do navegador até o servidor",
  "Cena 3: o servidor verifica as informações",
  "Cena 4: a resposta volta ao navegador",
  "Cena 5: o resultado aparece na tela",
  "Microinteração: as partes da comunicação e as etapas",
  "Fechamento: a comunicação completa",
];

/** Aula 4.1 — Como as informações viajam? (G1 - Internet e Web/S4 - Comunicação e segurança/aula4-1.md) */
export default function ComoAsInformacoesViajam({ scene, say, setCanAdvance, setHint, next, reducedMotion }: LessonEngineProps) {
  const common = { say, setCanAdvance, setHint, next, reducedMotion };

  return (
    <SceneCanvas className={styles.canvas} label={SCENE_LABELS[scene]}>
      <Starfield />
      {scene === 0 && <SceneLogin key="login" {...common} />}
      {scene === 1 && <SceneRequest key="request" {...common} />}
      {scene === 2 && <SceneServer key="server" {...common} />}
      {scene === 3 && <SceneResponse key="response" {...common} />}
      {scene === 4 && <SceneResult key="result" {...common} />}
      {scene === 5 && <SceneExplore key="explore" {...common} />}
      {scene === 6 && <SceneClosing key="closing" {...common} />}
    </SceneCanvas>
  );
}
