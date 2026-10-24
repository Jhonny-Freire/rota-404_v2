"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BonziState } from "@/types/domain";
import { SPRITES } from "@/config/assets";
import type { LabEngineMeta, LabEngineProps } from "@/components/learning/runtime";
import {
  ActionButton,
  DragPiece,
  DragProvider,
  DropZone,
  Place,
  SceneCanvas,
  useSeededRandom,
  useTimers,
  type DragMoveHandler,
} from "@/components/learning/kit";
import { cx } from "@/components/ui/cx";
import { Banner, Live, Node, Starfield } from "../_api/parts";
import { REPEAT_LINE_MS } from "../_api/timing";
import { ApiWorld, SHOWN_STEP, type RoleId } from "../_api/World";
import { BANNER, LABELS, QUERIES, STEP, TEXT, TIMING, type BannerSpec, type LabelId, type Phase, type QueryId } from "./model";
import styles from "./FacaUmaPerguntaAoServidor.module.css";

/** Etapas do .md (Planeta 1.3). */
export const meta: LabEngineMeta = {
  kind: "lab",
  steps: ["Escolher a consulta", "Enviar", "Receber a resposta", "Identificar o fluxo"],
};

/** Etapa 4: onde fica o lugar de cada etiqueta no palco, e qual peça do mundo ele aponta. */
const ZONES: Record<LabelId, { x: number; y: number; role?: RoleId }> = {
  cliente: { x: 15.5, y: 70, role: "client" },
  api: { x: 51, y: 66, role: "api" },
  servidor: { x: 85, y: 70, role: "server" },
  requisicao: { x: 38, y: 16 },
  resposta: { x: 68, y: 16 },
};
const MESSAGE_AT = { requisicao: { x: 38, y: 38 }, resposta: { x: 68, y: 38 } };

const SALT = "g2-lab-1-3";

/** Laboratório 1.3 (Galáxia 2) — Faça uma pergunta ao servidor (faixa14-completa.md, Assunto 1, Planeta 1.3) */
export default function FacaUmaPerguntaAoServidor({ attempt, say, feedback, setStep, mistake, finish, reducedMotion, Stage, Interaction }: LabEngineProps) {
  const rand = useSeededRandom(attempt, { salt: SALT });
  const timers = useTimers({ reducedMotion });
  const pool = useMemo(() => rand.shuffle(LABELS, "pool", true), [rand]);

  const [phase, setPhaseState] = useState<Phase>("choose");
  const [queryId, setQueryId] = useState<QueryId | null>(null);
  const [worldStep, setWorldStep] = useState(-1);
  const [placed, setPlaced] = useState<LabelId[]>([]);
  const [wrongZone, setWrongZone] = useState<LabelId | null>(null);
  const [banner, setBanner] = useState<{ spec: BannerSpec; key: number }>({ spec: BANNER.choose, key: 0 });
  const phaseRef = useRef<Phase>("choose");
  const lineRef = useRef<{ text: string; at: number } | null>(null);

  const query = QUERIES.find((q) => q.id === queryId) ?? null;
  /* dados predefinidos: cada "Jogar de novo" mostra outro conjunto */
  const data = query ? query.data[attempt % query.data.length] : null;

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
    setStep(STEP.choose);
    guide(BANNER.choose, TEXT.intro, "happy");
    feedback({ tone: "hint", message: TEXT.introFb });
  }, [setStep, guide, feedback]);

  /** Etapa 1: escolher a consulta (pode trocar enquanto não enviou). */
  const choose = (id: QueryId) => {
    if (phaseRef.current !== "choose" && phaseRef.current !== "ready") return;
    setQueryId(id);
    setPhase("ready");
    setStep(STEP.send);
    guide(BANNER.ready, TEXT.chosen);
    feedback({ tone: "hint", message: TEXT.chosenFb });
  };

  /** Etapas 2 e 3: CONSULTAR anima a requisição até o servidor e a resposta de volta. */
  const consult = () => {
    if (phaseRef.current !== "ready") return;
    setPhase("sending");
    guide(BANNER.sending, TEXT.sending);
    feedback({ tone: "info", message: TEXT.sendingFb });
    let at = 0;
    TIMING.send.forEach((ms, index) => {
      at += ms;
      timers.after(at - ms, () => setWorldStep(index), { hold: true });
    });
    timers.after(at, () => {
      setPhase("receiving");
      setStep(STEP.receive);
      show(BANNER.receiving);
      setWorldStep(5);
    }, { hold: true });
    TIMING.receive.forEach((ms, index) => {
      at += ms;
      timers.after(at, () => setWorldStep(6 + index), { hold: true });
    });
    timers.after(at, () => {
      guide(BANNER.received, TEXT.received, "happy");
      feedback({ tone: "success", message: TEXT.receivedFb });
    }, { hold: true });
    timers.after(at + TIMING.readResult, () => {
      setPhase("identify");
      setStep(STEP.identify);
      guide(BANNER.identify, TEXT.identify, "thinking");
      feedback({ tone: "hint", message: TEXT.identifyFb });
    }, { hold: true });
  };

  /** Etapa 4: cada etiqueta no lugar certo. Errado: o lugar acende, o Bonzi explica a função dessa parte e conta erro. */
  const onMove: DragMoveHandler = (itemId, zoneId) => {
    if (phaseRef.current !== "identify") return false;
    const label = LABELS.find((l) => l.id === itemId);
    const zone = LABELS.find((l) => `zona-${l.id}` === zoneId);
    if (!label || !zone || placed.includes(label.id)) return false;
    if (label.id !== zone.id) {
      mistake();
      setWrongZone(zone.id);
      timers.after(TIMING.wrongMs, () => setWrongZone((w) => (w === zone.id ? null : w)), { hold: true });
      guide(BANNER.wrong, zone.wrong, "warning");
      feedback({ tone: "error", message: zone.wrong });
      return false;
    }
    const next = [...placed, label.id];
    setPlaced(next);
    setWrongZone(null);
    if (next.length === LABELS.length) {
      setPhase("done");
      setStep(meta.steps.length);
      guide(BANNER.done, TEXT.done, "happy");
      feedback({ tone: "success", message: TEXT.doneFb });
      timers.after(TIMING.finish, finish, { hold: true });
    } else {
      show(BANNER.identify);
      say(TEXT.right, "happy");
      feedback({ tone: "success", message: TEXT.rightFb(LABELS.length - next.length) });
    }
    return true;
  };

  const identify = phase === "identify" || phase === "done";
  const wrongRole = wrongZone ? ZONES[wrongZone].role ?? null : null;

  return (
    <DragProvider onMove={onMove} disabled={phase !== "identify"}>
      <Stage>
        <SceneCanvas className={styles.canvas} label="Simulação de uma consulta: aplicativo, API e servidor">
          <Starfield />
          <Banner key={banner.key} text={banner.spec.text} tone={banner.spec.tone} icon={banner.spec.icon} reducedMotion={reducedMotion} />
          {query && data ? (
            <ApiWorld
              step={identify ? SHOWN_STEP : worldStep}
              reducedMotion={reducedMotion}
              appName={query.app}
              appIcon={query.appIcon}
              appCaption={data.caption}
              appValue={data.value}
              appEmpty="?"
              serviceLabel={query.service}
              serviceBadge={query.badge}
              requestLabel={query.request}
              responseLabel={data.response}
              panelRows={data.rows}
              bare={identify}
              focus={wrongRole}
            />
          ) : (
            <ApiWorld step={-1} reducedMotion={reducedMotion} appName="Aplicativo" appCaption="Escolha uma consulta" appValue="" requestLabel="" responseLabel="" />
          )}
          {identify && (
            <>
              <Message id="requisicao" wrong={wrongZone === "requisicao"} />
              <Message id="resposta" wrong={wrongZone === "resposta"} />
              {LABELS.map((label) => {
                const zone = ZONES[label.id];
                const inside = placed.includes(label.id);
                return (
                  <Place key={label.id} x={zone.x} y={zone.y} anchor="top" width={15} z={7}>
                    <DropZone
                      id={`zona-${label.id}`}
                      label={label.zone}
                      hideLabel
                      layout="stack"
                      status={inside ? "correct" : wrongZone === label.id ? "wrong" : null}
                      className={styles.zone}
                      emptyHint={<span className={styles.zoneHint}>Solte aqui</span>}
                    >
                      {inside && <DragPiece id={label.id} label={label.text} status="correct" disabled className={styles.tag} />}
                    </DropZone>
                  </Place>
                );
              })}
            </>
          )}
          <Live text={identify ? `${placed.length} de ${LABELS.length} etiquetas no lugar.` : ""} />
        </SceneCanvas>
      </Stage>
      <Interaction>
        <div className={styles.panel}>
          {(phase === "choose" || phase === "ready") && (
            <>
              <p className={styles.lead}>{phase === "choose" ? "O que você quer perguntar ao servidor?" : "Consulta escolhida. Pode trocar antes de enviar."}</p>
              <div className={styles.options} role="group" aria-label="Consultas">
                {QUERIES.map((q) => (
                  <ActionButton key={q.id} label={q.option} element={q.icon} variant={queryId === q.id ? "primary" : "default"} onClick={() => choose(q.id)} size={22} />
                ))}
              </div>
              {phase === "ready" && <ActionButton label="CONSULTAR" sprite={SPRITES.ui.play} onClick={consult} attention focusOnAttention size={22} />}
            </>
          )}
          {(phase === "sending" || phase === "receiving") && <p className={styles.lead}>{phase === "sending" ? "Enviando a requisição..." : "Recebendo a resposta..."}</p>}
          {identify && (
            <>
              <p className={styles.lead}>
                Etiquetas no lugar: <strong>{placed.length}</strong> de {LABELS.length}
              </p>
              <div className={styles.pool} role="group" aria-label="Etiquetas">
                {pool
                  .filter((label) => !placed.includes(label.id))
                  .map((label) => (
                    <span key={label.id} className={cx(!reducedMotion && styles.cue)}>
                      <DragPiece id={label.id} label={label.text} className={styles.tag} />
                    </span>
                  ))}
              </div>
            </>
          )}
        </div>
      </Interaction>
    </DragProvider>
  );
}

/** Etapa 4: as duas mensagens paradas, com a direção (vai para o servidor / volta para o aplicativo). */
function Message({ id, wrong }: { id: "requisicao" | "resposta"; wrong: boolean }) {
  const at = MESSAGE_AT[id];
  const going = id === "requisicao";
  return (
    <>
      <Node at={at} element={going ? "mail" : "boxGold"} size={4.6} alt={going ? "Mensagem indo do aplicativo para o servidor" : "Mensagem voltando do servidor para o aplicativo"} look={{ wrong }} z={5} />
      <Place x={at.x + (going ? 5 : -5)} y={at.y} z={5}>
        <img src={going ? SPRITES.ui.next : SPRITES.ui.back} alt="" draggable={false} className={styles.arrow} />
      </Place>
    </>
  );
}
