"use client";

import type { LessonEngineMeta, LessonEngineProps } from "@/components/learning/runtime/types";
import { PlaceholderLessonEngine } from "@/components/learning/runtime/placeholders";

export const meta: LessonEngineMeta = {
  kind: "lesson",
  scenes: ["Quero acessar um site", "Fazendo o pedido", "Conhecendo o servidor", "Enviando a resposta", "O site aparece!", "Microinteração", "Fechamento"],
};

/** STUB 3.1 — substituir pelo motor real (G1 - Internet e Web/S3 - Navegador e páginas Web/aula3-1.md). */
export default function OQueAconteceQuandoAcessoUmSite(props: LessonEngineProps) {
  return <PlaceholderLessonEngine {...props} meta={meta} code="3.1" />;
}
