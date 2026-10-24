"use client";

import { useEffect, useMemo, useState } from "react";
import { SPRITES } from "@/config/assets";
import { ActionButton, Place, useSeededRandom, useSequence, useSpeech, useTimers } from "@/components/learning/kit";
import { cx } from "@/components/ui/cx";
import { Catalog, METHODS, MethodTag, RequestLine, SummaryCards, type CatalogRow, type HttpMethod, type RowState, type SummaryItem } from "../_api/http";
import { MatchBoard } from "../_api/MatchBoard";
import { Banner, Live } from "../_api/parts";
import { READY_PAUSE_MS, phases } from "../_api/timing";
import { DEMOS, EXTRA_LINES, INTENTS, LINES, MATCH_PIECES, MATCH_ZONES, START_ROWS, type SceneProps } from "./model";
import styles from "./GetPostPutEDelete.module.css";

/*
 * Cena 1 — As quatro intenções: os cartões aparecem um de cada vez e o Bonzi lê cada texto do .md; no fim, a fala
 * do .md. As falas são encadeadas pelo fim real do áudio (useSpeech).
 */
/** revisão: estava rápido demais. Antes do 1º cartão e depois de cada fala, tempo para ler o cartão (sem fala nova) */
const FIRST_PAUSE_MS = 1500;
const READ_PAUSE_MS = 2500;

export function SceneIntents({ say, setCanAdvance, reducedMotion }: SceneProps) {
  const { afterSpeech, pause } = useSpeech();
  const [shown, setShown] = useState(0);

  useEffect(() => {
    let active = true;
    const run = async () => {
      await pause(reducedMotion ? 0 : FIRST_PAUSE_MS);
      for (let i = 0; i < INTENTS.length; i += 1) {
        if (!active) return;
        setShown(i + 1);
        const line = `${INTENTS[i].method}: ${INTENTS[i].name}. ${INTENTS[i].text}`;
        say(line);
        await afterSpeech(line);
        await pause(READ_PAUSE_MS);
      }
      if (!active) return;
      say(LINES.intents, "happy");
      await afterSpeech(LINES.intents);
      if (active) setCanAdvance(true);
    };
    run();
    return () => {
      active = false;
    };
  }, [say, setCanAdvance, afterSpeech, pause, reducedMotion]);

  return (
    <>
      <Banner text="O método indica a intenção" icon="mail" reducedMotion={reducedMotion} />
      <Place x={50} y={56} width={92}>
        <ul className={styles.intents} aria-label="Os quatro métodos">
          {INTENTS.map((intent, index) => (
            <li key={intent.method} className={cx(styles.intent, index >= shown && styles.hidden, index === shown - 1 && styles.intentLit)}>
              <span className={styles.intentHead}>
                <MethodTag method={intent.method} size="lg" />
                <strong>{intent.name}</strong>
              </span>
              <span>{intent.text}</span>
            </li>
          ))}
        </ul>
      </Place>
      <Live text={shown > 0 ? `${INTENTS[shown - 1].method}: ${INTENTS[shown - 1].name}, ${INTENTS[shown - 1].text}` : ""} />
    </>
  );
}

/* Demonstração (.md): tocar em cada método anima uma operação no catálogo fictício; dá para reiniciar. */
export function SceneDemo({ say, setCanAdvance, setHint, reducedMotion }: SceneProps) {
  const timers = useTimers({ reducedMotion });
  const [rows, setRows] = useState<CatalogRow[]>(START_ROWS);
  const [states, setStates] = useState<Record<number, RowState>>({});
  const [last, setLast] = useState<HttpMethod | null>(null);
  const [tried, setTried] = useState<HttpMethod[]>([]);
  const [busy, setBusy] = useState(false);
  const demo = last ? DEMOS[last] : null;

  useEffect(() => {
    say(EXTRA_LINES.demo, "thinking");
  }, [say]);

  const run = (method: HttpMethod) => {
    if (busy) return;
    const d = DEMOS[method];
    setLast(method);
    setBusy(true);
    say(d.line);
    if (method === "DELETE") {
      setStates(d.states(rows));
      timers.after(1200, () => {
        setRows(d.apply);
        setStates({});
        setBusy(false);
      });
    } else {
      const next = d.apply(rows);
      setRows(next);
      setStates(d.states(next));
      timers.after(700, () => setBusy(false));
    }
    const nextTried = tried.includes(method) ? tried : [...tried, method];
    setTried(nextTried);
    const left = METHODS.length - nextTried.length;
    if (left > 0) {
      setHint(left === 1 ? "Falta testar 1 método." : `Faltam ${left} métodos para testar.`);
    } else {
      setHint("Você testou os quatro métodos! Pode reiniciar e testar de novo.");
      if (nextTried.length !== tried.length) {
        say(EXTRA_LINES.demoDone, "happy", { afterCurrent: true });
        timers.after(READY_PAUSE_MS, () => setCanAdvance(true), { hold: true });
      }
    }
  };

  const reset = () => {
    setRows(START_ROWS);
    setStates({});
    setLast(null);
  };

  return (
    <>
      <Banner key={tried.length} text={`Teste os métodos: ${tried.length} de ${METHODS.length}`} tone={tried.length === METHODS.length ? "success" : "warning"} icon={tried.length === METHODS.length ? "ok" : "box"} reducedMotion={reducedMotion} />
      <Place x={3} y={20} anchor="top-left" width={42}>
        <div className={styles.catalogFit}>
          <Catalog rows={rows} states={states} changedField={demo?.changedField} />
        </div>
      </Place>
      <Place x={97} y={20} anchor="top-right" width={48}>
        <div className={styles.methods} role="group" aria-label="Métodos para testar">
          {METHODS.map((method) => (
            <button key={method} type="button" className={cx(styles.methodBtn, tried.includes(method) && styles.methodDone, last === method && styles.methodLast)} onClick={() => run(method)} disabled={busy} aria-pressed={last === method}>
              <MethodTag method={method} size="md" />
              <span>{INTENTS.find((i) => i.method === method)?.name}</span>
            </button>
          ))}
        </div>
      </Place>
      {demo && (
        <Place key={`${demo.method}-${tried.length}`} x={97} y={58} anchor="top-right" width={48} z={4}>
          <div className={styles.result}>
            <RequestLine method={demo.method} path={demo.path} />
            {demo.body && <span className={styles.body}>{demo.body}</span>}
            <span className={styles.resultText}>{demo.result}</span>
          </div>
        </Place>
      )}
      <Place x={24} y={88} z={4}>
        <div className={styles.resetFit}>
          <ActionButton label="Reiniciar catálogo" sprite={SPRITES.ui.back} variant="ghost" onClick={reset} disabled={busy} size={18} />
        </div>
      </Place>
      <Live text={demo ? `${demo.method} ${demo.path}. ${demo.result}` : ""} />
    </>
  );
}

/* Microinteração (.md): ver / registrar / alterar / remover produto → GET, POST, PUT, DELETE. */
export function SceneMatch({ say, setCanAdvance, setHint, reducedMotion }: SceneProps) {
  const rand = useSeededRandom(0, { salt: "g2-aula-2-2-metodos" });
  const pieces = useMemo(() => rand.shuffle(MATCH_PIECES, "pool", true), [rand]);

  useEffect(() => {
    say(EXTRA_LINES.match, "thinking");
  }, [say]);

  return (
    <MatchBoard
      zones={MATCH_ZONES}
      pieces={pieces}
      say={say}
      setHint={setHint}
      reducedMotion={reducedMotion}
      rightLine={EXTRA_LINES.matchRight}
      doneLine={EXTRA_LINES.matchDone}
      onDone={() => setCanAdvance(true)}
      countText={(placed, total) => `Ligue os pedidos: ${placed} de ${total}`}
      doneText="Todos ligados!"
    />
  );
}

/* Fechamento — GET = consultar | POST = enviar/criar | PUT = substituir/atualizar | DELETE = remover. */
const SUMMARY: SummaryItem[] = INTENTS.map((intent) => ({ label: intent.method, term: <MethodTag method={intent.method} size="lg" />, meaning: intent.name }));
const CLOSING_STEPS = phases([900, 900, 900, 900, 1200], EXTRA_LINES.closing);

export function SceneClosing({ say, setCanAdvance, reducedMotion }: SceneProps) {
  const { step } = useSequence(CLOSING_STEPS, { reducedMotion, onDone: () => setCanAdvance(true) });

  useEffect(() => {
    say(EXTRA_LINES.closing, "happy");
  }, [say]);

  return (
    <>
      <Banner text="Resumo dos métodos" tone="success" icon="ok" reducedMotion={reducedMotion} />
      <Place x={50} y={55} width={88}>
        <SummaryCards items={SUMMARY} upTo={step} />
      </Place>
      <Live text="GET: consultar. POST: enviar ou criar. PUT: substituir ou atualizar. DELETE: remover." />
    </>
  );
}
