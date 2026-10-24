"use client";

import { useEffect, useRef, useState } from "react";
import { SPRITES } from "@/config/assets";
import { Place, Tag, useTimers } from "@/components/learning/kit";
import { cx } from "@/components/ui/cx";
import { Banner, Live, Node } from "../_api/parts";
import { READY_PAUSE_MS } from "../_api/timing";
import type { RoleId } from "../_api/World";
import { EXTRA_LINES, MESSAGE_QUESTIONS, ROLE_QUESTIONS, TEMP, type MessageId, type SceneProps } from "./model";
import { World } from "./Scenes";
import styles from "./ClienteServidorEApi.module.css";

const WRONG_MS = 1100;
/** o motivo do acerto fica escrito no palco antes da próxima pergunta; toques nesse tempo não contam */
const REASON_MS = 3200;
/** as duas mensagens da parte 2, abaixo da linha: a requisição vai para a direita, a resposta volta */
const MESSAGE_AT: Record<MessageId, { x: number; y: number }> = { request: { x: 33, y: 84 }, response: { x: 67, y: 84 } };

/*
 * Microinteração (.md): o aluno toca em "quem pede?", "quem define a forma de comunicação?" e "quem processa o
 * pedido?" (cliente, API, servidor); depois identifica qual mensagem é a requisição e qual é a resposta. O erro
 * marca a peça tocada por um instante e o Bonzi dá uma pista, sem revelar a resposta. Aulas não tiram pontos.
 */
export function SceneQuiz({ say, setCanAdvance, setHint, reducedMotion }: SceneProps) {
  const timers = useTimers({ reducedMotion });
  /** 0–2: perguntas dos papéis · 3–4: perguntas das mensagens · 5: tudo certo */
  const [index, setIndex] = useState(0);
  const [wrong, setWrong] = useState<string | null>(null);
  const [found, setFound] = useState<string[]>([]);
  /** motivo do último acerto, escrito no palco (sem fala nova) */
  const [reason, setReason] = useState<string | null>(null);
  const indexRef = useRef(0);
  const lockedRef = useRef(false);
  const total = ROLE_QUESTIONS.length + MESSAGE_QUESTIONS.length;
  const done = index >= total;
  const messages = index >= ROLE_QUESTIONS.length;
  const question = done ? null : messages ? MESSAGE_QUESTIONS[index - ROLE_QUESTIONS.length] : ROLE_QUESTIONS[index];

  useEffect(() => {
    say(EXTRA_LINES.quiz, "thinking");
  }, [say]);

  useEffect(() => {
    setHint(question ? `Pergunta ${index + 1} de ${total}: ${question.question}` : "Você acertou todas as perguntas!");
  }, [question, index, total, setHint]);

  const answer = (id: string) => {
    const current = indexRef.current;
    // logo depois de um acerto, ou numa peça já descoberta, o toque não conta como erro (a pergunta já mudou)
    if (current >= total || lockedRef.current || found.includes(id)) return;
    const q = current < ROLE_QUESTIONS.length ? ROLE_QUESTIONS[current] : MESSAGE_QUESTIONS[current - ROLE_QUESTIONS.length];
    if (id !== q.answer) {
      setWrong(id);
      timers.after(WRONG_MS, () => setWrong((w) => (w === id ? null : w)), { hold: true });
      say(q.retry, "warning");
      return;
    }
    const next = current + 1;
    indexRef.current = next;
    setIndex(next);
    setWrong(null);
    setFound((f) => [...f, id]);
    setReason(q.why);
    lockedRef.current = true;
    timers.after(
      REASON_MS,
      () => {
        lockedRef.current = false;
        setReason(null);
      },
      { hold: true },
    );
    if (next >= total) {
      say(EXTRA_LINES.quizDone, "happy");
      timers.after(READY_PAUSE_MS, () => setCanAdvance(true), { hold: true });
    } else if (next === ROLE_QUESTIONS.length) {
      say(`${EXTRA_LINES.quizRight} ${EXTRA_LINES.messages}`, "happy");
    } else {
      say(EXTRA_LINES.quizRight, "happy");
    }
  };

  const roleLook = (role: RoleId) => ({ correct: found.includes(role), wrong: wrong === role });
  const banner = done
    ? { text: "Tudo certo!", tone: "success" as const, icon: "ok" as const }
    : reason
      ? { text: "Certo!", tone: "success" as const, icon: "ok" as const }
      : wrong
      ? { text: "Tente outra vez", tone: "danger" as const, icon: "error" as const }
      : { text: question!.question, tone: "warning" as const, icon: "question" as const };

  return (
    <>
      <Banner key={`${index}-${wrong ?? ""}-${reason ? 1 : 0}`} text={banner.text} tone={banner.tone} icon={banner.icon} reducedMotion={reducedMotion} />
      <World
        step={-1}
        roles={found.filter((id): id is RoleId => id === "client" || id === "api" || id === "server")}
        looks={{ client: roleLook("client"), api: roleLook("api"), server: roleLook("server") }}
        onTap={messages || done ? undefined : (role) => answer(role)}
        reducedMotion={reducedMotion}
      />
      {messages && (
        <>
          <MessageCard id="request" element="mail" text="Temperatura de Osasco?" arrow="right" found={found.includes("request")} wrong={wrong === "request"} onTap={done ? undefined : () => answer("request")} />
          <MessageCard id="response" element="boxGold" text={TEMP} arrow="left" found={found.includes("response")} wrong={wrong === "response"} onTap={done ? undefined : () => answer("response")} />
        </>
      )}
      {reason && (
        <Place x={50} y={19} anchor="top" z={7}>
          <p key={reason} className={styles.reason}>
            <img src={SPRITES.status.completed} alt="" draggable={false} />
            {reason}
          </p>
        </Place>
      )}
      <Live text={reason ?? (question ? question.question : "Você acertou todas as perguntas.")} />
    </>
  );
}

function MessageCard({ id, element, text, arrow, found, wrong, onTap }: { id: MessageId; element: "mail" | "boxGold"; text: string; arrow: "left" | "right"; found: boolean; wrong: boolean; onTap?: () => void }) {
  const at = MESSAGE_AT[id];
  const where = arrow === "right" ? "indo para o servidor" : "voltando para o cliente";
  return (
    <>
      <Node at={at} element={element} size={5} alt={`Mensagem ${where}: ${text}`} label={text} look={{ correct: found, wrong }} onTap={onTap} pressed={found} z={5} />
      <Place x={at.x} y={at.y - 12} z={5}>
        <span className={cx(styles.direction, arrow === "right" && styles.directionRight)}>
          <img src={arrow === "right" ? SPRITES.ui.next : SPRITES.ui.back} alt="" draggable={false} />
          <Tag size="sm" tone="muted">
            {where}
          </Tag>
        </span>
      </Place>
    </>
  );
}

