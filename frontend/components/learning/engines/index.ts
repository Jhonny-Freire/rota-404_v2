import type { EngineLoader } from "../runtime/types";

/**
 * Registro dos motores: chave = content.engine (aula) / config.engine (laboratório) = slug do planeta.
 * Liberados: as duas galáxias inteiras (G1 "Internet e Web" e G2 "API REST", 32 planetas). Planetas sem motor
 * registrado abrem em modo prévia.
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
  /* S3 - Navegador e páginas Web */
  "o-que-acontece-quando-acesso-um-site": () => import("./o-que-acontece-quando-acesso-um-site"),
  "html-os-blocos-de-uma-pagina": () => import("./html-os-blocos-de-uma-pagina"),
  "monte-sua-pagina": () => import("./monte-sua-pagina"),
  "conserte-a-pagina": () => import("./conserte-a-pagina"),
  /* S4 - Comunicação e segurança */
  "como-as-informacoes-viajam": () => import("./como-as-informacoes-viajam"),
  "http-e-https": () => import("./http-e-https"),
  "detetive-digital": () => import("./detetive-digital"),
  "missao-navegacao-segura": () => import("./missao-navegacao-segura"),
  /* Galáxia 2 "API REST" — Assunto 1: Conhecendo uma API */
  "sistemas-que-conversam": () => import("./sistemas-que-conversam"),
  "cliente-servidor-e-api": () => import("./cliente-servidor-e-api"),
  "faca-uma-pergunta-ao-servidor": () => import("./faca-uma-pergunta-ao-servidor"),
  "o-servidor-respondeu": () => import("./o-servidor-respondeu"),
  /* Galáxia 2 — Assunto 2: Requisições HTTP */
  "como-pedir-uma-informacao": () => import("./como-pedir-uma-informacao"),
  "get-post-put-e-delete": () => import("./get-post-put-e-delete"),
  "qual-metodo-devo-usar": () => import("./qual-metodo-devo-usar"),
  "encontre-o-problema": () => import("./encontre-o-problema"),
  /* Galáxia 2 — Assunto 3: Entendendo os dados */
  "o-que-e-json": () => import("./o-que-e-json"),
  "lendo-uma-resposta": () => import("./lendo-uma-resposta"),
  "caca-ao-dado": () => import("./caca-ao-dado"),
  "monte-a-resposta": () => import("./monte-a-resposta"),
  /* Galáxia 2 — Assunto 4: API em situações reais */
  "api-em-um-aplicativo": () => import("./api-em-um-aplicativo"),
  "quando-algo-da-errado": () => import("./quando-algo-da-errado"),
  "diagnostico-da-api": () => import("./diagnostico-da-api"),
  "desafio-final-missao-api": () => import("./desafio-final-missao-api"),
};

export const ENGINE_KEYS = Object.keys(ENGINES);

export function hasEngine(key: string | null | undefined): key is string {
  return Boolean(key && Object.prototype.hasOwnProperty.call(ENGINES, key));
}

export function getEngineLoader(key: string | null | undefined): EngineLoader | null {
  return hasEngine(key) ? ENGINES[key] : null;
}
