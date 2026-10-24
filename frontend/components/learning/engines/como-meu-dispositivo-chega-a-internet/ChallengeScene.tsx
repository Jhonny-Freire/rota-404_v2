"use client";

import { Fragment, useMemo, useState } from "react";
import { SPRITES, type ElementKey } from "@/config/assets";
import { cx } from "@/components/ui/cx";
import { Packet, Place, SceneCanvas, SceneSprite, useSeededRandom, useSequence, useTimers } from "@/components/learning/kit";
import { PARTS, READY_PAUSE_MS, RETRY_MS, type PartId, type SceneProps } from "./parts";
import styles from "./ComoMeuDispositivoChegaAInternet.module.css";

/* Cena 6 — Microdesafio: uma seta desaparece do caminho e o aluno escolhe a parte que falta. */

const ROW_Y = 34;
const ROW_X = [12, 31, 50, 69, 88];
const ROW_SIZE: Record<PartId, number> = { phone: 5, wifi: 8, router: 9, internet: 11, site: 7.5 };
const MISSABLE: PartId[] = ["wifi", "router", "internet"];

type Option = { id: string; label: string; element: ElementKey };

const OUTSIDERS: Option[] = [
  { id: "printer", label: "Impressora", element: "printer" },
  { id: "camera", label: "Câmera", element: "camera" },
];

function partOption(id: PartId): Option {
  const part = PARTS.find((p) => p.id === id) ?? PARTS[0];
  return { id: part.id, label: part.label, element: part.element };
}

const arrowX = (index: number) => (ROW_X[index] + ROW_X[index + 1]) / 2;
const rowPoint = (x: number) => ({ x, y: ROW_Y });

export function SceneChallenge({ say, setCanAdvance, setHint, reducedMotion }: SceneProps) {
  const rand = useSeededRandom(0, { salt: "aula-1-2-microdesafio" });
  const missing = useMemo(() => rand.pick(MISSABLE, "missing"), [rand]);
  const options = useMemo(() => {
    const decoy = rand.pick(
      MISSABLE.filter((id) => id !== missing),
      "decoy",
    );
    return rand.shuffle([partOption(missing), partOption(decoy), ...OUTSIDERS], "options", true);
  }, [rand, missing]);
  const missingIndex = PARTS.findIndex((p) => p.id === missing);
  const timers = useTimers({ reducedMotion });
  const [wrongId, setWrongId] = useState<string | null>(null);
  const [solved, setSolved] = useState(false);
  const { step } = useSequence([{ hold: 1300 }, 500], {
    reducedMotion,
    onStep: (s) => {
      if (s === 2) say("Qual parte falta no caminho?", "thinking");
    },
  });
  const broken = step >= 1 && !solved;
  const ready = step >= 2;
  const wrongOption = options.find((option) => option.id === wrongId) ?? null;

  const choose = (option: Option) => {
    if (!ready || solved || wrongId) return;
    if (option.id === missing) {
      timers.clearAll();
      setSolved(true);
      say("Boa! Sem essa parte, o caminho fica interrompido.", "happy");
      /* libera depois de uma pausa: o aluno vê o caminho consertado antes de o foco ir para "Próxima cena" */
      setHint("Isso! Agora o caminho está completo.");
      timers.after(READY_PAUSE_MS, () => setCanAdvance(true), { hold: true });
      return;
    }
    setWrongId(option.id);
    say("Ainda não. Veja onde o caminho parou.", "warning");
    setHint("Veja onde o caminho parou e escolha outra parte.");
    timers.after(RETRY_MS, () => setWrongId(null), { hold: true });
  };

  const blockedPath = [...ROW_X.slice(0, missingIndex).map(rowPoint), rowPoint(arrowX(missingIndex - 1) - 1.5)];
  const fullPath = ROW_X.map(rowPoint);
  const pathText = PARTS.map((part, i) => (broken && i === missingIndex ? "parte que falta" : part.label)).join(", ");

  return (
    <SceneCanvas backdrop="grid" label="Microdesafio: escolha a parte que falta no caminho">
      <p className="sr-only">{`Caminho: ${pathText}.`}</p>

      {ROW_X.slice(0, -1).map((_, i) => {
        const gone = broken && i === missingIndex - 1;
        return (
          <Fragment key={`arrow-${i}`}>
            <Place x={arrowX(i)} y={ROW_Y} z={1} hidden={gone}>
              <img src={SPRITES.ui.next} alt="" draggable={false} className={styles.rowArrow} />
            </Place>
            {gone && (
              <Place x={arrowX(i)} y={ROW_Y} z={1}>
                <span className={cx(styles.gapLine, styles.pop)} aria-hidden="true" />
              </Place>
            )}
          </Fragment>
        );
      })}

      {PARTS.map((part, i) => {
        const isMissing = i === missingIndex;
        if (isMissing && broken) {
          return (
            <Fragment key={part.id}>
              <Place x={ROW_X[i]} y={ROW_Y}>
                <span className={cx(styles.slotBox, styles.pop)}>
                  {wrongOption ? (
                    <SceneSprite key={wrongOption.id} element={wrongOption.element} size={6} wrong alt={`${wrongOption.label}: não é essa`} />
                  ) : (
                    /* sem pulse: o "?" não é para tocar; quem pulsa são as opções embaixo */
                    <SceneSprite element="question" size={5} alt="Parte que falta" />
                  )}
                </span>
              </Place>
              <Place x={ROW_X[i]} y={ROW_Y + 9} anchor="top">
                <span className={cx(styles.rowLabel, styles.rowLabelMissing)} aria-hidden="true">
                  ?
                </span>
              </Place>
            </Fragment>
          );
        }
        const restored = solved && isMissing;
        return (
          <Fragment key={part.id}>
            <Place x={ROW_X[i]} y={ROW_Y}>
              <span className={cx(styles.holder, restored && styles.pop)}>
                <SceneSprite
                  element={part.element}
                  size={ROW_SIZE[part.id]}
                  alt={part.label}
                  correct={restored}
                  highlighted={restored || (solved && part.id === "site")}
                />
              </span>
            </Place>
            <Place x={ROW_X[i]} y={ROW_Y + 9} anchor="top">
              <span className={cx(styles.rowLabel, restored && styles.rowLabelRight)} aria-hidden="true">
                {part.label}
              </span>
            </Place>
          </Fragment>
        );
      })}

      {ready &&
        !reducedMotion &&
        (solved ? (
          <Packet key="open" path={fullPath} durationMs={2400} size={3.5} loop loopPauseMs={500} hideOnArrive />
        ) : (
          <Packet key="blocked" path={blockedPath} durationMs={500 * missingIndex} size={3.5} blocked loop loopPauseMs={900} />
        ))}

      <Place x={50} y={77} hidden={!ready}>
        <div className={styles.tray} role="group" aria-label="Escolha a parte que falta no caminho">
          {options.map((option) => {
            const right = solved && option.id === missing;
            return (
              <SceneSprite
                key={option.id}
                element={option.element}
                size={6.5}
                label={option.label}
                alt={option.label}
                className={styles.option}
                onClick={() => choose(option)}
                pulse={ready && !solved && !wrongId}
                wrong={wrongId === option.id}
                correct={right}
                dimmed={solved && !right}
              />
            );
          })}
        </div>
      </Place>

      <p className="sr-only" aria-live="polite">
        {solved ? "Resposta correta. O caminho está completo." : wrongId ? "Ainda não. Tente de novo." : ""}
      </p>
    </SceneCanvas>
  );
}
