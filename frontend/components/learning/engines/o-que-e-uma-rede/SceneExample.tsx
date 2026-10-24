"use client";

import { useEffect, useState } from "react";
import { SPRITES } from "@/config/assets";
import { Packet, Place, SceneSprite, Tag, useSequence, useTimers, type ScenePoint } from "@/components/learning/kit";
import type { SceneProps } from "./devices";
import { DeviceNode, Live, NetLink } from "./NetworkParts";
import styles from "./OQueEUmaRede.module.css";

const PHONE: ScenePoint = { x: 20, y: 60 };
const COMPUTER: ScenePoint = { x: 79, y: 60 };
const SCALE = 1.1;
const TRAVEL_MS = 2600;

/** Cena 4 — Celular → Computador: a foto atravessa a ligação. */
export function SceneExample({ say, setCanAdvance, reducedMotion }: SceneProps) {
  const timers = useTimers({ reducedMotion });
  const [round, setRound] = useState(0);
  const [arrived, setArrived] = useState(false);
  const [explained, setExplained] = useState(false);
  const { step } = useSequence([{ hold: 1000 }, 700], { reducedMotion });
  const ready = step >= 1;
  const sending = step >= 2;

  useEffect(() => {
    say("O celular envia uma foto.");
  }, [say]);

  const arrive = () => {
    setArrived(true);
    if (explained) return;
    setExplained(true);
    say("Uma rede permite trocar informações.", "happy");
    timers.after(1400, () => setCanAdvance(true), { hold: true });
  };

  const resend = () => {
    if (!arrived) return;
    setArrived(false);
    setRound((r) => r + 1);
  };

  return (
    <>
      <Place x={50} y={15}>
        <div className={styles.route} aria-label="Celular para Computador" role="img">
          <Tag size="lg" tone="info">
            Celular
          </Tag>
          <img src={SPRITES.ui.next} alt="" draggable={false} className={styles.routeArrow} />
          <Tag size="lg" tone="info">
            Computador
          </Tag>
        </div>
      </Place>

      <NetLink from={PHONE} to={COMPUTER} state={ready ? "active" : "idle"} thickness={1.2} />

      {ready && !sending && (
        <Place x={PHONE.x} y={PHONE.y} z={3}>
          <span className={reducedMotion ? styles.node : styles.pop}>
            <SceneSprite element="photo" size={6.5} />
          </span>
        </Place>
      )}

      {sending && (
        <Packet
          key={round}
          path={[PHONE, COMPUTER]}
          element="photo"
          size={6.5}
          durationMs={TRAVEL_MS}
          hideOnArrive
          onArrive={arrive}
          alt="Foto"
        />
      )}

      {arrived && (
        <Place x={COMPUTER.x} y={COMPUTER.y - 25} z={4}>
          <span className={reducedMotion ? styles.node : styles.pop}>
            <SceneSprite element="photo" size={8} correct alt="Foto recebida" />
          </span>
        </Place>
      )}

      <DeviceNode
        id="cellphone"
        at={PHONE}
        scale={SCALE}
        float={!reducedMotion}
        onClick={resend}
        alt={arrived ? "Celular: enviar a foto de novo" : "Celular"}
      />
      <DeviceNode id="computer" at={COMPUTER} scale={SCALE} float={!reducedMotion} order={1} highlighted={arrived} />

      <Live text={arrived ? "A foto chegou ao computador." : sending ? "O celular está enviando a foto." : ""} />
    </>
  );
}

export default SceneExample;
