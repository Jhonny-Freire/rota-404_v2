"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SPRITES } from "@/config/assets";
import { Place, Tag, useSequence, useSpeech, useTimers } from "@/components/learning/kit";
import { cx } from "@/components/ui/cx";
import { JsonView, jsonLines, type Tok } from "../_api/Json";
import { AppCard, AppValue, Banner, Live } from "../_api/parts";
import { READY_PAUSE_MS, phases } from "../_api/timing";
import { EXTRA_LINES, FIELDS, LINES, ORDER, PERSON, PRODUCTS, QUESTIONS, type SceneProps } from "./model";
import styles from "./LendoUmaResposta.module.css";

/* Cena 1 — Recebendo dados: a resposta simulada chega; no fim, a propriedade cidade é destacada. */
const RECEIVE_STEPS = phases([1000, 2200, 2000], LINES.receive);

export function SceneReceive({ say, setCanAdvance, reducedMotion }: SceneProps) {
  const { step } = useSequence(RECEIVE_STEPS, { reducedMotion, onDone: () => setCanAdvance(true) });
  const lines = useMemo(() => jsonLines(PERSON), []);

  useEffect(() => {
    say(LINES.receive);
  }, [say]);

  return (
    <>
      <Banner text="Uma resposta em JSON" icon="boxGold" reducedMotion={reducedMotion} />
      <Place x={50} y={55} width={40}>
        <div className={styles.pop}>
          <JsonView lines={lines} title="RESPOSTA" label="Resposta JSON: id 42, nome Ana, cidade Osasco, ativo true" highlight={step >= 2 ? ["cidade"] : []} marks={step >= 2 ? { "key:cidade": "hint", cidade: "hint" } : {}} />
        </div>
      </Place>
      <Live text={step >= 2 ? "A cidade é Osasco." : "Chegou uma resposta com id, nome, cidade e ativo."} />
    </>
  );
}

/* Cena 2 — Encontrando campos: id, nome, cidade e ativo, um por vez, com o tipo do valor. */
export function SceneFields({ say, setCanAdvance, reducedMotion }: SceneProps) {
  const { afterSpeech } = useSpeech();
  const [index, setIndex] = useState(-1);
  const lines = useMemo(() => jsonLines(PERSON), []);

  useEffect(() => {
    let active = true;
    const run = async () => {
      for (let i = 0; i < FIELDS.length; i += 1) {
        if (!active) return;
        setIndex(i);
        say(FIELDS[i].line);
        await afterSpeech(FIELDS[i].line);
      }
      if (active) setCanAdvance(true);
    };
    run();
    return () => {
      active = false;
    };
  }, [say, setCanAdvance, afterSpeech]);

  const field = index >= 0 ? FIELDS[index] : null;
  return (
    <>
      <Banner text="Encontrando os campos" icon="magnifier" reducedMotion={reducedMotion} />
      <Place x={34} y={55} width={40}>
        <JsonView lines={lines} title="RESPOSTA" label="Resposta JSON" highlight={field ? [field.key] : []} marks={field ? { [`key:${field.key}`]: "hint", [field.key]: "hint" } : {}} />
      </Place>
      {field && (
        <Place key={field.key} x={78} y={55} z={4}>
          <div className={styles.typeCard}>
            <span className={styles.typeKey}>{field.key}</span>
            <Tag size="md" tone="warning">
              {field.type}
            </Tag>
          </div>
        </Place>
      )}
      <Live text={field ? field.line : ""} />
    </>
  );
}

/* Cena 3 — Dados dentro de dados: o objeto produto dentro do pedido; os níveis abrem um de cada vez. */
const NESTED_STEPS = phases([1600, 1800, 2200], LINES.nested);

export function SceneNested({ say, setCanAdvance, reducedMotion }: SceneProps) {
  const { step } = useSequence(NESTED_STEPS, { reducedMotion, onDone: () => setCanAdvance(true) });
  const lines = useMemo(() => jsonLines(ORDER, step >= 1 ? ["produto"] : []), [step]);

  useEffect(() => {
    say(LINES.nested);
  }, [say]);

  return (
    <>
      <Banner key={step >= 1 ? "open" : "closed"} text={step >= 1 ? "Abrindo o objeto produto" : "Um objeto dentro de outro"} icon="box" reducedMotion={reducedMotion} />
      <Place x={50} y={55} width={44}>
        <JsonView lines={lines} title="RESPOSTA" label="Resposta JSON com o objeto produto dentro" highlight={step >= 2 ? ["produto.preco"] : step >= 1 ? ["produto"] : []} />
      </Place>
      <Place x={50} y={86} hidden={step < 2} z={4}>
        <Tag size="md" tone="info">
          produto, depois preco: 120
        </Tag>
      </Place>
      <Live text={step >= 2 ? "Seguindo os nomes: produto, depois preco, o valor é 120." : "O pedido tem um objeto produto dentro dele."} />
    </>
  );
}

/* Cena 4 — Lista de itens: produtos é uma lista de objetos; o aluno abre um item para ver as propriedades. */
export function SceneList({ say, setCanAdvance, setHint, reducedMotion }: SceneProps) {
  const timers = useTimers({ reducedMotion });
  const [expanded, setExpanded] = useState<string[]>(["produtos"]);
  const opened = expanded.length > 1;
  const lines = useMemo(() => jsonLines(PRODUCTS, expanded), [expanded]);

  useEffect(() => {
    say(EXTRA_LINES.list, "thinking");
    setHint("Toque num item da lista para abrir.");
  }, [say, setHint]);

  const toggle = (path: string) => {
    if (expanded.includes(path)) return;
    const next = [...expanded, path];
    setExpanded(next);
    if (next.length === 2) {
      say(EXTRA_LINES.listOpened, "happy");
      setHint("Você abriu um item. Pode abrir os outros também.");
      timers.after(READY_PAUSE_MS, () => setCanAdvance(true), { hold: true });
    }
  };

  return (
    <>
      <Banner key={opened ? "open" : "closed"} text={opened ? "Propriedades do item" : "Toque num item da lista"} tone={opened ? "success" : "warning"} icon={opened ? "ok" : "box"} reducedMotion={reducedMotion} />
      <Place x={50} y={55} width={46}>
        <JsonView lines={lines} title="RESPOSTA" label="Lista de produtos" onToggle={toggle} />
      </Place>
      <Live text={opened ? "Item aberto: id, nome e preço." : "A lista produtos tem 3 itens fechados."} />
    </>
  );
}

/* Microinteração (.md): três perguntas curtas; o aluno toca no valor (abrindo objetos e listas se precisar). */
export function SceneQuiz({ say, setCanAdvance, setHint, reducedMotion }: SceneProps) {
  const timers = useTimers({ reducedMotion });
  const [index, setIndex] = useState(0);
  const [expanded, setExpanded] = useState<string[]>(QUESTIONS[0].expanded);
  const [marks, setMarks] = useState<Record<string, "ok" | "wrong">>({});
  const [tries, setTries] = useState(0);
  const indexRef = useRef(0);
  const done = index >= QUESTIONS.length;
  const q = QUESTIONS[Math.min(index, QUESTIONS.length - 1)];
  const lines = useMemo(() => jsonLines(q.json, expanded), [q, expanded]);

  useEffect(() => {
    say(EXTRA_LINES.quiz, "thinking");
  }, [say]);

  useEffect(() => {
    setHint(done ? "Você respondeu às três perguntas!" : `Pergunta ${index + 1} de ${QUESTIONS.length}: ${q.text}`);
  }, [index, done, q, setHint]);

  const tap = (tok: Tok) => {
    const i = indexRef.current;
    if (i >= QUESTIONS.length || !tok.path) return;
    const current = QUESTIONS[i];
    if (tok.path !== current.answer) {
      const key = tok.path;
      setMarks((m) => ({ ...m, [key]: "wrong" }));
      setTries((t) => t + 1);
      timers.after(1100, () => setMarks((m) => Object.fromEntries(Object.entries(m).filter(([k, v]) => !(k === key && v === "wrong")))), { hold: true });
      say(`Ainda não. ${current.hint}`, "warning");
      return;
    }
    setMarks({ [tok.path]: "ok" });
    const next = i + 1;
    indexRef.current = next;
    if (next >= QUESTIONS.length) {
      setIndex(next);
      say(EXTRA_LINES.done, "happy");
      timers.after(READY_PAUSE_MS, () => setCanAdvance(true), { hold: true });
      return;
    }
    say(`${EXTRA_LINES.right} ${QUESTIONS[next].text}`, "happy");
    timers.after(
      1200,
      () => {
        setIndex(next);
        setExpanded(QUESTIONS[next].expanded);
        setMarks({});
      },
      { hold: true },
    );
  };

  return (
    <>
      <Banner key={`${index}-${tries}`} text={done ? "Tudo encontrado!" : q.text} tone={done ? "success" : "warning"} icon={done ? "ok" : "question"} reducedMotion={reducedMotion} />
      <Place x={50} y={56} width={48}>
        <JsonView
          key={index}
          lines={lines}
          title={`Pergunta ${Math.min(index + 1, QUESTIONS.length)} de ${QUESTIONS.length}`}
          label={`JSON da pergunta: ${q.text}`}
          tappable={done ? [] : ["string", "number", "boolean"]}
          onTap={tap}
          onToggle={done ? undefined : (path) => setExpanded((e) => (e.includes(path) ? e : [...e, path]))}
          marks={marks}
        />
      </Place>
      <Live text={done ? "Você respondeu às três perguntas." : q.text} />
    </>
  );
}

/* Fechamento — a resposta JSON vira informação na tela do aplicativo. */
const CLOSING_STEPS = phases([1200, 1600, 1600], LINES.closing);

export function SceneClosing({ say, setCanAdvance, reducedMotion }: SceneProps) {
  const { step } = useSequence(CLOSING_STEPS, { reducedMotion, onDone: () => setCanAdvance(true) });
  const lines = useMemo(() => jsonLines(PERSON), []);

  useEffect(() => {
    say(LINES.closing, "happy");
  }, [say]);

  return (
    <>
      <Banner text="Dos dados à tela" tone="success" icon="ok" reducedMotion={reducedMotion} />
      <Place x={28} y={56} width={36}>
        <JsonView lines={lines} title="RESPOSTA" label="Resposta JSON" highlight={step >= 1 ? ["nome", "cidade"] : []} />
      </Place>
      <Place x={55} y={56} hidden={step < 1} z={4}>
        <img src={SPRITES.ui.next} alt="" draggable={false} className={cx(styles.arrow)} />
      </Place>
      <AppCard x={64} y={38} width={30} name="Perfil" icon="cellphone" highlighted={step >= 2}>
        {step >= 2 ? (
          <>
            <AppValue tone="ok">Ana</AppValue>
            <span>Mora em Osasco</span>
          </>
        ) : (
          <AppValue empty>?</AppValue>
        )}
      </AppCard>
      <Live text={step >= 2 ? "O aplicativo mostra: Ana, mora em Osasco." : ""} />
    </>
  );
}
