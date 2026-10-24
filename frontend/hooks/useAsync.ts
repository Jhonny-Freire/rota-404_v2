"use client";

import { useCallback, useEffect, useState } from "react";
import { isNotFound, isNotImplemented } from "@/services/apiClient";

export type AsyncState<T> = {
  data?: T;
  error?: unknown;
  loading: boolean;
  notImplemented: boolean;
  notFound: boolean;
  reload: () => void;
};

export type AsyncOptions = {
  /**
   * Guarda o resultado em memória com esta chave (inclua nela tudo de que `fn` depende, ex.: `system:${slug}`).
   * Ao voltar a uma página já visitada, o conteúdo aparece direto, sem passar pelo "Carregando".
   * Use só para dados do catálogo (não para progresso, pontos ou ranking). `undefined` = sem cache.
   */
  cacheKey?: string;
};

/** Mesmo TTL do cache de GET do apiClient. */
const RESULT_TTL_MS = 5 * 60 * 1000;
const MAX_RESULTS = 60;
const results = new Map<string, { data: unknown; at: number }>();

function readResult<T>(key: string | undefined): { data: T } | undefined {
  if (!key) return undefined;
  const hit = results.get(key);
  if (!hit) return undefined;
  if (Date.now() - hit.at >= RESULT_TTL_MS) {
    results.delete(key);
    return undefined;
  }
  return { data: hit.data as T };
}

function writeResult(key: string, data: unknown): void {
  results.delete(key);
  results.set(key, { data, at: Date.now() });
  if (results.size > MAX_RESULTS) {
    const oldest = results.keys().next().value;
    if (oldest !== undefined) results.delete(oldest);
  }
}

type InnerState<T> = { data?: T; error?: unknown; loading: boolean };

export function useAsync<T>(fn: () => Promise<T>, deps: unknown[], options: AsyncOptions = {}): AsyncState<T> {
  const { cacheKey } = options;
  const [state, setState] = useState<InnerState<T>>(() => {
    const hit = readResult<T>(cacheKey);
    return hit ? { data: hit.data, loading: false } : { loading: true };
  });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const hit = readResult<T>(cacheKey);
    if (hit) {
      setState((prev) => (prev.data === hit.data && !prev.loading && prev.error === undefined ? prev : { data: hit.data, loading: false }));
      return;
    }
    let active = true;
    setState((prev) => (prev.loading && prev.data === undefined && prev.error === undefined ? prev : { loading: true }));
    fn().then(
      (data) => {
        if (cacheKey) writeResult(cacheKey, data);
        if (active) setState({ data, loading: false });
      },
      (error: unknown) => {
        if (active) setState({ error, loading: false });
      },
    );
    return () => {
      active = false;
    };
    // `fn` é recriada a cada render; quem chama declara as dependências reais em `deps`
  }, [...deps, cacheKey, attempt]);

  const reload = useCallback(() => {
    if (cacheKey) results.delete(cacheKey);
    setAttempt((n) => n + 1);
  }, [cacheKey]);

  return {
    data: state.data,
    error: state.error,
    loading: state.loading,
    notImplemented: isNotImplemented(state.error),
    notFound: isNotFound(state.error),
    reload,
  };
}

export default useAsync;
