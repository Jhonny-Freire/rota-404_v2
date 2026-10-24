"use client";

import type { LessonEngineMeta, LessonEngineProps } from "@/components/learning/runtime/types";
import { PlaceholderLessonEngine } from "@/components/learning/runtime/placeholders";

export const meta: LessonEngineMeta = {
  kind: "lesson",
  scenes: ["Enviando uma informação", "Sem proteção", "Protegendo a comunicação", "HTTP e HTTPS", "O cadeado", "Encerramento"],
};

/** STUB 4.2 — substituir pelo motor real (G1 - Internet e Web/S4 - Comunicação e segurança/aula4-2.md). */
export default function HttpEHttps(props: LessonEngineProps) {
  return <PlaceholderLessonEngine {...props} meta={meta} code="4.2" />;
}
