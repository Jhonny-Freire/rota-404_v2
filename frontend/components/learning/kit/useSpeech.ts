"use client";

import { useCallback, useEffect, useRef } from "react";
import { isSpeaking, whenIdle } from "@/services/narrationService";

const MS_PER_CHAR = 65;
const START_MS = 150;

/**
 * Espera uma fala do Bonzi terminar DE VERDADE (fim do áudio), em vez de estimar a duração. Use para encadear falas
 * e ações numa cena sem cortar o Bonzi:
 *
 *   say(LINE_A); await afterSpeech(LINE_A); mostrar algo; say(LINE_B); ...
 *
 * Sem voz (narração desligada ou sem suporte) espera o tempo de leitura (~65 ms por letra). A promessa nunca resolve
 * depois que a cena sai da tela, então o código seguinte não roda num componente desmontado.
 */
export function useSpeech() {
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const afterSpeech = useCallback(
    (line: string) =>
      new Promise<void>((resolve) => {
        const settle = () => {
          if (alive.current) resolve();
        };
        window.setTimeout(() => {
          if (isSpeaking()) whenIdle().then(settle);
          else window.setTimeout(settle, Math.max(0, line.length * MS_PER_CHAR - START_MS));
        }, START_MS);
      }),
    [],
  );

  /** pausa simples (ms) que também não resolve depois de desmontar */
  const pause = useCallback(
    (ms: number) =>
      new Promise<void>((resolve) => {
        window.setTimeout(() => {
          if (alive.current) resolve();
        }, ms);
      }),
    [],
  );

  return { afterSpeech, pause };
}
