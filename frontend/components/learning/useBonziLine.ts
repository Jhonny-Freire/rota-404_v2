"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { narrationService, setPendingLines, whenSilent, yieldBackground } from "@/services/narrationService";
import type { BonziState } from "@/types/domain";
import { EMPTY_LINE, type NarratorLine } from "./Narrator";
import type { Say } from "./runtime/types";

type Pending = { message: string; state: BonziState; silent?: boolean };

/** a fala aparece e só depois do render a voz começa: espera isso antes de conferir se ela terminou */
const START_MS = 350;
/** pausa curta entre duas falas da fila */
const GAP_MS = 250;
/** sem voz (narração desligada), cada fala fica na tela pelo menos o tempo de leitura */
const READ_MS_PER_CHAR = 45;
/** falas esperando além da atual: com toques rápidos, as mais antigas da fila saem (a última sempre fica) */
const MAX_PENDING = 3;

/**
 * Fala do Bonzi dos shells (aula e laboratório) com FILA: uma fala nova nunca corta a que está sendo dita, ela espera
 * a atual terminar (revisão de 23/10/2026: falas eram cortadas quando a cena pedia duas seguidas ou a criança agia
 * durante a fala). Enquanto há fala na fila, `narrationService` conta o Bonzi como ocupado (`whenIdle`,
 * `useBonziSpeaking`), então o avanço de cena e a conclusão esperam a fila toda.
 * `reset` (troca de cena, "Jogar de novo") esvazia a fila e corta o que sobrou da cena anterior.
 */
export function useBonziLine() {
  const [line, setLine] = useState<NarratorLine>(EMPTY_LINE);
  const queue = useRef<Pending[]>([]);
  const current = useRef<Pending | null>(null);
  const generation = useRef(0);
  /** false depois que o shell sai da tela de verdade (a fila para) */
  const alive = useRef(true);

  const publish = () => {
    if (alive.current) setPendingLines(queue.current.length + (current.current ? 1 : 0));
  };

  const pump = useCallback(() => {
    if (current.current || !alive.current) return;
    const next = queue.current.shift();
    if (!next) {
      publish();
      return;
    }
    current.current = next;
    publish();
    const run = generation.current;
    // a leitura do painel ("O que fazer") termina a frase dela e cede a vez: ninguém é cortado no meio da frase
    yieldBackground().then(() => {
      if (run !== generation.current || !alive.current) return;
      show(next, run);
    });
  }, []);

  const show = (next: Pending, run: number) => {
    const shownAt = performance.now();
    setLine((prev) => ({ message: next.message, state: next.state, key: prev.key + 1, silent: next.silent }));
    window.setTimeout(() => {
      whenSilent().then(() => {
        const rest = Math.max(0, next.message.length * READ_MS_PER_CHAR - (performance.now() - shownAt));
        window.setTimeout(() => {
          if (run !== generation.current || !alive.current) return;
          current.current = null;
          pump();
        }, rest + GAP_MS);
      });
    }, START_MS);
  };

  /** põe uma fala na fila (a mesma fala repetida em seguida não entra duas vezes) */
  const say = useCallback<Say>(
    (message, state = "speaking", options) => {
      const last = queue.current[queue.current.length - 1] ?? current.current;
      if (last && last.message === message) return;
      queue.current.push({ message, state, silent: options?.silent });
      if (queue.current.length > MAX_PENDING) queue.current.splice(0, queue.current.length - MAX_PENDING);
      pump();
    },
    [pump],
  );

  /** troca de cena / nova tentativa: esvazia a fila e corta a fala da cena anterior */
  const reset = useCallback(() => {
    generation.current += 1;
    queue.current = [];
    current.current = null;
    publish();
    narrationService.stop();
  }, []);

  /** fala uma sequência inteira, na ordem (o "Repetir" da aula), no lugar do que estava na fila */
  const sayAll = useCallback(
    (lines: Pending[]) => {
      reset();
      queue.current = [...lines];
      pump();
    },
    [reset, pump],
  );

  /** limpa a linha (sem fala), ex.: "Jogar de novo" */
  const clear = useCallback(() => {
    reset();
    setLine(EMPTY_LINE);
  }, [reset]);

  // o shell saiu da tela: a fila dele não segura mais ninguém. Não muda `generation`: no modo de desenvolvimento o
  // React desmonta e monta de novo na hora, e a fala da abertura (já na fila) ficava presa para sempre, calando o Bonzi
  useEffect(() => {
    alive.current = true;
    publish();
    return () => {
      alive.current = false;
      setPendingLines(0);
    };
  }, []);

  return { line, say, reset, sayAll, clear };
}
