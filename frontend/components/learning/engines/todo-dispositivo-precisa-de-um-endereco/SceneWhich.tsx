"use client";

import { Link, useSequence, type SequenceStep } from "@/components/learning/kit";
import { DeviceNode, LEFT_PC, Letter, Live, MESSAGE_AT, MESSAGE_SIZE, PC_SCALE, RIGHT_PC, type SceneProps } from "./parts";

const LINE = "Para qual deles vai a mensagem?";

const MESSAGE = 1;
const ASKING = 2;
/* a última pausa cobre a pergunta do Bonzi antes de liberar "Próxima cena" */
const STEPS: SequenceStep[] = [400, 500, { hold: 2600 }];

/** Cena 1 — dois computadores idênticos piscando: para qual deles vai a mensagem? */
export function SceneWhich({ say, setCanAdvance, reducedMotion }: SceneProps) {
  const { step } = useSequence(STEPS, {
    reducedMotion,
    onStep: (current) => {
      if (current === ASKING) say(LINE, "thinking");
    },
    onDone: () => setCanAdvance(true),
  });
  const asking = step >= ASKING;
  const animate = !reducedMotion;

  return (
    <>
      {step >= MESSAGE && (
        <>
          <Link from={MESSAGE_AT} to={LEFT_PC} state="idle" />
          <Link from={MESSAGE_AT} to={RIGHT_PC} state="idle" />
        </>
      )}

      <DeviceNode
        kind="computer"
        at={LEFT_PC}
        scale={PC_SCALE}
        pop={animate}
        blink={asking && animate ? 0 : undefined}
        highlighted={asking && !animate}
        alt="Computador"
      />
      <DeviceNode
        kind="computer"
        at={RIGHT_PC}
        scale={PC_SCALE}
        pop={animate}
        blink={asking && animate ? 1 : undefined}
        highlighted={asking && !animate}
        alt="Computador igual ao primeiro"
      />

      {step >= MESSAGE && (
        <Letter at={MESSAGE_AT} size={MESSAGE_SIZE} pop={animate} sway={asking && animate} question={asking} alt="Mensagem sem destino" />
      )}

      <Live text={asking ? "Dois computadores iguais piscando. A mensagem não sabe para qual deles ir." : ""} />
    </>
  );
}

export default SceneWhich;
