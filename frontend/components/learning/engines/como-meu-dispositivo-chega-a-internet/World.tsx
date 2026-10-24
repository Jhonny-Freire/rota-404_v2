"use client";

import { Fragment, type CSSProperties, type ReactNode } from "react";
import { ELEMENTS, SPRITES } from "@/config/assets";
import { cx } from "@/components/ui/cx";
import { Link, Place, SceneSprite, Tag, type LinkState } from "@/components/learning/kit";
import { CABLE, PARTS, PATH_LABEL, WORLD, WORLD_SIZE, type Part, type PartId } from "./parts";
import styles from "./ComoMeuDispositivoChegaAInternet.module.css";

const NO_POINTER: CSSProperties = { pointerEvents: "none" };

export type WavesProps = {
  x: number;
  y: number;
  /** diâmetro do maior anel em unidades do kit */
  diameter: number;
  reducedMotion: boolean;
};

/** Ondas do Wi-Fi: anéis que se expandem a partir do símbolo (estáticos com movimento reduzido). */
export function Waves({ x, y, diameter, reducedMotion }: WavesProps) {
  return (
    <Place x={x} y={y} z={1} style={NO_POINTER}>
      <span
        className={cx(styles.waves, reducedMotion && styles.wavesStill)}
        style={{ "--d": diameter } as CSSProperties}
        aria-hidden="true"
      >
        <span className={styles.ring} />
        <span className={styles.ring} />
        <span className={styles.ring} />
      </span>
    </Place>
  );
}

export type PartLook = {
  hidden?: boolean;
  highlighted?: boolean;
  dimmed?: boolean;
  pulse?: boolean;
  /** brilho suave piscando (chamar atenção sem mudar o tamanho) */
  beckon?: boolean;
  correct?: boolean;
  /** entra com um "pop" ao aparecer */
  pop?: boolean;
  onClick?: () => void;
  pressed?: boolean;
};

function WorldPart({ part, look }: { part: Part; look: PartLook }) {
  if (look.hidden) return null;
  const isCloud = part.id === "internet";
  return (
    <Place x={WORLD[part.id].x} y={WORLD[part.id].y}>
      <span className={cx(styles.holder, look.pop && styles.pop, look.beckon && styles.beckon)}>
        <SceneSprite
          element={part.element}
          size={WORLD_SIZE[part.id]}
          label={isCloud ? undefined : part.label}
          alt={part.label}
          highlighted={look.highlighted}
          dimmed={look.dimmed}
          pulse={look.pulse}
          correct={look.correct}
          onClick={look.onClick}
          pressed={look.onClick ? Boolean(look.pressed) : undefined}
        />
      </span>
    </Place>
  );
}

export type WorldProps = {
  looks?: Partial<Record<PartId, PartLook>>;
  /** ondas em volta do Wi-Fi */
  waves?: boolean;
  /** ligação Roteador → Internet ("none" = sem ligação) */
  cable?: LinkState | "none";
  reducedMotion: boolean;
  children?: ReactNode;
};

/** Mundo comum das cenas 4, 5 e 7: celular, Wi-Fi, roteador e a nuvem da Internet com o site dentro. */
export function World({ looks = {}, waves = false, cable = "idle", reducedMotion, children }: WorldProps) {
  const cloud = looks.internet ?? {};
  return (
    <>
      {cable !== "none" && !cloud.hidden && <Link from={CABLE.from} to={CABLE.to} state={cable} thickness={0.9} />}
      {waves && <Waves x={WORLD.wifi.x} y={WORLD.wifi.y} diameter={34} reducedMotion={reducedMotion} />}
      {PARTS.map((part) => (
        <WorldPart key={part.id} part={part} look={looks[part.id] ?? {}} />
      ))}
      {!cloud.hidden && (
        <Place x={WORLD.internet.x} y={67} style={cloud.onClick ? undefined : NO_POINTER}>
          {/* atalho de toque/mouse para a nuvem; o botão acessível é o próprio sprite da Internet */}
          <span
            className={cx(styles.holder, cloud.pop && styles.pop, cloud.onClick && styles.tapTarget)}
            onClick={cloud.onClick}
            aria-hidden={cloud.onClick ? true : undefined}
          >
            <Tag tone={cloud.highlighted ? "warning" : "info"} icon="internet">
              Internet
            </Tag>
          </span>
        </Place>
      )}
      {children}
    </>
  );
}

export type StripState = "hidden" | "dim" | "lit" | "current";

const STRIP_CLASS: Record<StripState, string | undefined> = {
  hidden: styles.stripHidden,
  dim: styles.stripDim,
  lit: styles.stripLit,
  current: styles.stripCurrent,
};

/** Faixa "Celular → Wi-Fi → Roteador → Internet → Site" com setas-sprite. */
export function RouteStrip({ states, y = 86 }: { states: StripState[]; y?: number }) {
  return (
    <Place x={50} y={y} width={96} style={NO_POINTER}>
      <ol className={styles.strip} aria-label={PATH_LABEL}>
        {PARTS.map((part, index) => {
          const state = states[index] ?? "lit";
          const next = states[index + 1] ?? "lit";
          const arrowHidden = state === "hidden" || next === "hidden";
          const arrowLit = (state === "lit" || state === "current") && (next === "lit" || next === "current");
          return (
            <Fragment key={part.id}>
              <li className={cx(styles.stripItem, STRIP_CLASS[state])} aria-hidden={state === "hidden" || undefined}>
                <img src={ELEMENTS[part.element]} alt="" draggable={false} className={styles.stripIcon} />
                <span>{part.label}</span>
              </li>
              {index < PARTS.length - 1 && (
                <li
                  className={cx(styles.stripArrow, arrowHidden && styles.stripHidden, !arrowHidden && !arrowLit && styles.stripArrowDim)}
                  aria-hidden="true"
                >
                  <img src={SPRITES.ui.next} alt="" draggable={false} />
                </li>
              )}
            </Fragment>
          );
        })}
      </ol>
    </Place>
  );
}
