"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { SPRITES } from "@/config/assets";
import {
  Callout,
  Packet,
  Place,
  SceneCanvas,
  SceneSprite,
  Tag,
  useSequence,
  useTimers,
  type SequenceStep,
} from "@/components/learning/kit";
import { PARTS, READY_PAUSE_MS, WORLD_PATH, type Part, type PartId, type SceneProps } from "./parts";
import { RouteStrip, World, type PartLook, type StripState } from "./World";
import styles from "./ComoMeuDispositivoChegaAInternet.module.css";

const NO_POINTER: CSSProperties = { pointerEvents: "none" };

function LoopPacket() {
  return <Packet path={WORLD_PATH} durationMs={2600} size={3.5} loop loopPauseMs={500} hideOnArrive />;
}

/* Cena 4 — Internet: o roteador se conecta à nuvem, o site aparece nela e o caminho é mostrado. */

/** a pausa final dá tempo de ler a faixa completa do caminho antes de liberar "Próxima cena" */
const S4_STEPS: SequenceStep[] = [500, 1000, 700, 450, 450, 450, 450, { hold: 1500 }];

export function SceneInternet({ say, setCanAdvance, reducedMotion }: SceneProps) {
  const { step, done } = useSequence(S4_STEPS, { reducedMotion, onDone: () => setCanAdvance(true) });
  const cloud = step >= 1;
  const site = step >= 2;
  const revealed = Math.min(PARTS.length, Math.max(0, step - 2));
  const current = step >= 3 && step < 3 + PARTS.length ? step - 3 : -1;

  useEffect(() => {
    say("O roteador se conecta à Internet.");
  }, [say]);

  const looks: Partial<Record<PartId, PartLook>> = {
    phone: { highlighted: current === 0 },
    wifi: { highlighted: current === 1 },
    router: { highlighted: current === 2 },
    internet: { hidden: !cloud, pop: true, highlighted: current === 3 },
    site: { hidden: !site, pop: true, highlighted: step === 2 || current === 4 },
  };
  const states: StripState[] = PARTS.map((_, i) => (i >= revealed ? "hidden" : i === current ? "current" : "lit"));

  return (
    <SceneCanvas backdrop="grid" label="Cena 4: o roteador se conecta à Internet e o site aparece dentro da nuvem">
      <World looks={looks} waves cable={cloud ? "active" : "none"} reducedMotion={reducedMotion}>
        {done && !reducedMotion && <LoopPacket />}
      </World>
      <RouteStrip states={states} />
    </SceneCanvas>
  );
}

/* Cena 5 — Repetição interativa: tocar em cada parte do caminho destaca o que ela é. */

const CALLOUT_AT: Record<PartId, { x: number; y: number }> = {
  phone: { x: 13, y: 34 },
  wifi: { x: 24, y: 28 },
  router: { x: 39, y: 41 },
  internet: { x: 66, y: 23 },
  site: { x: 73, y: 36 },
};

/** Instrução do painel "O que fazer" conforme faltam partes (sem dizer qual). */
function exploreHint(left: number): string {
  if (left === 1) return "Falta só 1 parte do caminho. Encontre e toque nela.";
  return `Faltam ${left} partes. Toque em outra parte do caminho.`;
}

export function SceneExplore({ say, setCanAdvance, setHint, reducedMotion }: SceneProps) {
  const timers = useTimers({ reducedMotion });
  const [selected, setSelected] = useState<PartId | null>(null);
  const [visited, setVisited] = useState<PartId[]>([]);
  const complete = visited.length === PARTS.length;
  const active = PARTS.find((part) => part.id === selected) ?? null;

  useEffect(() => {
    say("Toque em cada parte do caminho.", "help");
  }, [say]);

  const touch = (part: Part) => {
    const nextVisited = visited.includes(part.id) ? visited : [...visited, part.id];
    const finishing = !complete && nextVisited.length === PARTS.length;
    setSelected(part.id);
    setVisited(nextVisited);
    say(part.speech, finishing ? "happy" : "speaking");
    if (complete) return;
    if (finishing) {
      /* libera depois de uma pausa: o aluno vê a última parte destacada e o caminho todo aceso */
      setHint("Você tocou em todas as partes do caminho!");
      timers.after(READY_PAUSE_MS, () => setCanAdvance(true), { hold: true });
    } else {
      setHint(exploreHint(PARTS.length - nextVisited.length));
    }
  };

  const looks: Partial<Record<PartId, PartLook>> = {};
  for (const part of PARTS) {
    const seen = visited.includes(part.id);
    const isSelected = selected === part.id;
    looks[part.id] = {
      highlighted: isSelected,
      pulse: !seen && part.id !== "internet",
      beckon: !seen && part.id === "internet",
      onClick: () => touch(part),
      pressed: isSelected,
    };
  }
  const states: StripState[] = PARTS.map((part) =>
    part.id === selected ? "current" : visited.includes(part.id) ? "lit" : "dim",
  );

  return (
    <SceneCanvas backdrop="grid" label="Cena 5: toque em cada parte do caminho">
      <World
        looks={looks}
        waves={selected === "wifi" || complete}
        cable={selected === "internet" || complete ? "active" : "idle"}
        reducedMotion={reducedMotion}
      >
        {active && (
          <Place key={active.id} x={CALLOUT_AT[active.id].x} y={CALLOUT_AT[active.id].y} anchor="bottom" z={4} style={NO_POINTER}>
            <Callout tone="warning" tail="down" size="md">
              {active.role}
            </Callout>
          </Place>
        )}
        {complete && !reducedMotion && <LoopPacket />}
      </World>
      <RouteStrip states={states} />
      <p className="sr-only" aria-live="polite">
        {visited.length > 0 ? `${visited.length} de ${PARTS.length} partes tocadas.` : ""}
      </p>
    </SceneCanvas>
  );
}

/* Encerramento — o caminho completo é animado do dispositivo até o site. */

/**
 * A pausa final deixa o Bonzi terminar a ideia central da aula antes de liberar "Concluir". Os saltos do pacote
 * também são pausas (hold): com movimento reduzido ele vai de parte em parte sem animar, e a fala longa ainda cabe.
 */
const S7_STEPS: SequenceStep[] = [600, { hold: 900 }, { hold: 900 }, { hold: 900 }, { hold: 900 }, { hold: 2000 }];
const LAST = PARTS.length - 1;

function ClosingRun({
  setCanAdvance,
  reducedMotion,
  onReplay,
}: Pick<SceneProps, "setCanAdvance" | "reducedMotion"> & { onReplay: () => void }) {
  const { step, done } = useSequence(S7_STEPS, { reducedMotion, onDone: () => setCanAdvance(true) });
  const target = Math.min(step, LAST);
  const lastLit = Math.max(0, Math.min(step - 1, LAST));
  const arrived = step > LAST;

  const looks: Partial<Record<PartId, PartLook>> = {};
  PARTS.forEach((part, i) => {
    looks[part.id] = {
      dimmed: i > lastLit,
      highlighted: i === lastLit && !done,
      correct: part.id === "site" && arrived,
    };
  });
  const states: StripState[] = PARTS.map((_, i) => (i > lastLit ? "dim" : i === lastLit && !done ? "current" : "lit"));

  return (
    <SceneCanvas backdrop="grid" label="Encerramento: o caminho completo do celular até o site">
      <World looks={looks} waves={step >= 1} cable={step >= 3 ? "active" : "idle"} reducedMotion={reducedMotion}>
        {!arrived && (
          <Place x={WORLD_PATH[target].x} y={WORLD_PATH[target].y} z={3} moveMs={reducedMotion ? 0 : 820} style={NO_POINTER}>
            <SceneSprite element="box" size={4} className={styles.traveler} />
          </Place>
        )}
      </World>
      <RouteStrip states={states} />
      {done && (
        <Place x={50} y={6} anchor="top">
          <Tag iconSrc={SPRITES.ui.play} onClick={onReplay} ariaLabel="Ver o caminho de novo" tone="info">
            Ver de novo
          </Tag>
        </Place>
      )}
      <p className="sr-only" aria-live="polite">
        {arrived ? "O pacote chegou ao site." : ""}
      </p>
    </SceneCanvas>
  );
}

export function SceneClosing({ say, setCanAdvance, reducedMotion }: SceneProps) {
  const [run, setRun] = useState(0);

  useEffect(() => {
    say("Meu dispositivo não conversa diretamente com a internet de forma mágica: existe uma conexão no caminho.");
  }, [say]);

  return <ClosingRun key={run} setCanAdvance={setCanAdvance} reducedMotion={reducedMotion} onReplay={() => setRun((r) => r + 1)} />;
}
