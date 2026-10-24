"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BonziState } from "@/types/domain";
import { ELEMENTS, SPRITES } from "@/config/assets";
import type { LabEngineMeta, LabEngineProps } from "@/components/learning/runtime";
import { ActionButton, Place, SceneCanvas, useSeededRandom, useTimers } from "@/components/learning/kit";
import { cx } from "@/components/ui/cx";
import { METHODS, MethodTag } from "../_api/http";
import { Banner, Live, Starfield } from "../_api/parts";
import { REPEAT_LINE_MS } from "../_api/timing";
import { BANNER, INTENT, RESOURCES, RESOURCE_IDS, STEP, TEXT, TIMING, buildRounds, diagnose, explain, pathOf, type BannerSpec, type Phase, type Request } from "./model";
import styles from "./EncontreOProblema.module.css";

/** Etapas do .md (Planeta 2.4). */
export const meta: LabEngineMeta = {
  kind: "lab",
  steps: ["Entender o objetivo", "Inspecionar", "Corrigir", "Testar"],
};

type Part = "method" | "resource" | "id";
const SALT = "g2-lab-2-4";

/** Laboratório 2.4 (Galáxia 2) — Encontre o problema (faixa14-completa.md, Assunto 2, Planeta 2.4) */
export default function EncontreOProblema({ attempt, say, feedback, setStep, mistake, finish, reducedMotion, Stage, Interaction }: LabEngineProps) {
  const rand = useSeededRandom(attempt, { salt: SALT });
  const rounds = useMemo(() => buildRounds(rand, attempt), [rand, attempt]);
  const timers = useTimers({ reducedMotion });

  const [index, setIndex] = useState(0);
  const [req, setReq] = useState<Request>(rounds[0].start);
  const [part, setPart] = useState<Part | null>(null);
  const [phase, setPhaseState] = useState<Phase>("inspect");
  const [message, setMessage] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ spec: BannerSpec; key: number }>({ spec: BANNER.goal, key: 0 });
  const phaseRef = useRef<Phase>("inspect");
  const lineRef = useRef<{ text: string; at: number } | null>(null);
  const round = rounds[index];

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
    setStep(STEP.goal);
    guide(BANNER.goal, TEXT.intro, "thinking");
    feedback({ tone: "hint", message: TEXT.inspectFb });
  }, [setStep, guide, feedback]);

  const editable = phase === "inspect" || phase === "wrong";

  /** Etapa 2: tocar numa parte destaca a intenção (método), o recurso (caminho) ou o item (ID). */
  const inspect = (p: Part) => {
    if (!editable) return;
    setPart(p);
    setStep(STEP.inspect);
    const text = p === "method" ? `${req.method}: a intenção é ${INTENT[req.method]}.` : p === "resource" ? `/${req.resource}/: o recurso é ${RESOURCES[req.resource].name}.` : `${req.id}: o item número ${req.id}.`;
    say(text);
  };

  /** Etapa 3: corrigir método, caminho ou ID. */
  const change = (next: Partial<Request>, p: Part) => {
    if (!editable) return;
    setReq((r) => ({ ...r, ...next }));
    setPart(p);
    setStep(STEP.fix);
    if (phaseRef.current === "wrong") setPhase("inspect");
  };

  /** Etapa 4: ENVIAR simula o resultado. */
  const send = () => {
    if (!editable) return;
    setPhase("sending");
    setStep(STEP.test);
    setMessage(null);
    show(BANNER.sending);
    const problems = diagnose(req, round.mission);
    timers.after(
      TIMING.sending,
      () => {
        if (problems.length > 0) {
          mistake();
          const why = explain(problems);
          setPhase("wrong");
          setMessage(why);
          guide(BANNER.wrong, why, "warning");
          feedback({ tone: "error", message: why });
          return;
        }
        setPhase("right");
        setMessage(`${TEXT.right} ${round.mission.done}`);
        guide(BANNER.right, `${TEXT.right} ${round.mission.done}`, "happy");
        feedback({ tone: "success", message: `${TEXT.right} ${round.mission.done}` });
        const last = index === rounds.length - 1;
        timers.after(
          TIMING.nextRound,
          () => {
            if (last) {
              setPhase("done");
              setStep(meta.steps.length);
              guide(BANNER.done, TEXT.done, "happy");
              feedback({ tone: "success", message: TEXT.doneFb });
              timers.after(TIMING.finish, finish, { hold: true });
              return;
            }
            const nextIndex = index + 1;
            setIndex(nextIndex);
            setReq(rounds[nextIndex].start);
            setPart(null);
            setMessage(null);
            setPhase("inspect");
            setStep(STEP.goal);
            guide(BANNER.goal, TEXT.round(nextIndex + 1), "thinking");
            feedback({ tone: "hint", message: TEXT.inspectFb });
          },
          { hold: true },
        );
      },
      { hold: true },
    );
  };

  const resource = RESOURCES[round.mission.answer.resource];
  const status = phase === "right" || phase === "done" ? "ok" : phase === "wrong" ? "wrong" : null;

  return (
    <>
      <Stage>
        <SceneCanvas className={styles.canvas} label={`Missão ${index + 1} de ${rounds.length}: ${round.mission.goal}. Requisição: ${req.method} ${pathOf(req)}`}>
          <Starfield />
          <Banner key={banner.key} text={banner.spec.text} tone={banner.spec.tone} icon={banner.spec.icon} reducedMotion={reducedMotion} />
          <Place key={`goal-${index}`} x={50} y={19} anchor="top" width={60}>
            <div className={styles.goal}>
              <img src={ELEMENTS[resource.element]} alt="" draggable={false} />
              <span>
                Missão {index + 1} de {rounds.length}
                <strong>{round.mission.goal}</strong>
              </span>
            </div>
          </Place>
          <Place x={50} y={50} z={4}>
            <div className={cx(styles.line, status === "ok" && styles.lineOk, status === "wrong" && styles.lineWrong)} role="group" aria-label="Requisição: toque numa parte para inspecionar">
              <button type="button" className={cx(styles.seg, part === "method" && styles.segLit)} onClick={() => inspect("method")} disabled={!editable} aria-label={`Inspecionar o método ${req.method}`}>
                <MethodTag method={req.method} size="lg" />
              </button>
              <button type="button" className={cx(styles.seg, styles.segPath, part === "resource" && styles.segLit)} onClick={() => inspect("resource")} disabled={!editable} aria-label={`Inspecionar o caminho /${req.resource}/`}>
                /{req.resource}/
              </button>
              <button type="button" className={cx(styles.seg, styles.segPath, part === "id" && styles.segLit)} onClick={() => inspect("id")} disabled={!editable} aria-label={`Inspecionar o ID ${req.id}`}>
                {req.id}
              </button>
            </div>
          </Place>
          {/* o simulador destaca a intenção do pedido e o recurso indicado pelo caminho */}
          <Place x={50} y={63} anchor="top" z={4}>
            <div className={styles.chips}>
              <span className={cx(styles.chip, part === "method" && styles.chipLit)}>intenção: {INTENT[req.method]}</span>
              <span className={cx(styles.chip, part === "resource" && styles.chipLit)}>recurso: {RESOURCES[req.resource].name}</span>
              <span className={cx(styles.chip, part === "id" && styles.chipLit)}>item: {req.id}</span>
            </div>
          </Place>
          {message && (
            <Place key={message} x={50} y={78} anchor="top" width={90} z={5}>
              <p className={cx(styles.message, status === "ok" ? styles.messageOk : styles.messageWrong)}>{message}</p>
            </Place>
          )}
          <Live text={message ?? ""} />
        </SceneCanvas>
      </Stage>
      <Interaction>
        <div className={styles.panel}>
          <fieldset className={styles.group} disabled={!editable}>
            <legend>Método</legend>
            {METHODS.map((m) => (
              <button key={m} type="button" className={cx(styles.opt, req.method === m && styles.optOn)} aria-pressed={req.method === m} onClick={() => change({ method: m }, "method")}>
                <MethodTag method={m} size="sm" />
              </button>
            ))}
          </fieldset>
          <fieldset className={styles.group} disabled={!editable}>
            <legend>Caminho</legend>
            {RESOURCE_IDS.map((r) => (
              <button key={r} type="button" className={cx(styles.opt, styles.optMono, req.resource === r && styles.optOn)} aria-pressed={req.resource === r} onClick={() => change({ resource: r }, "resource")}>
                /{r}/
              </button>
            ))}
          </fieldset>
          <fieldset className={styles.group} disabled={!editable}>
            <legend>ID</legend>
            {round.ids.map((id) => (
              <button key={id} type="button" className={cx(styles.opt, styles.optMono, req.id === id && styles.optOn)} aria-pressed={req.id === id} onClick={() => change({ id }, "id")}>
                {id}
              </button>
            ))}
          </fieldset>
          <ActionButton label="ENVIAR" sprite={SPRITES.ui.play} onClick={send} disabled={!editable} attention={phase === "inspect" && part !== null} size={22} />
        </div>
      </Interaction>
    </>
  );
}
