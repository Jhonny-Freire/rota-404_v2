"use client";

import type { CSSProperties, ReactNode } from "react";
import { BACKGROUNDS } from "@/config/assets";
import {
  Link,
  Place,
  SceneSprite,
  StageBanner,
  type ElementKey,
  type KitTone,
  type LinkState,
  type ScenePoint,
} from "@/components/learning/kit";
import { cx } from "@/components/ui/cx";
import { DEVICES, LABEL_SHIFT, PIXEL, type DeviceId } from "./devices";
import styles from "./OQueEUmaRede.module.css";

export function Starfield() {
  return <div className={styles.starfield} style={{ backgroundImage: `url(${BACKGROUNDS.starfieldFar})` }} aria-hidden="true" />;
}

export type BannerProps = {
  text: string;
  tone?: KitTone;
  icon?: ElementKey;
  reducedMotion: boolean;
};

/** Faixa curta no alto da cena: a pergunta ou o objetivo do momento ("Na rede: 2 de 4"). O <Live> da cena já anuncia. */
export function Banner({ text, tone = "info", icon, reducedMotion }: BannerProps) {
  return <StageBanner text={text} tone={tone} icon={icon} reducedMotion={reducedMotion} live={false} />;
}

export function Live({ text }: { text: string }) {
  return (
    <p className="sr-only" role="status" aria-live="polite">
      {text}
    </p>
  );
}

export type DeviceNodeProps = {
  id: DeviceId;
  at: ScenePoint;
  /** unidades do kit por pixel nativo */
  scale?: number;
  showLabel?: boolean;
  /** flutua devagar (desligado com movimento reduzido) */
  float?: boolean;
  /** índice para defasar a flutuação */
  order?: number;
  /** entra com um "pop" */
  pop?: boolean;
  alt?: string;
  onClick?: () => void;
  disabled?: boolean;
  pressed?: boolean;
  selected?: boolean;
  highlighted?: boolean;
  dimmed?: boolean;
  pulse?: boolean;
  correct?: boolean;
  children?: ReactNode;
};

/** Aparelho da cena: sprite ampliado na mesma escala de pixel, com legenda e estados. */
export function DeviceNode({
  id,
  at,
  scale = PIXEL,
  showLabel = true,
  float = false,
  order = 0,
  pop = false,
  ...sprite
}: DeviceNodeProps) {
  const device = DEVICES[id];
  return (
    <Place x={at.x} y={at.y + (showLabel ? LABEL_SHIFT : 0)}>
      <span
        className={cx(styles.node, float && styles.float, pop && styles.pop)}
        style={{ "--delay": `${order * -0.8}s` } as CSSProperties}
      >
        <SceneSprite element={device.element} label={showLabel ? device.label : undefined} size={device.native * scale} {...sprite} />
      </span>
    </Place>
  );
}

export type NetLinkProps = {
  from: ScenePoint;
  to: ScenePoint;
  state?: LinkState;
  /** anima a linha surgindo de `from` até `to` */
  draw?: boolean;
  reverse?: boolean;
  thickness?: number;
};

/** Ligação entre aparelhos (Link do kit) que pode surgir desenhada. */
export function NetLink({ from, to, state = "active", draw = false, reverse = false, thickness = 0.9 }: NetLinkProps) {
  return (
    <Link
      from={from}
      to={to}
      state={state}
      reverse={reverse}
      thickness={thickness}
      dots={3}
      speedMs={1300}
      className={draw ? styles.draw : undefined}
    />
  );
}

/** Fio curto em CSS com pontos de informação correndo (para os exemplos do microteste). */
export function Wire({ active, moving, width = 7 }: { active: boolean; moving: boolean; width?: number }) {
  return (
    <span className={cx(styles.wire, !active && styles.wireIdle)} style={{ "--w": width } as CSSProperties} aria-hidden="true">
      {active &&
        [0, 1, 2].map((i) => (
          <span
            key={i}
            className={cx(styles.wireTrack, !moving && styles.wireStill)}
            style={{ "--i": i, "--pos": (i + 0.5) / 3 } as CSSProperties}
          />
        ))}
    </span>
  );
}
