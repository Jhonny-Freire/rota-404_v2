"use client";

import { useEffect, useState } from "react";
import { ActionButton, FlowChain, Place, useSequence, type FlowItem, type ScenePoint } from "@/components/learning/kit";
import { LINES, STOPS, phases, type MessageKind, type SceneProps } from "./model";
import { CheckPanel, InternetNode, Live, LoginWindow, ServerNode, Traveler, Wires, type LoginState } from "./parts";
import styles from "./ComoAsInformacoesViajam.module.css";

/** `Clique em Entrar → Requisição → Servidor → Resposta → Resultado na tela` (aula4-1.md, Fechamento) */
const CHAIN: FlowItem[] = [
  { id: "enter", label: "Clique em Entrar", content: <span className={styles.chainEnter}>Entrar</span> },
  { id: "request", label: "Requisição", element: "mail" },
  { id: "server", label: "Servidor", element: "server" },
  { id: "response", label: "Resposta", element: "boxGold" },
  { id: "result", label: "Resultado na tela", element: "webpage" },
];

type Phase = "enter" | "requestOut" | "requestNet" | "requestServer" | "server" | "responseNet" | "responseClient" | "result";

const TIMELINE: { phase: Phase; ms: number; chain: number; travel?: { kind: MessageKind; at: ScenePoint } }[] = [
  { phase: "enter", ms: 1100, chain: 0 },
  { phase: "requestOut", ms: 700, chain: 1, travel: { kind: "request", at: STOPS.client } },
  { phase: "requestNet", ms: 1100, chain: 1, travel: { kind: "request", at: STOPS.internet } },
  { phase: "requestServer", ms: 1100, chain: 1, travel: { kind: "request", at: STOPS.server } },
  { phase: "server", ms: 1500, chain: 2, travel: { kind: "request", at: STOPS.server } },
  { phase: "responseNet", ms: 1100, chain: 3, travel: { kind: "response", at: STOPS.internet } },
  { phase: "responseClient", ms: 1100, chain: 3, travel: { kind: "response", at: STOPS.client } },
  { phase: "result", ms: 1800, chain: 4 },
];

const STEPS = phases(
  TIMELINE.map((t) => t.ms),
  LINES.closing,
);

/** Fechamento — a sequência completa de novo, com a cadeia no alto; "Ver de novo" repete. */
export function SceneClosing({ say, setCanAdvance, reducedMotion }: SceneProps) {
  const [seen, setSeen] = useState(false);
  const { step, done, restart } = useSequence(STEPS, {
    reducedMotion,
    onDone: () => {
      setSeen(true);
      setCanAdvance(true);
    },
  });
  const current = TIMELINE[Math.min(step, TIMELINE.length - 1)];
  const travel = done ? undefined : current.travel;
  const login: LoginState = current.phase === "enter" ? "form" : current.phase === "result" ? "ok" : "sending";

  useEffect(() => {
    say(LINES.closing, "happy");
  }, [say]);

  const replay = () => {
    restart();
    say(LINES.closing, "happy");
  };

  return (
    <>
      <Wires
        a={current.phase === "requestNet" || current.phase === "responseClient" ? "active" : "idle"}
        b={current.phase === "requestServer" || current.phase === "responseNet" ? "active" : "idle"}
        back={current.chain >= 3}
      />
      <LoginWindow state={login} highlighted={current.phase === "enter" || current.phase === "result"} done={done} />
      <InternetNode look={{ highlighted: current.phase === "requestNet" || current.phase === "responseNet" }} />
      <ServerNode look={{ highlighted: current.phase === "server" }} />
      {current.phase === "server" && <CheckPanel checked={2} />}
      {travel && <Traveler key={travel.kind} kind={travel.kind} at={travel.at} reducedMotion={reducedMotion} />}

      <Place x={50} y={9} width={98} z={4}>
        <div className={styles.chainFit}>
          <FlowChain
            items={CHAIN}
            current={done ? undefined : current.chain}
            reached={current.chain}
            size={4.2}
            ariaLabel="Clique em Entrar, requisição, servidor, resposta, resultado na tela"
            className={styles.chain}
          />
        </div>
      </Place>

      {/* logo abaixo da cadeia que resume a comunicação: "Ver de novo" repete exatamente isso */}
      <Place x={50} y={20} anchor="top" hidden={!seen} z={6}>
        <div className={styles.replayFit}>
          <ActionButton label="Ver de novo" variant="default" onClick={replay} disabled={!seen} size={20} />
        </div>
      </Place>

      <Live text={done ? "Clique em Entrar, requisição, servidor, resposta e resultado na tela." : ""} />
    </>
  );
}
