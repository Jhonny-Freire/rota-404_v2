"use client";

import { useId, type KeyboardEventHandler, type PointerEventHandler } from "react";
import { ELEMENTS, SPRITES } from "@/config/assets";
import { cx } from "@/components/ui/cx";
import type { Phase, Round } from "./model";
import styles from "./EncontrandoODestino.module.css";

type CardStatus = "queued" | "current" | "done";

/** Ícones pequenos do painel em fator inteiro da arte nativa (pino 11 px, lupa 13 px, servidor 12 px: ×2). */
const PIN = <img src={ELEMENTS.pin} alt="" draggable={false} className={styles.subPin} />;
const MAGNIFIER = <img src={ELEMENTS.magnifier} alt="" draggable={false} className={styles.subMagnifier} />;
const SERVER = <img src={ELEMENTS.server} alt="" draggable={false} className={styles.subServer} />;

type DomainCardProps = {
  round: Round;
  status: CardStatus;
  phase: Phase;
  onDomain: () => void;
};

function DomainCard({ round, status, phase, onDomain }: DomainCardProps) {
  const { domain, server } = round;
  const icon = (
    <span className={styles.cardArt}>
      <img
        src={ELEMENTS[domain.element]}
        alt=""
        draggable={false}
        className={styles.cardIcon}
        style={{ width: domain.w * 3 }}
      />
    </span>
  );
  const name = <span className={styles.cardName}>{domain.name}</span>;

  if (status === "current") {
    const waiting = phase === "arriving" || phase === "waiting";
    let sub;
    let label;
    if (waiting) {
      sub = <span className={styles.cardSub}>Toque para ver o endereço</span>;
      label = `${domain.name}: toque para ver o endereço`;
    } else if (phase === "lookup") {
      sub = (
        <span className={styles.cardSub}>
          {MAGNIFIER}
          Procurando o endereço
        </span>
      );
      label = `${domain.name}: procurando o endereço`;
    } else {
      sub = (
        <span className={cx(styles.cardSub, styles.subFind)}>
          {PIN}
          {server.ip}
        </span>
      );
      label = `${domain.name}: endereço ${server.ip}. Encontre este servidor no mapa.`;
    }
    return (
      <button
        type="button"
        className={cx(styles.card, styles.cardCurrent, waiting && styles.cardPulse)}
        onClick={onDomain}
        aria-label={label}
      >
        {icon}
        <span className={styles.cardText}>
          {name}
          {sub}
        </span>
      </button>
    );
  }

  if (status === "done") {
    return (
      <div className={cx(styles.card, styles.cardDone)}>
        {icon}
        <span className={styles.cardText}>
          {name}
          <span className={cx(styles.cardSub, styles.subOk)}>
            <span className="sr-only">endereço </span>
            {PIN}
            <span>{server.ip}</span>
            <img src={SPRITES.ui.next} alt="" draggable={false} className={styles.subArrow} />
            <span className="sr-only">no </span>
            {SERVER}
            <span>{server.name}</span>
          </span>
        </span>
        <img src={ELEMENTS.ok} alt="Conectado" draggable={false} className={styles.cardMark} />
      </div>
    );
  }

  return (
    <div className={cx(styles.card, styles.cardQueued)}>
      {icon}
      <span className={styles.cardText}>
        {name}
        <span className={styles.cardSub}>Na fila</span>
      </span>
    </div>
  );
}

export type DomainPanelProps = {
  rounds: Round[];
  round: number;
  phase: Phase;
  reducedMotion: boolean;
  onDomain: () => void;
  onKeyDown: KeyboardEventHandler<HTMLDivElement>;
  onPointerDown: PointerEventHandler<HTMLDivElement>;
};

/** Painel lateral (lab2-3.md, "Tela"): os domínios fictícios da partida, na ordem em que chegam. */
export function DomainPanel({ rounds, round, phase, reducedMotion, onDomain, onKeyDown, onPointerDown }: DomainPanelProps) {
  const titleId = useId();
  const linked = phase === "connected" || phase === "done";

  return (
    <div className={cx(styles.panel, reducedMotion && styles.reduced)} onKeyDown={onKeyDown} onPointerDown={onPointerDown}>
      <h3 id={titleId} className={styles.panelTitle}>
        Domínios
      </h3>
      <ol className={styles.domainList} aria-labelledby={titleId}>
        {rounds.map((r, i) => {
          let status: CardStatus = "queued";
          if (i < round || (i === round && linked)) status = "done";
          else if (i === round) status = "current";
          return (
            <li key={r.domain.id}>
              <DomainCard round={r} status={status} phase={phase} onDomain={onDomain} />
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export default DomainPanel;
