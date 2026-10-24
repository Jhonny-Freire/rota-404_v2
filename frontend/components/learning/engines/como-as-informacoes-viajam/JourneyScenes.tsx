"use client";

import { useEffect, useState } from "react";
import { ActionButton, Place, useSequence, useTimers, type SequenceStep } from "@/components/learning/kit";
import { EXTRA_LINES, LINES, READY_PAUSE_MS, STOPS, phases, speechMs, type SceneProps } from "./model";
import { Banner, CheckPanel, InternetNode, Live, LoginWindow, ServerNode, Traveler, Wires, type LoginState } from "./parts";
import styles from "./ComoAsInformacoesViajam.module.css";

/*
 * Cena 1 — Entrando em uma conta: página de login; o aluno clica em Entrar e a aula segue sozinha para a Cena 2
 * (sem o 2º clique em "Próxima cena"). O shell só troca de cena quando o Bonzi termina a fala.
 */

/* texto criado: instrução do painel "O que fazer" depois do toque */
const SENT_HINT = "O navegador começou a enviar as suas informações.";

export function SceneLogin({ say, setCanAdvance, setHint, next, reducedMotion }: SceneProps) {
  const timers = useTimers({ reducedMotion });
  const [clicked, setClicked] = useState(false);

  useEffect(() => {
    say(LINES.login);
  }, [say]);

  const enter = () => {
    if (clicked) return;
    setClicked(true);
    setHint(SENT_HINT);
    timers.after(
      READY_PAUSE_MS,
      () => {
        setCanAdvance(true);
        next();
      },
      { hold: true },
    );
  };

  return (
    <>
      <Banner text={clicked ? "Enviando..." : "Toque em Entrar"} tone={clicked ? "info" : "warning"} icon={clicked ? "mail" : "key"} reducedMotion={reducedMotion} />
      <Wires />
      <LoginWindow state={clicked ? "sending" : "form"} onEnter={enter} enterPulse={!clicked && !reducedMotion} highlighted={clicked} />
      <InternetNode />
      <ServerNode />
      <Live text={clicked ? SENT_HINT : ""} />
    </>
  );
}

/* Cena 2 — Enviando a requisição. Fases: 0 sai do navegador · 1 internet · 2 servidor · 3 leitura. */
const REQUEST_STEPS = phases([800, 1200, 1200, 1400], LINES.request);

export function SceneRequest({ say, setCanAdvance, reducedMotion }: SceneProps) {
  const { step } = useSequence(REQUEST_STEPS, { reducedMotion, onDone: () => setCanAdvance(true) });
  const at = step === 0 ? STOPS.client : step === 1 ? STOPS.internet : STOPS.server;

  useEffect(() => {
    say(LINES.request);
  }, [say]);

  return (
    <>
      <Wires a={step === 1 ? "active" : "idle"} b={step === 2 ? "active" : "idle"} />
      <LoginWindow state="sending" />
      <InternetNode look={{ highlighted: step === 1 }} />
      <ServerNode look={{ highlighted: step >= 2 }} />
      <Traveler kind="request" at={at} reducedMotion={reducedMotion} />
      <Live text={step >= 2 ? "A requisição chegou ao servidor." : "A requisição saiu do navegador."} />
    </>
  );
}

/* Cena 3 — O servidor recebe o pedido e verifica as informações. Fases: 0 recebeu · 1 usuário · 2 senha · 3 leitura. */
const SERVER_STEPS = phases([900, 1000, 1000, 1400], LINES.server);

export function SceneServer({ say, setCanAdvance, reducedMotion }: SceneProps) {
  const { step } = useSequence(SERVER_STEPS, { reducedMotion, onDone: () => setCanAdvance(true) });

  useEffect(() => {
    say(LINES.server);
  }, [say]);

  return (
    <>
      <Wires />
      <LoginWindow state="sending" />
      <InternetNode look={{ dimmed: true }} />
      <ServerNode look={{ highlighted: true }} />
      <Traveler kind="request" at={STOPS.server} reducedMotion={reducedMotion} />
      <CheckPanel checked={Math.min(2, step)} />
      <Live text={step >= 2 ? "O servidor verificou o usuário e a senha." : "O servidor está verificando as informações."} />
    </>
  );
}

/* Cena 4 — O servidor envia uma resposta. Fases: 0 sai do servidor · 1 internet · 2 navegador · 3 leitura. */
const RESPONSE_STEPS = phases([800, 1200, 1200, 1400], LINES.response);

export function SceneResponse({ say, setCanAdvance, reducedMotion }: SceneProps) {
  const { step } = useSequence(RESPONSE_STEPS, { reducedMotion, onDone: () => setCanAdvance(true) });
  const at = step === 0 ? STOPS.server : step === 1 ? STOPS.internet : STOPS.client;

  useEffect(() => {
    say(LINES.response);
  }, [say]);

  return (
    <>
      <Wires a={step === 2 ? "active" : "idle"} b={step === 1 ? "active" : "idle"} back />
      <LoginWindow state="sending" highlighted={step >= 2} />
      <InternetNode look={{ highlighted: step === 1 }} />
      <ServerNode look={{ highlighted: step === 0 }} />
      <Traveler kind="response" at={at} reducedMotion={reducedMotion} />
      <Live text={step >= 2 ? "A resposta chegou ao navegador." : "O servidor enviou uma resposta."} />
    </>
  );
}

/*
 * Cena 5 — O resultado aparece: "Login realizado!". Interpretação do "Em outra tentativa, a resposta pode indicar
 * que os dados estão incorretos": depois do acerto, o botão "Ver outra tentativa" mostra o login com a senha errada.
 */
const RESULT_STEPS = phases([700, 1500], LINES.result);

export function SceneResult({ say, setCanAdvance, reducedMotion }: SceneProps) {
  const timers = useTimers({ reducedMotion });
  const [view, setView] = useState<LoginState>("sending");
  const [tryWrong, setTryWrong] = useState(false);
  const { step, done } = useSequence(RESULT_STEPS, {
    reducedMotion,
    onStep: (s) => {
      if (s === 1) setView("ok");
    },
    onDone: () => setCanAdvance(true),
  });

  useEffect(() => {
    say(LINES.result, "happy");
  }, [say]);

  const toggle = () => {
    if (view === "sending") return;
    const wrong = !tryWrong;
    setTryWrong(wrong);
    setView("sending");
    timers.after(
      1500,
      () => {
        setView(wrong ? "fail" : "ok");
        say(wrong ? EXTRA_LINES.wrongTry : LINES.result, wrong ? "warning" : "happy");
      },
      { hold: true },
    );
  };

  return (
    <>
      <Wires />
      <LoginWindow state={view} wrongPassword={tryWrong} highlighted={step >= 1} />
      <InternetNode />
      <ServerNode />
      {/* embaixo da janela do navegador, que é o que muda */}
      <Place x={23} y={88} hidden={!done} z={6}>
        <div className={styles.replayFit}>
          <ActionButton label={tryWrong ? "Ver o login certo" : "Ver outra tentativa"} variant="default" onClick={toggle} disabled={!done || view === "sending"} size={20} />
        </div>
      </Place>
      <Live text={view === "ok" ? "Login realizado!" : view === "fail" ? "Usuário ou senha incorretos." : ""} />
    </>
  );
}
