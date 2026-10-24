"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Sprite } from "@/components/ui/Sprite";
import { cx } from "@/components/ui/cx";
import { SPRITES } from "@/config/assets";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { unlockAchievement } from "@/lib/achievementEvents";
import styles from "./PineappleJuice.module.css";

/**
 * Raro de propósito: primeira chance 1–2 min depois de abrir o site; depois, a cada 3–6 min (e nem sempre aparece). O
 * horário da próxima chance fica no módulo, então trocar de página não reinicia a contagem.
 */
const FIRST_MS: [number, number] = [60000, 120000];
const NEXT_MS: [number, number] = [180000, 360000];
const CHANCE = 0.4;
let nextChanceAt = 0;
/** travessia da tela (com "Reduzir animações", fica parado e some depois desse tempo) */
const FLIGHT_MS = 15000;
const STILL_MS = 9000;
const CAUGHT_MS = 600;

type Juice = { key: number; top: number; left: number; reverse: boolean; duration: number };

const between = ([min, max]: [number, number]) => min + Math.random() * (max - min);

/**
 * Easter egg da conquista secreta S-03: um suco de abacaxi atravessa o espaço de vez em quando; tocar nele dá a
 * conquista. Sorteio só em efeito/timer (nunca no render), animação só com transform/opacity.
 */
export function PineappleJuice() {
  const reducedMotion = useReducedMotion();
  const [juice, setJuice] = useState<Juice | null>(null);
  const [caught, setCaught] = useState(false);
  const caughtTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    let timer: number | undefined;
    let key = 0;
    const schedule = (delay: number) => {
      nextChanceAt = Date.now() + delay;
      timer = window.setTimeout(tick, delay);
    };
    const tick = () => {
      if (document.hidden || Math.random() >= CHANCE) {
        schedule(between(NEXT_MS));
        return;
      }
      nextChanceAt = Infinity;
      const duration = reducedMotion ? STILL_MS : FLIGHT_MS;
      setCaught(false);
      setJuice({ key: ++key, top: between([16, 74]), left: between([10, 80]), reverse: Math.random() < 0.5, duration });
      timer = window.setTimeout(() => {
        setJuice(null);
        schedule(between(NEXT_MS));
      }, duration);
    };
    if (nextChanceAt === 0) schedule(between(FIRST_MS));
    else if (nextChanceAt === Infinity) schedule(between(NEXT_MS));
    // a chance venceu numa aula ou laboratório (sem suco): espera um pouco depois de chegar na página
    else timer = window.setTimeout(tick, Math.max(5000, nextChanceAt - Date.now()));
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(caughtTimer.current);
    };
  }, [reducedMotion]);

  if (!juice) return null;

  const grab = () => {
    if (caught) return;
    setCaught(true);
    unlockAchievement("s-03");
    caughtTimer.current = window.setTimeout(() => setJuice(null), CAUGHT_MS);
  };

  const style = {
    top: `${juice.top}%`,
    left: reducedMotion ? `${juice.left}%` : 0,
    "--flight": `${juice.duration}ms`,
  } as CSSProperties;

  return (
    <div
      key={juice.key}
      className={cx(styles.lane, reducedMotion ? styles.still : juice.reverse ? styles.leftward : styles.rightward)}
      style={style}
    >
      <button type="button" className={cx(styles.juice, caught && styles.caught)} onClick={grab} aria-label="Suco de abacaxi: toque para pegar">
        <Sprite src={SPRITES.objects.pineappleJuice} alt="" decorative size={30} height={57} className={styles.sprite} />
      </button>
    </div>
  );
}

export default PineappleJuice;
