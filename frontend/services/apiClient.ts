/** NEXT_PUBLIC_API_URL (fixado no build) tem prioridade; vazio = não definido. */
const CONFIGURED_API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").trim().replace(/\/+$/, "");
const API_PORT = 5000;

/**
 * URL padrão da API fora do navegador (SSR) ou quando nada foi configurado. No navegador, sem
 * NEXT_PUBLIC_API_URL, a API é procurada no MESMO host da página, na porta 5000: num tablet da feira que
 * abre http://192.168.0.10:3000, as chamadas vão para http://192.168.0.10:5000/api (e não para o
 * "localhost" do próprio tablet).
 */
export const API_URL = CONFIGURED_API_URL || `http://localhost:${API_PORT}/api`;

let browserApiUrl: string | null = null;

/** Base da API para as requisições (calculada uma vez por carregamento da página). */
export function apiBaseUrl(): string {
  if (CONFIGURED_API_URL || typeof window === "undefined") return API_URL;
  if (browserApiUrl === null) {
    const { protocol, hostname } = window.location;
    browserApiUrl = hostname ? `${protocol}//${hostname}:${API_PORT}/api` : API_URL;
  }
  return browserApiUrl;
}

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export type QueryParams = Record<string, string | number | boolean | null | undefined>;

type Method = "GET" | "POST" | "PUT" | "PATCH";

/** Caminho relativo à base da API + query string normalizada (também é a chave do cache de GET). */
function relativeUrl(path: string, params?: QueryParams): string {
  const url = path.startsWith("/") ? path : `/${path}`;
  if (!params) return url;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") query.set(key, String(value));
  }
  const qs = query.toString();
  return qs ? `${url}?${qs}` : url;
}

async function request<T>(method: Method, path: string, params?: QueryParams, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";

  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl()}${relativeUrl(path, params)}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
  } catch {
    throw new ApiError(0, "network_error", "Não foi possível conectar ao servidor do Rota 404.");
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const error = (payload as { error?: { code?: string; message?: string } } | null)?.error;
    throw new ApiError(
      response.status,
      error?.code ?? "http_error",
      error?.message ?? `O servidor respondeu com erro ${response.status}.`,
    );
  }

  if (!payload || typeof payload !== "object" || !("data" in payload)) {
    throw new ApiError(response.status, "invalid_response", "Resposta inesperada do servidor.");
  }

  return (payload as { data: T }).data;
}

/* ───────── cache de GET do catálogo (navegação instantânea entre páginas já visitadas) ───────── */

/** Mesmo TTL do cache do Flask (CATALOG_CACHE_SECONDS padrão). */
const CATALOG_TTL_MS = 5 * 60 * 1000;
/** Só o catálogo (dados que não mudam durante a visita). Progresso, pontos, ranking e usuário nunca são cacheados. */
const CATALOG_PATH = /^\/(?:galaxies|systems|age-ranges|lessons|labs)(?:[/?]|$)/;

type CacheEntry = { promise: Promise<unknown>; done: boolean; at: number };
const getCache = new Map<string, CacheEntry>();

export type GetOptions = {
  /** força (true) ou desliga (false) o cache em memória. Padrão: só rotas do catálogo */
  cache?: boolean;
};

/**
 * GET JSON. Rotas do catálogo ficam em memória por 5 min: a mesma URL pedida de novo (outra página, o
 * StrictMode do dev, uma aula depois do sistema) reaproveita a resposta ou a requisição em andamento.
 * Erros não ficam no cache (a próxima tentativa vai à API).
 */
export function apiGet<T>(path: string, params?: QueryParams, options: GetOptions = {}): Promise<T> {
  const key = relativeUrl(path, params);
  const cacheable = typeof window !== "undefined" && (options.cache ?? CATALOG_PATH.test(key));
  if (!cacheable) return request<T>("GET", path, params);

  const hit = getCache.get(key);
  if (hit && (!hit.done || Date.now() - hit.at < CATALOG_TTL_MS)) return hit.promise as Promise<T>;

  const entry: CacheEntry = { promise: Promise.resolve(), done: false, at: Date.now() };
  entry.promise = request<T>("GET", path, params).then(
    (value) => {
      entry.done = true;
      entry.at = Date.now();
      return value;
    },
    (error: unknown) => {
      if (getCache.get(key) === entry) getCache.delete(key);
      throw error;
    },
  );
  getCache.set(key, entry);
  return entry.promise as Promise<T>;
}

/** Esquece as respostas guardadas (todas, ou as que começam com `prefix`, ex.: "/systems"). */
export function clearApiCache(prefix?: string): void {
  if (!prefix) {
    getCache.clear();
    return;
  }
  for (const key of [...getCache.keys()]) if (key.startsWith(prefix)) getCache.delete(key);
}

export function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return request<T>("POST", path, undefined, body ?? {});
}

export function apiPut<T>(path: string, body?: unknown): Promise<T> {
  return request<T>("PUT", path, undefined, body ?? {});
}

export function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  return request<T>("PATCH", path, undefined, body ?? {});
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function isNotImplemented(error: unknown): boolean {
  return isApiError(error) && error.status === 501;
}

export function isNotFound(error: unknown): boolean {
  return isApiError(error) && error.status === 404;
}

export function isNetworkError(error: unknown): boolean {
  return isApiError(error) && error.status === 0;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "Algo deu errado na comunicação com a base.";
}
