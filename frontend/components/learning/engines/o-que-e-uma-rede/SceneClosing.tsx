"use client";

import { Packet, Place, Tag, useSequence, type ScenePoint } from "@/components/learning/kit";
import { DRAW_MS, type DeviceId, type SceneProps } from "./devices";
import { DeviceNode, Live, NetLink } from "./NetworkParts";
import styles from "./OQueEUmaRede.module.css";

const SCALE = 0.85;

const AT = {
  computer: { x: 50, y: 25 },
  cellphone: { x: 25, y: 70 },
  tablet: { x: 75, y: 70 },
} satisfies Partial<Record<DeviceId, ScenePoint>>;

type NodeId = keyof typeof AT;

const NODES: NodeId[] = ["computer", "cellphone", "tablet"];

const TRIANGLE: [NodeId, NodeId][] = [
  ["computer", "cellphone"],
  ["cellphone", "tablet"],
  ["tablet", "computer"],
];

const LOOP: ScenePoint[] = [AT.computer, AT.cellphone, AT.tablet, AT.computer];
const LOOP_BACK: ScenePoint[] = [...LOOP].reverse();

/** Encerramento — uma rede simples de três aparelhos ligados. */
export function SceneClosing({ say, setCanAdvance, reducedMotion }: SceneProps) {
  const { step } = useSequence([500, DRAW_MS, DRAW_MS, DRAW_MS, 300, { hold: 1600 }], {
    reducedMotion,
    onStep: (current) => {
      if (current === 5) say("Uma rede são dispositivos conectados.", "happy");
    },
    onDone: () => setCanAdvance(true),
  });
  const formed = step >= 5;

  return (
    <>
      {TRIANGLE.map(([a, b], index) =>
        step >= index + 2 ? (
          <NetLink
            key={`${a}-${b}`}
            from={AT[a]}
            to={AT[b]}
            state={formed ? "active" : "idle"}
            draw={!reducedMotion}
            thickness={1.1}
          />
        ) : null,
      )}

      {formed && !reducedMotion && (
        <>
          <Packet path={LOOP} element="mail" size={4} durationMs={4200} loop loopPauseMs={300} />
          <Packet path={LOOP_BACK} element="photo" size={4} durationMs={4200} loop loopPauseMs={300} />
        </>
      )}

      {formed && (
        <Place x={50} y={56} z={4}>
          <span className={reducedMotion ? styles.node : styles.pop}>
            <Tag size="lg" tone="info" icon="internet">
              Rede
            </Tag>
          </span>
        </Place>
      )}

      {step >= 1 &&
        NODES.map((id, index) => (
          <DeviceNode key={id} id={id} at={AT[id]} scale={SCALE} order={index} pop={!reducedMotion} highlighted={formed} />
        ))}

      <Live text={formed ? "Computador, celular e tablet conectados formam uma rede." : ""} />
    </>
  );
}

export default SceneClosing;
