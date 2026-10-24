"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SPRITES } from "@/config/assets";
import { useBonziSpeaking } from "@/hooks/useBonziSpeaking";
import { ActionButton, Callout, OrderCards, Place, Tag, useSeededRandom, useSequence, useTimers, type OrderItem, type OrderResult } from "@/components/learning/kit";
import { cx } from "@/components/ui/cx";
import { EXPLORE_AT, EXTRA_LINES, ORDER_STEPS, PARTS, READY_PAUSE_MS, STOPS, speechMs, type PartId, type SceneProps } from "./model";
import { Banner, InternetNode, Live, LoginWindow, MessageNode, ServerNode, Traveler, Wires, type LoginState, type NodeLook } from "./parts";
import styles from "./ComoAsInformacoesViajam.module.css";

/*
 * Microinteração (aula4-1.md), em duas partes na mesma cena: (a) tocar nas 4 partes da comunicação para descobrir a
 * função; (b) ordenar os 3 cartões. Depois do acerto, a animação completa é reproduzida; só então libera o avanço.
 */
export function SceneExplore(props: SceneProps) {
  const [stage, setStage] = useState<"explore" | "order">("explore");
  return stage === "explore" ? <ExploreParts key="explore" {...props} onDone={() => setStage("order")} /> : <OrderSteps key="order" {...props} />;
}

function ExploreParts({ say, setHint, reducedMotion, onDone }: SceneProps & { onDone: () => void }) {
  /* a ordenação só começa quando o aluno toca em "Continuar" (o botão aparece depois que o Bonzi termina) */
  const speaking = useBonziSpeaking();
  const [selected, setSelected] = useState<PartId | null>(null);
  const [found, setFound] = useState<PartId[]>([]);
  const foundRef = useRef<PartId[]>([]);
  const active = PARTS.find((p) => p.id === selected) ?? null;
  const complete = found.length === PARTS.length;

  useEffect(() => {
    say(EXTRA_LINES.explore, "help");
  }, [say]);

  const tap = (id: PartId) => {
    const part = PARTS.find((p) => p.id === id)!;
    const next = foundRef.current.includes(id) ? foundRef.current : [...foundRef.current, id];
    foundRef.current = next;
    const left = PARTS.length - next.length;
    setSelected(id);
    setFound(next);
    say(part.text, left === 0 ? "happy" : "speaking");
    setHint(left > 0 ? `Faltam ${left === 1 ? "1 parte" : `${left} partes`}. Toque em outra.` : "Você descobriu as 4 partes!");
  };

  const look = (id: PartId): NodeLook => ({ highlighted: selected === id, correct: found.includes(id), pulse: !found.includes(id) });

  return (
    <>
      {active ? (
        <Place key={active.id} x={50} y={3} anchor="top" z={7}>
          <Callout tone="info" size="md" maxWidth={76}>
            <strong className={styles.explainName}>{active.text.slice(0, active.text.indexOf(":") + 1)}</strong>
            {active.text.slice(active.text.indexOf(":") + 1)}
          </Callout>
        </Place>
      ) : (
        <Banner text="Toque em cada parte" tone="warning" icon="magnifier" reducedMotion={reducedMotion} />
      )}
      <Wires />
      {/* ordem do DOM = ordem visual (esquerda para a direita) */}
      <LoginWindow state="ok" onTap={() => tap("browser")} pressed={selected === "browser"} highlighted={selected === "browser"} done={found.includes("browser")} />
      <MessageNode kind="request" at={EXPLORE_AT.request} look={look("request")} onTap={() => tap("request")} pressed={selected === "request"} />
      <InternetNode look={{ dimmed: true }} />
      <MessageNode kind="response" at={EXPLORE_AT.response} look={look("response")} onTap={() => tap("response")} pressed={selected === "response"} />
      <ServerNode look={look("server")} onTap={() => tap("server")} pressed={selected === "server"} />
      <Place x={3} y={93} anchor="left" z={3}>
        <Tag size="sm" tone={found.length === PARTS.length ? "success" : "info"} icon={found.length === PARTS.length ? "ok" : "magnifier"}>
          {`Descobertas: ${found.length} de ${PARTS.length}`}
        </Tag>
      </Place>
      <Place x={97} y={93} anchor="right" hidden={!complete || speaking} z={7}>
        <div className={styles.replayFit}>
          <ActionButton label="Continuar" sprite={SPRITES.ui.next} onClick={onDone} disabled={!complete || speaking} attention={complete && !speaking} focusOnAttention size={20} />
        </div>
      </Place>
      <Live text={active ? `${active.text} ${found.length} de ${PARTS.length} partes descobertas.` : ""} />
    </>
  );
}

type Replay = "cards" | "request-out" | "request-net" | "request-server" | "response-net" | "response-client" | "shown";
const REPLAY: Replay[] = ["cards", "request-out", "request-net", "request-server", "response-net", "response-client", "shown"];

function OrderSteps({ say, setCanAdvance, setHint, reducedMotion }: SceneProps) {
  const rand = useSeededRandom(0, { salt: "aula-4-1-etapas" });
  const items = useMemo<OrderItem[]>(() => rand.shuffle(ORDER_STEPS.map(({ id, label, element }) => ({ id, label, element })), "order", true), [rand]);
  const [state, setState] = useState<"idle" | "wrong" | "right">("idle");
  const [tries, setTries] = useState(0);
  const timers = useTimers({ reducedMotion });
  const cancelRetry = useRef<(() => void) | null>(null);
  /* depois do acerto: a comunicação completa é reproduzida (cobre a fala do acerto) */
  const { step } = useSequence([...REPLAY.map(() => ({ hold: 900 })), { hold: 1200 }], {
    play: state === "right",
    reducedMotion,
    onDone: () => setCanAdvance(true),
  });

  useEffect(() => {
    say(EXTRA_LINES.order, "thinking");
    setHint("Toque em dois cartões para trocar de lugar. Depois toque em Verificar.");
  }, [say, setHint]);

  const onResult = (result: OrderResult) => {
    cancelRetry.current?.();
    if (result.correct) {
      setState("right");
      say(EXTRA_LINES.orderRight, "happy");
      setHint("Isso! Veja a comunicação completa.");
      return;
    }
    setState("wrong");
    setTries((t) => t + 1);
    say(EXTRA_LINES.orderWrong, "warning");
    setHint("Ainda não. Troque os cartões de lugar e toque em Verificar de novo.");
    cancelRetry.current = timers.after(1400, () => setState((s) => (s === "wrong" ? "idle" : s)), { hold: true });
  };

  const right = state === "right";
  const phase = right ? REPLAY[Math.min(step, REPLAY.length - 1)] : null;
  /* os cartões certos (verdes) ficam um instante antes da animação */
  const showCards = !right || phase === "cards";
  const travel =
    phase === "request-out" ? { kind: "request" as const, at: STOPS.client }
    : phase === "request-net" ? { kind: "request" as const, at: STOPS.internet }
    : phase === "request-server" ? { kind: "request" as const, at: STOPS.server }
    : phase === "response-net" ? { kind: "response" as const, at: STOPS.internet }
    : phase === "response-client" ? { kind: "response" as const, at: STOPS.client }
    : null;
  const login: LoginState = !right ? "ok" : phase === "shown" ? "ok" : "sending";
  const banner = right
    ? { text: "Ordem certa!", tone: "success" as const, icon: "ok" as const, key: "right" }
    : state === "wrong"
      ? { text: "Tente outra ordem", tone: "danger" as const, icon: "error" as const, key: `wrong-${tries}` }
      : { text: "Coloque em ordem", tone: "info" as const, icon: "box" as const, key: "idle" };

  return (
    <>
      <Banner key={banner.key} text={banner.text} tone={banner.tone} icon={banner.icon} reducedMotion={reducedMotion} />
      {!showCards ? (
        <>
          <Wires a={phase === "request-net" || phase === "response-client" ? "active" : "idle"} b={phase === "request-server" || phase === "response-net" ? "active" : "idle"} back={phase?.startsWith("response")} />
          <LoginWindow state={login} highlighted={phase === "shown"} />
          <InternetNode look={{ highlighted: phase === "request-net" || phase === "response-net" }} />
          <ServerNode look={{ highlighted: phase === "request-server" }} />
          {travel && <Traveler key={travel.kind} kind={travel.kind} at={travel.at} reducedMotion={reducedMotion} />}
        </>
      ) : (
        <Place x={50} y={19} anchor="top" width={94}>
          <div className={styles.order}><div className={cx(!reducedMotion && styles.pop)}>
            <OrderCards items={items} correctOrder={ORDER_STEPS.map((s) => s.id)} onResult={onResult} checkLabel="Verificar" size={5} retryMs={1400} ariaLabel="Etapas para colocar em ordem" />
          </div></div>
        </Place>
      )}
      <Live text={right ? "Ordem certa: navegador envia o pedido, servidor processa, navegador mostra o resultado." : "Coloque as 3 etapas na ordem certa."} />
    </>
  );
}
