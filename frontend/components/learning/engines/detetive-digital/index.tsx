"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BonziState } from "@/types/domain";
import type { LabEngineMeta, LabEngineProps } from "@/components/learning/runtime";
import { ActionButton, useSeededRandom, useTimers } from "@/components/learning/kit";
import { CaseScene, type CaseStatus, type ResultData } from "./CaseScene";
import { BANNER, REPEAT_LINE_MS, STEP, TEXT, buildCases, type BannerSpec, type Category, type Phase } from "./model";
import styles from "./DetetiveDigital.module.css";

/** Etapas do lab4-3.md (Fluxo). */
export const meta: LabEngineMeta = {
  kind: "lab",
  steps: ["Analisar as evidências", "Classificar", "Descobrir os indícios", "Revisar os casos"],
};

const SALT = "detetive-digital";
const WRONG_BACK_MS = 2600;
const REJECT_MS = 1300;

/** Laboratório 4.3 — Detetive digital (G1 - Internet e Web/S4 - Comunicação e segurança/lab4-3.md) */
export default function DetetiveDigital({ attempt, say, feedback, setStep, mistake, finish, reducedMotion, Stage, Interaction }: LabEngineProps) {
  const rand = useSeededRandom(attempt, { salt: SALT });
  const cases = useMemo(() => buildCases(rand), [rand]);
  const timers = useTimers({ reducedMotion });

  const [phase, setPhaseState] = useState<Phase>("board");
  const [status, setStatus] = useState<Record<string, CaseStatus>>({});
  const [reviewing, setReviewing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [examined, setExamined] = useState<string[]>([]);
  const [rejected, setRejected] = useState<Category | null>(null);
  const [banner, setBanner] = useState<{ spec: BannerSpec; key: number }>({ spec: BANNER.pick, key: 0 });
  const phaseRef = useRef<Phase>("board");
  const statusRef = useRef<Record<string, CaseStatus>>({});
  const reviewingRef = useRef(false);
  /** casos errados na primeira classificação (para o painel final) */
  const missedRef = useRef(new Set<string>());
  const lineRef = useRef<{ text: string; at: number } | null>(null);

  const current = cases.find((c) => c.id === currentId) ?? null;

  const setPhase = useCallback((next: Phase) => {
    phaseRef.current = next;
    setPhaseState(next);
  }, []);

  const mark = (id: string, value: CaseStatus) => {
    statusRef.current = { ...statusRef.current, [id]: value };
    setStatus(statusRef.current);
  };

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

  // lab4-3.md: o Bonzi apresenta a investigação.
  useEffect(() => {
    setStep(STEP.analyze);
    guide(BANNER.pick, TEXT.intro, "happy");
    feedback({ tone: "hint", message: TEXT.howPick });
  }, [setStep, guide, feedback]);

  const toResult = () => {
    setPhase("result");
    setCurrentId(null);
    setStep(meta.steps.length);
    guide(BANNER.result, TEXT.done, "happy");
    feedback({ tone: "success", message: TEXT.resultFb });
  };

  /** Volta ao quadro; ao terminar todos os cartões, começa a revisão (Etapa 4) ou mostra o resultado. */
  const toBoard = () => {
    const st = statusRef.current;
    setCurrentId(null);
    setExamined([]);
    setRejected(null);
    const open = cases.filter((c) => (st[c.id] ?? "open") === "open");
    const review = cases.filter((c) => st[c.id] === "review");
    if (!reviewingRef.current && open.length === 0 && review.length > 0) {
      reviewingRef.current = true;
      setReviewing(true);
      setStep(STEP.review);
      setPhase("board");
      guide(BANNER.review, TEXT.review, "thinking");
      feedback({ tone: "hint", message: TEXT.reviewFb });
      return;
    }
    if ((reviewingRef.current ? review.length : open.length) === 0) {
      toResult();
      return;
    }
    setPhase("board");
    setStep(reviewingRef.current ? STEP.review : STEP.analyze);
    guide(reviewingRef.current ? BANNER.review : BANNER.pick, TEXT.pick);
    feedback({ tone: "hint", message: reviewingRef.current ? TEXT.reviewFb : TEXT.howPick });
  };

  /** Etapa 1: o aluno escolhe um cartão; a situação aparece em tamanho maior. */
  const pick = (id: string) => {
    if (phaseRef.current !== "board") return;
    const st = statusRef.current[id] ?? "open";
    const allowed = reviewingRef.current ? st === "review" : st === "open";
    if (!allowed) {
      guide(reviewingRef.current ? BANNER.review : BANNER.pick, TEXT.pick);
      return;
    }
    setCurrentId(id);
    setExamined([]);
    setRejected(null);
    setPhase("examine");
    setStep(reviewingRef.current ? STEP.review : STEP.analyze);
    guide(BANNER.examine, reviewingRef.current ? TEXT.reviewOpen : TEXT.examine, "thinking");
    feedback({ tone: "hint", message: TEXT.howExamine });
  };

  /** Tocar numa pista: o detetive percebe um detalhe; nas pistas de endereço e permissão, o Bonzi pergunta. */
  const examine = (evidenceId: string) => {
    const ev = current?.evidence.find((e) => e.id === evidenceId);
    if (!ev || (phaseRef.current !== "examine" && phaseRef.current !== "reveal")) return;
    setExamined((prev) => (prev.includes(evidenceId) ? prev : [...prev, evidenceId]));
    feedback({ tone: "info", message: `${ev.label}: ${ev.note}` });
    /* revisão de UX: o Bonzi narra o que o detetive percebe em cada pista (antes ficava só no painel) */
    const explanation = `${ev.label}: ${ev.note}`;
    if (phaseRef.current === "examine") {
      if (!reviewingRef.current) setStep(STEP.classify);
      if (ev.question) {
        say(ev.question, "thinking");
        say(explanation, "speaking", { afterCurrent: true });
        return;
      }
    }
    say(explanation);
  };

  /** Etapa 2: arrastar o cartão para uma categoria. Certo: indícios (Etapa 3). Errado: revisão no fim (Etapa 4). */
  const onMove = (itemId: string, zoneId: string): boolean => {
    if (phaseRef.current !== "examine" || !current || itemId !== current.id) return false;
    const category = zoneId as Category;
    if (category === current.category) {
      mark(current.id, "right");
      setExamined(current.evidence.map((e) => e.id));
      setPhase("reveal");
      setStep(reviewingRef.current ? STEP.review : STEP.reveal);
      feedback({ tone: "success", message: TEXT.rightFb(category) });
      guide(BANNER.right, current.reveal, "happy");
      return true;
    }
    mistake();
    setRejected(category);
    timers.after(REJECT_MS, () => setRejected((r) => (r === category ? null : r)), { hold: true });
    if (reviewingRef.current) {
      /* revisão: a pista importante continua marcada; tenta de novo sem revelar a resposta */
      feedback({ tone: "error", message: TEXT.wrongReviewFb });
      guide(BANNER.wrongReview, TEXT.wrongReview, "warning");
      return false;
    }
    missedRef.current.add(current.id);
    mark(current.id, "review");
    setPhase("wrong");
    feedback({ tone: "error", message: TEXT.wrongFb });
    guide(BANNER.wrong, TEXT.wrong, "warning");
    timers.after(WRONG_BACK_MS, toBoard, { hold: true });
    return false;
  };

  const result: ResultData = useMemo(() => {
    const signals = cases.filter((c) => status[c.id] === "right").flatMap((c) => c.signals);
    return { total: cases.length, firstTry: cases.length - missedRef.current.size, signals: [...new Set(signals)] };
  }, [cases, status]);

  const solved = cases.filter((c) => status[c.id] === "right").length;

  return (
    <>
      <Stage>
        <CaseScene
          phase={phase}
          cases={cases}
          status={status}
          reviewing={reviewing}
          current={current}
          examined={examined}
          rejected={rejected}
          result={result}
          banner={banner.spec}
          bannerKey={banner.key}
          reducedMotion={reducedMotion}
          onPick={pick}
          onExamine={examine}
          onMove={onMove}
        />
      </Stage>
      <Interaction>
        <div className={styles.panel}>
          <p className={styles.progress}>
            Casos resolvidos: <strong>{solved}</strong> de {cases.length}
            {reviewing && " · revisão"}
          </p>
          {phase === "examine" && (
            <ActionButton label="Voltar aos casos" element="magnifier" variant="default" onClick={toBoard} size={20} />
          )}
          {phase === "reveal" && (
            <ActionButton label="Próximo caso" element="magnifier" onClick={toBoard} attention focusOnAttention size={22} />
          )}
          {phase === "result" && (
            <ActionButton label="Concluir" element="ok" onClick={finish} attention focusOnAttention size={22} />
          )}
        </div>
      </Interaction>
    </>
  );
}
