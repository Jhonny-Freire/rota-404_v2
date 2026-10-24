"use client";

import { useEffect, useId, useRef, useState } from "react";
import { BONZI_FRAMES, BONZI_POSE_MS, SPRITES } from "@/config/assets";
import { Sprite } from "@/components/ui/Sprite";
import { BonziBuddy } from "@/components/bonzi/BonziBuddy";
import { AnimatedSprite } from "@/components/ui/AnimatedSprite";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useSettings } from "@/hooks/useSettings";
import { useTypewriter } from "@/hooks/useTypewriter";
import { narrationService } from "@/services/narrationService";
import type { BonziState } from "@/types/domain";
import styles from "./Narrator.module.css";

/** `silent`: a fala aparece escrita, sem voz */
export type NarratorLine = { message: string; state: BonziState; key: number; silent?: boolean };

export const EMPTY_LINE: NarratorLine = { message: "", state: "idle", key: 0 };

export type NarratorProps = {
  line: NarratorLine;
  size?: number;
  /** "Repetir" do balão: em vez de repetir só a fala atual, chama isto (a aula repete todas as falas da cena) */
  onRepeat?: () => void;
  /**
   * "balloon" (padrão): Bonzi com balão de fala.
   * "portrait": retrato pequeno do Bonzi + fala em texto, sem moldura própria — para ficar dentro de um
   * cartão do shell (o "guia" do laboratório). Mesma voz e mesma digitação do balão.
   */
  variant?: "balloon" | "portrait";
};

/** Bonzi inline das aulas/laboratórios. Com "Mostrar o Bonzi" desligado, mostra só o texto. */
export function Narrator({ line, size = 96, variant = "balloon", onRepeat }: NarratorProps) {
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
      <BonziBuddy
        position="inline"
        message={line.message}
        messageKey={line.key}
        state={line.state}
        size={size}
        onRepeat={onRepeat}
        silent={line.silent}
      />
    </div>
  );
}

/* ───────── retrato (cartão do laboratório) ───────── */

function Portrait({ line, size }: { line: NarratorLine; size: number }) {
  const { settings, hydrated } = useSettings();
  const reducedMotion = useReducedMotion();
  const owner = useId();
  const [replay, setReplay] = useState(0);
  const volumeRef = useRef(settings.volume);
  const text = line.message.trim();
  const lineId = `${line.key}:${text}:${replay}`;
  // como no balão: antes de ler os ajustes o Bonzi aparece; com "Mostrar o Bonzi" desligado, só o texto (e sem voz)
  const showFigure = !hydrated || settings.showBonzi;
  const voice = hydrated && settings.showBonzi && !line.silent;
  // texto aparecendo letra por letra, escrito direto no DOM (instantâneo com movimento reduzido)
  const { typedRef, typing } = useTypewriter(text, `${line.key}:${replay}`, !reducedMotion);
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
    <div className={styles.portrait}>
      {showFigure && (
        <span className={styles.figure} aria-hidden="true">
          <AnimatedSprite frames={BONZI_FRAMES[state]} fps={1000 / BONZI_POSE_MS} alt="" size={size} className={styles.figureSprite} />
        </span>
      )}
      <div className={styles.speech}>
        <span className={styles.speakerRow}>
          {showFigure && (
            <span className={styles.speaker} aria-hidden="true">
              Bonzi
            </span>
          )}
          {text && (
            <button type="button" className={styles.repeat} onClick={() => setReplay((n) => n + 1)} aria-label="Repetir fala do Bonzi">
              <Sprite src={SPRITES.ui.soundOn} alt="" decorative size={14} />
              <span>Repetir</span>
            </button>
          )}
        </span>
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
