"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { ELEMENTS } from "@/config/assets";
import { Place, SceneSprite, Tag, useTimers } from "@/components/learning/kit";
import { cx } from "@/components/ui/cx";
import { DEVICES, type DeviceId, type SceneProps } from "./devices";
import { Live, Wire } from "./NetworkParts";
import styles from "./OQueEUmaRede.module.css";

type OptionKind = "apart" | "linked" | "dangling";

type Option = { kind: OptionKind; x: number; devices: DeviceId[]; ariaLabel: string };

const OPTIONS: Option[] = [
  { kind: "apart", x: 17, devices: ["tablet", "printer"], ariaLabel: "Exemplo 1: dois aparelhos separados" },
  { kind: "linked", x: 50, devices: ["computer", "cellphone"], ariaLabel: "Exemplo 2: dois aparelhos ligados" },
  { kind: "dangling", x: 83, devices: ["notebook"], ariaLabel: "Exemplo 3: um aparelho com uma conexão" },
];

const CORRECT: OptionKind = "linked";
const SCALE = 0.6;
const SUCCESS = "Isso! Eles estão conectados.";
const ERROR = "Ainda não. Procure uma conexão.";

function Device({ id }: { id: DeviceId }) {
  return <SceneSprite element={DEVICES[id].element} size={DEVICES[id].native * SCALE} />;
}

/** Cena 5 — microteste: tocar no exemplo em que existe uma rede (erro não revela a resposta). */
export function SceneQuiz({ say, setCanAdvance, setHint, reducedMotion }: SceneProps) {
  const timers = useTimers({ reducedMotion });
  const [wrong, setWrong] = useState<OptionKind | null>(null);
  const [solved, setSolved] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    say("Toque onde existe uma rede.", "thinking");
  }, [say]);

  const choose = (kind: OptionKind) => {
    if (solved || wrong) return;
    if (kind === CORRECT) {
      setSolved(true);
      setStatus(SUCCESS);
      say(SUCCESS, "happy");
      setCanAdvance(true);
      return;
    }
    setWrong(kind);
    setStatus(ERROR);
    say(ERROR, "warning");
    setHint(`${ERROR} Toque em outro exemplo.`);
    timers.after(
      1300,
      () => {
        setWrong(null);
        setStatus("");
      },
      { hold: true },
    );
  };

  return (
    <>
      <Place x={50} y={13}>
        <Tag size="lg" tone="warning" icon="magnifier">
          Onde existe uma rede?
        </Tag>
      </Place>

      {OPTIONS.map((option) => {
        const isWrong = wrong === option.kind;
        const isRight = solved && option.kind === CORRECT;
        const [first, second] = option.devices;
        return (
          <Place key={option.kind} x={option.x} y={56} width={30}>
            <button
              type="button"
              className={cx(
                styles.option,
                isWrong && styles.optionWrong,
                isRight && styles.optionRight,
                solved && !isRight && styles.optionLocked,
              )}
              onClick={() => choose(option.kind)}
              aria-label={option.ariaLabel}
              aria-disabled={solved || undefined}
            >
              <span className={styles.optionFloor} aria-hidden="true" />
              <Device id={first} />
              {option.kind === "apart" && <span className={styles.gap} style={{ "--w": 6 } as CSSProperties} />}
              {option.kind === "linked" && <Wire active moving={!reducedMotion} width={7} />}
              {option.kind === "dangling" && (
                <>
                  <Wire active={false} moving={false} width={5} />
                  <img src={ELEMENTS.cable} alt="" draggable={false} className={styles.plug} />
                </>
              )}
              {second && <Device id={second} />}
              {(isWrong || isRight) && (
                <img src={isRight ? ELEMENTS.ok : ELEMENTS.error} alt="" draggable={false} className={styles.optionMark} />
              )}
            </button>
          </Place>
        );
      })}

      <Live text={status} />
    </>
  );
}

export default SceneQuiz;
