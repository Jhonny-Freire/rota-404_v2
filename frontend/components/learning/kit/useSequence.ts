"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/** Duração (ms) usada no lugar de passos de animação quando o movimento está reduzido. */
export const REDUCED_MOTION_MS = 0;

/**
 * Passo de uma sequência:
 * - `number`: duração de ANIMAÇÃO em ms (vira ~0 com movimento reduzido);
 * - `{ hold: ms }`: pausa de LEITURA (mantida mesmo com movimento reduzido).
 */
export type SequenceStep = number | { hold: number };

export type SequenceOptions = {
  /** false pausa no passo atual; voltar a true reinicia do passo 0. Padrão true. */
  play?: boolean;
  /** força o modo de movimento reduzido (padrão: ajuste do usuário/sistema) */
  reducedMotion?: boolean;
  /** chamado ao entrar em cada passo (1..steps.length) */
  onStep?: (step: number) => void;
  /** chamado uma vez ao terminar o último passo */
  onDone?: () => void;
};

export type SequenceControls = {
  /** 0 antes do primeiro intervalo; steps.length quando terminou */
  step: number;
  done: boolean;
  /** recomeça do passo 0 */
  restart: () => void;
  /** pula para o fim (dispara onDone) */
  skipToEnd: () => void;
};

export function stepDuration(step: SequenceStep, reducedMotion: boolean): number {
  if (typeof step === "number") return reducedMotion ? REDUCED_MOTION_MS : Math.max(0, step);
  return Math.max(0, step.hold);
}

/**
 * Sequência temporizada com setTimeout (nunca depende de animationend/rAF).
 * `step` avança 0 → 1 → … → steps.length; todos os timers são limpos no unmount.
 *
 * const { step, done } = useSequence([600, 900, { hold: 1500 }], { onDone: () => setCanAdvance(true) });
 */
export function useSequence(steps: SequenceStep[], options: SequenceOptions = {}): SequenceControls {
  const systemReduced = useReducedMotion();
  const reduced = options.reducedMotion ?? systemReduced;
  const play = options.play ?? true;
  const [state, setState] = useState({ step: 0, run: 0, skipped: false });
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const onStepRef = useRef(options.onStep);
  const onDoneRef = useRef(options.onDone);
  const reducedRef = useRef(reduced);
  const stepsRef = useRef(steps);
  const total = steps.length;
  const signature = steps.map((s) => (typeof s === "number" ? String(s) : `h${s.hold}`)).join(",");

  useEffect(() => {
    onStepRef.current = options.onStep;
    onDoneRef.current = options.onDone;
    reducedRef.current = reduced;
    stepsRef.current = steps;
  });

  const clear = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  useEffect(() => {
    if (!play || state.skipped) return;
    const list = stepsRef.current;
    setState((s) => (s.step === 0 ? s : { ...s, step: 0 }));
    let at = 0;
    if (list.length === 0) {
      timersRef.current.push(setTimeout(() => onDoneRef.current?.(), 0));
    }
    list.forEach((item, index) => {
      at += stepDuration(item, reducedRef.current);
      const next = index + 1;
      timersRef.current.push(
        setTimeout(() => {
          setState((s) => ({ ...s, step: next }));
          onStepRef.current?.(next);
          if (next === list.length) onDoneRef.current?.();
        }, at),
      );
    });
    return clear;
  }, [play, signature, state.run, state.skipped, clear]);

  const restart = useCallback(() => {
    clear();
    setState((s) => ({ step: 0, run: s.run + 1, skipped: false }));
  }, [clear]);

  const skipToEnd = useCallback(() => {
    clear();
    setState((s) => ({ step: total, run: s.run + 1, skipped: true }));
    onStepRef.current?.(total);
    onDoneRef.current?.();
  }, [clear, total]);

  return { step: state.step, done: state.step >= total, restart, skipToEnd };
}

export type TimerOptions = {
  /** pausa de leitura: não é encurtada com movimento reduzido */
  hold?: boolean;
};

export type Timers = {
  /** agenda `fn` depois de `ms` (encurtado com movimento reduzido, salvo `hold`); retorna o cancelador */
  after: (ms: number, fn: () => void, options?: TimerOptions) => () => void;
  /** cancela todos os timers pendentes */
  clearAll: () => void;
};

/**
 * Timers avulsos para reações a eventos (ex.: limpar um erro depois de 1 s).
 * Objeto estável; tudo é cancelado no unmount.
 */
export function useTimers(options: { reducedMotion?: boolean } = {}): Timers {
  const systemReduced = useReducedMotion();
  const reducedRef = useRef(options.reducedMotion ?? systemReduced);
  const timersRef = useRef(new Set<ReturnType<typeof setTimeout>>());

  useEffect(() => {
    reducedRef.current = options.reducedMotion ?? systemReduced;
  });

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach(clearTimeout);
      timers.clear();
    };
  }, []);

  return useMemo<Timers>(
    () => ({
      after: (ms, fn, opts) => {
        const delay = opts?.hold ? Math.max(0, ms) : reducedRef.current ? REDUCED_MOTION_MS : Math.max(0, ms);
        const id = setTimeout(() => {
          timersRef.current.delete(id);
          fn();
        }, delay);
        timersRef.current.add(id);
        return () => {
          clearTimeout(id);
          timersRef.current.delete(id);
        };
      },
      clearAll: () => {
        timersRef.current.forEach(clearTimeout);
        timersRef.current.clear();
      },
    }),
    [],
  );
}
