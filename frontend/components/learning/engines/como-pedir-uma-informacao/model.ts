import type { LessonEngineProps } from "@/components/learning/runtime";
import type { UrlPart } from "../_api/http";

export type SceneProps = Pick<LessonEngineProps, "say" | "setCanAdvance" | "setHint" | "reducedMotion" | "next">;

/** Falas do Bonzi: LITERAIS de faixa14-completa.md (Planeta 2.1). */
export const LINES = {
  url: "URL é o endereço completo usado para localizar um recurso. Ela pode incluir o protocolo, o domínio e o caminho.",
  endpoint: "Endpoint é um ponto de acesso oferecido pela API. O caminho indica qual recurso queremos acessar; combinado ao método HTTP, indica a operação solicitada.",
  http: "HTTP é um conjunto de regras usado para trocar requisições e respostas na Web. Uma requisição inclui uma operação, como GET, e o endereço do recurso.",
} as const;

/* falas criadas: o .md não define falas para a Microinteração e o Fechamento */
export const EXTRA_LINES = {
  quiz: "Sua missão: buscar o produto 42. Digite o caminho certo, usando os endpoints da lista.",
  quizRight: "Parabéns! Esse é o caminho do produto 42.",
  closing: "URL é o endereço completo, endpoint é o ponto de acesso da API e HTTP são as regras de requisição e resposta.",
} as const;

/** A URL fictícia do .md, em partes. */
export const URL_PARTS: UrlPart[] = [
  { key: "protocol", text: "https://" },
  { key: "domain", text: "api.exemplo.test" },
  { key: "path", text: "/users/42" },
];

/** O que cada parte indica: textos do .md (Cena 1). */
export const PART_NOTES: Record<string, string> = {
  protocol: "indica uma conexão HTTPS, que protege a comunicação com criptografia",
  domain: "domínio/servidor ao qual o cliente se dirige",
  path: "caminho até o recurso solicitado",
};

/** Microinteração: os endpoints fictícios do .md. */
export const ENDPOINTS = [
  { path: "/users/", name: "usuários" },
  { path: "/products/", name: "produtos" },
  { path: "/ratings/", name: "avaliações" },
];

/** `missing`: o recurso não existe nesta API (vale a conquista secreta S-02, "endereço que não existe") */
export type PathCheck = { ok: boolean; message: string; missing?: boolean };

/**
 * Confere o caminho digitado para "buscar o produto 42" e diz ONDE está o erro (recurso, número ou formato). Aceita
 * com ou sem a barra do começo/fim e até a URL completa.
 */
export function checkPath(raw: string): PathCheck {
  let value = raw.trim().toLowerCase().replace(/\s+/g, "");
  value = value.replace(/^https?:\/\//, "").replace(/^api\.exemplo\.test/, "");
  if (!value) return { ok: false, message: "Digite um caminho, por exemplo começando com uma barra." };
  if (!value.startsWith("/")) value = `/${value}`;
  value = value.replace(/\/+$/, "");
  const match = value.match(/^\/([a-z0-9_-]+)(?:\/(.*))?$/);
  if (!match) return { ok: false, message: "Escreva o caminho como os da lista: o recurso e depois o número." };
  const [, resource, id] = match;
  const known = ENDPOINTS.find((e) => e.path === `/${resource}/`);
  if (!known) return { ok: false, missing: true, message: `O recurso /${resource}/ não existe nesta API. Use um dos endpoints da lista.` };
  if (resource !== "products") return { ok: false, message: `O recurso está errado: /${resource}/ guarda ${known.name}, e a missão pede um produto.` };
  if (!id) return { ok: false, message: "O recurso está certo, mas falta o número do produto depois da barra." };
  if (id !== "42") return { ok: false, message: `O recurso está certo, mas o número está errado: a missão pede o produto 42${/^\d+$/.test(id) ? `, não o ${id}` : ""}.` };
  return { ok: true, message: "Isso! /products/42 é o produto 42." };
}
