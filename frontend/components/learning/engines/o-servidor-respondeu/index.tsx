"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BonziState } from "@/types/domain";
import type { LabEngineMeta, LabEngineProps } from "@/components/learning/runtime";
import {
  Callout,
  ChoiceGrid,
  FlowChain,
  OrderCards,
  Place,
  SceneCanvas,
  useSeededRandom,
  useTimers,
  type ChoiceResult,
  type OrderResult,
} from "@/components/learning/kit";
import { Banner, Live, Node, Starfield } from "../_api/parts";
import { REPEAT_LINE_MS } from "../_api/timing";
import { ApiWorld, SHOWN_STEP } from "../_api/World";
import { BANNER, CARDS, CARD_AT_STEP, MESSAGES, MISSING, STEP, TEXT, TIMING, type BannerSpec, type CardId, type Phase } from "./model";
import styles from "./OServidorRespondeu.module.css";

/** Etapas do .md (Planeta 1.4). */
export const meta: LabEngineMeta = {
  kind: "lab",
  steps: ["Organizar", "Acompanhar", "Abrir as mensagens", "Identificar uma falha"],
};

const SALT = "g2-lab-1-4";
type MessageKey = keyof typeof MESSAGES;
const MESSAGE_AT: Record<MessageKey, { x: number; y: number }> = { request: { x: 38, y: 34 }, response: { x: 68, y: 34 } };

/** Laboratório 1.4 (Galáxia 2) — O servidor respondeu! (faixa14-completa.md, Assunto 1, Planeta 1.4) */
export default function OServidorRespondeu({ attempt, say, feedback, setStep, mistake, finish, reducedMotion, Stage, Interaction }: LabEngineProps) {
  const rand = useSeededRandom(attempt, { salt: SALT });
  const timers = useTimers({ reducedMotion });
  const items = useMemo(() => rand.shuffle(CARDS.map(({ id, label, element }) => ({ id, label, element })), "cards", true), [rand]);
  const choices = useMemo(() => rand.shuffle(MISSING.map(({ id, text }) => ({ id, label: text })), "missing"), [rand]);

  const [phase, setPhaseState] = useState<Phase>("order");
  const [worldStep, setWorldStep] = useState(-1);
  const [opened, setOpened] = useState<MessageKey[]>([]);
  const [showing, setShowing] = useState<MessageKey | null>(null);
  const [banner, setBanner] = useState<{ spec: BannerSpec; key: number }>({ spec: BANNER.order, key: 0 });
  const phaseRef = useRef<Phase>("order");
  const lineRef = useRef<{ text: string; at: number } | null>(null);

  const setPhase = useCallback((next: Phase) => {
    phaseRef.current = next;
    setPhaseState(next);
  }, []);

  const show = useCallback((spec: BannerSpec) => setBanner((prev) => ({ spec, key: prev.key + 1 })), []);

  const guide = useCallback(
    (spec: BannerSpec, line: string, state?: BonziState) => {
      show(spec);
      const last = lineRef.current;
      if (last && last.text === line && performance.now() - last.at < REPEAT_LINE_MS) return;
      lineRef.current = { text: line, at: performance.now() };
      say(line, state);
    },
    [show, say],
  );

  useEffect(() => {
    setStep(STEP.order);
    guide(BANNER.order, TEXT.intro, "thinking");
    feedback({ tone: "hint", message: TEXT.introFb });
  }, [setStep, guide, feedback]);

  /** anima os passos do mundo; `then` roda depois do último */
  const play = (holds: number[], then: () => void) => {
    let at = 0;
    holds.forEach((ms, index) => {
      timers.after(at, () => setWorldStep(index), { hold: true });
      at += ms;
    });
    timers.after(at, then, { hold: true });
  };

  /** Etapa 1: organizar. Errado: o cartão fora de ordem é explicado (e conta erro); dá para reorganizar. */
  const onOrder = (result: OrderResult) => {
    if (phaseRef.current !== "order") return;
    if (!result.correct) {
      mistake();
      const card = CARDS.find((c) => c.id === result.order[result.firstWrong]) ?? CARDS[0];
      const message = TEXT.wrongFb(card.why);
      guide(BANNER.wrong, message, "warning");
      feedback({ tone: "error", message });
      return;
    }
    /* Etapa 2: o simulador reproduz a sequência organizada */
    setPhase("replay");
    setStep(STEP.replay);
    guide(BANNER.replay, TEXT.right, "happy");
    feedback({ tone: "info", message: TEXT.replayFb });
    play(TIMING.replay, () => {
      setPhase("open");
      setStep(STEP.open);
      guide(BANNER.open, TEXT.open);
      feedback({ tone: "hint", message: TEXT.openFb });
    });
  };

  /** Etapa 3: abrir REQUISIÇÃO e RESPOSTA. Com as duas abertas, começa a rodada alternativa (Etapa 4). */
  const openMessage = (key: MessageKey) => {
    if (phaseRef.current !== "open") return;
    setShowing(key);
    const next = opened.includes(key) ? opened : [...opened, key];
    setOpened(next);
    say(`${MESSAGES[key].title === "REQUISIÇÃO" ? "Requisição" : "Resposta"}: ${MESSAGES[key].text}.`);
    if (next.length < 2) {
      feedback({ tone: "info", message: TEXT.opened(2 - next.length) });
      return;
    }
    feedback({ tone: "success", message: "Você abriu as duas mensagens: o pedido e o resultado." });
    timers.after(
      3200,
      () => {
        setShowing(null);
        setWorldStep(-1);
        setPhase("fail");
        setStep(STEP.fail);
        guide(BANNER.fail, TEXT.failIntro);
        feedback({ tone: "info", message: TEXT.failFb });
        timers.after(
          1200,
          () =>
            play(TIMING.fail, () => {
              setPhase("question");
              guide(BANNER.question, TEXT.question, "thinking");
              feedback({ tone: "hint", message: TEXT.questionFb });
            }),
          { hold: true },
        );
      },
      { hold: true },
    );
  };

  /** Etapa 4: o que está faltando? */
  const onMissing = (result: ChoiceResult) => {
    if (phaseRef.current !== "question") return;
    if (!result.correct) {
      mistake();
      const picked = MISSING.find((m) => m.id === result.wrong[0]);
      const message = TEXT.wrongMissing(picked && "why" in picked ? picked.why ?? "" : "");
      guide(BANNER.lost, message, "warning");
      feedback({ tone: "error", message });
      return;
    }
    setPhase("done");
    setStep(meta.steps.length);
    guide(BANNER.done, TEXT.rightMissing, "happy");
    feedback({ tone: "success", message: TEXT.doneFb });
    say(TEXT.done, "happy", { afterCurrent: true });
    /* o LabShell só mostra o resultado quando o Bonzi termina as duas falas */
    timers.after(TIMING.finish, finish, { hold: true });
  };

  const failRound = phase === "fail" || phase === "question" || phase === "done";
  const replayCard = phase === "replay" ? CARDS.findIndex((c) => CARD_AT_STEP[c.id as CardId].includes(worldStep)) : -1;
  const worldNote = failRound && worldStep >= 6 ? (phase === "done" ? "Sem resposta, nada para mostrar" : "A resposta não chegou") : undefined;

  return (
    <>
      <Stage>
        <SceneCanvas className={styles.canvas} label="Comunicação da loja: cliente, API e servidor">
          <Starfield />
          <Banner key={banner.key} text={banner.spec.text} tone={banner.spec.tone} icon={banner.spec.icon} reducedMotion={reducedMotion} />
          {phase === "order" ? (
            <Place x={50} y={22} anchor="top" width={94}>
              <div className={styles.orderFit}>
                <OrderCards items={items} correctOrder={CARDS.map((c) => c.id)} onResult={onOrder} checkLabel="Verificar" size={5} retryMs={1600} uniform ariaLabel="Etapas da comunicação para colocar em ordem" />
              </div>
            </Place>
          ) : (
          <ApiWorld
            step={phase === "open" ? SHOWN_STEP : worldStep}
            reducedMotion={reducedMotion}
            lost={failRound}
            appName="Loja on-line"
            appIcon="store"
            appCaption="Produto 42"
            appValue={MESSAGES.response.text}
            appEmpty={failRound && worldStep >= 0 ? "Aguardando..." : "?"}
            appNote={worldNote}
            serviceLabel="Servidor da loja"
            serviceBadge="box"
            requestLabel="REQUISIÇÃO"
            responseLabel="RESPOSTA"
            panelTitle="Processando"
            panelRows={["Produto 42", "Encontrado"]}
          />
          )}
          {phase === "open" && (
            <>
              {(Object.keys(MESSAGES) as MessageKey[]).map((key) => (
                <Node
                  key={key}
                  at={MESSAGE_AT[key]}
                  element={key === "request" ? "mail" : "boxGold"}
                  size={5}
                  label={MESSAGES[key].title}
                  alt={`Abrir a ${key === "request" ? "requisição" : "resposta"}`}
                  look={{ correct: opened.includes(key), pulse: !opened.includes(key) && !reducedMotion }}
                  onTap={() => openMessage(key)}
                  pressed={showing === key}
                  z={6}
                />
              ))}
              {showing && (
                <Place key={showing} x={MESSAGE_AT[showing].x} y={MESSAGE_AT[showing].y + 12} anchor="top" z={8}>
                  <Callout tone={showing === "request" ? "info" : "warning"} tail="up" size="md" maxWidth={30} live>
                    <strong className={styles.calloutTitle}>{MESSAGES[showing].title}</strong>
                    <span>{MESSAGES[showing].text}</span>
                  </Callout>
                </Place>
              )}
            </>
          )}
          <Live text={phase === "replay" && replayCard >= 0 ? CARDS[replayCard].label : ""} />
        </SceneCanvas>
      </Stage>
      <Interaction>
        <div className={styles.panel}>
          {phase === "order" && <p className={styles.lead}>Toque em dois cartões, no palco, para trocar de lugar. Depois toque em Verificar.</p>}
          {phase === "replay" && (
            <FlowChain items={CARDS.map(({ id, label, element }) => ({ id, label, element }))} current={replayCard >= 0 ? replayCard : undefined} reached={replayCard} size={3.2} wrap ariaLabel="Etapas em ordem" />
          )}
          {phase === "open" && <p className={styles.lead}>Mensagens abertas: <strong>{opened.length}</strong> de 2</p>}
          {phase === "fail" && <p className={styles.lead}>Observe a nova rodada...</p>}
          {(phase === "question" || phase === "done") && (
            <>
              <p className={styles.lead}>O que está faltando?</p>
              <ChoiceGrid choices={choices} correct={["resposta"]} onResult={onMissing} columns={1} retryMs={1400} disabled={phase === "done"} ariaLabel="O que está faltando?" className={styles.choices} />
            </>
          )}
        </div>
      </Interaction>
    </>
  );
}
