"use client";

import { useEffect, useState } from "react";
import {
  ActionButton,
  Link,
  Packet,
  Place,
  SceneSprite,
  Tag,
  useSequence,
  type ElementKey,
  type ScenePoint,
  type SequenceStep,
} from "@/components/learning/kit";
import { cx } from "@/components/ui/cx";
import { DOMAIN, IP, LINES, labeled, type SceneProps } from "./concepts";
import { Arrow, Live } from "./parts";
import styles from "./IpDominioESite.module.css";

type ChainNode = { id: string; x: number; element: ElementKey; native: number; label: string };

/** exemplo.com → endereço IP → servidor → página (aula2-2.md, Cena 5) */
const NODES: ChainNode[] = [
  { id: "domain", x: 12, element: "internet", native: 14, label: DOMAIN },
  { id: "ip", x: 37, element: "pin", native: 11, label: "Endereço IP" },
  { id: "server", x: 63, element: "server", native: 12, label: "Servidor" },
  { id: "page", x: 88, element: "webpage", native: 15, label: "Página" },
];

/** altura (%) do fio que liga os sprites */
const Y = 48;
const SCALE = 0.65;
const GAP = 6;
const HOP_MS = 900;
/** pausa de leitura com o sprite recém-aceso (fica com movimento reduzido) */
const PAUSE_MS = 400;
const LOOP_MS = 2600;

const at = (x: number): ScenePoint => ({ x, y: Y });
const rightOf = (index: number) => at(NODES[index].x + GAP);
const leftOf = (index: number) => at(NODES[index].x - GAP);

/**
 * Passos: 0 domínio aceso · 1 pacote → IP · 2 IP aceso · 3 pacote → servidor · 4 servidor aceso ·
 * 5 pacote → página · 6 página acesa · 7 fim (o pacote passa a dar a volta inteira).
 * Os saltos são animação (0 ms com movimento reduzido); as pausas são leitura ({ hold }):
 * 700 + 400 + 400 + 1800 = 3300 ms para a fala (50 caracteres).
 */
const STEPS: SequenceStep[] = [{ hold: 700 }, HOP_MS, { hold: PAUSE_MS }, HOP_MS, { hold: PAUSE_MS }, HOP_MS, { hold: 1800 }];
const LAST = STEPS.length;

/** Cena 5 — anima o caminho do domínio até a página. */
export function SceneChain({ say, setCanAdvance, reducedMotion }: SceneProps) {
  /** já terminou uma vez: "Ver de novo" fica no palco (e com o foco, se o aluno o usou) mesmo durante a repetição */
  const [seen, setSeen] = useState(false);
  const { step, done, restart } = useSequence(STEPS, {
    reducedMotion,
    onDone: () => {
      setSeen(true);
      setCanAdvance(true);
    },
  });
  const reached = Math.min(NODES.length - 1, Math.floor(step / 2));
  /** trecho do pacote (ele espera no fim do trecho enquanto o próximo sprite acende) */
  const hop = step >= 1 && step < LAST ? Math.floor((step - 1) / 2) : null;
  const passed = (index: number) => reached > index || (step % 2 === 1 && hop === index);

  useEffect(() => {
    say(LINES.chain);
  }, [say]);

  const replay = () => {
    restart();
    say(LINES.chain);
  };

  return (
    <>
      {NODES.slice(0, -1).map((node, index) => (
        <Link
          key={`link-${node.id}`}
          from={rightOf(index)}
          to={leftOf(index + 1)}
          state={passed(index) ? "active" : "idle"}
          thickness={0.7}
          dots={2}
          speedMs={900}
        />
      ))}

      {/* só a seta do trecho que o pacote está fazendo empurra: parada a cena, nada fica se mexendo além do fluxo */}
      {NODES.slice(0, -1).map((node, index) => (
        <Place key={`arrow-${node.id}`} x={(node.x + NODES[index + 1].x) / 2} y={Y} z={2}>
          <span className={cx(styles.holder, hop === index && !reducedMotion && styles.nudge)}>
            <Arrow size={4.2} lit={passed(index)} />
          </span>
        </Place>
      ))}

      {NODES.map((node, index) => {
        const lit = index <= reached;
        return (
          <Place key={node.id} {...labeled(at(node.x))}>
            <SceneSprite
              element={node.element}
              size={node.native * SCALE}
              label={node.label}
              alt={node.id === "ip" ? `${node.label}: ${IP}` : node.label}
              highlighted={index === reached}
              dimmed={!lit}
            >
              {node.id === "ip" && lit && (
                <Tag size="sm" tone="info">
                  {IP}
                </Tag>
              )}
            </SceneSprite>
          </Place>
        );
      })}

      {hop !== null && <Packet key={`hop-${hop}`} path={[rightOf(hop), leftOf(hop + 1)]} size={4} durationMs={HOP_MS} />}

      {done && !reducedMotion && (
        <Packet
          key="loop"
          path={[rightOf(0), leftOf(NODES.length - 1)]}
          size={4}
          durationMs={LOOP_MS}
          delayMs={600}
          loop
          loopPauseMs={1100}
          hideOnArrive
          z={1}
        />
      )}

      <Place x={50} y={84} hidden={!seen}>
        <ActionButton label="Ver de novo" variant="default" onClick={replay} disabled={!seen} size={20} />
      </Place>

      <Live text={done ? `${DOMAIN}, endereço IP ${IP}, servidor, página.` : ""} />
    </>
  );
}
