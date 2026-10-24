"use client";

import { useEffect, useRef, useState } from "react";
import { Block, BrowserFrame, Callout, Link, PagePreview, Place, SceneSprite, Tag, useSequence, useSpeech } from "@/components/learning/kit";
import { ELEMENTS } from "@/config/assets";
import { cx } from "@/components/ui/cx";
import { LINES, READY_PAUSE_MS, STOPS, SUMMARY, phases, speechMs, untilSpoken, type SceneProps } from "./model";
import { Banner, Hacker, Live, Message, SendForm, Server, Window, Wire, urlOf, type Protocol } from "./parts";
import styles from "./HttpEHttps.module.css";

/*
 * Cena 1 — Enviando uma informação (e, na mesma cena, a comunicação SEM proteção): o aluno digita uma informação
 * fictícia e envia; a mensagem viaja aberta pelo HTTP, o hacker intercepta e lê. As falas do .md são encadeadas
 * pelo FIM REAL do áudio (useSpeech), sem cortar o Bonzi. (Revisão de UX: as antigas cenas 1 e 2 viraram uma só.)
 */

/* texto criado: instruções do painel "O que fazer" */
const SENT_HINT = "A sua mensagem está viajando até o site. Observe o caminho!";

type HttpPhase = "form" | "sent" | "travel" | "intercept" | "arrive";

export function SceneSend({ say, setCanAdvance, setHint, reducedMotion, onInfo }: SceneProps & { onInfo: (value: string) => void }) {
  const { afterSpeech, pause } = useSpeech();
  const [sent, setSent] = useState<string | null>(null);
  const [phase, setPhase] = useState<HttpPhase>("form");
  const introDone = useRef<Promise<void> | null>(null);

  useEffect(() => {
    say(LINES.send);
    introDone.current = afterSpeech(LINES.send);
  }, [say, afterSpeech]);

  const send = async (value: string) => {
    if (sent !== null) return;
    setSent(value);
    onInfo(value);
    setPhase("sent");
    setHint(SENT_HINT);
    (document.activeElement as HTMLElement | null)?.blur?.();
    await (introDone.current ?? Promise.resolve());
    setPhase("travel");
    say(LINES.http);
    await afterSpeech(LINES.http);
    setPhase("intercept");
    await pause(900);
    say(LINES.httpRead, "warning");
    await pause(1200);
    setPhase("arrive");
    await afterSpeech(LINES.httpRead);
    say(LINES.httpSwitch, "thinking");
    await afterSpeech(LINES.httpSwitch);
    setCanAdvance(true);
  };

  const intercepted = phase === "intercept" || phase === "arrive";
  const at = phase === "form" || phase === "sent" ? STOPS.client : phase === "arrive" ? STOPS.server : STOPS.hacker;
  const banner =
    phase === "form"
      ? { text: "Digite e envie", tone: "warning" as const, icon: "webpage" as const }
      : intercepted
        ? { text: "O hacker leu a mensagem!", tone: "danger" as const, icon: "hacker" as const }
        : { text: "Mensagem viajando", tone: "info" as const, icon: "mail" as const };

  return (
    <>
      <Banner key={banner.text} text={banner.text} tone={banner.tone} icon={banner.icon} reducedMotion={reducedMotion} />
      <Wire state={phase === "travel" || phase === "arrive" ? "active" : "idle"} />
      <Window protocol="http" highlight={phase !== "form"}>
        <SendForm onSend={send} sentValue={sent ?? undefined} />
      </Window>
      <Server received={phase === "arrive"} />
      {phase !== "form" && <Hacker sees={intercepted ? "content" : "nothing"} text={sent ?? ""} highlighted={phase === "intercept"} />}
      {sent !== null && (
        <Message
          locked={false}
          text={sent}
          at={at}
          highlight={phase === "travel" || phase === "intercept"}
          reducedMotion={reducedMotion}
          pop={phase === "sent"}
        />
      )}
      <Live
        text={
          intercepted
            ? `Com HTTP, o hacker interceptou a mensagem e leu: Apelido ${sent}.`
            : phase === "travel"
              ? "A mensagem viaja aberta, com HTTP."
              : ""
        }
      />
    </>
  );
}

/*
 * Cena 2 — Protegendo a comunicação (HTTPS): a mensagem vira um pacote fechado com cadeado, viaja, o hacker
 * intercepta e não consegue ler, e o servidor recebe normalmente. Falas encadeadas pelo fim real do áudio.
 */
type HttpsPhase = "start" | "protect" | "travel" | "intercept" | "arrive" | "received";

export function SceneHttps({ say, setCanAdvance, reducedMotion, info }: SceneProps) {
  const { afterSpeech, pause } = useSpeech();
  const [phase, setPhase] = useState<HttpsPhase>("start");

  useEffect(() => {
    let active = true;
    const run = async () => {
      say(LINES.https);
      const spoken = afterSpeech(LINES.https);
      await pause(900);
      if (!active) return;
      setPhase("protect");
      await pause(1500);
      if (!active) return;
      setPhase("travel");
      await spoken;
      if (!active) return;
      setPhase("intercept");
      say(LINES.httpsBlocked, "happy");
      await pause(1600);
      if (!active) return;
      setPhase("arrive");
      await afterSpeech(LINES.httpsBlocked);
      if (!active) return;
      setPhase("received");
      setCanAdvance(true);
    };
    run();
    return () => {
      active = false;
    };
  }, [say, setCanAdvance, afterSpeech, pause]);

  const locked = phase !== "start";
  const at = phase === "start" || phase === "protect" ? STOPS.client : phase === "travel" || phase === "intercept" ? STOPS.hacker : STOPS.server;
  const sees = phase === "intercept" || phase === "arrive" || phase === "received" ? "locked" : "nothing";

  return (
    <>
      <Wire state={phase === "travel" || phase === "arrive" ? "active" : "idle"} />
      <Window protocol="https" highlight>
        <SendForm sentValue={info} />
      </Window>
      <Server received={phase === "received"} highlighted={phase === "received"} />
      <Hacker sees={sees} text={info} highlighted={phase === "intercept"} />
      {phase !== "received" && (
        <Message key={locked ? "locked" : "open"} locked={locked} text={info} at={at} highlight={phase === "travel" || phase === "intercept"} reducedMotion={reducedMotion} pop={locked} />
      )}
      <Live
        text={
          phase === "received"
            ? "A mensagem protegida chegou ao servidor, que conseguiu processá-la."
            : sees === "locked"
              ? "O hacker interceptou a mensagem, mas ela está protegida e ele não consegue ler."
              : locked
                ? "Com HTTPS, a mensagem foi protegida: virou um pacote fechado com cadeado."
                : ""
        }
      />
    </>
  );
}

/* Cena 3 — Comparando HTTP e HTTPS: tela dividida; em cada lado, a mensagem vai do navegador ao servidor. */

const COMPARE_STEPS = phases([900, 1300, 1300, 1500], speechMs(LINES.compare));

function Lane({ protocol, step, info, reducedMotion }: { protocol: Exclude<Protocol, "none">; step: number; info: string; reducedMotion: boolean }) {
  const x = protocol === "http" ? 25 : 75;
  const y = step <= 0 ? 47 : step === 1 ? 59 : 68;
  return (
    <>
      <Place x={x} y={8} z={4}>
        <Tag size="lg" tone={protocol === "http" ? "danger" : "success"} icon={protocol === "http" ? "lockOpen" : "lockClosed"}>
          {protocol.toUpperCase()}
        </Tag>
      </Place>
      <Place x={x} y={17} anchor="top" width={44} z={3}>
        <div className={styles.miniFit}>
          <BrowserFrame url={urlOf(protocol)} secure={protocol === "https"} highlight="protocol" className={styles.browser} />
        </div>
      </Place>
      <Link from={{ x, y: 42 }} to={{ x, y: 74 }} state={step >= 1 && step <= 2 ? "active" : "idle"} thickness={0.6} dots={2} />
      <Place x={x} y={74} anchor="top" z={3}>
        <SceneSprite element="server" size={6} alt="Servidor" correct={step >= 3} />
      </Place>
      <Message locked={protocol === "https"} text={info} at={{ x, y }} reducedMotion={reducedMotion} highlight={step >= 1 && step <= 2} />
    </>
  );
}

export function SceneCompare({ say, setCanAdvance, reducedMotion, info }: SceneProps) {
  const { step } = useSequence(COMPARE_STEPS, { reducedMotion, onDone: () => setCanAdvance(true) });

  useEffect(() => {
    say(LINES.compare);
  }, [say]);

  return (
    <>
      <div className={styles.divider} aria-hidden="true" />
      <Lane protocol="http" step={step} info={info} reducedMotion={reducedMotion} />
      <Lane protocol="https" step={step} info={info} reducedMotion={reducedMotion} />
      <Live text="À esquerda, http://exemplo.com: a mensagem viaja aberta. À direita, https://exemplo.com: a mensagem viaja protegida, com cadeado." />
    </>
  );
}

/* Cena 4 — O que o cadeado significa? Fases: 0 endereço · 1 o cadeado em destaque · 2 o aviso (até a fala acabar). */

const LOCK_STEPS = phases([900, 2600, 1500], speechMs(LINES.lock));

export function SceneLock({ say, setCanAdvance, reducedMotion }: SceneProps) {
  const { step } = useSequence(LOCK_STEPS, { reducedMotion, onDone: () => setCanAdvance(true) });

  useEffect(() => {
    say(LINES.lock);
  }, [say]);

  return (
    <>
      <Place x={50} y={8} anchor="top" width={62} z={3}>
        <div className={cx(styles.lockFit, step >= 1 && styles.lockFocus)}>
          <BrowserFrame url={urlOf("https")} secure highlight={step >= 1 ? "url" : "none"} tabTitle="Exemplo" className={styles.browser}>
            <PagePreview dense label="Página exemplo.com">
              <Block kind="title" text="Exemplo" />
              <Block kind="text" />
            </PagePreview>
          </BrowserFrame>
        </div>
      </Place>
      {/* textos criados: legendas visuais da fala literal */}
      {step >= 1 && (
        <Place x={27} y={68} anchor="top" z={5}>
          <div className={styles.calloutFit}><div className={styles.pop}>
            <Callout tone="success" tail="up" size="sm" maxWidth={30}>
              <span className={styles.note}>
                <img src={ELEMENTS.lockClosed} alt="" draggable={false} />
                Cadeado: conexão protegida
              </span>
            </Callout>
          </div></div>
        </Place>
      )}
      {step >= 2 && (
        <Place x={74} y={68} anchor="top" z={5}>
          <div className={styles.calloutFit}><div className={styles.pop}>
            <Callout tone="warning" size="sm" maxWidth={30}>
              Atenção: não quer dizer que o site é confiável!
            </Callout>
          </div></div>
        </Place>
      )}
      <Live text={step >= 2 ? "O cadeado indica conexão protegida, mas não garante que o site é confiável." : ""} />
    </>
  );
}

/* Encerramento — as duas formas de comunicação de novo, lado a lado. */

const CLOSING_STEPS = phases([800, 1600, 800, 1600, 1500], speechMs(LINES.closing));

function SummaryRow({ protocol, y, step, info, reducedMotion }: { protocol: "http" | "https"; y: number; step: number; info: string; reducedMotion: boolean }) {
  const trip = step % 2 === 1 ? 50 : 30;
  return (
    <>
      <Place x={24} y={y - 15} anchor="left" z={4}>
        <Tag size="md" tone={protocol === "http" ? "danger" : "success"} icon={protocol === "http" ? "lockOpen" : "lockClosed"}>
          {protocol.toUpperCase()}
        </Tag>
      </Place>
      <Link from={{ x: 24, y }} to={{ x: 56, y }} state="active" thickness={0.6} dots={2} speedMs={1100} />
      <Message key={`${protocol}-${Math.floor(step / 2)}`} locked={protocol === "https"} text={info} at={{ x: step === 0 ? 30 : trip, y }} reducedMotion={reducedMotion} />
      <Place x={60} y={y} anchor="left" z={4}>
        <span className={cx(styles.summary, protocol === "http" ? styles.summaryOpen : styles.summaryLocked)}>{SUMMARY[protocol]}</span>
      </Place>
    </>
  );
}

export function SceneClosing({ say, setCanAdvance, reducedMotion, info }: SceneProps) {
  const { step } = useSequence(CLOSING_STEPS, { reducedMotion, onDone: () => setCanAdvance(true) });

  useEffect(() => {
    say(LINES.closing, "happy");
  }, [say]);

  return (
    <>
      <SummaryRow protocol="http" y={34} step={step} info={info} reducedMotion={reducedMotion} />
      <SummaryRow protocol="https" y={68} step={step} info={info} reducedMotion={reducedMotion} />
      <Live text="HTTP: comunicação sem criptografia. HTTPS: comunicação protegida por criptografia." />
    </>
  );
}
