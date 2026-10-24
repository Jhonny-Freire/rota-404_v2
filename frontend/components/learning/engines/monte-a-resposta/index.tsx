"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BonziState } from "@/types/domain";
import { ELEMENTS } from "@/config/assets";
import type { LabEngineMeta, LabEngineProps } from "@/components/learning/runtime";
import { ActionButton, DragPiece, DragProvider, DropZone, POOL_ZONE, Place, SceneCanvas, useSeededRandom, useTimers, type DragMoveHandler } from "@/components/learning/kit";
import { cx } from "@/components/ui/cx";
import { JsonView, jsonLines } from "../_api/Json";
import { Banner, Live, Starfield } from "../_api/parts";
import { REPEAT_LINE_MS } from "../_api/timing";
import { BANNER, STEP, TEMPLATES, TEXT, TIMING, asJson, type BannerSpec, type Phase } from "./model";
import styles from "./MonteAResposta.module.css";

/** Etapas do .md (Planeta 3.4). */
export const meta: LabEngineMeta = {
  kind: "lab",
  steps: ["Ler os dados", "Preencher a interface", "Visualizar", "Corrigir"],
};

const SALT = "g2-lab-3-4";

/** Laboratório 3.4 (Galáxia 2) — Monte a resposta (faixa14-completa.md, Assunto 3, Planeta 3.4) */
export default function MonteAResposta({ attempt, say, feedback, setStep, mistake, finish, reducedMotion, Stage, Interaction }: LabEngineProps) {
  const session = useSeededRandom(0, { salt: `${SALT}:visita` });
  const rand = useSeededRandom(attempt, { salt: SALT });
  /* garante outro modelo a cada "Jogar de novo" */
  const template = useMemo(() => TEMPLATES[(session.int(0, TEMPLATES.length - 1, "modelo") + attempt) % TEMPLATES.length], [session, attempt]);
  const values = useMemo(() => rand.shuffle(template.fields.map((f) => ({ id: `v-${f.key}`, key: f.key, text: String(template.json[f.key]) })), "valores", true), [rand, template]);
  const lines = useMemo(() => jsonLines(asJson(template)), [template]);
  const timers = useTimers({ reducedMotion });

  /** campo → id do valor colocado */
  const [slots, setSlots] = useState<Record<string, string>>({});
  const slotsRef = useRef<Record<string, string>>({});
  const [wrong, setWrong] = useState<string[]>([]);
  const [phase, setPhaseState] = useState<Phase>("read");
  const [banner, setBanner] = useState<{ spec: BannerSpec; key: number }>({ spec: BANNER.read, key: 0 });
  const phaseRef = useRef<Phase>("read");
  const lineRef = useRef<{ text: string; at: number } | null>(null);
  const full = template.fields.every((f) => slots[f.key]);

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

  /* Etapa 1: ler os dados; depois começa a montagem */
  useEffect(() => {
    setStep(STEP.read);
    guide(BANNER.read, TEXT.intro, "thinking");
    feedback({ tone: "hint", message: TEXT.introFb });
    return timers.after(
      TIMING.read,
      () => {
        if (phaseRef.current !== "read") return;
        setPhase("fill");
        setStep(STEP.fill);
        show(BANNER.fill);
      },
      { hold: true },
    );
  }, [setStep, guide, feedback, timers, setPhase, show]);

  /** Etapa 2: colocar, trocar ou devolver valores. Campo ocupado: o valor que estava lá volta ao monte. */
  const onMove: DragMoveHandler = (itemId, zoneId) => {
    const now = phaseRef.current;
    if (now === "checking" || now === "done") return false;
    if (now === "read") setPhase("fill");
    const next = Object.fromEntries(Object.entries(slotsRef.current).filter(([, v]) => v !== itemId));
    if (zoneId !== POOL_ZONE) next[zoneId] = itemId;
    slotsRef.current = next;
    setSlots(next);
    if (template.fields.every((f) => next[f.key])) {
      setStep(STEP.view);
      show(BANNER.full);
      feedback({ tone: "hint", message: TEXT.fullFb });
    } else {
      setStep(wrong.length ? STEP.fix : STEP.fill);
      show(BANNER.fill);
    }
    setWrong((w) => w.filter((key) => key !== zoneId));
    if (now === "wrong") setPhase("fill");
    return true;
  };

  /** Etapas 3 e 4: CONFERIR. Campo com valor de outra chave: destaque e reposicionar. */
  const check = () => {
    if (!full || phaseRef.current === "checking" || phaseRef.current === "done") return;
    setPhase("checking");
    timers.after(
      TIMING.checking,
      () => {
        const bad = template.fields.filter((f) => values.find((v) => v.id === slots[f.key])?.key !== f.key);
        if (bad.length > 0) {
          mistake();
          setWrong(bad.map((f) => f.key));
          setPhase("wrong");
          setStep(STEP.fix);
          const message = TEXT.wrong(bad.map((f) => f.label));
          guide(BANNER.wrong, message, "warning");
          feedback({ tone: "error", message });
          return;
        }
        setPhase("done");
        setStep(meta.steps.length);
        guide(BANNER.done, TEXT.done, "happy");
        feedback({ tone: "success", message: TEXT.doneFb });
        timers.after(TIMING.finish, finish, { hold: true });
      },
      { hold: true },
    );
  };

  const pool = values.filter((v) => !Object.values(slots).includes(v.id));
  const done = phase === "done";

  return (
    <DragProvider onMove={onMove} disabled={phase === "checking" || done}>
      <Stage>
        <SceneCanvas className={styles.canvas} label={`Montar o ${template.name} com os dados do JSON`}>
          <Starfield />
          <Banner key={banner.key} text={banner.spec.text} tone={banner.spec.tone} icon={banner.spec.icon} reducedMotion={reducedMotion} />
          <Place x={4} y={19} anchor="top-left" width={40}>
            <JsonView lines={lines} title="DADOS (JSON)" label={template.label} highlight={wrong} />
          </Place>
          <Place x={96} y={19} anchor="top-right" width={46} z={4}>
            <div className={cx(styles.card, done && styles.cardDone)} role="group" aria-label={template.name}>
              <span className={styles.cardHead}>
                <img src={ELEMENTS[template.icon]} alt="" draggable={false} />
                {template.name}
              </span>
              {template.fields.map((field) => {
                const value = values.find((v) => v.id === slots[field.key]);
                const bad = wrong.includes(field.key);
                return (
                  <div key={field.key} className={styles.row}>
                    <span className={styles.rowLabel}>{field.label}</span>
                    <DropZone id={field.key} label={`Campo ${field.label}`} hideLabel layout="stack" status={done ? "correct" : bad ? "wrong" : null} className={styles.slot} emptyHint={<span className={styles.hint}>solte aqui</span>}>
                      {value && <DragPiece id={value.id} label={value.text} disabled={done} className={styles.value} />}
                    </DropZone>
                  </div>
                );
              })}
            </div>
          </Place>
          {/* Etapa 3: o simulador monta o cartão com os valores escolhidos */}
          {full && (
            <Place x={96} y={66} anchor="top-right" width={46} z={4}>
              <div className={cx(styles.preview, done && styles.previewDone, wrong.length > 0 && styles.previewWrong)} aria-label="Como o cartão aparece para o usuário">
                {template.fields.map((field) => {
                  const value = values.find((v) => v.id === slots[field.key]);
                  return (
                    <span key={field.key} className={cx(wrong.includes(field.key) && styles.previewBad)}>
                      {field.label}: <strong>{value ? field.format(value.text) : "?"}</strong>
                    </span>
                  );
                })}
              </div>
            </Place>
          )}
          <Live text={full ? template.fields.map((f) => `${f.label}: ${values.find((v) => v.id === slots[f.key])?.text ?? "vazio"}`).join(". ") : ""} />
        </SceneCanvas>
      </Stage>
      <Interaction>
        <div className={styles.panel}>
          {/* o monte fica aqui (e não no palco): no celular as peças de 44 px não cabiam abaixo do JSON */}
          <DropZone id={POOL_ZONE} label="Valores do JSON" className={styles.pool} emptyHint={<span className={styles.hint}>Todos os valores estão no cartão</span>}>
            {pool.map((v) => (
              <span key={v.id} className={cx(!reducedMotion && phase !== "done" && styles.cue)}>
                <DragPiece id={v.id} label={v.text} className={styles.value} />
              </span>
            ))}
          </DropZone>
          <p className={styles.lead}>
            Campos preenchidos: <strong>{Object.keys(slots).length}</strong> de {template.fields.length}
          </p>
          <ActionButton label="CONFERIR" element="magnifier" onClick={check} disabled={!full || phase === "checking" || done} attention={full && phase !== "wrong" && !done} focusOnAttention size={22} />
        </div>
      </Interaction>
    </DragProvider>
  );
}
