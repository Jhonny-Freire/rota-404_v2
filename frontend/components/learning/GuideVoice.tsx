"use client";

import { useCallback, useEffect, useRef } from "react";
import { SPRITES } from "@/config/assets";
import { Sprite } from "@/components/ui/Sprite";
import { cx } from "@/components/ui/cx";
import { useSettings } from "@/hooks/useSettings";
import { cleanForSpeech, narrationService, whenIdle, yieldBackground } from "@/services/narrationService";
import styles from "./GuideVoice.module.css";

const OWNER = "guide-voice";
/**
 * Espera a fala do Bonzi que chega com a instrução (numa cena nova ela vem ~0,7 s depois) entrar na fila antes de
 * conferir se ele terminou: com 350 ms a instrução começava antes do Bonzi e ele a cortava na troca de cena.
 */
const SETTLE_MS = 1500;

const same = (a: string, b: string) => cleanForSpeech(a).toLowerCase() === cleanForSpeech(b).toLowerCase();

/**
 * Lê em voz alta o texto do painel do guia ("O que fazer", resultado da ação), para quem ainda não lê bem.
 * Lê uma vez por texto novo, depois que o Bonzi termina a fala dele (não atropela); se o texto é a própria fala do
 * Bonzi, não repete. É leitura de apoio (`background`): não segura o avanço das cenas. Respeita "Narração" e
 * "Mostrar o Bonzi" dos ajustes, como a voz do Bonzi. Devolve `listen` para o botão "Ouvir".
 */
export function useGuideVoice(text: string | null, bonziLine: string): () => void {
  const { settings, hydrated } = useSettings();
  const enabled = hydrated && settings.showBonzi && settings.narrationEnabled;
  const volumeRef = useRef(settings.volume);
  const bonziRef = useRef(bonziLine);
  const message = text?.trim() ?? "";

  useEffect(() => {
    volumeRef.current = settings.volume;
    bonziRef.current = bonziLine;
  });

  useEffect(() => {
    if (!enabled || !message) return;
    let active = true;
    const timer = window.setTimeout(() => {
      whenIdle(20000)
        .then(() => (active ? yieldBackground() : undefined))
        .then(() => {
          if (!active || same(message, bonziRef.current)) return;
          narrationService.speak(message, { volume: volumeRef.current, owner: OWNER, background: true }).catch(() => undefined);
        });
    }, SETTLE_MS);
    // texto novo não corta a leitura do anterior (ela termina a frase e cede a vez); a troca de cena corta (useBonziLine)
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [message, enabled]);

  // o painel saiu da tela: a leitura dele para
  useEffect(() => () => narrationService.stop(OWNER), []);

  return useCallback(() => {
    if (!message) return;
    narrationService
      .speak(message, { enabled: settings.narrationEnabled, volume: volumeRef.current, owner: OWNER, background: true })
      .catch(() => undefined);
  }, [message, settings.narrationEnabled]);
}

/** Botão "Ouvir" ao lado de uma instrução escrita: lê o texto de novo. */
export function ListenButton({ onListen, className }: { onListen: () => void; className?: string }) {
  return (
    <button type="button" className={cx(styles.listen, className)} onClick={onListen} aria-label="Ouvir esta instrução">
      <Sprite src={SPRITES.ui.soundOn} alt="" decorative size={14} />
      <span>Ouvir</span>
    </button>
  );
}
