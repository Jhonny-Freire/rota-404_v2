"use client";

import { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Packet, useTimers } from "@/components/learning/kit";
import {
  DEFAULT_LINK,
  DEVICES,
  DRAW_MS,
  NETWORK,
  SPOTS,
  linkedText,
  missingText,
  neighbors,
  pairKey,
  reachable,
  samePair,
  selectedText,
  type DeviceId,
  type Pair,
  type SceneProps,
} from "./devices";
import { Banner, DeviceNode, Live, NetLink } from "./NetworkParts";

const FLIGHT_MS = 1100;
const CYCLE_MS = 2600;

type Flight = { id: number; from: DeviceId; to: DeviceId; reply: boolean };

type Props = SceneProps & { initial: Pair | null };

type TrafficHandle = { fly: (from: DeviceId, to: DeviceId, reply?: boolean) => void };

type TrafficProps = {
  links: Pair[];
  /** todos na rede: começa o ciclo em que cada aparelho, um de cada vez, inicia a conversa */
  complete: boolean;
  reducedMotion: boolean;
  /** aparelho que começa a conversa da vez (destacado pela cena) */
  onStarter: (id: DeviceId) => void;
};

/**
 * Os pacotes em voo moram aqui: cada chegada re-renderiza só esta lista, não a cena inteira
 * (aparelhos, ligações e faixa). A cena só muda quando troca o aparelho que começa (1 vez por ciclo).
 */
const Traffic = memo(
  forwardRef<TrafficHandle, TrafficProps>(function Traffic({ links, complete, reducedMotion, onStarter }, ref) {
    const [flights, setFlights] = useState<Flight[]>([]);
    const flightId = useRef(0);
    const linksRef = useRef(links);

    useEffect(() => {
      linksRef.current = links;
    });

    const fly = useCallback((from: DeviceId, to: DeviceId, reply = false) => {
      flightId.current += 1;
      const id = flightId.current;
      setFlights((prev) => [...prev, { id, from, to, reply }]);
    }, []);

    useImperativeHandle(ref, () => ({ fly }), [fly]);

    const land = (flight: Flight) => {
      setFlights((prev) => prev.filter((f) => f.id !== flight.id));
      if (flight.reply) fly(flight.to, flight.from);
    };

    useEffect(() => {
      if (!complete) return;
      let index = 0;
      let timer: ReturnType<typeof setTimeout> | undefined;
      const tick = () => {
        const id = NETWORK[index % NETWORK.length];
        index += 1;
        onStarter(id);
        neighbors(id, linksRef.current).forEach((other) => fly(id, other));
        timer = setTimeout(tick, CYCLE_MS);
      };
      timer = setTimeout(tick, reducedMotion ? 300 : DRAW_MS + 300);
      return () => clearTimeout(timer);
    }, [complete, fly, reducedMotion, onStarter]);

    return (
      <>
        {flights.map((flight) => (
          <Packet
            key={flight.id}
            path={[SPOTS[flight.from], SPOTS[flight.to]]}
            element="mail"
            size={3.8}
            durationMs={FLIGHT_MS}
            onArrive={() => land(flight)}
          />
        ))}
      </>
    );
  }),
);

/**
 * Cena 3 — o aluno liga mais aparelhos; os dados circulam pelas ligações.
 * Com todos na mesma rede, cada aparelho, um de cada vez, começa a conversa.
 */
export function SceneManyLinks({ say, setCanAdvance, setHint, reducedMotion, initial }: Props) {
  const timers = useTimers({ reducedMotion });
  const [start] = useState<Pair>(() => initial ?? DEFAULT_LINK);
  const [links, setLinks] = useState<Pair[]>(() => [start]);
  const [drawing, setDrawing] = useState<string[]>([]);
  const [selected, setSelected] = useState<DeviceId | null>(null);
  const [complete, setComplete] = useState(false);
  const [starter, setStarter] = useState<DeviceId | null>(null);
  const [status, setStatus] = useState("");
  const trafficRef = useRef<TrafficHandle>(null);
  const network = reachable(start[0], links);
  const missing = NETWORK.length - network.size;

  useEffect(() => {
    say("Conecte os outros dispositivos à rede.");
    setHint(missingText(NETWORK.length - reachable(start[0], [start]).size));
  }, [say, setHint, start]);

  const tap = (id: DeviceId) => {
    if (selected === null) {
      setSelected(id);
      setStatus(selectedText(id));
      if (!complete) setHint(selectedText(id));
      return;
    }
    if (selected === id) {
      setSelected(null);
      setStatus("Seleção desfeita.");
      if (!complete) setHint(missingText(missing));
      return;
    }
    const pair: Pair = [selected, id];
    setSelected(null);
    if (links.some((l) => samePair(l, pair))) {
      setStatus("Esses dois já estão conectados.");
      if (!complete) setHint(`Esses dois já estão ligados. ${missingText(missing)}`);
      return;
    }
    const next = [...links, pair];
    const key = pairKey(pair);
    const nextMissing = NETWORK.length - reachable(start[0], next).size;
    setLinks(next);
    setDrawing((prev) => [...prev, key]);
    setStatus(linkedText(pair));
    timers.after(DRAW_MS, () => {
      setDrawing((prev) => prev.filter((k) => k !== key));
      trafficRef.current?.fly(pair[0], pair[1], true);
    });
    if (complete) return;
    if (nextMissing > 0) {
      setHint(missingText(nextMissing));
      return;
    }
    setComplete(true);
    setHint("Todos os aparelhos estão na rede! Veja a informação circular.");
    timers.after(DRAW_MS + 500, () => {
      say("Não importa qual dispositivo começa. O importante é existir uma conexão.", "happy");
      timers.after(1600, () => setCanAdvance(true), { hold: true });
    });
  };

  return (
    <>
      <Banner
        text={complete ? "Todos na rede!" : `Na rede: ${network.size} de ${NETWORK.length}`}
        tone={complete ? "success" : "info"}
        icon={complete ? "ok" : "internet"}
        reducedMotion={reducedMotion}
      />

      {links.map((link) => {
        const key = pairKey(link);
        const isDrawing = drawing.includes(key);
        return (
          <NetLink
            key={key}
            from={SPOTS[link[0]]}
            to={SPOTS[link[1]]}
            state={isDrawing ? "idle" : "active"}
            draw={isDrawing && !reducedMotion}
            thickness={1}
          />
        );
      })}

      <Traffic ref={trafficRef} links={links} complete={complete} reducedMotion={reducedMotion} onStarter={setStarter} />

      {NETWORK.map((id, index) => {
        const inNetwork = network.has(id);
        return (
          <DeviceNode
            key={id}
            id={id}
            at={SPOTS[id]}
            order={index}
            float={!reducedMotion}
            onClick={() => tap(id)}
            pressed={selected === id}
            selected={selected === id}
            pulse={!inNetwork && selected !== id}
            highlighted={complete ? starter === id : inNetwork && selected !== id}
            alt={`${DEVICES[id].label}: ligar${inNetwork ? " (na rede)" : ""}`}
          />
        );
      })}

      <Live text={status} />
    </>
  );
}

export default SceneManyLinks;
