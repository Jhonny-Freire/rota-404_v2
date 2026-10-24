"use client";

import { useEffect, useState } from "react";
import { ELEMENTS } from "@/config/assets";
import { AnswerInput, Place, Tag, useSequence, useTimers } from "@/components/learning/kit";
import { cx } from "@/components/ui/cx";
import { unlockAchievement } from "@/lib/achievementEvents";
import { RequestLine, SummaryCards, UrlBar, type SummaryItem } from "../_api/http";
import { Banner, Code, Live } from "../_api/parts";
import { READY_PAUSE_MS, phases } from "../_api/timing";
import { ENDPOINTS, EXTRA_LINES, LINES, PART_NOTES, URL_PARTS, checkPath, type SceneProps } from "./model";
import styles from "./ComoPedirUmaInformacao.module.css";

/*
 * Cena 1 — Um endereço completo: a URL e, uma de cada vez, o protocolo, o domínio e o caminho. Revisão: cada parte
 * aparecia e sumia rápido demais para ler. Agora as três explicações ficam na tela (uma a mais a cada 4 s, depois
 * da fala) e tocar numa delas destaca a parte na URL de novo, no ritmo da criança. Sem fala nova do Bonzi.
 */
const PART_ORDER = ["protocol", "domain", "path"];
const URL_STEPS = phases([1600, 4000, 4000, 4000], LINES.url);

export function SceneUrl({ say, setCanAdvance, reducedMotion }: SceneProps) {
  const { step } = useSequence(URL_STEPS, { reducedMotion, onDone: () => setCanAdvance(true) });
  const [picked, setPicked] = useState<string | null>(null);
  const shown = Math.min(Math.max(step, 0), PART_ORDER.length);
  const auto = step >= 1 ? PART_ORDER[Math.min(step - 1, PART_ORDER.length - 1)] : null;
  const lit = picked ?? auto;
  const part = URL_PARTS.find((p) => p.key === lit);

  useEffect(() => {
    say(LINES.url);
  }, [say]);

  return (
    <>
      <Banner text="Um endereço completo" icon="webpage" reducedMotion={reducedMotion} />
      <Place x={50} y={30}>
        <div className={styles.fit}>
          <UrlBar parts={URL_PARTS} highlight={lit} label="URL" />
        </div>
      </Place>
      <Place x={50} y={47} anchor="top" width={84} z={4}>
        <ul className={styles.legend} aria-label="Partes da URL">
          {PART_ORDER.slice(0, shown).map((key) => {
            const p = URL_PARTS.find((u) => u.key === key)!;
            return (
              <li key={key}>
                <button type="button" className={cx(styles.legendItem, lit === key && styles.legendLit)} onClick={() => setPicked(key)} aria-pressed={lit === key}>
                  <Code>{p.text}</Code>
                  <span>{PART_NOTES[key]}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </Place>
      <Live text={part ? `${part.text}: ${PART_NOTES[part.key]}.` : "A URL https://api.exemplo.test/users/42."} />
    </>
  );
}

/* Cena 2 — O que é endpoint? O caminho em destaque; /users/42 e /products/42: o número é igual, o recurso muda. */
const ENDPOINT_STEPS = phases([1400, 2200, 2200, 1600], LINES.endpoint);

export function SceneEndpoint({ say, setCanAdvance, reducedMotion }: SceneProps) {
  const { step } = useSequence(ENDPOINT_STEPS, { reducedMotion, onDone: () => setCanAdvance(true) });

  useEffect(() => {
    say(LINES.endpoint);
  }, [say]);

  return (
    <>
      <Banner key={step >= 3 ? "diff" : "endpoint"} text={step >= 3 ? "Mesmo número, recursos diferentes" : "O que é endpoint?"} tone={step >= 3 ? "warning" : "info"} icon="plug" reducedMotion={reducedMotion} />
      <Place x={50} y={30}>
        <div className={styles.fit}>
          <UrlBar parts={URL_PARTS} highlight="path" label="URL" />
        </div>
      </Place>
      <Place x={30} y={52} anchor="top" hidden={step < 1} z={4}>
        <div className={cx(styles.resource, step >= 3 && styles.resourceLit)}>
          <img src={ELEMENTS.person} alt="" draggable={false} />
          <Code>/users/42</Code>
          <span>usuário 42</span>
        </div>
      </Place>
      <Place x={70} y={52} anchor="top" hidden={step < 2} z={4}>
        <div className={cx(styles.resource, step >= 3 && styles.resourceLit)}>
          <img src={ELEMENTS.box} alt="" draggable={false} />
          <Code>/products/42</Code>
          <span>produto 42</span>
        </div>
      </Place>
      <Live text="/users/42 é o usuário 42; /products/42 é o produto 42. O número é igual, mas o recurso é diferente." />
    </>
  );
}

/* Cena 3 — O que é HTTP? A requisição GET /users/42: a operação e o endereço do recurso. */
const HTTP_STEPS = phases([1200, 2000, 2000, 1600], LINES.http);

export function SceneHttp({ say, setCanAdvance, reducedMotion }: SceneProps) {
  const { step } = useSequence(HTTP_STEPS, { reducedMotion, onDone: () => setCanAdvance(true) });

  useEffect(() => {
    say(LINES.http);
  }, [say]);

  return (
    <>
      <Banner text="O que é HTTP?" icon="mail" reducedMotion={reducedMotion} />
      <Place x={50} y={38}>
        <div className={styles.big}>
          <RequestLine method="GET" path="/users/42" />
        </div>
      </Place>
      <Place x={41} y={56} anchor="top" hidden={step < 1} z={4}>
        <Tag size="sm" tone="info">
          operação
        </Tag>
      </Place>
      <Place x={58} y={56} anchor="top" hidden={step < 2} z={4}>
        <Tag size="sm" tone="warning">
          endereço do recurso
        </Tag>
      </Place>
      {/* .md: "Explicar que o GET será estudado na próxima aula" */}
      <Place x={50} y={76} anchor="top" hidden={step < 3} z={4}>
        <p className={styles.note}>O GET aparece aqui como exemplo de método: você vai estudá-lo na próxima aula.</p>
      </Place>
      <Live text="A requisição GET /users/42: GET é a operação e /users/42 é o endereço do recurso." />
    </>
  );
}

/* Microinteração (.md): endpoints /users/, /products/, /ratings/; o objetivo "buscar o produto 42" é digitado. */
export function SceneQuiz({ say, setCanAdvance, setHint, reducedMotion }: SceneProps) {
  const timers = useTimers({ reducedMotion });
  const [result, setResult] = useState<{ ok: boolean; message: string; tries: number } | null>(null);
  /** tocar num endpoint da lista escreve o caminho dele no campo; a criança completa com o número */
  const [fill, setFill] = useState<{ text: string; key: number } | null>(null);

  useEffect(() => {
    say(EXTRA_LINES.quiz, "thinking");
  }, [say]);

  const submit = (value: string) => {
    const check = checkPath(value);
    setResult((prev) => ({ ...check, tries: (prev?.tries ?? 0) + 1 }));
    if (!check.ok) {
      if (check.missing) unlockAchievement("s-02");
      say(check.message, "warning");
      setHint(check.message);
      return false;
    }
    say(EXTRA_LINES.quizRight, "happy");
    setHint("Parabéns! Você encontrou o caminho do produto 42.");
    (document.activeElement as HTMLElement | null)?.blur?.();
    timers.after(READY_PAUSE_MS, () => setCanAdvance(true), { hold: true });
    return true;
  };

  const ok = result?.ok === true;
  return (
    <>
      <Banner key={result ? `${result.ok}-${result.tries}` : "start"} text={ok ? "Caminho certo!" : result ? "Quase: veja a dica" : "Missão: buscar o produto 42"} tone={ok ? "success" : result ? "danger" : "warning"} icon={ok ? "ok" : result ? "error" : "box"} reducedMotion={reducedMotion} />
      {/* revisão: a cena não era intuitiva. Tudo escrito (sem fala nova): a lista vira botões, um exemplo (da Cena 2)
          e o molde /recurso/número */}
      <Place x={50} y={19} anchor="top" width={92}>
        <div className={styles.menu}>
          <p className={styles.menuTitle}>Endpoints desta API (toque para usar)</p>
          <ul className={styles.endpoints} aria-label="Endpoints da API">
            {ENDPOINTS.map((e) => (
              <li key={e.path}>
                <button
                  type="button"
                  className={styles.endpoint}
                  disabled={ok}
                  onClick={() => setFill((prev) => ({ text: e.path, key: (prev?.key ?? 0) + 1 }))}
                  aria-label={`Usar ${e.path}, que guarda ${e.name}`}
                >
                  <Code>{e.path}</Code>
                  <span>guarda {e.name}</span>
                </button>
              </li>
            ))}
          </ul>
          <p className={styles.example}>
            Exemplo: <Code>/users/42</Code> busca o usuário 42. Monte assim: <Code>/recurso/número</Code>
          </p>
        </div>
      </Place>
      <Place x={50} y={55} anchor="top" width={70} z={5}>
        <div className={styles.answerFit}>
          <AnswerInput label="Caminho para buscar o produto 42" placeholder="/recurso/número" onSubmit={submit} submitLabel="Buscar" mono maxLength={40} disabled={ok} fill={fill} />
        </div>
      </Place>
      {result && (
        <Place key={result.tries} x={50} y={81} anchor="top" width={86} z={4}>
          <p className={cx(styles.note, result.ok ? styles.noteOk : styles.noteWrong)}>{result.message}</p>
        </Place>
      )}
      <Live text={result ? result.message : "Objetivo: buscar o produto 42. Endpoints: /users/, /products/ e /ratings/."} />
    </>
  );
}

/* Fechamento — URL = endereço completo | Endpoint = ponto de acesso da API | HTTP = regras de requisição e resposta. */
const SUMMARY: SummaryItem[] = [
  { label: "URL", term: "URL", meaning: "endereço completo", element: "webpage" },
  { label: "Endpoint", term: "Endpoint", meaning: "ponto de acesso da API", element: "plug" },
  { label: "HTTP", term: "HTTP", meaning: "regras de requisição e resposta", element: "mail" },
];
const SUMMARY_STEPS = phases([1000, 1000, 1000, 1200], EXTRA_LINES.closing);

export function SceneClosing({ say, setCanAdvance, reducedMotion }: SceneProps) {
  const { step } = useSequence(SUMMARY_STEPS, { reducedMotion, onDone: () => setCanAdvance(true) });

  useEffect(() => {
    say(EXTRA_LINES.closing, "happy");
  }, [say]);

  return (
    <>
      <Banner text="Resumo" tone="success" icon="ok" reducedMotion={reducedMotion} />
      <Place x={50} y={55} width={80}>
        <SummaryCards items={SUMMARY} upTo={step} />
      </Place>
      <Live text="URL: endereço completo. Endpoint: ponto de acesso da API. HTTP: regras de requisição e resposta." />
    </>
  );
}
