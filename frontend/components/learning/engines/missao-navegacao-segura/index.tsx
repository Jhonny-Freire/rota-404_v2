"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BonziState } from "@/types/domain";
import type { LabEngineMeta, LabEngineProps } from "@/components/learning/runtime";
import { ActionButton, useSeededRandom } from "@/components/learning/kit";
import { MissionScene, type Summary } from "./MissionScene";
import { BANNER, INTRO, REPEAT_LINE_MS, SCENARIOS, TEXT, buildOrder, type BannerSpec, type Option, type Phase } from "./model";
import styles from "./MissaoNavegacaoSegura.module.css";

/** Cenários do lab4-4.md (Fluxo), na ordem. */
export const meta: LabEngineMeta = {
  kind: "lab",
  steps: ["Senha", "Permissão", "Perfil público", "Computador compartilhado", "Pedir ajuda"],
};

const SALT = "missao-navegacao-segura";

/** Laboratório 4.4 — Missão: navegação segura (G1 - Internet e Web/S4 - Comunicação e segurança/lab4-4.md) */
export default function MissaoNavegacaoSegura({ attempt, say, feedback, setStep, mistake, finish, reducedMotion, Stage, Interaction }: LabEngineProps) {
  const rand = useSeededRandom(attempt, { salt: SALT });
  const order = useMemo(() => buildOrder(rand), [rand]);

  const [index, setIndex] = useState(0);
  const [phase, setPhaseState] = useState<Phase>("play");
  const [tried, setTried] = useState<string[]>([]);
  const [shown, setShown] = useState<Option | null>(null);
  const [banner, setBanner] = useState<{ spec: BannerSpec; key: number }>({ spec: BANNER.choose, key: 0 });
  const phaseRef = useRef<Phase>("play");
  /** escolhas arriscadas feitas antes do acerto, por cenário (resumo final) */
  const wrongRef = useRef<Record<string, string[]>>({});
  const lineRef = useRef<{ text: string; at: number } | null>(null);

  const scenario = SCENARIOS[index];
  const options = order[scenario.id];

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

  // lab4-4.md: o Bonzi apresenta a missão; começa o Cenário 1.
  useEffect(() => {
    setStep(0);
    guide(BANNER.choose, INTRO, "happy");
    feedback({ tone: "hint", message: TEXT.chooseFb(SCENARIOS[0].question) });
  }, [setStep, guide, feedback]);

  /** Escolher como agir: o sistema mostra o que acontece. A escolha segura permite avançar. */
  const choose = (id: string) => {
    const option = options.find((o) => o.id === id);
    if (!option) return;
    const now = phaseRef.current;
    if (now === "solved") {
      /* depois do acerto: ver o que aconteceria com as outras escolhas, sem perder pontos */
      if (option.correct) return;
      setShown(option);
      setTried((prev) => (prev.includes(id) ? prev : [...prev, id]));
      show(BANNER.explore);
      feedback({ tone: "info", message: `${option.text}: ${option.outcome.text}` });
      return;
    }
    if (now !== "play" || tried.includes(id)) return;
    setShown(option);
    setTried((prev) => [...prev, id]);
    if (option.correct) {
      setPhase("solved");
      feedback({ tone: "success", message: `${option.outcome.text} ${TEXT.solvedFb}` });
      guide(BANNER.right, scenario.line, "happy");
      return;
    }
    mistake();
    wrongRef.current[scenario.id] = [...(wrongRef.current[scenario.id] ?? []), option.text];
    feedback({ tone: "error", message: option.outcome.text });
    guide(BANNER.wrong, TEXT.wrongSay, "warning");
  };

  const next = () => {
    if (phaseRef.current !== "solved") return;
    const nextIndex = index + 1;
    setTried([]);
    setShown(null);
    if (nextIndex >= SCENARIOS.length) {
      setPhase("summary");
      setStep(meta.steps.length);
      guide(BANNER.summary, TEXT.summarySay, "happy");
      feedback({ tone: "success", message: TEXT.summaryFb });
      return;
    }
    setIndex(nextIndex);
    setPhase("play");
    setStep(nextIndex);
    const upcoming = SCENARIOS[nextIndex];
    guide(BANNER.choose, `${upcoming.situation} ${upcoming.question}`, "thinking");
    feedback({ tone: "hint", message: TEXT.chooseFb(upcoming.question) });
  };

  const summary: Summary = useMemo(() => {
    if (phase !== "summary") return { applied: [], review: [] };
    const wrong = wrongRef.current;
    return {
      applied: SCENARIOS.filter((s) => !wrong[s.id]?.length).map((s) => s.practice),
      review: SCENARIOS.filter((s) => wrong[s.id]?.length).map((s) => ({ title: s.title, choices: wrong[s.id], tip: s.tip })),
    };
  }, [phase]);

  return (
    <>
      <Stage>
        <MissionScene
          phase={phase}
          scenario={scenario}
          index={index}
          options={options}
          tried={tried}
          shown={shown}
          summary={summary}
          banner={banner.spec}
          bannerKey={banner.key}
          reducedMotion={reducedMotion}
          onChoose={choose}
        />
      </Stage>
      <Interaction>
        <div className={styles.panel}>
          <p className={styles.progress}>
            {phase === "summary" ? "Missão cumprida!" : `Situação ${index + 1} de ${SCENARIOS.length}`}
          </p>
          {phase === "solved" && (
            <ActionButton
              label={index + 1 < SCENARIOS.length ? "Próxima situação" : "Ver resumo"}
              element="magnifier"
              onClick={next}
              attention
              focusOnAttention
              size={22}
            />
          )}
          {phase === "summary" && <ActionButton label="Concluir" element="ok" onClick={finish} attention focusOnAttention size={22} />}
        </div>
      </Interaction>
    </>
  );
}
