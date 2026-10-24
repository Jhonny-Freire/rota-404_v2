"use client";

import { Link, lerpPoint, useSequence, type ScenePoint, type SequenceStep } from "@/components/learning/kit";
import { DeviceNode, Hub, Letter, Live, ip, type ArtKind, type SceneProps } from "./parts";

const SENDER: ScenePoint = { x: 16, y: 43 };
const HOME: ScenePoint = { x: 29, y: 43 };
const HUB: ScenePoint = { x: 50, y: 43 };

type Destination = { kind: ArtKind; ip: string; at: ScenePoint };

const DESTINATIONS: Destination[] = [
  { kind: "computer", ip: ip(10), at: { x: 79, y: 14 } },
  { kind: "printer", ip: ip(20), at: { x: 79, y: 43 } },
  { kind: "tablet", ip: ip(30), at: { x: 79, y: 72 } },
];
const TARGET = 2;
const TARGET_IP = DESTINATIONS[TARGET].ip;
const LANDING = lerpPoint(HUB, DESTINATIONS[TARGET].at, 0.68);
const LEG_MS = 1000;

const LETTER = 1;
const ADDRESSED = 2;
const TO_HUB = 3;
const TO_DEVICE = 4;
const ARRIVED = 5;
/*
 * A pausa com o endereço na mensagem cobre "A mensagem recebe o endereço do destino." (~2,6 s) também com
 * movimento reduzido, quando a viagem vira 0 ms. A última pausa cobre a ideia central dita pelo Bonzi antes de
 * liberar "Próxima cena".
 */
const STEPS: SequenceStep[] = [400, 800, { hold: 2500 }, LEG_MS, LEG_MS + 60, { hold: 4400 }];

function liveText(step: number): string {
  if (step >= ARRIVED) return `A mensagem chegou ao tablet com o endereço ${TARGET_IP}.`;
  if (step >= ADDRESSED) return `A mensagem recebeu o endereço do destino: ${TARGET_IP}.`;
  if (step >= LETTER) return "O notebook tem uma mensagem para enviar.";
  return "";
}

/** Cena 4 — Destino: a mensagem recebe o endereço do destino e viaja até o dispositivo correspondente. */
export function SceneDestination({ say, setCanAdvance, reducedMotion }: SceneProps) {
  const { step } = useSequence(STEPS, {
    reducedMotion,
    onStep: (current) => {
      if (current === ADDRESSED) say("A mensagem recebe o endereço do destino.");
      if (current === ARRIVED) say("Um endereço ajuda a identificar para onde os dados devem ir.", "happy");
    },
    onDone: () => setCanAdvance(true),
  });
  const animate = !reducedMotion;
  const arrived = step >= ARRIVED;
  const letterAt = step >= TO_DEVICE ? LANDING : step >= TO_HUB ? HUB : HOME;

  return (
    <>
      <Link from={SENDER} to={HUB} state={step >= TO_HUB ? "active" : "idle"} />
      {DESTINATIONS.map((dest, index) => (
        <Link
          key={dest.ip}
          from={HUB}
          to={dest.at}
          state={index === TARGET && step >= TO_DEVICE ? "active" : arrived ? "off" : "idle"}
        />
      ))}
      <Hub at={HUB} active={step >= TO_HUB} />

      <DeviceNode kind="notebook" at={SENDER} scale={0.6} pop={animate} alt="Notebook que envia a mensagem" />
      {DESTINATIONS.map((dest, index) => (
        <DeviceNode
          key={dest.ip}
          kind={dest.kind}
          at={dest.at}
          scale={0.5}
          address={dest.ip}
          addressHighlighted={index === TARGET && step >= ADDRESSED && !arrived}
          pop={animate}
          highlighted={arrived && index === TARGET}
          correct={arrived && index === TARGET}
          dimmed={arrived && index !== TARGET}
        />
      ))}

      {step >= LETTER && (
        <Letter
          at={letterAt}
          size={6.5}
          moveMs={reducedMotion ? 0 : LEG_MS}
          hidden={arrived}
          address={step >= ADDRESSED ? TARGET_IP : null}
          pop={animate}
        />
      )}

      <Live text={liveText(step)} />
    </>
  );
}

export default SceneDestination;
