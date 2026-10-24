"use client";

import type { CSSProperties } from "react";
import { BACKGROUNDS, ELEMENTS, SPRITES } from "@/config/assets";
import { Place, StageBanner, type ElementKey, type KitTone } from "@/components/learning/kit";
import { cx } from "@/components/ui/cx";
import { BANNER_Y, CARD_X, CONCEPTS, CONCEPT_ORDER, ROW_MOVE_MS, ROW_Y, type ConceptId, type RowLayout } from "./concepts";
import styles from "./IpDominioESite.module.css";

/** Classe de cor de cada conceito (IP ciano, Domínio amarelo, Página verde). */
export const TONE: Record<ConceptId, string> = {
  ip: styles.toneIp,
  domain: styles.toneDomain,
  page: styles.tonePage,
};

export function Starfield() {
  return <div className={styles.starfield} style={{ backgroundImage: `url(${BACKGROUNDS.starfieldFar})` }} aria-hidden="true" />;
}

export type BannerProps = {
  text: string;
  tone?: KitTone;
  icon?: ElementKey;
  reducedMotion: boolean;
};

/**
 * Faixa curta no alto do palco (StageBanner do kit): a pergunta ou o objetivo do momento ("Nas caixas: 1 de 3").
 * live={false}: a cena já anuncia pelo Bonzi, pelo <Live> e pela dica "O que fazer" do shell.
 */
export function Banner({ text, tone = "info", icon, reducedMotion }: BannerProps) {
  return <StageBanner text={text} tone={tone} icon={icon} reducedMotion={reducedMotion} y={BANNER_Y} live={false} />;
}

export function Live({ text }: { text: string }) {
  return (
    <p className="sr-only" role="status" aria-live="polite">
      {text}
    </p>
  );
}

export type ArrowProps = {
  /** largura em unidades do kit. Padrão 4.5 */
  size?: number;
  /** aponta para baixo */
  down?: boolean;
  /** apagada enquanto o fluxo não passou por ela */
  lit?: boolean;
};

/** Seta-SPRITE (SPRITES.ui.next). */
export function Arrow({ size = 4.5, down = false, lit = true }: ArrowProps) {
  return (
    <img
      src={SPRITES.ui.next}
      alt=""
      draggable={false}
      aria-hidden="true"
      className={cx(styles.arrow, down && styles.arrowDown, !lit && styles.arrowOff)}
      style={{ "--s": size } as CSSProperties}
    />
  );
}

export type CardLook = {
  /** mostra o sprite e o nome do conceito (IP, Domínio, Página) */
  revealed?: boolean;
  /** em destaque (maior, brilhando na cor do conceito) */
  focus?: boolean;
  dimmed?: boolean;
  /** entra caindo na cena */
  enter?: boolean;
  /** o "?" do cartão balança algumas vezes (não fica pulsando: o cartão não é tocável) */
  ask?: boolean;
};

export type ConceptCardProps = {
  id: ConceptId;
  look?: CardLook;
  /** versão menor (fileira no alto) */
  compact?: boolean;
};

/** Cartão pixel com um dos três textos da aula: "?" até ser revelado, depois o sprite e o nome do conceito. */
export function ConceptCard({ id, look = {}, compact = false }: ConceptCardProps) {
  const concept = CONCEPTS[id];
  const { revealed = false, focus = false, dimmed = false, enter = false, ask = false } = look;
  const native = revealed ? concept.native : 14;
  return (
    <span className={cx(styles.holder, enter && styles.enter)}>
      <span
        className={cx(
          styles.card,
          TONE[id],
          revealed && styles.revealed,
          focus && styles.focus,
          dimmed && styles.dimmed,
          compact && styles.compact,
        )}
        role="img"
        aria-label={revealed ? `${concept.name}: ${concept.value}` : `Cartão: ${concept.value}`}
      >
        {revealed && <span className={styles.ribbon}>{concept.name}</span>}
        <span className={styles.slot}>
          <img
            key={revealed ? "concept" : "question"}
            src={revealed ? ELEMENTS[concept.element] : ELEMENTS.question}
            alt=""
            draggable={false}
            className={cx(styles.slotImg, revealed && styles.popIn, ask && styles.bob)}
            style={{ "--s": native * 0.5 } as CSSProperties}
          />
        </span>
        <span className={cx(styles.value, concept.mono && styles.mono)}>{concept.value}</span>
      </span>
    </span>
  );
}

export type CardRowProps = {
  layout: RowLayout;
  /** aparência de cada cartão; `null` = ainda não apareceu */
  looks: Record<ConceptId, CardLook | null>;
};

/** Os três cartões lado a lado; mudar `layout` desliza a fileira (e encolhe os cartões). */
export function CardRow({ layout, looks }: CardRowProps) {
  return (
    <>
      {CONCEPT_ORDER.map((id) => {
        const look = looks[id];
        if (!look) return null;
        return (
          <Place key={id} x={CARD_X[id]} y={ROW_Y[layout]} moveMs={ROW_MOVE_MS} z={look.focus ? 3 : 2}>
            <ConceptCard id={id} look={look} compact={layout === "top"} />
          </Place>
        );
      })}
    </>
  );
}
