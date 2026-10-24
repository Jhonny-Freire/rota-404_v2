"use client";

import type { ComponentType } from "react";
import type { LessonEngineMeta, LessonEngineProps } from "@/components/learning/runtime";
import { SceneChallenge } from "./ChallengeScene";
import { SceneProblem, SceneRouter, SceneWifi } from "./IntroScenes";
import { SceneClosing, SceneExplore, SceneInternet } from "./PathScenes";
import type { SceneProps } from "./parts";

export const meta: LessonEngineMeta = {
  kind: "lesson",
  scenes: ["O problema", "Wi-Fi", "O roteador", "Internet", "Repetição interativa", "Microdesafio", "Encerramento"],
  hints: [
    "Observe o celular tentar abrir o site.",
    "Toque no símbolo do Wi-Fi.",
    "Observe os pacotes passando pelo roteador.",
    "Observe o roteador se ligar à nuvem da Internet.",
    "Toque em cada uma das 5 partes do caminho.",
    "Veja qual parte sumiu e escolha embaixo a que falta.",
    "Observe o pacote fazer o caminho todo até o site.",
  ],
};

const SCENES: ComponentType<SceneProps>[] = [
  SceneProblem,
  SceneWifi,
  SceneRouter,
  SceneInternet,
  SceneExplore,
  SceneChallenge,
  SceneClosing,
];

/** Aula 1.2 — Como meu dispositivo chega à internet? (G1 - Internet e Web/S1 - Dispositivos e conexão/aula1-2.md) */
export default function ComoMeuDispositivoChegaAInternet({ scene, say, setCanAdvance, setHint, reducedMotion }: LessonEngineProps) {
  const index = Math.max(0, Math.min(SCENES.length - 1, scene));
  const Scene = SCENES[index];
  return <Scene key={index} say={say} setCanAdvance={setCanAdvance} setHint={setHint} reducedMotion={reducedMotion} />;
}
