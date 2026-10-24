"use client";

import { useEffect, useMemo } from "react";
import { Place, Tag, useSeededRandom, useSequence } from "@/components/learning/kit";
import { cx } from "@/components/ui/cx";
import { RequestLine, StatusBadge } from "../_api/http";
import { MatchBoard } from "../_api/MatchBoard";
import { Banner, Live, Node, Traveler, Wire } from "../_api/parts";
import { phases } from "../_api/timing";
import { CASES, EXTRA_LINES, SITUATIONS, STATUS_ZONES, type SceneProps, type StatusCase } from "./model";
import styles from "./QuandoAlgoDaErrado.module.css";

const LINE_Y = 52;
const STOPS = [{ x: 24, y: LINE_Y }, { x: 50, y: LINE_Y }, { x: 76, y: LINE_Y }];

/*
 * Cenas 1 a 5 — uma requisição vai, o servidor responde com um código de status. Fases: 0 a requisição aparece ·
 * 1 meio do caminho · 2 no servidor · 3 a resposta volta · 4 o código chega (leitura da fala).
 */
export function SceneStatus({ statusCase, say, setCanAdvance, reducedMotion }: SceneProps & { statusCase: StatusCase }) {
  const steps = useMemo(() => phases([1000, 1000, 1000, 1000, 1600], statusCase.line), [statusCase]);
  const { step } = useSequence(steps, { reducedMotion, onDone: () => setCanAdvance(true) });
  const ok = statusCase.code < 300;
  const arrived = step >= 4;

  useEffect(() => {
    say(statusCase.line, ok ? "speaking" : "thinking");
  }, [say, statusCase, ok]);

  return (
    <>
      <Banner text={statusCase.title} tone={arrived ? (ok ? "success" : "warning") : "info"} icon={arrived ? (ok ? "ok" : "error") : "mail"} reducedMotion={reducedMotion} />
      <Place x={4} y={20} anchor="top-left" z={4}>
        <div className={styles.request}>
          <RequestLine method={statusCase.method} path={statusCase.path} />
          {statusCase.note && (
            <Tag size="sm" tone="danger">
              {statusCase.note}
            </Tag>
          )}
        </div>
      </Place>
      <Wire from={{ x: 18, y: LINE_Y }} to={{ x: 79, y: LINE_Y }} state={step >= 1 && step <= 3 ? "active" : "idle"} back={step === 3} />
      <Node at={{ x: 12, y: LINE_Y }} element="cellphone" size={5.5} label="Cliente" alt="Cliente" look={{ highlighted: arrived }} />
      <Node at={{ x: 85, y: LINE_Y }} element={statusCase.serverElement} size={7} badge={statusCase.serverBadge} label="Servidor" alt="Servidor" look={{ highlighted: step === 2 }} />
      {step >= 0 && step <= 2 && <Traveler key="req" at={STOPS[step]} tone="request" label={`${statusCase.method} ${statusCase.path}`} reducedMotion={reducedMotion} lift={7} />}
      {step === 3 && <Traveler key="res" at={STOPS[1]} tone={ok ? "response" : "error"} label={`${statusCase.code}`} reducedMotion={reducedMotion} lift={7} />}
      <Place x={50} y={72} hidden={!arrived} z={5}>
        <div className={styles.result}>
          <StatusBadge code={statusCase.code} text={statusCase.text} size="lg" />
          <span className={cx(styles.shows, !ok && styles.showsBad)}>{statusCase.shows}</span>
        </div>
      </Place>
      <Live text={arrived ? `Resposta: ${statusCase.code} ${statusCase.text}.` : `Requisição ${statusCase.method} ${statusCase.path}.`} />
    </>
  );
}

/* Microinteração (.md): situações → 200, 400, 401, 404 ou 500, com uma explicação a cada escolha. */
export function SceneQuiz({ say, setCanAdvance, setHint, reducedMotion }: SceneProps) {
  const rand = useSeededRandom(0, { salt: "g2-aula-4-2" });
  const pieces = useMemo(() => rand.shuffle(SITUATIONS, "situacoes", true), [rand]);

  useEffect(() => {
    say(EXTRA_LINES.match, "thinking");
  }, [say]);

  return (
    <MatchBoard
      zones={STATUS_ZONES}
      pieces={pieces}
      say={say}
      setHint={setHint}
      reducedMotion={reducedMotion}
      rightLine=""
      explain={(piece) => SITUATIONS.find((s) => s.id === piece.id)?.why ?? ""}
      doneLine={EXTRA_LINES.matchDone}
      onDone={() => setCanAdvance(true)}
      countText={(placed, total) => `Situações: ${placed} de ${total}`}
      doneText="Todos os códigos!"
      poolY={27}
      zoneTop={46}
    />
  );
}

/* Fechamento — exemplos comuns, não a lista completa; o código resume, mas não conta toda a causa. */
const CLOSING_STEPS = phases([800, 600, 600, 600, 600, 1600], EXTRA_LINES.closing);

export function SceneClosing({ say, setCanAdvance, reducedMotion }: SceneProps) {
  const { step } = useSequence(CLOSING_STEPS, { reducedMotion, onDone: () => setCanAdvance(true) });

  useEffect(() => {
    say(EXTRA_LINES.closing, "happy");
  }, [say]);

  return (
    <>
      <Banner text="Alguns códigos comuns" tone="success" icon="ok" reducedMotion={reducedMotion} />
      <Place x={50} y={44} width={94}>
        <div className={styles.badges}>
          {CASES.map((c, i) => (
            <span key={c.id} className={cx(i > step && styles.hidden)}>
              <StatusBadge code={c.code} text={c.text} />
            </span>
          ))}
        </div>
      </Place>
      <Place x={50} y={70} anchor="top" width={80} hidden={step < 5} z={4}>
        <p className={styles.note}>Existem outros códigos. O código resume o resultado, mas nem sempre conta toda a causa.</p>
      </Place>
      <Live text="200, 400, 401, 404 e 500 são exemplos comuns. Existem outros códigos de status." />
    </>
  );
}
