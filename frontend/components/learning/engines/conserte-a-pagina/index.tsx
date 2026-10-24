"use client";

import type { LabEngineMeta, LabEngineProps } from "@/components/learning/runtime/types";
import { PlaceholderLabEngine } from "@/components/learning/runtime/placeholders";

export const meta: LabEngineMeta = {
  kind: "lab",
  steps: ["Observar", "Tocar no erro", "Corrigir", "Testar"],
};

/** STUB 3.4 — substituir pelo motor real (G1 - Internet e Web/S3 - Navegador e páginas Web/lab3-4.md). */
export default function ConserteAPagina(props: LabEngineProps) {
  return <PlaceholderLabEngine {...props} meta={meta} code="3.4" />;
}
