"use client";

import type { LabEngineMeta, LabEngineProps } from "@/components/learning/runtime/types";
import { PlaceholderLabEngine } from "@/components/learning/runtime/placeholders";

export const meta: LabEngineMeta = {
  kind: "lab",
  steps: ["Senha", "Permissão", "Perfil público", "Computador compartilhado", "Pedir ajuda"],
};

/** STUB 4.4 — substituir pelo motor real (G1 - Internet e Web/S4 - Comunicação e segurança/lab4-4.md). */
export default function MissaoNavegacaoSegura(props: LabEngineProps) {
  return <PlaceholderLabEngine {...props} meta={meta} code="4.4" />;
}
