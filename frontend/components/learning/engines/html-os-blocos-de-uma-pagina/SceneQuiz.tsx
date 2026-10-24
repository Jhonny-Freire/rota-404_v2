"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BLOCK_LABELS, useSeededRandom, useTimers, type BlockState } from "@/components/learning/kit";
import { BANNER, LINES, QUIZ_ORDERS, QUIZ_SITES, READY_PAUSE_MS, WRONG_LINES, WRONG_MS, speechMs, type PageKind, type SceneProps } from "./model";
import { Banner, Live, PageWindow } from "./parts";

/* texto criado: instruções do painel "O que fazer" (o .md não define) */
const HINT = {
  wrong: "Esse não é o título. O título é o nome da página: toque em outro bloco.",
  right: "Isso! Você achou o título da página.",
} as const;

/**
 * Cena 5 — Microteste: uma página simples (sorteada por visita, com o título nem sempre em cima); o aluno aponta o
 * bloco que é o título. O erro diz o que é o bloco tocado, sem apontar o título; só o acerto libera o avanço.
 */
export function SceneQuiz({ say, setCanAdvance, setHint, reducedMotion }: SceneProps) {
  const timers = useTimers({ reducedMotion });
  const rand = useSeededRandom(0, { salt: "aula-3-2-microteste" });
  const { site, order } = useMemo(() => ({ site: rand.pick(QUIZ_SITES, "site"), order: rand.pick(QUIZ_ORDERS, "order") }), [rand]);
  const [wrong, setWrong] = useState<PageKind | null>(null);
  const [tries, setTries] = useState(0);
  const [solved, setSolved] = useState(false);
  const solvedRef = useRef(false);
  const cancelWrong = useRef<(() => void) | null>(null);

  useEffect(() => {
    say(LINES.quiz, "thinking");
  }, [say]);

  const pick = (kind: PageKind) => {
    if (solvedRef.current) return;
    cancelWrong.current?.();
    cancelWrong.current = null;
    if (kind === "title") {
      solvedRef.current = true;
      setSolved(true);
      setWrong(null);
      say(LINES.quizRight, "happy");
      setHint(HINT.right);
      timers.after(Math.max(READY_PAUSE_MS, speechMs(LINES.quizRight)), () => setCanAdvance(true), { hold: true });
      return;
    }
    setWrong(kind);
    setTries((t) => t + 1);
    say(WRONG_LINES[kind], "warning");
    setHint(HINT.wrong);
    cancelWrong.current = timers.after(WRONG_MS, () => setWrong(null), { hold: true });
  };

  const states: Partial<Record<PageKind, BlockState>> = {};
  if (wrong) states[wrong] = "wrong";
  if (solved) states.title = "correct";

  const banner = solved
    ? { text: BANNER.right, tone: "success" as const, icon: "ok" as const, key: "right" }
    : wrong
      ? { text: BANNER.wrong, tone: "danger" as const, icon: "error" as const, key: `wrong-${tries}` }
      : { text: BANNER.quiz, tone: "warning" as const, icon: "magnifier" as const, key: "quiz" };

  return (
    <>
      <Banner key={banner.key} text={banner.text} tone={banner.tone} icon={banner.icon} reducedMotion={reducedMotion} />
      <PageWindow
        site={site}
        order={order}
        states={states}
        tagged={solved ? ["title"] : []}
        onPick={pick}
        y={17.5}
        label={`Página ${site.url}: toque no bloco que é o título`}
      />
      <Live text={solved ? "Certo! Esse bloco é o título." : wrong ? `Esse bloco é ${BLOCK_LABELS[wrong].toLowerCase()}, não o título.` : ""} />
    </>
  );
}
