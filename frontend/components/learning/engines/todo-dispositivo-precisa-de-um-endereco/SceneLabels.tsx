"use client";

import { Link, lerpPoint, useSequence, type SequenceStep } from "@/components/learning/kit";
import { DeviceNode, LEFT_PC, Letter, Live, MESSAGE_AT, MESSAGE_SIZE, PC_SCALE, RIGHT_PC, ip, type SceneProps } from "./parts";

const IP_LEFT = ip(10);
const IP_RIGHT = ip(20);
const FLY_MS = 1500;
const LANDING = lerpPoint(MESSAGE_AT, RIGHT_PC, 0.78);

const TAG_LEFT = 1;
const TAG_RIGHT = 2;
const ADDRESSED = 3;
const FLYING = 4;
const ARRIVED = 5;
/*
 * Pausas de leitura são { hold } (não somem com movimento reduzido, quando os números viram 0 ms): a fala
 * "Agora cada computador tem um endereço." tem ~2,8 s até a chegada. A última pausa cobre a fala da chegada
 * antes de liberar "Próxima cena".
 */
const STEPS: SequenceStep[] = [500, 600, { hold: 1300 }, { hold: 1500 }, FLY_MS + 60, { hold: 3400 }];

function liveText(step: number): string {
  if (step >= ARRIVED) return `A mensagem chegou ao computador ${IP_RIGHT}.`;
  if (step >= ADDRESSED) return `A mensagem recebeu o endereço ${IP_RIGHT}.`;
  if (step >= TAG_RIGHT) return `Os computadores receberam as etiquetas ${IP_LEFT} e ${IP_RIGHT}.`;
  return "";
}

/** Cena 2 — cada computador recebe uma etiqueta; a mensagem agora chega ao computador correto. */
export function SceneLabels({ say, setCanAdvance, reducedMotion }: SceneProps) {
  const { step } = useSequence(STEPS, {
    reducedMotion,
    onStep: (current) => {
      if (current === TAG_RIGHT) say("Agora cada computador tem um endereço.");
      if (current === ARRIVED) say("A mensagem agora chega ao computador correto.", "happy");
    },
    onDone: () => setCanAdvance(true),
  });
  const flying = step >= FLYING;
  const arrived = step >= ARRIVED;

  return (
    <>
      <Link from={MESSAGE_AT} to={LEFT_PC} state={flying ? "off" : "idle"} />
      <Link from={MESSAGE_AT} to={RIGHT_PC} state={flying ? "active" : "idle"} />

      <DeviceNode
        kind="computer"
        at={LEFT_PC}
        scale={PC_SCALE}
        address={step >= TAG_LEFT ? IP_LEFT : undefined}
        dimmed={arrived}
        alt="Computador"
      />
      <DeviceNode
        kind="computer"
        at={RIGHT_PC}
        scale={PC_SCALE}
        address={step >= TAG_RIGHT ? IP_RIGHT : undefined}
        addressHighlighted={step >= ADDRESSED && !arrived}
        highlighted={arrived}
        correct={arrived}
        alt="Computador"
      />

      <Letter
        at={flying ? LANDING : MESSAGE_AT}
        size={MESSAGE_SIZE}
        moveMs={reducedMotion ? 0 : FLY_MS}
        hidden={arrived}
        address={step >= ADDRESSED ? IP_RIGHT : null}
      />

      <Live text={liveText(step)} />
    </>
  );
}

export default SceneLabels;
