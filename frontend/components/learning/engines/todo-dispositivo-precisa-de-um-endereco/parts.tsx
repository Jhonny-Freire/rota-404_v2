"use client";

import type { CSSProperties } from "react";
import { BACKGROUNDS, ELEMENTS } from "@/config/assets";
import { Place, SceneSprite, Tag, type ElementKey, type KitTone, type ScenePoint } from "@/components/learning/kit";
import type { Say } from "@/components/learning/runtime";
import { cx } from "@/components/ui/cx";
import styles from "./TodoDispositivoPrecisaDeUmEndereco.module.css";

export type SceneProps = {
  say: Say;
  setCanAdvance: (ready: boolean) => void;
  /** instrução "O que fazer" do shell (null volta para a dica da cena) */
  setHint: (text: string | null) => void;
  reducedMotion: boolean;
};

export type ArtKind = "computer" | "notebook" | "tablet" | "cellphone" | "printer" | "house";

type Art = { element: ElementKey; label: string; w: number; h: number };

/** Sprites com o tamanho nativo (px) para ampliar todos na mesma escala de pixel. */
export const ART: Record<ArtKind, Art> = {
  computer: { element: "setup", label: "Computador", w: 19, h: 17 },
  notebook: { element: "notebook", label: "Notebook", w: 14, h: 11 },
  tablet: { element: "tablet", label: "Tablet", w: 15, h: 18 },
  cellphone: { element: "cellphone", label: "Celular", w: 9, h: 14 },
  printer: { element: "printer", label: "Impressora", w: 13, h: 11 },
  house: { element: "house", label: "Casa", w: 14, h: 13 },
};

export const ip = (last: number) => `192.168.0.${last}`;

/* Cenas 1 e 2: a mesma mensagem e os mesmos dois computadores. */
export const MESSAGE_AT: ScenePoint = { x: 50, y: 24 };
export const MESSAGE_SIZE = 8;
export const LEFT_PC: ScenePoint = { x: 25, y: 60 };
export const RIGHT_PC: ScenePoint = { x: 75, y: 60 };
export const PC_SCALE = 0.75;

/** 1 unidade do kit (1% da largura) em % da altura do canvas 16:9 */
const U_TO_Y = 16 / 9;
/** respiro do topo do .node em unidades do kit (o mesmo do CSS) */
const NODE_PAD = 1.1;

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

export type DeviceNodeProps = {
  kind: ArtKind;
  /** centro do sprite (a etiqueta fica logo abaixo) */
  at: ScenePoint;
  /** unidades do kit por pixel nativo */
  scale: number;
  /** etiqueta de endereço abaixo do sprite */
  address?: string;
  /** legenda curta acima da etiqueta */
  caption?: string;
  tone?: KitTone;
  /** anel amarelo piscando na etiqueta */
  addressHighlighted?: boolean;
  /** borda verde (destino indicado) */
  target?: boolean;
  alt?: string;
  highlighted?: boolean;
  dimmed?: boolean;
  correct?: boolean;
  wrong?: boolean;
  /** pisca (0 ou 1 = fase) */
  blink?: 0 | 1;
  pop?: boolean;
};

/** Dispositivo (ou casa) com a etiqueta de endereço embaixo. */
export function DeviceNode({
  kind,
  at,
  scale,
  address,
  caption,
  tone = "default",
  addressHighlighted = false,
  target = false,
  alt,
  highlighted = false,
  dimmed = false,
  correct = false,
  wrong = false,
  blink,
  pop = false,
}: DeviceNodeProps) {
  const art = ART[kind];
  const size = art.w * scale;
  const top = at.y - ((size * art.h) / art.w / 2 + NODE_PAD) * U_TO_Y;
  return (
    <Place x={at.x} y={top} anchor="top">
      <span
        className={cx(styles.node, pop && styles.pop, target && styles.target, dimmed && styles.dim, blink !== undefined && styles.blink)}
        style={blink ? ({ "--delay": "-0.45s" } as CSSProperties) : undefined}
      >
        <SceneSprite
          element={art.element}
          size={size}
          alt={alt ?? art.label}
          highlighted={highlighted}
          correct={correct}
          wrong={wrong}
        />
        {caption && <span className={styles.caption}>{caption}</span>}
        {address && (
          <span className={styles.tagIn}>
            <Tag tone={tone} highlighted={addressHighlighted} className={styles.ip}>
              {address}
            </Tag>
          </span>
        )}
        {target && <span className="sr-only">Indicado pela borda verde.</span>}
      </span>
    </Place>
  );
}

export type LetterProps = {
  at: ScenePoint;
  /** largura em unidades do kit */
  size?: number;
  /** duração do deslocamento até `at` (0 = salta) */
  moveMs?: number;
  hidden?: boolean;
  /** endereço de destino escrito na mensagem */
  address?: string | null;
  /** interrogação sobre a mensagem */
  question?: boolean;
  wrong?: boolean;
  /** balança sem saber para onde ir */
  sway?: boolean;
  pop?: boolean;
  alt?: string;
};

/** A mensagem (envelope) que viaja pela cena levando o endereço do destino. */
export function Letter({
  at,
  size = 7,
  moveMs = 0,
  hidden = false,
  address,
  question = false,
  wrong = false,
  sway = false,
  pop = false,
  alt = "Mensagem",
}: LetterProps) {
  return (
    <Place x={at.x} y={at.y} z={4} moveMs={moveMs} hidden={hidden}>
      <span className={cx(styles.wrap, pop && styles.pop)}>
        <span className={cx(styles.wrap, sway && styles.sway)}>
          <SceneSprite element="mail" size={size} wrong={wrong} alt={address ? `${alt} para ${address}` : alt}>
            {address ? (
              <Tag tone="warning" icon="pin" className={styles.address}>
                {address}
              </Tag>
            ) : question ? (
              <img src={ELEMENTS.question} alt="" draggable={false} className={styles.question} />
            ) : null}
          </SceneSprite>
        </span>
      </span>
    </Place>
  );
}

/** Ponto de encontro dos cabos da rede. */
export function Hub({ at, active = false }: { at: ScenePoint; active?: boolean }) {
  return (
    <Place x={at.x} y={at.y}>
      <span className={cx(styles.hub, active && styles.hubOn)} aria-hidden="true" />
    </Place>
  );
}
