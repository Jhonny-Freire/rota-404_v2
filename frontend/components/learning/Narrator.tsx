"use client";

import { useEffect, useId, useRef } from "react";
import { BONZI_FRAMES } from "@/config/assets";
import { BonziBuddy } from "@/components/bonzi/BonziBuddy";
import { AnimatedSprite } from "@/components/ui/AnimatedSprite";
import { cx } from "@/components/ui/cx";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useSettings } from "@/hooks/useSettings";
import { useTypewriter } from "@/hooks/useTypewriter";
import { narrationService } from "@/services/narrationService";
import type { BonziState } from "@/types/domain";
import styles from "./Narrator.module.css";

export type NarratorLine = { message: string; state: BonziState; key: number };

export const EMPTY_LINE: NarratorLine = { message: "", state: "idle", key: 0 };

export type NarratorProps = {
  line: NarratorLine;
  size?: number;
  /**
   * "balloon" (padrão): Bonzi com balão de fala.
   * "portrait": retrato pequeno do Bonzi + fala em texto, sem moldura própria — para ficar dentro de um
   * cartão do shell (o "guia" do laboratório). Mesma voz e mesma digitação do balão.
   */
  variant?: "balloon" | "portrait";
};

/** Bonzi inline das aulas/laboratórios. Com "Mostrar o Bonzi" desligado, mostra só o texto. */
export function Narrator({ line, size = 96, variant = "balloon" }: NarratorProps) {
  const { settings, hydrated } = useSettings();

  if (variant === "portrait") return <Portrait line={line} size={size} />;

  if (hydrated && !settings.showBonzi) {
    return (
      <p className={styles.text} aria-live="polite">
        {line.message}
      </p>
    );
  }

  return (
    <div className={styles.bonzi}>
      <BonziBuddy position="inline" message={line.message} messageKey={line.key} state={line.state} size={size} />
    </div>
  );
}

/* ───────── retrato (cartão do laboratório) ───────── */

const FPS: Record<BonziState, number> = { idle: 1, speaking: 5, happy: 1, thinking: 1.5, warning: 1, help: 1 };

const STATE_CLASS: Record<BonziState, string | undefined> = {
  idle: undefined,
  speaking: styles.talking,
  happy: styles.happy,
  thinking: styles.thinking,
  warning: styles.warning,
  help: styles.help,
};

function Portrait({ line, size }: { line: NarratorLine; size: number }) {
  const { settings, hydrated } = useSettings();
  const reducedMotion = useReducedMotion();
  const owner = useId();
  const volumeRef = useRef(settings.volume);
  const text = line.message.trim();
  const lineId = `${line.key}:${text}`;
  // como no balão: antes de ler os ajustes o Bonzi aparece; com "Mostrar o Bonzi" desligado, só o texto (e sem voz)
  const showFigure = !hydrated || settings.showBonzi;
  const voice = hydrated && settings.showBonzi;
  // texto aparecendo letra por letra, escrito direto no DOM (instantâneo com movimento reduzido)
  const { typedRef, typing } = useTypewriter(text, line.key, !reducedMotion);
  const state: BonziState = typing && (line.state === "idle" || line.state === "speaking") ? "speaking" : line.state;

  useEffect(() => {
    volumeRef.current = settings.volume;
  }, [settings.volume]);

  // voz (mesmas regras do balão: só com os ajustes lidos e a narração ligada)
  useEffect(() => {
    if (!voice || !text) return;
    narrationService
      .speak(text, { enabled: settings.narrationEnabled, volume: volumeRef.current, owner })
      .catch(() => undefined);
    return () => narrationService.stop(owner);
  }, [lineId, text, voice, settings.narrationEnabled, owner]);

  return (
    <div className={cx(styles.portrait, STATE_CLASS[state])}>
      {showFigure && (
        <span className={styles.figure} aria-hidden="true">
          <AnimatedSprite frames={BONZI_FRAMES[state]} fps={FPS[state]} alt="" size={size} className={styles.figureSprite} />
        </span>
      )}
      <div className={styles.speech}>
        {showFigure && (
          <span className={styles.speaker} aria-hidden="true">
            Bonzi
          </span>
        )}
        <p className={styles.line} aria-live="polite">
          {text ? (
            <span key={lineId} className={styles.lineInner}>
              <span className="sr-only">{text}</span>
              <span className={styles.ghost} aria-hidden="true">
                {text}
              </span>
              <span ref={typedRef} className={styles.typed} aria-hidden="true" />
            </span>
          ) : (
            // espera: três quadradinhos em CSS (sem caractere Unicode como indicador)
            <span className={styles.waiting} aria-hidden="true" />
          )}
        </p>
      </div>
    </div>
  );
}

export default Narrator;
