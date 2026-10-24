"use client";

import type { LabEngineMeta, LabEngineProps } from "@/components/learning/runtime/types";
import { PlaceholderLabEngine } from "@/components/learning/runtime/placeholders";

export const meta: LabEngineMeta = {
  kind: "lab",
  steps: ["Analisar as evidências", "Classificar", "Descobrir os indícios", "Revisar os casos"],
};

/** STUB 4.3 — substituir pelo motor real (G1 - Internet e Web/S4 - Comunicação e segurança/lab4-3.md). */
export default function DetetiveDigital(props: LabEngineProps) {
  return <PlaceholderLabEngine {...props} meta={meta} code="4.3" />;
}
