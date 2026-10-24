"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Place, useSeededRandom, useSequence, useSpeech, useTimers } from "@/components/learning/kit";
import { cx } from "@/components/ui/cx";
import { SummaryCards, type SummaryItem } from "../_api/http";
import { JsonView, jsonLines, type JsonValue, type Tok } from "../_api/Json";
import { Banner, Code, Live } from "../_api/parts";
import { READY_PAUSE_MS, phases } from "../_api/timing";
import { EXTRA_LINES, FIND, LINES, OBJECT_NOTES, PART_NAMES, PERSON, PERSON_FULL, invalidLines, type SceneProps } from "./model";
import styles from "./OQueEJson.module.css";

/* Cena 1 — Dados soltos: "nome: Ana" e "idade: 15" em cartões separados. */
const LOOSE_STEPS = phases([1200, 1600], EXTRA_LINES.loose);

export function SceneLoose({ say, setCanAdvance, reducedMotion }: SceneProps) {
  useSequence(LOOSE_STEPS, { reducedMotion, onDone: () => setCanAdvance(true) });

  useEffect(() => {
    say(EXTRA_LINES.loose, "thinking");
  }, [say]);

  return (
    <>
      <Banner text="Dados soltos" tone="warning" icon="question" reducedMotion={reducedMotion} />
      <Place x={30} y={44} z={3}>
        <span className={cx(styles.loose, styles.tiltLeft, !reducedMotion && styles.float)}>nome: Ana</span>
      </Place>
      <Place x={66} y={64} z={3}>
        <span className={cx(styles.loose, styles.tiltRight, !reducedMotion && styles.floatSlow)}>idade: 15</span>
      </Place>
      <Live text="Dois cartões soltos: nome Ana e idade 15." />
    </>
  );
}

/* Cena 2 — Objeto JSON: os cartões viram um objeto; o Bonzi explica os 4 itens do .md, um de cada vez. */
export function SceneObject({ say, setCanAdvance, reducedMotion }: SceneProps) {
  const { afterSpeech } = useSpeech();
  const [note, setNote] = useState(-1);
  const lines = useMemo(() => jsonLines(PERSON), []);

  useEffect(() => {
    let active = true;
    const run = async () => {
      for (let i = 0; i < OBJECT_NOTES.length; i += 1) {
        if (!active) return;
        setNote(i);
        say(OBJECT_NOTES[i].line);
        await afterSpeech(OBJECT_NOTES[i].line);
      }
      if (active) setCanAdvance(true);
    };
    run();
    return () => {
      active = false;
    };
  }, [say, setCanAdvance, afterSpeech]);

  const current = note >= 0 ? OBJECT_NOTES[note] : null;
  return (
    <>
      <Banner text="Um objeto JSON" icon="box" reducedMotion={reducedMotion} />
      <Place x={30} y={52} width={34}>
        <div className={styles.pop}>
          <JsonView lines={lines} label="Objeto JSON com nome Ana e idade 15" highlight={current?.highlight} marks={current?.marks} showPunct={current?.punct} />
        </div>
      </Place>
      <Place x={96} y={24} anchor="top-right" width={50}>
        <ul className={styles.notes} aria-label="Como ler o objeto">
          {OBJECT_NOTES.map((n, i) => (
            <li key={n.code} className={cx(styles.note, i > note && styles.hidden, i === note && styles.noteLit)}>
              <Code>{n.code}</Code>
              <span>{n.text}</span>
            </li>
          ))}
        </ul>
      </Place>
      <Live text={current ? `${current.code}: ${current.text}` : ""} />
    </>
  );
}

/* Cena 3 — Outros valores: entra "ativo": true (booleano) e depois "jogos": ["X", "Y"] (lista). */
export function SceneValues({ say, setCanAdvance, reducedMotion }: SceneProps) {
  const { afterSpeech } = useSpeech();
  const [stage, setStage] = useState<"bool" | "list">("bool");
  const value = useMemo<JsonValue>(() => (stage === "bool" ? { nome: "Ana", idade: 15, ativo: true } : PERSON_FULL), [stage]);
  const lines = useMemo(() => jsonLines(value), [value]);

  useEffect(() => {
    let active = true;
    const run = async () => {
      say(EXTRA_LINES.boolean);
      await afterSpeech(EXTRA_LINES.boolean);
      if (!active) return;
      setStage("list");
      say(LINES.lists);
      await afterSpeech(LINES.lists);
      if (active) setCanAdvance(true);
    };
    run();
    return () => {
      active = false;
    };
  }, [say, setCanAdvance, afterSpeech]);

  return (
    <>
      <Banner key={stage} text={stage === "bool" ? "Verdadeiro ou falso" : "Uma lista de valores"} icon="box" reducedMotion={reducedMotion} />
      <Place x={50} y={54} width={44}>
        <JsonView
          lines={lines}
          label="Objeto JSON com nome, idade, ativo e a lista jogos"
          highlight={stage === "bool" ? ["ativo"] : ["jogos"]}
          marks={stage === "bool" ? { ativo: "hint" } : {}}
        />
      </Place>
      <Live text={stage === "bool" ? "ativo: true. True e false são valores booleanos." : "jogos: uma lista com X e Y."} />
    </>
  );
}

/*
 * Microinteração (.md): (a) tocar no objeto, numa chave, num valor textual, num número, num booleano e na lista;
 * (b) escolher qual de dois exemplos tem a estrutura válida — o sistema destaca aspas, dois-pontos, vírgulas e
 * delimitadores. Erros dão pista, sem revelar onde está a resposta.
 */
export function SceneQuiz(props: SceneProps) {
  const [part, setPart] = useState<"find" | "choose">("find");
  return part === "find" ? <FindParts key="find" {...props} onDone={() => setPart("choose")} /> : <ChooseValid key="choose" {...props} />;
}

function FindParts({ say, setHint, reducedMotion, onDone }: SceneProps & { onDone: () => void }) {
  const timers = useTimers({ reducedMotion });
  const lines = useMemo(() => jsonLines(PERSON_FULL), []);
  const [index, setIndex] = useState(0);
  const [marks, setMarks] = useState<Record<string, "ok" | "wrong">>({});
  const [wrongKey, setWrongKey] = useState(0);
  const indexRef = useRef(0);
  const target = FIND[Math.min(index, FIND.length - 1)];
  const done = index >= FIND.length;

  useEffect(() => {
    say(EXTRA_LINES.find, "thinking");
  }, [say]);

  useEffect(() => {
    setHint(done ? "Você encontrou todas as partes!" : `${index + 1} de ${FIND.length}: ${target.prompt}.`);
  }, [index, done, target, setHint]);

  const markKey = (tok: Tok) => (tok.kind === "key" ? `key:${tok.path}` : tok.path ?? "");

  const tap = (tok: Tok) => {
    const i = indexRef.current;
    if (i >= FIND.length || !tok.part) return;
    const key = markKey(tok);
    if (tok.part !== FIND[i].part) {
      setMarks((m) => ({ ...m, [key]: "wrong" }));
      setWrongKey((k) => k + 1);
      timers.after(1100, () => setMarks((m) => (m[key] === "wrong" ? Object.fromEntries(Object.entries(m).filter(([k]) => k !== key)) : m)), { hold: true });
      say(EXTRA_LINES.findWrong(PART_NAMES[tok.part]), "warning");
      return;
    }
    setMarks((m) => ({ ...m, [key]: "ok" }));
    indexRef.current = i + 1;
    setIndex(i + 1);
    if (i + 1 >= FIND.length) {
      say(EXTRA_LINES.findRight, "happy");
      timers.after(1400, onDone, { hold: true });
    } else {
      say(`${EXTRA_LINES.findRight} ${FIND[i + 1].prompt}.`, "happy");
    }
  };

  return (
    <>
      <Banner key={`${index}-${wrongKey}`} text={done ? "Partes encontradas!" : target.prompt} tone={done ? "success" : "warning"} icon={done ? "ok" : "magnifier"} reducedMotion={reducedMotion} />
      <Place x={50} y={55} width={46}>
        <JsonView lines={lines} label="JSON para tocar nas partes" tappable={done ? [] : ["object", "key", "string", "number", "boolean", "list"]} onTap={tap} marks={marks} />
      </Place>
      <Live text={done ? "Você encontrou todas as partes." : target.prompt} />
    </>
  );
}

function ChooseValid({ say, setCanAdvance, setHint, reducedMotion }: SceneProps) {
  const timers = useTimers({ reducedMotion });
  const rand = useSeededRandom(0, { salt: "g2-aula-3-1-valido" });
  const validFirst = useMemo(() => rand.chance(0.5, "lado"), [rand]);
  const valid = useMemo(() => jsonLines(PERSON), []);
  const [state, setState] = useState<"idle" | "wrong" | "right">("idle");

  useEffect(() => {
    say(EXTRA_LINES.choose, "thinking");
    setHint("Toque no exemplo que tem a estrutura válida.");
  }, [say, setHint]);

  const choose = (isValid: boolean) => {
    if (state === "right") return;
    if (!isValid) {
      setState("wrong");
      say(EXTRA_LINES.chooseWrong, "warning");
      setHint("Os sinais que faltam estão em vermelho. Escolha o outro exemplo.");
      return;
    }
    setState("right");
    say(EXTRA_LINES.chooseRight, "happy");
    setHint("Esse é o JSON válido!");
    timers.after(READY_PAUSE_MS, () => setCanAdvance(true), { hold: true });
  };

  const reveal = state !== "idle";
  const cards = [
    { id: "valid", ok: true, lines: valid },
    { id: "invalid", ok: false, lines: invalidLines(reveal) },
  ];
  const ordered = validFirst ? cards : [cards[1], cards[0]];

  return (
    <>
      <Banner key={state} text={state === "right" ? "Estrutura válida!" : state === "wrong" ? "Esse tem problemas" : "Qual é o JSON válido?"} tone={state === "right" ? "success" : state === "wrong" ? "danger" : "warning"} icon={state === "right" ? "ok" : state === "wrong" ? "error" : "question"} reducedMotion={reducedMotion} />
      {ordered.map((card, i) => (
        <Place key={card.id} x={i === 0 ? 27 : 73} y={54} width={40}>
          <button
            type="button"
            className={cx(styles.example, state === "right" && card.ok && styles.exampleOk, reveal && !card.ok && styles.exampleWrong)}
            onClick={() => choose(card.ok)}
            aria-label={`Exemplo ${i + 1}`}
            aria-pressed={state === "right" && card.ok}
          >
            <span className={styles.exampleTitle}>Exemplo {i + 1}</span>
            <JsonView lines={card.lines} label={`Exemplo ${i + 1}`} showPunct={state === "right" && card.ok} />
          </button>
        </Place>
      ))}
      <Live text={state === "right" ? "Você escolheu o JSON válido." : state === "wrong" ? "Esse exemplo tem sinais faltando." : "Escolha o exemplo com a estrutura válida."} />
    </>
  );
}

/* Fechamento — objeto = conjunto de propriedades | propriedade = chave + valor | lista = conjunto ordenado de valores. */
const SUMMARY: SummaryItem[] = [
  { label: "objeto", term: <Code>{"{ }"}</Code>, meaning: "objeto = conjunto de propriedades" },
  { label: "propriedade", term: <Code>&quot;chave&quot;: valor</Code>, meaning: "propriedade = chave + valor" },
  { label: "lista", term: <Code>[ ]</Code>, meaning: "lista = conjunto ordenado de valores" },
];
const CLOSING_STEPS = phases([1000, 1000, 1000, 1200], EXTRA_LINES.closing);

export function SceneClosing({ say, setCanAdvance, reducedMotion }: SceneProps) {
  const { step } = useSequence(CLOSING_STEPS, { reducedMotion, onDone: () => setCanAdvance(true) });

  useEffect(() => {
    say(EXTRA_LINES.closing, "happy");
  }, [say]);

  return (
    <>
      <Banner text="Resumo do JSON" tone="success" icon="ok" reducedMotion={reducedMotion} />
      <Place x={50} y={55} width={84}>
        <SummaryCards items={SUMMARY} upTo={step} />
      </Place>
      <Live text="Objeto: conjunto de propriedades. Propriedade: chave mais valor. Lista: conjunto ordenado de valores." />
    </>
  );
}
