"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BonziState } from "@/types/domain";
import { ELEMENTS, SPRITES } from "@/config/assets";
import type { LabEngineMeta, LabEngineProps } from "@/components/learning/runtime";
import { ActionButton, Place, SceneCanvas, useSeededRandom, useTimers } from "@/components/learning/kit";
import { cx } from "@/components/ui/cx";
import { METHODS, MethodTag, RequestLine, type HttpMethod } from "../_api/http";
import { Banner, Live, Starfield } from "../_api/parts";
import { REPEAT_LINE_MS } from "../_api/timing";
import { BANNER, RESOURCES, STEP, TEXT, TIMING, buildMissions, explainWrong, type BannerSpec, type Mission, type Phase, type Row } from "./model";
import styles from "./QualMetodoDevoUsar.module.css";

/** Etapas do .md (Planeta 2.3). */
export const meta: LabEngineMeta = {
  kind: "lab",
  steps: ["Ler a missão", "Escolher", "Ver o efeito", "Variar"],
};

/** Aula 2.2: as intenções, para o botão "Rever os métodos" (Feedback do .md). */
const INTENTS: Record<HttpMethod, string> = {
  GET: "consultar: busca um recurso sem pedir sua alteração.",
  POST: "enviar/criar: envia dados para criar um recurso ou executar uma operação.",
  PUT: "substituir/atualizar: envia dados para substituir ou atualizar um recurso.",
  DELETE: "remover: solicita a remoção de um recurso.",
};

const SALT = "g2-lab-2-3";

/** Laboratório 2.3 (Galáxia 2) — Qual método devo usar? (faixa14-completa.md, Assunto 2, Planeta 2.3) */
export default function QualMetodoDevoUsar({ attempt, say, feedback, setStep, mistake, finish, reducedMotion, Stage, Interaction }: LabEngineProps) {
  const rand = useSeededRandom(attempt, { salt: SALT });
  const missions = useMemo(() => buildMissions(rand), [rand]);
  const timers = useTimers({ reducedMotion });

  const [index, setIndex] = useState(0);
  const [phase, setPhaseState] = useState<Phase>("choose");
  const [picked, setPicked] = useState<HttpMethod | null>(null);
  const [tested, setTested] = useState<HttpMethod | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [review, setReview] = useState(false);
  const [banner, setBanner] = useState<{ spec: BannerSpec; key: number }>({ spec: BANNER.read, key: 0 });
  const phaseRef = useRef<Phase>("choose");
  const lineRef = useRef<{ text: string; at: number } | null>(null);
  const mission = missions[index];

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
    setStep(STEP.read);
    guide(BANNER.read, TEXT.intro, "thinking");
    feedback({ tone: "hint", message: TEXT.chooseFb });
  }, [setStep, guide, feedback]);

  const pick = (method: HttpMethod) => {
    const now = phaseRef.current;
    if (now !== "choose" && now !== "wrong") return;
    setPicked(method);
    setPhase("choose");
    setStep(index === 0 ? STEP.choose : STEP.vary);
    show(BANNER.picked);
    feedback({ tone: "hint", message: TEXT.pickedFb(method) });
  };

  /** Etapas 2 e 3: TESTAR executa a ação no catálogo fictício. */
  const test = () => {
    if (phaseRef.current !== "choose" || !picked) return;
    setPhase("testing");
    setTested(picked);
    setMessage(null);
    if (index === 0) setStep(STEP.effect);
    show(BANNER.testing);
    timers.after(TIMING.testing, () => {
      if (picked === mission.method) {
        setPhase("right");
        setMessage(mission.result);
        guide(BANNER.right, TEXT.right, "happy");
        feedback({ tone: "success", message: mission.result });
        const last = index === missions.length - 1;
        timers.after(
          TIMING.nextMission,
          () => {
            if (last) {
              setPhase("done");
              setStep(meta.steps.length);
              guide(BANNER.done, TEXT.done, "happy");
              feedback({ tone: "success", message: TEXT.doneFb });
              timers.after(TIMING.finish, finish, { hold: true });
              return;
            }
            setIndex(index + 1);
            setPicked(null);
            setTested(null);
            setMessage(null);
            setPhase("choose");
            setStep(STEP.vary);
            guide(BANNER.read, TEXT.mission(index + 2, missions.length));
            feedback({ tone: "hint", message: TEXT.chooseFb });
          },
          { hold: true },
        );
        return;
      }
      mistake();
      const why = explainWrong(picked, mission);
      setPhase("wrong");
      setMessage(why);
      guide(BANNER.wrong, why, "warning");
      feedback({ tone: "error", message: why });
    }, { hold: true });
  };

  const toggleReview = () => {
    setReview((r) => !r);
    if (!review) say(TEXT.review);
  };

  const resource = RESOURCES[mission.resource];
  const right = phase === "right" || (phase === "done" && tested === mission.method);
  const rows: Row[] = useMemo(() => {
    const base = resource.rows;
    if (!right) return base;
    if (mission.effect.type === "new") return [...base, { id: mission.effect.id, text: mission.effect.text ?? "" }];
    if (mission.effect.type === "changed") return base.map((r) => (r.id === mission.effect.id ? { ...r, text: mission.effect.text ?? r.text } : r));
    return base;
  }, [resource, right, mission]);

  return (
    <>
      <Stage>
        <SceneCanvas className={styles.canvas} label={`Missão ${index + 1} de ${missions.length}: ${mission.text}`}>
          <Starfield />
          <Banner key={banner.key} text={banner.spec.text} tone={banner.spec.tone} icon={banner.spec.icon} reducedMotion={reducedMotion} />
          <Place key={`card-${index}`} x={4} y={20} anchor="top-left" width={40}>
            <MissionCard mission={mission} n={index + 1} total={missions.length} />
          </Place>
          <Place x={96} y={20} anchor="top-right" width={46}>
            <ResourceList title={resource.name} element={resource.element} rows={rows} mission={mission} right={right} />
          </Place>
          {tested && (phase === "right" || phase === "wrong" || phase === "done") && (
            <Place key={`line-${index}-${tested}`} x={4} y={60} anchor="top-left" width={92} z={4}>
              <div className={styles.outcome}>
                <RequestLine method={tested} path={mission.path} status={tested === mission.method ? "ok" : "wrong"} />
                {tested === mission.method && mission.body && <span className={styles.body}>{mission.body}</span>}
                {message && <p className={cx(styles.message, tested === mission.method ? styles.messageOk : styles.messageWrong)}>{message}</p>}
              </div>
            </Place>
          )}
          <Live text={message ?? `Missão ${index + 1}: ${mission.text}`} />
        </SceneCanvas>
      </Stage>
      <Interaction>
        <div className={styles.panel}>
          <div className={styles.methods} role="radiogroup" aria-label="Escolha o método">
            {METHODS.map((method) => (
              <button
                key={method}
                type="button"
                role="radio"
                aria-checked={picked === method}
                className={cx(styles.methodBtn, picked === method && styles.methodPicked)}
                onClick={() => pick(method)}
                disabled={phase === "testing" || phase === "right" || phase === "done"}
              >
                <MethodTag method={method} />
              </button>
            ))}
          </div>
          <div className={styles.actions}>
            <ActionButton label="TESTAR" sprite={SPRITES.ui.play} onClick={test} disabled={!picked || phase !== "choose"} attention={Boolean(picked) && phase === "choose"} focusOnAttention size={22} />
            <ActionButton label={review ? "Fechar revisão" : "Rever os métodos"} element="magnifier" variant="ghost" onClick={toggleReview} size={18} />
          </div>
          {review && (
            <ul className={styles.review} aria-label="Intenções dos métodos (Aula 2.2)">
              {METHODS.map((method) => (
                <li key={method}>
                  <MethodTag method={method} size="sm" />
                  <span>{INTENTS[method]}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Interaction>
    </>
  );
}

/**
 * Revisão ("deixar mais claro a missão"), só escrito: o verbo da missão em destaque e a dica de como resolver; a
 * lista marca o item da missão (ResourceList). Sem fala nova do Bonzi.
 */
function MissionCard({ mission, n, total }: { mission: Mission; n: number; total: number }) {
  const space = mission.text.indexOf(" ");
  const verb = space > 0 ? mission.text.slice(0, space) : mission.text;
  const rest = space > 0 ? mission.text.slice(space) : "";
  return (
    <div className={styles.card}>
      <span className={styles.cardHead}>
        <img src={ELEMENTS.receipt} alt="" draggable={false} />
        Missão {n} de {total}
      </span>
      <strong className={styles.cardText}>
        <mark className={styles.verb}>{verb}</mark>
        {rest}
      </strong>
      <span className={styles.cardTip}>O verbo diz o que fazer. Escolha o método com essa intenção e toque em TESTAR.</span>
    </div>
  );
}

/** A lista fictícia do recurso; com o método certo, mostra o efeito (destaque, novo, alterado ou removido). */
function ResourceList({ title, element, rows, mission, right }: { title: string; element: keyof typeof ELEMENTS; rows: Row[]; mission: Mission; right: boolean }) {
  return (
    <div className={styles.list} role="table" aria-label={`Lista: ${title}`}>
      <div className={styles.listHead} role="row">
        <img src={ELEMENTS[element]} alt="" draggable={false} />
        <span role="columnheader">{title}</span>
      </div>
      {rows.map((row) => {
        const hit = right && row.id === mission.effect.id;
        const target = !right && row.id === mission.effect.id && mission.effect.type !== "new";
        return (
          <div
            key={row.id}
            role="row"
            className={cx(
              styles.listRow,
              target && styles.rowTarget,
              hit && mission.effect.type === "lit" && styles.rowLit,
              hit && mission.effect.type === "new" && styles.rowNew,
              hit && mission.effect.type === "changed" && styles.rowChanged,
              hit && mission.effect.type === "removed" && styles.rowRemoved,
            )}
          >
            <span role="cell">{row.id}</span>
            <span role="cell">{row.text}</span>
          </div>
        );
      })}
      {!right && mission.effect.type === "new" && (
        <div role="row" className={cx(styles.listRow, styles.rowGhost)}>
          <span role="cell">+</span>
          <span role="cell">novo item</span>
        </div>
      )}
    </div>
  );
}
