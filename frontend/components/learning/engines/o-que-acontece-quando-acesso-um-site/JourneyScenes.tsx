"use client";

import { useEffect, useState } from "react";
import { Block, PagePreview, SceneSprite, Tag, useSequence, useTimers, type SequenceStep } from "@/components/learning/kit";
import { cx } from "@/components/ui/cx";
import { BANNER, GUIDE, LINES, READY_PAUSE_MS, SITE, SITE_TITLE, STOPS, phases, speechMs, type SceneProps } from "./model";
import { Banner, Client, FilesPanel, InternetNode, Live, LoadingPage, ServerNode, Traveler, Wires } from "./World";
import styles from "./OQueAconteceQuandoAcessoUmSite.module.css";

/* Cena 1 — Quero acessar um site: o computador com o navegador aberto em jogos.com; o aluno toca em Acessar. */

const BROWSER_SPEECH: SequenceStep[] = [{ hold: speechMs(LINES.browser) }];

export function SceneAccess({ say, setCanAdvance, setHint, reducedMotion }: SceneProps) {
  const timers = useTimers({ reducedMotion });
  const [clicked, setClicked] = useState(false);
  const [started, setStarted] = useState(false);
  /* a fala é longa (~6 s): mesmo com um toque rápido, "Próxima cena" só libera quando o Bonzi termina */
  const { done: spoken } = useSequence(BROWSER_SPEECH, { reducedMotion });

  useEffect(() => {
    say(LINES.browser);
  }, [say]);

  useEffect(() => {
    if (started && spoken) setCanAdvance(true);
  }, [started, spoken, setCanAdvance]);

  const access = () => {
    if (clicked) return;
    setClicked(true);
    setHint(GUIDE.accessed);
    timers.after(READY_PAUSE_MS, () => setStarted(true), { hold: true });
  };

  return (
    <>
      <Banner
        text={clicked ? BANNER.loading : BANNER.access}
        tone={clicked ? "info" : "warning"}
        icon={clicked ? "internet" : "webpage"}
        reducedMotion={reducedMotion}
        y={7}
      />
      <Client
        layout="focus"
        loading={clicked}
        page={clicked ? <LoadingPage reducedMotion={reducedMotion} /> : null}
        look={{ highlighted: clicked }}
        action={{ label: "Acessar", onClick: access, disabled: clicked, pulse: !clicked && !reducedMotion }}
      />
      <Live text={clicked ? GUIDE.accessed : ""} />
    </>
  );
}

/*
 * Cena 2 — Fazendo o pedido. Fases: 0 navegador carregando · 1 o pedido aparece no navegador · 2 pela internet ·
 * 3 até o outro computador · 4 chegou: a placa SERVIDOR aparece. A última fase cobre a fala (77 caracteres).
 */
const REQUEST_STEPS = phases([700, 500, 1300, 1300, 1600], LINES.request);

export function SceneRequest({ say, setCanAdvance, reducedMotion }: SceneProps) {
  const { step } = useSequence(REQUEST_STEPS, { reducedMotion, onDone: () => setCanAdvance(true) });
  const sending = step >= 1;
  const arrived = step >= 4;
  const at = step <= 1 ? STOPS.client : step === 2 ? STOPS.internet : STOPS.server;

  useEffect(() => {
    say(LINES.request);
  }, [say]);

  return (
    <>
      <Wires a={step === 2 ? "active" : "idle"} b={step === 3 ? "active" : "idle"} />
      <Client layout="side" loading page={<LoadingPage reducedMotion={reducedMotion} />} look={{ highlighted: step === 1 }} />
      <InternetNode look={{ highlighted: step === 2 }} />
      <ServerNode named={arrived} look={{ highlighted: arrived, bump: arrived && !reducedMotion }} />
      {sending && <Traveler key="request" kind="request" at={at} reducedMotion={reducedMotion} />}
      <Live text={arrived ? "O pedido chegou a outro computador: o servidor." : sending ? "O navegador enviou um pedido pela internet." : ""} />
    </>
  );
}

/*
 * Cena 3 — Conhecendo o servidor. Fases: 0 servidor em destaque com o pedido · 1 a 3 os arquivos do site aparecem ·
 * 4 leitura (cobre a fala de 104 caracteres) e o pedido ganha a marca de recebido.
 */
const SERVER_STEPS = phases([800, 500, 500, 500, 1800], LINES.server);

export function SceneServer({ say, setCanAdvance, reducedMotion }: SceneProps) {
  const { step } = useSequence(SERVER_STEPS, { reducedMotion, onDone: () => setCanAdvance(true) });
  const shown = Math.min(3, step);

  useEffect(() => {
    say(LINES.server);
  }, [say]);

  return (
    <>
      <Wires dimmed />
      <Client layout="side" loading page={<LoadingPage reducedMotion={reducedMotion} />} look={{ dimmed: true }} />
      <InternetNode look={{ dimmed: true }} />
      <ServerNode look={{ highlighted: true }} />
      {step >= 1 && <FilesPanel shown={shown} />}
      <Traveler kind="request" at={STOPS.server} reducedMotion={reducedMotion} pop={false} received={step >= 4} />
      <Live text={step >= 3 ? `O servidor guarda os arquivos do site ${SITE}: página, imagens e textos. Ele recebeu o pedido.` : ""} />
    </>
  );
}

/*
 * Cena 4 — Enviando a resposta. Fases: 0 o servidor com os arquivos · 1 os arquivos entram na resposta ·
 * 2 a resposta pela internet · 3 até o navegador · 4 chegou. Cobre a fala (54 caracteres).
 */
const RESPONSE_STEPS = phases([800, 700, 1300, 1300, 1200], LINES.response);

export function SceneResponse({ say, setCanAdvance, reducedMotion }: SceneProps) {
  const { step } = useSequence(RESPONSE_STEPS, { reducedMotion, onDone: () => setCanAdvance(true) });
  const packed = step >= 1;
  const arrived = step >= 4;
  const at = step <= 1 ? STOPS.server : step === 2 ? STOPS.internet : STOPS.client;

  useEffect(() => {
    say(LINES.response);
  }, [say]);

  return (
    <>
      <Wires a={step === 3 ? "active" : "idle"} b={step === 2 ? "active" : "idle"} back />
      <Client layout="side" loading page={<LoadingPage reducedMotion={reducedMotion} />} look={{ highlighted: arrived }} />
      <InternetNode look={{ highlighted: step === 2 }} />
      <ServerNode look={{ highlighted: step <= 1 }} />
      <FilesPanel shown={3} packed={packed} hidden={step >= 2} enter={false} />
      {packed && <Traveler key="response" kind="response" at={at} reducedMotion={reducedMotion} />}
      <Live text={arrived ? "A resposta chegou ao navegador." : packed ? "O servidor enviou uma resposta pela internet." : ""} />
    </>
  );
}

/*
 * Cena 5 — O site aparece! Fases: 0 a resposta chegou à página (ainda carregando) · 1 a caixa se abre ·
 * 2 título · 3 imagem · 4 texto · 5 botão e leitura (cobre a fala de 68 caracteres).
 */
const PAGE_STEPS = phases([700, 500, 450, 450, 450, 1600], LINES.page);

export function ScenePage({ say, setCanAdvance, reducedMotion }: SceneProps) {
  const { step, done } = useSequence(PAGE_STEPS, { reducedMotion, onDone: () => setCanAdvance(true) });
  const shown = (at: number) => (step >= at ? styles.blockIn : styles.ghost);

  useEffect(() => {
    say(LINES.page);
  }, [say]);

  return (
    <>
      <Client
        layout="focus"
        tall
        loading={step < 1}
        look={{ highlighted: done }}
        page={
          <div className={styles.siteStage}>
            <PagePreview label={`Site ${SITE}`}>
              <Block kind="title" text={SITE_TITLE} className={shown(2)} />
              <div className={styles.siteRow}>
                <Block kind="image" ariaLabel="Imagem" className={shown(3)} />
                <div className={styles.siteCol}>
                  <Block kind="text" text="Escolha um jogo e divirta-se!" className={shown(4)} />
                  <Block kind="button" text="Jogar" className={shown(5)} />
                </div>
              </div>
            </PagePreview>
            {step < 2 && (
              <span className={styles.pageBox}>
                <span className={cx(styles.holder, step >= 1 && styles.boxOpen)}>
                  <SceneSprite element="boxGold" size={6} alt="Resposta">
                    <Tag size="sm" tone="warning">
                      Resposta
                    </Tag>
                  </SceneSprite>
                </span>
              </span>
            )}
          </div>
        }
      />
      <Live text={step >= 5 ? `O site ${SITE} apareceu na tela, com título, imagem, texto e botão.` : ""} />
    </>
  );
}
