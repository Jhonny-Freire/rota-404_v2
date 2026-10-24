"use client";

import { useEffect, useState } from "react";
import { Packet, Place, SceneSprite, lerpPoint, useSequence, useTimers } from "@/components/learning/kit";
import { CENTER, DEVICES, NETWORK, SPOTS, type DeviceId, type SceneProps } from "./devices";
import { Banner, DeviceNode, Live } from "./NetworkParts";
import styles from "./OQueEUmaRede.module.css";

const TRAVEL_MS = 1300;

const stopPoint = (id: DeviceId) => lerpPoint(SPOTS[id], CENTER, 0.45);

/** Cena 1 — aparelhos separados; a mensagem de cada um para no espaço. */
export function SceneIntro({ say, setCanAdvance, setHint, reducedMotion }: SceneProps) {
  const timers = useTimers({ reducedMotion });
  const [sent, setSent] = useState<Partial<Record<DeviceId, number>>>({});
  const [stuck, setStuck] = useState<DeviceId[]>([]);
  const [stopped, setStopped] = useState(false);
  const [status, setStatus] = useState("");
  const { step } = useSequence([{ hold: 900 }], { reducedMotion });
  const anySent = Object.keys(sent).length > 0;

  useEffect(() => {
    say("Eles estão conversando?", "thinking");
  }, [say]);

  useEffect(() => {
    if (!stopped) return;
    say("A mensagem parou no espaço. Sem conexão, ninguém recebe!", "thinking");
    setHint("A mensagem parou no meio do caminho: ninguém recebeu.");
    timers.after(1400, () => setCanAdvance(true), { hold: true });
  }, [stopped, say, setCanAdvance, setHint, timers]);

  const send = (id: DeviceId) => {
    setSent((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
    setStuck((prev) => prev.filter((d) => d !== id));
    setStatus(`${DEVICES[id].label} enviou uma mensagem.`);
  };

  const stop = (id: DeviceId) => {
    setStuck((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setStatus("A mensagem parou no espaço. Ninguém recebeu.");
    setStopped(true);
  };

  return (
    <>
      {stopped ? (
        <Banner text="A mensagem não chegou!" tone="danger" icon="question" reducedMotion={reducedMotion} />
      ) : (
        <Banner text="Eles estão conversando?" tone="warning" icon="question" reducedMotion={reducedMotion} />
      )}

      {NETWORK.map((id) => {
        const count = sent[id];
        if (!count) return null;
        return (
          <Packet
            key={`${id}-${count}`}
            path={[SPOTS[id], stopPoint(id)]}
            element="mail"
            size={4.4}
            durationMs={TRAVEL_MS}
            blocked
            onArrive={() => stop(id)}
            alt="Mensagem"
          />
        );
      })}

      {stuck.map((id) => {
        const at = stopPoint(id);
        return (
          <Place key={`stuck-${id}`} x={at.x} y={at.y - 8.5} z={4}>
            <span className={reducedMotion ? styles.node : styles.pop}>
              <SceneSprite element="question" size={3.4} className={reducedMotion ? undefined : styles.blink} />
            </span>
          </Place>
        );
      })}

      {NETWORK.map((id, index) => (
        <DeviceNode
          key={id}
          id={id}
          at={SPOTS[id]}
          order={index}
          float={!reducedMotion}
          pulse={step >= 1 && !anySent}
          onClick={() => send(id)}
          alt={`${DEVICES[id].label}: enviar mensagem`}
        />
      ))}

      <Live text={status} />
    </>
  );
}

export default SceneIntro;
