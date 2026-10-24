"use client";

import type { LessonEngineMeta, LessonEngineProps } from "@/components/learning/runtime/types";
import { PlaceholderLessonEngine } from "@/components/learning/runtime/placeholders";

export const meta: LessonEngineMeta = {
  kind: "lesson",
  scenes: ["Página pronta", "Separação", "HTML visual", "Montagem", "Microteste"],
};

/** STUB 3.2 — substituir pelo motor real (G1 - Internet e Web/S3 - Navegador e páginas Web/aula3-2.md). */
export default function HtmlOsBlocosDeUmaPagina(props: LessonEngineProps) {
  return <PlaceholderLessonEngine {...props} meta={meta} code="3.2" />;
}
