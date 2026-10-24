"use client";

import type { LessonEngineMeta, LessonEngineProps } from "@/components/learning/runtime/types";
import { PlaceholderLessonEngine } from "@/components/learning/runtime/placeholders";

export const meta: LessonEngineMeta = {
  kind: "lesson",
  scenes: ["Entrando em uma conta", "Enviando a requisição", "O servidor recebe o pedido", "O servidor responde", "O resultado aparece", "Microinteração", "Fechamento"],
};

/** STUB 4.1 — substituir pelo motor real (G1 - Internet e Web/S4 - Comunicação e segurança/aula4-1.md). */
export default function ComoAsInformacoesViajam(props: LessonEngineProps) {
  return <PlaceholderLessonEngine {...props} meta={meta} code="4.1" />;
}
