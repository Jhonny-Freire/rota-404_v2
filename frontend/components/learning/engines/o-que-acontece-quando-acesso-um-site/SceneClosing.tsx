"use client";

import { useEffect, useState } from "react";
import { ActionButton, FlowChain, Place, useSequence, type FlowItem, type LinkState, type ScenePoint } from "@/components/learning/kit";
import { LINES, STOPS, phases, type SceneProps, type TravelerKind } from "./model";
import { BrowserIcon, Client, FilesPanel, InternetNode, Live, LoadingPage, MiniPage, ServerNode, Traveler, Wires } from "./World";
import styles from "./OQueAconteceQuandoAcessoUmSite.module.css";

/** `Navegador → Pedido pela internet → Servidor → Resposta → Página na tela` (aula3-1.md, Fechamento) */
const CHAIN: FlowItem[] = [
  { id: "browser", label: "Navegador", content: <BrowserIcon size={4.2} /> },
  { id: "request", label: "Pedido pela internet", element: "mail" },
  { id: "server", label: "Servidor", element: "server" },
  { id: "response", label: "Resposta", element: "boxGold" },
  { id: "page", label: "Página na tela", element: "webpage" },
];

type Phase =
  | "browser"
  | "requestOut"
  | "requestNet"
  | "requestServer"
  | "server"
  | "responseOut"
  | "responseNet"
  | "responseClient"
  | "page";

/**
 * A animação completa de novo, fase a fase (todas pausas { hold }: com movimento reduzido o pedido e a resposta
 * saltam de parada em parada no mesmo ritmo). A soma cobre a fala do fechamento (83 caracteres).
 */
const TIMELINE: { phase: Phase; ms: number }[] = [
  { phase: "browser", ms: 900 },
  { phase: "requestOut", ms: 450 },
  { phase: "requestNet", ms: 1100 },
  { phase: "requestServer", ms: 1100 },
  { phase: "server", ms: 900 },
  { phase: "responseOut", ms: 450 },
  { phase: "responseNet", ms: 1100 },
  { phase: "responseClient", ms: 1100 },
  { phase: "page", ms: 1800 },
];

const STEPS = phases(
  TIMELINE.map((t) => t.ms),
  LINES.closing,
);

/** item da cadeia aceso em cada fase */
const CHAIN_INDEX: Record<Phase, number> = {
  browser: 0,
  requestOut: 1,
  requestNet: 1,
  requestServer: 1,
  server: 2,
  responseOut: 3,
  responseNet: 3,
  responseClient: 3,
  page: 4,
};

const TRAVEL: Partial<Record<Phase, { kind: TravelerKind; at: ScenePoint }>> = {
  requestOut: { kind: "request", at: STOPS.client },
  requestNet: { kind: "request", at: STOPS.internet },
  requestServer: { kind: "request", at: STOPS.server },
  server: { kind: "request", at: STOPS.server },
  responseOut: { kind: "response", at: STOPS.server },
  responseNet: { kind: "response", at: STOPS.internet },
  responseClient: { kind: "response", at: STOPS.client },
};

const WIRE_A: Partial<Record<Phase, LinkState>> = { requestNet: "active", responseClient: "active" };
const WIRE_B: Partial<Record<Phase, LinkState>> = { requestServer: "active", responseNet: "active" };

/** Fechamento — Navegador, pedido pela internet, servidor, resposta e página na tela; "Ver de novo" repete. */
export function SceneClosing({ say, setCanAdvance, reducedMotion }: SceneProps) {
  /** já terminou uma vez: "Ver de novo" fica no palco também durante a repetição */
  const [seen, setSeen] = useState(false);
  const { step, done, restart } = useSequence(STEPS, {
    reducedMotion,
    onDone: () => {
      setSeen(true);
      setCanAdvance(true);
    },
  });
  const phase = TIMELINE[Math.min(step, TIMELINE.length - 1)].phase;
  const travel = done ? undefined : TRAVEL[phase];
  const index = CHAIN_INDEX[phase];
  const pageShown = phase === "page";
  const loading = step >= 1 && !pageShown;
  const serverOn = phase === "server" || phase === "responseOut";

  useEffect(() => {
    say(LINES.closing, "happy");
  }, [say]);

  const replay = () => {
    restart();
    say(LINES.closing, "happy");
  };

  return (
    <>
      <Wires a={WIRE_A[phase] ?? "idle"} b={WIRE_B[phase] ?? "idle"} back={index >= 3} />
      <Client
        layout="side"
        loading={loading}
        page={pageShown ? <MiniPage /> : loading ? <LoadingPage reducedMotion={reducedMotion} /> : null}
        look={{ highlighted: phase === "browser" || (pageShown && !done), correct: done }}
      />
      <InternetNode look={{ highlighted: phase === "requestNet" || phase === "responseNet" }} />
      <ServerNode look={{ highlighted: serverOn }} />
      {serverOn && <FilesPanel shown={3} packed={phase === "responseOut"} small />}
      {travel && <Traveler key={travel.kind} kind={travel.kind} at={travel.at} reducedMotion={reducedMotion} />}

      <Place x={50} y={10} width={98} z={3}>
        <div className={styles.chainFit}>
          <FlowChain
            items={CHAIN}
            current={done ? undefined : index}
            reached={index}
            size={4.2}
            ariaLabel="Navegador, pedido pela internet, servidor, resposta, página na tela"
            className={styles.chain}
          />
        </div>
      </Place>

      {/* logo abaixo da cadeia que resume a viagem: "Ver de novo" repete exatamente isso */}
      <Place x={50} y={20} anchor="top" hidden={!seen} z={6}>
        <div className={styles.replayFit}>
          <ActionButton label="Ver de novo" variant="default" onClick={replay} disabled={!seen} size={20} />
        </div>
      </Place>

      <Live text={done ? "Navegador, pedido pela internet, servidor, resposta e página na tela." : ""} />
    </>
  );
}
