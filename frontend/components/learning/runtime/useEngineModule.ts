"use client";

import { useEffect, useState } from "react";
import { getEngineLoader } from "../engines";
import type { EngineModule } from "./types";

export type EngineStatus = "loading" | "ready" | "missing" | "error";

export type EngineModuleState = {
  status: EngineStatus;
  module: EngineModule | null;
  error?: unknown;
};

/**
 * Motores já carregados nesta visita: voltar a uma aula/lab mostra a cena direto, sem passar de novo pelo
 * "Preparando a cena". O loader ainda roda (é instantâneo com o chunk em memória) para pegar a versão nova
 * do módulo depois de um HMR no dev.
 */
const loaded = new Map<string, EngineModule>();

function cachedState(engineKey: string | null | undefined): EngineModuleState | null {
  const mod = engineKey ? loaded.get(engineKey) : undefined;
  return mod ? { status: "ready", module: mod } : null;
}

/** Carrega o motor pelo registro (import dinâmico, só no cliente). */
export function useEngineModule(engineKey: string | null | undefined): EngineModuleState {
  const [state, setState] = useState<EngineModuleState>(() => cachedState(engineKey) ?? { status: "loading", module: null });

  useEffect(() => {
    const loader = getEngineLoader(engineKey);
    if (!loader) {
      setState({ status: "missing", module: null });
      return;
    }
    let active = true;
    const cached = cachedState(engineKey);
    setState((prev) => {
      if (cached) return prev.status === "ready" && prev.module === cached.module ? prev : cached;
      return prev.status === "loading" && prev.module === null ? prev : { status: "loading", module: null };
    });
    loader().then(
      (mod) => {
        const component: unknown = mod?.default;
        const valid =
          (typeof component === "function" || (typeof component === "object" && component !== null)) &&
          (mod.meta?.kind === "lesson" || mod.meta?.kind === "lab");
        if (valid && engineKey) loaded.set(engineKey, mod);
        else if (engineKey) loaded.delete(engineKey);
        if (!active) return;
        setState((prev) => {
          if (!valid) return { status: "error", module: null, error: new Error("Motor inválido") };
          return prev.status === "ready" && prev.module === mod ? prev : { status: "ready", module: mod };
        });
      },
      (error: unknown) => {
        if (active) setState({ status: "error", module: null, error });
      },
    );
    return () => {
      active = false;
    };
  }, [engineKey]);

  return state;
}

export default useEngineModule;
