"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

/** Mesma velocidade de antes (1 letra a cada 24 ms), com metade dos ticks: 2 letras a cada 48 ms. */
const TICK_MS = 48;
const CHARS_PER_TICK = 2;

const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export type Typewriter = {
  /** ref (callback) do <span> que recebe o texto digitado. Deixe o span SEM filhos no JSX. */
  typedRef: (el: HTMLElement | null) => void;
  /** true enquanto ainda faltam letras */
  typing: boolean;
};

/**
 * Texto aparecendo letra por letra, escrito direto no DOM: o componente só re-renderiza no começo e no fim da
 * digitação (antes era um setState a cada letra, ~42 renders/s do Bonzi inteiro durante cada fala).
 * Recomeça quando `text` ou `resetKey` mudam; com `animate` falso o texto aparece inteiro na hora.
 * O span pode montar/desmontar no meio (balão fechado e reaberto): ele recebe o que já foi digitado.
 */
export function useTypewriter(text: string, resetKey: unknown, animate: boolean): Typewriter {
  const elRef = useRef<HTMLElement | null>(null);
  const textRef = useRef(text);
  const shownRef = useRef(animate ? 0 : text.length);
  const [typing, setTyping] = useState(() => animate && text.length > 0);

  const write = useCallback(() => {
    const el = elRef.current;
    if (!el) return;
    const value = textRef.current.slice(0, shownRef.current);
    if (el.textContent !== value) el.textContent = value;
  }, []);

  const typedRef = useCallback(
    (el: HTMLElement | null) => {
      elRef.current = el;
      write();
    },
    [write],
  );

  useIsomorphicLayoutEffect(() => {
    textRef.current = text;
    if (!animate || !text) {
      shownRef.current = text.length;
      write();
      setTyping(false);
      return;
    }
    shownRef.current = 0;
    write();
    setTyping(true);
    const id = window.setInterval(() => {
      shownRef.current = Math.min(textRef.current.length, shownRef.current + CHARS_PER_TICK);
      write();
      if (shownRef.current >= textRef.current.length) {
        window.clearInterval(id);
        setTyping(false);
      }
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [text, resetKey, animate, write]);

  return { typedRef, typing };
}

export default useTypewriter;
