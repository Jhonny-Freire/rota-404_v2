"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BonziState } from "@/types/domain";
import { ELEMENTS, SPRITES } from "@/config/assets";
import type { LabEngineMeta, LabEngineProps } from "@/components/learning/runtime";
import { ActionButton, Place, SceneCanvas, useSeededRandom, useTimers } from "@/components/learning/kit";
import { JsonView, jsonLines, type Tok } from "../_api/Json";
import { Banner, Code, Live, Starfield } from "../_api/parts";
import { REPEAT_LINE_MS } from "../_api/timing";
import { BANNER, STEP, TEXT, TIMING, buildRounds, type BannerSpec, type Phase } from "./model";
import styles from "./CacaAoDado.module.css";

/** Etapas do .md (Planeta 3.3). */
export const meta: LabEngineMeta = {
  kind: "lab",
  steps: ["Receber a missão", "Explorar", "Conferir"],
};

const SALT = "g2-lab-3-3";

/** Laboratório 3.3 (Galáxia 2) — Caça ao dado (faixa14-completa.md, Assunto 3, Planeta 3.3) */
export default function CacaAoDado({ attempt, say, feedback, setStep, mistake, finish, reducedMotion, Stage, Interaction }: LabEngineProps) {
  const rand = useSeededRandom(attempt, { salt: SALT });
  const rounds = useMemo(() => buildRounds(rand, attempt), [rand, attempt]);
  const timers = useTimers({ reducedMotion });

  const [index, setIndex] = useState(0);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [wrongs, setWrongs] = useState(0);
  const [phase, setPhaseState] = useState<Phase>("explore");
  const [banner, setBanner] = useState<{ spec: BannerSpec; key: number }>({ spec: BANNER.mission, key: 0 });
  const phaseRef = useRef<Phase>("explore");
  const lineRef = useRef<{ text: string; at: number } | null>(null);
  const round = rounds[index];
  const lines = useMemo(() => jsonLines(round.json, expanded), [round, expanded]);

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
    setStep(STEP.mission);
    guide(BANNER.mission, TEXT.intro, "thinking");
    feedback({ tone: "hint", message: TEXT.exploreFb });
  }, [setStep, guide, feedback]);

  const open = phase === "explore" || phase === "wrong";

  /** Etapa 2: abrir objetos e listas, tocar no valor. */
  const toggle = (path: string) => {
    if (!open) return;
    setExpanded((e) => (e.includes(path) ? e : [...e, path]));
    setStep(STEP.explore);
  };

  const pick = (tok: Tok) => {
    if (!open || !tok.path) return;
    setPicked(tok.path);
    setStep(STEP.explore);
    if (phaseRef.current === "wrong") setPhase("explore");
    show(BANNER.picked);
    feedback({ tone: "hint", message: TEXT.picked });
  };

  /** Etapa 3: conferir. Certo: destaque + caminho visual. Errado: destaca a chave relevante, sem revelar o valor. */
  const check = () => {
    if (!open || !picked) return;
    setPhase("checking");
    setStep(STEP.check);
    timers.after(
      TIMING.checking,
      () => {
        if (picked !== round.answer) {
          mistake();
          setWrongs((w) => w + 1);
          setPhase("wrong");
          guide(BANNER.wrong, TEXT.wrong, "warning");
          feedback({ tone: "error", message: TEXT.wrong });
          return;
        }
        setPhase("right");
        guide(BANNER.right, TEXT.right, "happy");
        feedback({ tone: "success", message: `Caminho: ${round.trail.join(", ")}.` });
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
            const next = index + 1;
            setIndex(next);
            setExpanded([]);
            setPicked(null);
            setWrongs(0);
            setPhase("explore");
            setStep(STEP.mission);
            guide(BANNER.mission, TEXT.round(next + 1, rounds[next].level), "thinking");
            feedback({ tone: "hint", message: TEXT.exploreFb });
          },
          { hold: true },
        );
      },
      { hold: true },
    );
  };

  const right = phase === "right" || phase === "done";
  const hintMarks = Object.fromEntries(round.hints.slice(0, wrongs).map((h) => [h, "hint" as const]));
  const marks = { ...hintMarks, ...(picked ? { [picked]: right ? ("ok" as const) : phase === "wrong" ? ("wrong" as const) : ("hint" as const) } : {}) };

  return (
    <>
      <Stage>
        <SceneCanvas className={styles.canvas} label={`Missão ${index + 1} de ${rounds.length}: ${round.mission}`}>
          <Starfield />
          <Banner key={banner.key} text={banner.spec.text} tone={banner.spec.tone} icon={banner.spec.icon} reducedMotion={reducedMotion} />
          <Place key={`mission-${index}`} x={4} y={20} anchor="top-left" width={34}>
            <div className={styles.mission}>
              <span className={styles.missionHead}>
                <img src={ELEMENTS.magnifier} alt="" draggable={false} />
                Missão {index + 1} de {rounds.length} · {round.level}
              </span>
              <strong>{round.mission}</strong>
            </div>
          </Place>
          <Place x={96} y={18} anchor="top-right" width={54}>
            <JsonView
              key={index}
              lines={lines}
              title="RESPOSTA DA API"
              label={`JSON da missão: ${round.mission}`}
              tappable={open ? ["string", "number", "boolean"] : []}
              onTap={pick}
              onToggle={open ? toggle : undefined}
              marks={marks}
              highlight={right ? [round.answer] : []}
            />
          </Place>
          {right && (
            <Place key={`trail-${index}`} x={4} y={62} anchor="top-left" width={36} z={5}>
              <div className={styles.trail} aria-label={`Caminho: ${round.trail.join(", ")}`}>
                {round.trail.map((step, i) => (
                  <Fragment key={step}>
                    {i > 0 && <img src={SPRITES.ui.next} alt="" draggable={false} />}
                    <Code>{step}</Code>
                  </Fragment>
                ))}
              </div>
            </Place>
          )}
          <Live text={right ? `Caminho: ${round.trail.join(", ")}` : phase === "wrong" ? TEXT.wrong : ""} />
        </SceneCanvas>
      </Stage>
      <Interaction>
        <div className={styles.panel}>
          <p className={styles.lead}>
            {picked ? (
              <>
                Valor escolhido: <strong>{lines.flatMap((l) => l.toks).find((t) => t.path === picked && t.kind !== "key")?.text ?? "?"}</strong>
              </>
            ) : (
              "Toque num valor do JSON para escolher."
            )}
          </p>
          <ActionButton label="CONFERIR" element="magnifier" onClick={check} disabled={!open || !picked} attention={open && Boolean(picked) && phase !== "wrong"} focusOnAttention size={22} />
        </div>
      </Interaction>
    </>
  );
}
