"use client";

import { useMemo, useState } from "react";

export type SeededRandom = {
  /** semente efetiva (tentativa + sessão + sal) */
  seed: number;
  /** número em [0, 1) — mesmo `key` ⇒ mesmo valor para a mesma semente */
  float: (key?: string) => number;
  /** inteiro em [min, max] (inclusivo) */
  int: (min: number, max: number, key?: string) => number;
  /** um item da lista */
  pick: <T>(list: readonly T[], key?: string) => T;
  /** cópia embaralhada; `avoidIdentity` garante ordem diferente da original (listas com 2+ itens distintos) */
  shuffle: <T>(list: readonly T[], key?: string, avoidIdentity?: boolean) => T[];
  /** true com probabilidade p (0–1) */
  chance: (probability: number, key?: string) => boolean;
};

function hashString(input: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Gerador puro: cada chamada é determinada por (seed, key) — independe da ordem das chamadas e dos re-renders. */
export function createSeededRandom(seed: number): SeededRandom {
  const stream = (key = "") => mulberry32(hashString(`${seed}|${key}`));
  return {
    seed,
    float: (key) => stream(key)(),
    int: (min, max, key) => {
      const lo = Math.ceil(Math.min(min, max));
      const hi = Math.floor(Math.max(min, max));
      return lo + Math.floor(stream(key)() * (hi - lo + 1));
    },
    pick: (list, key) => list[Math.floor(stream(key)() * list.length)],
    shuffle: (list, key, avoidIdentity = false) => {
      const next = stream(key);
      const copy = [...list];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      if (avoidIdentity && copy.length > 1 && copy.every((item, i) => item === list[i])) {
        copy.push(copy.shift() as (typeof copy)[number]);
      }
      return copy;
    },
    chance: (probability, key) => stream(key)() < probability,
  };
}

let sessionSalt: number | null = null;

function getSessionSalt(): number {
  if (typeof window === "undefined") return 0;
  if (sessionSalt === null) {
    try {
      const buffer = new Uint32Array(1);
      window.crypto.getRandomValues(buffer);
      sessionSalt = buffer[0];
    } catch {
      sessionSalt = Date.now() >>> 0;
    }
  }
  return sessionSalt;
}

export type SeededRandomOptions = {
  /** sal extra para separar sorteios de componentes diferentes */
  salt?: string;
  /** false: mesma variação para todos (só depende de `attempt`). Padrão true: varia também a cada visita. */
  perSession?: boolean;
};

/**
 * Aleatoriedade determinística por tentativa (`attempt` do laboratório).
 * Estável entre re-renders; muda a cada "Jogar de novo". Nunca use Math.random no render.
 *
 * const rand = useSeededRandom(attempt);
 * const servers = useMemo(() => rand.shuffle(SERVERS, "servers"), [rand]);
 * const fault = rand.pick(FAULTS, "fault");
 */
export function useSeededRandom(attempt: number, options: SeededRandomOptions = {}): SeededRandom {
  const perSession = options.perSession ?? true;
  const [session] = useState(() => (perSession ? getSessionSalt() : 0));
  const salt = options.salt ?? "";
  return useMemo(() => createSeededRandom(hashString(`${session}:${attempt}:${salt}`)), [session, attempt, salt]);
}
