import type { EngineLoader } from "../runtime/types";

/**
 * Registro dos motores: chave = content.engine (aula) / config.engine (laboratório) = slug do planeta.
 * Liberados: Sistema 1 (Dispositivos e conexão) e Sistema 2 (Endereços e sites). Os demais planetas
 * (S3, S4...) ainda não estão registrados e abrem em modo prévia.
 */
export const ENGINES: Record<string, EngineLoader> = {
  /* S1 - Dispositivos e conexão */
  "o-que-e-uma-rede": () => import("./o-que-e-uma-rede"),
  "como-meu-dispositivo-chega-a-internet": () => import("./como-meu-dispositivo-chega-a-internet"),
  "conectando-uma-rede": () => import("./conectando-uma-rede"),
  "missao-recuperar-a-conexao": () => import("./missao-recuperar-a-conexao"),
  /* S2 - Endereços e sites */
  "todo-dispositivo-precisa-de-um-endereco": () => import("./todo-dispositivo-precisa-de-um-endereco"),
  "ip-dominio-e-site": () => import("./ip-dominio-e-site"),
  "encontrando-o-destino": () => import("./encontrando-o-destino"),
  "missao-encontrar-o-servidor": () => import("./missao-encontrar-o-servidor"),
};

export const ENGINE_KEYS = Object.keys(ENGINES);

export function hasEngine(key: string | null | undefined): key is string {
  return Boolean(key && Object.prototype.hasOwnProperty.call(ENGINES, key));
}

export function getEngineLoader(key: string | null | undefined): EngineLoader | null {
  return hasEngine(key) ? ENGINES[key] : null;
}
