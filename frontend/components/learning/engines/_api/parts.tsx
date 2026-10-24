"use client";

import type { CSSProperties, ReactNode } from "react";
import { BACKGROUNDS, ELEMENTS } from "@/config/assets";
import { Link, Place, SceneSprite, StageBanner, type ElementKey, type KitTone, type LinkState, type ScenePoint } from "@/components/learning/kit";
import { cx } from "@/components/ui/cx";
import { MOVE_MS } from "./timing";
import styles from "./ApiKit.module.css";

/*
 * Peças comuns dos motores da Galáxia 2 "API REST" (faixa 14+): cliente/aplicativo, API, servidor/serviço, as
 * mensagens que viajam entre eles. Cada motor posiciona as peças com as próprias coordenadas.
 */

const NO_POINTER: CSSProperties = { pointerEvents: "none" };

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

export function Banner({ text, tone = "info", icon, reducedMotion, y = 8 }: { text: string; tone?: KitTone; icon?: ElementKey; reducedMotion: boolean; y?: number }) {
  return <StageBanner text={text} tone={tone} icon={icon} reducedMotion={reducedMotion} y={y} live={false} />;
}

export type NodeLook = { highlighted?: boolean; dimmed?: boolean; correct?: boolean; wrong?: boolean; pulse?: boolean; selected?: boolean };

export type NodeProps = {
  at: ScenePoint;
  element: ElementKey;
  /** largura em unidades do kit */
  size: number;
  label?: ReactNode;
  alt: string;
  look?: NodeLook;
  onTap?: () => void;
  pressed?: boolean;
  /** sprite pequeno acima (ex.: o serviço de clima em cima do servidor) */
  badge?: ElementKey;
  /** proporção altura/largura do sprite (centraliza na vertical) */
  aspect?: number;
  z?: number;
};

/** Sprite com legenda centrado em `at`. */
export function Node({ at, element, size, label, alt, look = {}, onTap, pressed, badge, aspect = 1, z = 3 }: NodeProps) {
  return (
    <Place x={at.x} y={at.y - (size * aspect * 16) / 9 / 2} anchor="top" z={z}>
      <SceneSprite
        element={element}
        size={size}
        label={label}
        alt={alt}
        highlighted={look.highlighted}
        dimmed={look.dimmed}
        correct={look.correct}
        wrong={look.wrong}
        selected={look.selected}
        pulse={look.pulse}
        onClick={onTap}
        pressed={onTap ? Boolean(pressed) : undefined}
      >
        {badge && <img src={ELEMENTS[badge]} alt="" draggable={false} className={styles.badge} />}
      </SceneSprite>
    </Place>
  );
}

export function Wire({ from, to, state = "idle", back = false }: { from: ScenePoint; to: ScenePoint; state?: LinkState; back?: boolean }) {
  return <Link from={from} to={to} state={state} reverse={back} thickness={0.7} dots={2} speedMs={900} />;
}

export type MessageTone = "request" | "response" | "error";

/**
 * Mensagem viajando (requisição = carta, resposta = caixa dourada) com o nome em cima. Mude só `at`: o Place desliza
 * até a nova parada (transform); com movimento reduzido ele salta.
 */
export function Traveler({ at, tone, label, element, alt, reducedMotion, lift = 6 }: { at: ScenePoint; tone: MessageTone; label: string; element?: ElementKey; alt?: string; reducedMotion: boolean; lift?: number }) {
  const sprite = element ?? (tone === "request" ? "mail" : tone === "response" ? "boxGold" : "error");
  return (
    <Place x={at.x} y={at.y - lift} z={6} moveMs={reducedMotion ? 0 : MOVE_MS} style={NO_POINTER}>
      <span className={cx(styles.traveler, styles.pop)}>
        <span className={cx(styles.messageName, tone === "request" ? styles.nameRequest : tone === "response" ? styles.nameResponse : styles.nameError)}>{label}</span>
        <img src={ELEMENTS[sprite]} alt={alt ?? label} draggable={false} className={styles.travelerImg} />
      </span>
    </Place>
  );
}

export type AppCardProps = {
  x: number;
  y: number;
  /** largura em unidades do kit */
  width: number;
  name: string;
  icon: ElementKey;
  children?: ReactNode;
  highlighted?: boolean;
  done?: boolean;
  /** torna a janela tocável */
  onTap?: () => void;
  pressed?: boolean;
  tapLabel?: string;
  anchor?: "top-left" | "top" | "top-right" | "left";
  z?: number;
};

/** Janela de aplicativo (cliente): cabeçalho com ícone e nome; o conteúdo vem do motor. */
export function AppCard({ x, y, width, name, icon, children, highlighted = false, done = false, onTap, pressed, tapLabel, anchor = "top-left", z = 3 }: AppCardProps) {
  return (
    <Place x={x} y={y} anchor={anchor} width={width} z={z}>
      <div className={cx(styles.appFit, anchor === "top" && styles.fitTop, anchor === "top-right" && styles.fitRight, anchor === "left" && styles.fitLeft)}>
        <div className={cx(styles.app, highlighted && styles.ringLit, done && styles.ringDone)} role="group" aria-label={name}>
          <span className={styles.appHead}>
            <img src={ELEMENTS[icon]} alt="" draggable={false} />
            {name}
          </span>
          <div className={styles.appBody}>{children}</div>
          {done && <img src={ELEMENTS.ok} alt="" draggable={false} className={styles.doneMark} />}
          {onTap && <button type="button" className={styles.tapArea} onClick={onTap} aria-pressed={pressed} aria-label={tapLabel ?? name} />}
        </div>
      </div>
    </Place>
  );
}

/** Texto grande dentro de um AppCard (ex.: "Osasco — 24 °C") ou o vazio "?" enquanto o dado não chegou. */
export function AppValue({ children, empty = false, tone = "default" }: { children: ReactNode; empty?: boolean; tone?: "default" | "ok" | "error" }) {
  return <span className={cx(styles.appValue, empty && styles.appEmpty, tone === "ok" && styles.valueOk, tone === "error" && styles.valueError, !empty && styles.pop)}>{children}</span>;
}

/** Caminho, método ou código em fonte monoespaçada (ex.: /users). */
export function Code({ children, className }: { children: ReactNode; className?: string }) {
  return <code className={cx(styles.code, className)}>{children}</code>;
}

/** Painel pequeno acima de um servidor (ex.: "Consultando dados"). `checked` = linhas já conferidas. */
export function WorkPanel({ at, title, rows, checked, icon = "magnifier" }: { at: ScenePoint; title: string; rows: string[]; checked: number; icon?: ElementKey }) {
  return (
    <Place x={at.x} y={at.y} anchor="bottom" z={5}>
      <div className={styles.panelFit}>
        <div className={cx(styles.panel, styles.pop)} role="group" aria-label={title}>
          <span className={styles.panelTitle}>
            <img src={ELEMENTS[icon]} alt="" draggable={false} />
            {title}
          </span>
          {rows.map((row, index) => (
            <span key={row} className={styles.panelRow}>
              {row}
              {index < checked && <img src={ELEMENTS.ok} alt="feito" draggable={false} className={styles.pop} />}
            </span>
          ))}
        </div>
      </div>
    </Place>
  );
}
