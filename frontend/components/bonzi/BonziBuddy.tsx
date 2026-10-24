"use client";

import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { BONZI_FRAMES, SPRITES } from "@/config/assets";
import { AnimatedSprite } from "@/components/ui/AnimatedSprite";
import { Sprite } from "@/components/ui/Sprite";
import { cx } from "@/components/ui/cx";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useSettings } from "@/hooks/useSettings";
import { useTypewriter } from "@/hooks/useTypewriter";
import { narrationService } from "@/services/narrationService";
import type { BonziPosition, BonziState } from "@/types/domain";
import styles from "./BonziBuddy.module.css";

export type BonziBuddyProps = {
  message?: string;
  /** mude para repetir a mesma mensagem (balão e voz) */
  messageKey?: string | number;
  state?: BonziState;
  visible?: boolean;
  position?: BonziPosition;
  audioSrc?: string;
  onClose?: () => void;
  onSpeechEnd?: () => void;
  size?: number;
};

const FPS: Record<BonziState, number> = { idle: 1, speaking: 5, happy: 1, thinking: 1.5, warning: 1, help: 1 };
const AUTO_COLLAPSE_MS = 8000;

export function BonziBuddy({
  message,
  messageKey,
  state = "idle",
  visible = true,
  position = "bottom-right",
  audioSrc,
  onClose,
  onSpeechEnd,
  size = 120,
}: BonziBuddyProps) {
  const { settings, hydrated } = useSettings();
  const reducedMotion = useReducedMotion();
  const [collapsed, setCollapsed] = useState(false);
  const onSpeechEndRef = useRef(onSpeechEnd);
  const figureRef = useRef<HTMLButtonElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const bubbleId = useId();
  const speechOwner = useId();
  const volumeRef = useRef(settings.volume);
  const text = message?.trim() ?? "";
  const floating = position !== "inline";
  // digitação escrita direto no DOM (só re-renderiza no começo e no fim da fala)
  const { typedRef, typing } = useTypewriter(text, messageKey, !reducedMotion);

  useEffect(() => {
    onSpeechEndRef.current = onSpeechEnd;
  }, [onSpeechEnd]);

  useEffect(() => {
    volumeRef.current = settings.volume;
  }, [settings.volume]);

  useEffect(() => {
    setCollapsed(false);
  }, [text, state, messageKey]);

  useEffect(() => {
    if (!floating || collapsed || typing || !text) return;
    const id = window.setTimeout(() => {
      if (bubbleRef.current?.contains(document.activeElement)) return;
      setCollapsed(true);
    }, AUTO_COLLAPSE_MS);
    return () => window.clearTimeout(id);
  }, [floating, collapsed, typing, text]);

  useEffect(() => {
    if (!visible || !text || !hydrated) return;
    let active = true;
    narrationService
      .speak(text, { audioSrc, enabled: settings.narrationEnabled, volume: volumeRef.current, owner: speechOwner })
      .then(() => {
        if (active) onSpeechEndRef.current?.();
      })
      .catch(() => undefined);
    return () => {
      active = false;
      narrationService.stop(speechOwner);
    };
  }, [text, messageKey, audioSrc, settings.narrationEnabled, visible, hydrated, speechOwner]);

  if (!visible) return null;

  const displayState: BonziState = typing && (state === "idle" || state === "speaking") ? "speaking" : state;
  const showBubble = Boolean(text) && !collapsed;

  const close = () => {
    if (onClose) onClose();
    else {
      setCollapsed(true);
      figureRef.current?.focus();
    }
  };

  const figure = (
    <>
      <span className={styles.shadow} aria-hidden="true" />
      <span className={styles.figure}>
        <AnimatedSprite frames={BONZI_FRAMES[displayState]} fps={FPS[displayState]} alt="" size={size} className={styles.sprite} />
      </span>
      {text && collapsed && <span className={styles.ping} aria-hidden="true" />}
    </>
  );

  return (
    <div
      className={cx(styles.bonzi, styles[position], styles[`state-${state}`])}
      style={{ "--bonzi-size": `${size}px` } as CSSProperties}
    >
      <div id={bubbleId} ref={bubbleRef} className={styles.bubbleSlot} aria-live="polite">
        {showBubble && (
          <div key={`${messageKey ?? ""}:${text}`} className={cx(styles.bubble, state === "thinking" && styles.thought)}>
            <div className={styles.bubbleHeader}>
              <span className={styles.speaker}>Bonzi</span>
              <button type="button" className={styles.close} onClick={close} aria-label="Fechar fala do Bonzi">
                <Sprite src={SPRITES.ui.close} alt="" decorative size={18} />
              </button>
            </div>
            <p className={styles.text}>
              <span className="sr-only">{text}</span>
              <span className={styles.ghost} aria-hidden="true">
                {text}
              </span>
              <span ref={typedRef} className={styles.typed} aria-hidden="true" />
            </p>
          </div>
        )}
      </div>

      {text ? (
        <button
          ref={figureRef}
          type="button"
          className={styles.figureButton}
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Mostrar fala do Bonzi" : "Esconder fala do Bonzi"}
          aria-expanded={!collapsed}
          aria-controls={bubbleId}
        >
          {figure}
        </button>
      ) : (
        <span className={styles.figureButton} role="img" aria-label="Bonzi Buddy, seu co-piloto">
          {figure}
        </span>
      )}
    </div>
  );
}

export default BonziBuddy;
