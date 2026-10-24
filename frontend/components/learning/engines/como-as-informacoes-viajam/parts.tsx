"use client";

import type { CSSProperties } from "react";
import { BACKGROUNDS, ELEMENTS } from "@/config/assets";
import { BrowserFrame, Link, Place, SceneSprite, StageBanner, type ElementKey, type KitTone, type LinkState, type ScenePoint } from "@/components/learning/kit";
import { cx } from "@/components/ui/cx";
import { INTERNET_AT, LOGIN_FAIL, LOGIN_OK, MESSAGES, MOVE_MS, SERVER_AT, SITE, USER, WIRES, type MessageKind } from "./model";
import styles from "./ComoAsInformacoesViajam.module.css";

const NO_POINTER: CSSProperties = { pointerEvents: "none" };
/** a mensagem viaja um pouco acima do fio: o nome dela fica acima da internet e do servidor (no celular cobria os dois) */
const TRAVEL_LIFT = 6;

export function Starfield() {
  return <div className={styles.starfield} style={{ backgroundImage: `url(${BACKGROUNDS.starfieldFar})` }} aria-hidden="true" />;
}

export function Live({ text }: { text: string }) {
  return (
    <p className="sr-only" role="status" aria-live="polite">
      {text}
    </p>
  );
}

export function Banner({ text, tone = "info", icon, reducedMotion }: { text: string; tone?: KitTone; icon?: ElementKey; reducedMotion: boolean }) {
  return <StageBanner text={text} tone={tone} icon={icon} reducedMotion={reducedMotion} y={8} live={false} />;
}

/** form: login a preencher · sending: esperando a resposta · ok / fail: o resultado na tela. */
export type LoginState = "form" | "sending" | "ok" | "fail";

export type LoginWindowProps = {
  state: LoginState;
  /** botão Entrar tocável (cena 1) */
  onEnter?: () => void;
  enterPulse?: boolean;
  /** senha errada (a outra tentativa da cena 5) */
  wrongPassword?: boolean;
  highlighted?: boolean;
  /** torna a janela tocável (cena 6: "Navegador") */
  onTap?: () => void;
  pressed?: boolean;
  done?: boolean;
};

/** Navegador com a página de login (cena 1) que, no fim, mostra o resultado (cena 5). */
export function LoginWindow({ state, onEnter, enterPulse = false, wrongPassword = false, highlighted = false, onTap, pressed, done = false }: LoginWindowProps) {
  const result = state === "ok" || state === "fail";
  return (
    <Place x={3} y={17} anchor="top-left" width={40} z={3}>
      <div className={styles.windowFit}>
        <div className={cx(styles.window, highlighted && styles.ringLit, done && styles.ringDone)}>
          <BrowserFrame url={SITE} tabTitle="Entrar" loading={state === "sending"} className={styles.browser}>
            {result ? (
              <div className={cx(styles.result, state === "ok" ? styles.resultOk : styles.resultFail)} role="status">
                <img src={state === "ok" ? ELEMENTS.ok : ELEMENTS.error} alt="" draggable={false} />
                <span>{state === "ok" ? LOGIN_OK : LOGIN_FAIL}</span>
              </div>
            ) : (
              <div className={cx(styles.login, state === "sending" && styles.sending)} role="group" aria-label="Página de login">
                <span className={styles.fieldLabel}>Usuário</span>
                <span className={styles.field}>{USER}</span>
                <span className={styles.fieldLabel}>Senha</span>
                <span className={cx(styles.field, wrongPassword && styles.fieldWrong)} aria-label={wrongPassword ? "Senha errada, escondida" : "Senha escondida"}>
                  {wrongPassword ? "****" : "********"}
                </span>
                {onEnter ? (
                  <button type="button" className={cx(styles.enter, enterPulse && styles.enterPulse)} onClick={onEnter} disabled={state !== "form"}>
                    Entrar
                  </button>
                ) : (
                  <span className={styles.enter} aria-hidden="true">
                    Entrar
                  </span>
                )}
              </div>
            )}
          </BrowserFrame>
          {done && <img src={ELEMENTS.ok} alt="" draggable={false} className={styles.doneMark} />}
          {onTap && <button type="button" className={styles.tapArea} onClick={onTap} aria-pressed={pressed} aria-label="Navegador" />}
        </div>
      </div>
    </Place>
  );
}

export type NodeLook = { highlighted?: boolean; dimmed?: boolean; correct?: boolean; pulse?: boolean; selected?: boolean };

function Node({ at, element, size, label, alt, look = {}, onTap, pressed }: { at: ScenePoint; element: ElementKey; size: number; label?: string; alt: string; look?: NodeLook; onTap?: () => void; pressed?: boolean }) {
  return (
    <Place x={at.x} y={at.y - (size * 16) / 9 / 2} anchor="top" z={3}>
      <SceneSprite
        element={element}
        size={size}
        label={label}
        alt={alt}
        highlighted={look.highlighted}
        dimmed={look.dimmed}
        correct={look.correct}
        selected={look.selected}
        pulse={look.pulse}
        onClick={onTap}
        pressed={onTap ? Boolean(pressed) : undefined}
      />
    </Place>
  );
}

export function InternetNode({ look }: { look?: NodeLook }) {
  return <Node at={INTERNET_AT} element="internet" size={7.5} label="Internet" alt="Internet" look={look} />;
}

export function ServerNode({ look, onTap, pressed }: { look?: NodeLook; onTap?: () => void; pressed?: boolean }) {
  return <Node at={SERVER_AT} element="server" size={9} label="Servidor" alt="Servidor" look={look} onTap={onTap} pressed={pressed} />;
}

/** Requisição ou resposta parada (cena 6, para ser tocada). */
export function MessageNode({ kind, at, look, onTap, pressed }: { kind: MessageKind; at: ScenePoint; look?: NodeLook; onTap?: () => void; pressed?: boolean }) {
  const message = MESSAGES[kind];
  return <Node at={at} element={message.element} size={5.5} label={message.alt} alt={message.alt} look={look} onTap={onTap} pressed={pressed} />;
}

export function Wires({ a = "idle", b = "idle", back = false }: { a?: LinkState; b?: LinkState; back?: boolean }) {
  return (
    <>
      <Link {...WIRES.a} state={a} reverse={back} thickness={0.7} dots={2} speedMs={900} />
      <Link {...WIRES.b} state={b} reverse={back} thickness={0.7} dots={2} speedMs={900} />
    </>
  );
}

/**
 * Mensagem viajando (requisição = carta, resposta = caixa dourada) com o nome em cima. Mude só `at`: o Place
 * desliza até a nova parada (transform); com movimento reduzido ele salta.
 */
export function Traveler({ kind, at, reducedMotion }: { kind: MessageKind; at: ScenePoint; reducedMotion: boolean }) {
  const message = MESSAGES[kind];
  return (
    <Place x={at.x} y={at.y - TRAVEL_LIFT} z={6} moveMs={reducedMotion ? 0 : MOVE_MS} style={NO_POINTER}>
      <span className={cx(styles.traveler, styles.pop)}>
        <span className={cx(styles.messageName, kind === "request" ? styles.nameRequest : styles.nameResponse)}>{message.label}</span>
        <img src={ELEMENTS[message.element]} alt={message.alt} draggable={false} className={styles.travelerImg} />
      </span>
    </Place>
  );
}

/** Painel acima do servidor: verificando usuário e senha (cena 3). `checked` = linhas já conferidas. */
export function CheckPanel({ checked, fail = false }: { checked: number; fail?: boolean }) {
  const rows = ["Usuário", "Senha"];
  return (
    <Place x={SERVER_AT.x - 3} y={SERVER_AT.y - 19} anchor="bottom" z={5}>
      <div className={styles.checkFit}>
        <div className={cx(styles.check, styles.pop)} role="group" aria-label="O servidor verifica as informações">
          <span className={styles.checkTitle}>
            <img src={ELEMENTS.magnifier} alt="" draggable={false} />
            Verificando
          </span>
          {rows.map((row, index) => (
            <span key={row} className={styles.checkRow}>
              {row}
              {index < checked && (
                <img src={fail && index === 1 ? ELEMENTS.error : ELEMENTS.ok} alt={fail && index === 1 ? "errado" : "certo"} draggable={false} className={styles.pop} />
              )}
            </span>
          ))}
        </div>
      </div>
    </Place>
  );
}
