"use client";

import { Place, SceneSprite, lerpPoint, useSequence, type ScenePoint, type SequenceStep } from "@/components/learning/kit";
import { DeviceNode, Letter, Live, ip, type SceneProps } from "./parts";
import styles from "./TodoDispositivoPrecisaDeUmEndereco.module.css";

const LINE = "É como um endereço para encontrar o destino.";

const STREET = "Rua Cometa, 42";
const PC_IP = ip(20);
const HOUSE_AT: ScenePoint = { x: 25, y: 42 };
const PC_AT: ScenePoint = { x: 75, y: 42 };
const PIN_Y = 23;
const START: ScenePoint = { x: 50, y: 9 };
const HOUSE_LANDING = lerpPoint(START, HOUSE_AT, 0.9);
const PC_LANDING = lerpPoint(START, PC_AT, 0.9);
const FLY_MS = 1300;

const LEFT_PLATE = 1;
const COMPUTER = 2;
const RIGHT_PLATE = 3;
const PINS = 4;
const LETTERS = 5;
const MOVING = 6;
const ARRIVED = 7;
/* com movimento reduzido sobram só os { hold }: 1300 + 2000 cobrem a fala do Bonzi (~2,9 s) antes de liberar */
const STEPS: SequenceStep[] = [500, 600, 500, 500, { hold: 1300 }, 450, FLY_MS + 60, { hold: 2000 }];

function liveText(step: number): string {
  if (step >= ARRIVED) return "A carta chegou à casa e a mensagem chegou ao computador.";
  if (step >= RIGHT_PLATE) return `Casa com o endereço ${STREET}. Computador com o endereço IP ${PC_IP}.`;
  if (step >= LEFT_PLATE) return `Casa com o endereço ${STREET}.`;
  return "";
}

function Pin({ x, animate }: { x: number; animate: boolean }) {
  return (
    <Place x={x} y={PIN_Y} z={3}>
      <span className={animate ? styles.pin : styles.wrap}>
        <SceneSprite element="pin" size={5} alt="Destino" />
      </span>
    </Place>
  );
}

/** Cena 3 — Comparação: a casa tem um endereço; o dispositivo tem um endereço IP. */
export function SceneCompare({ say, setCanAdvance, reducedMotion }: SceneProps) {
  const { step } = useSequence(STEPS, {
    reducedMotion,
    onStep: (current) => {
      if (current === PINS) say(LINE);
    },
    onDone: () => setCanAdvance(true),
  });
  const animate = !reducedMotion;
  const moving = step >= MOVING;
  const arrived = step >= ARRIVED;

  return (
    <>
      <span className={styles.divider} aria-hidden="true" />

      <DeviceNode
        kind="house"
        at={HOUSE_AT}
        scale={15 / 14}
        caption={step >= LEFT_PLATE ? "Endereço" : undefined}
        address={step >= LEFT_PLATE ? STREET : undefined}
        tone="warning"
        pop={animate}
        highlighted={arrived}
        correct={arrived}
      />
      {step >= COMPUTER && (
        <DeviceNode
          kind="computer"
          at={PC_AT}
          scale={16 / 19}
          caption={step >= RIGHT_PLATE ? "Endereço IP" : undefined}
          address={step >= RIGHT_PLATE ? PC_IP : undefined}
          tone="info"
          pop={animate}
          highlighted={arrived}
          correct={arrived}
        />
      )}

      {step >= PINS && (
        <>
          <Pin x={HOUSE_AT.x} animate={animate} />
          <Pin x={PC_AT.x} animate={animate} />
        </>
      )}

      {step >= LETTERS && (
        <>
          <Letter
            at={moving ? HOUSE_LANDING : START}
            size={6}
            moveMs={reducedMotion ? 0 : FLY_MS}
            hidden={arrived}
            pop={animate}
            alt="Carta"
          />
          <Letter
            at={moving ? PC_LANDING : START}
            size={6}
            moveMs={reducedMotion ? 0 : FLY_MS}
            hidden={arrived}
            pop={animate}
            alt="Mensagem"
          />
        </>
      )}

      <Live text={liveText(step)} />
    </>
  );
}

export default SceneCompare;
