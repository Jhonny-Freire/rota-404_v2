"use client";

import { useEffect, useState } from "react";
import { useTimers } from "@/components/learning/kit";
import {
  DEVICES,
  DRAW_MS,
  NETWORK,
  SPOTS,
  linkedText,
  selectedText,
  type DeviceId,
  type Pair,
  type SceneProps,
} from "./devices";
import { Banner, DeviceNode, Live, NetLink } from "./NetworkParts";

type Props = SceneProps & { onLinked: (pair: Pair) => void };

/** Cena 2 — o aluno toca em dois aparelhos e surge a ligação entre eles. */
export function SceneFirstLink({ say, setCanAdvance, setHint, reducedMotion, onLinked }: Props) {
  const timers = useTimers({ reducedMotion });
  const [selected, setSelected] = useState<DeviceId | null>(null);
  const [link, setLink] = useState<Pair | null>(null);
  const [active, setActive] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    say("Toque em dois dispositivos para ligar um ao outro.");
  }, [say]);

  const tap = (id: DeviceId) => {
    if (link) return;
    if (selected === null) {
      setSelected(id);
      setStatus(selectedText(id));
      setHint(selectedText(id));
      return;
    }
    if (selected === id) {
      setSelected(null);
      setStatus("Seleção desfeita.");
      setHint(null);
      return;
    }
    const pair: Pair = [selected, id];
    setSelected(null);
    setLink(pair);
    onLinked(pair);
    setHint("Veja: surgiu uma ligação entre os dois!");
    timers.after(DRAW_MS, () => {
      setActive(true);
      setStatus(linkedText(pair));
      say("Agora eles estão conectados.", "happy");
      timers.after(1200, () => setCanAdvance(true), { hold: true });
    });
  };

  let banner = "Ligue dois aparelhos";
  if (active) banner = "Conectados!";
  else if (selected) banner = "Agora toque em outro aparelho";

  return (
    <>
      <Banner text={banner} tone={active ? "success" : "info"} icon={active ? "ok" : "cable"} reducedMotion={reducedMotion} />

      {link && (
        <NetLink from={SPOTS[link[0]]} to={SPOTS[link[1]]} state={active ? "active" : "idle"} draw={!reducedMotion} thickness={1} />
      )}

      {NETWORK.map((id, index) => {
        const inLink = link ? link.includes(id) : false;
        return (
          <DeviceNode
            key={id}
            id={id}
            at={SPOTS[id]}
            order={index}
            float={!reducedMotion}
            onClick={() => tap(id)}
            pressed={link ? undefined : selected === id}
            selected={selected === id}
            pulse={!link && selected !== id}
            highlighted={active && inLink}
            dimmed={link !== null && !inLink}
            alt={link ? DEVICES[id].label : `${DEVICES[id].label}: ligar`}
          />
        );
      })}

      <Live text={status} />
    </>
  );
}

export default SceneFirstLink;
