"use client";

import type { LabEngineMeta, LabEngineProps } from "@/components/learning/runtime/types";
import { PlaceholderLabEngine } from "@/components/learning/runtime/placeholders";

export const meta: LabEngineMeta = {
  kind: "lab",
  steps: ["Estrutura", "Conteúdo", "Elemento visual", "Ação", "Visualização"],
};

/** STUB 3.3 — substituir pelo motor real (G1 - Internet e Web/S3 - Navegador e páginas Web/lab3-3.md). */
export default function MonteSuaPagina(props: LabEngineProps) {
  return <PlaceholderLabEngine {...props} meta={meta} code="3.3" />;
}
