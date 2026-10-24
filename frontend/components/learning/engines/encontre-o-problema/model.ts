import type { ElementKey, KitTone, SeededRandom } from "@/components/learning/kit";
import { METHODS, type HttpMethod } from "../_api/http";

export type Phase = "inspect" | "sending" | "right" | "wrong" | "done";

/** Índices de meta.steps (as 4 etapas do .md). */
export const STEP = { goal: 0, inspect: 1, fix: 2, test: 3 } as const;

export type ResourceId = "products" | "users" | "orders" | "comments";
export const RESOURCE_IDS: ResourceId[] = ["products", "users", "orders", "comments"];
export const RESOURCES: Record<ResourceId, { name: string; one: string; element: ElementKey }> = {
  products: { name: "produtos", one: "produto", element: "box" },
  users: { name: "usuários", one: "usuário", element: "person" },
  orders: { name: "pedidos", one: "pedido", element: "receipt" },
  comments: { name: "comentários", one: "comentário", element: "mail" },
};

/** O que cada método pede (Aula 2.2). */
export const INTENT: Record<HttpMethod, string> = {
  GET: "consultar",
  POST: "enviar/criar algo novo",
  PUT: "substituir/atualizar",
  DELETE: "remover",
};

export type Request = { method: HttpMethod; resource: ResourceId; id: number };

export type Mission = {
  /** objetivo (Etapa 1), no estilo do exemplo do .md: "Atualize o produto 42" */
  goal: string;
  verb: string;
  answer: Request;
  done: string;
};

/** Missões fictícias (o .md dá o exemplo "Atualize o produto 42"). */
export const MISSIONS: Mission[] = [
  { goal: "Atualize o produto 42", verb: "atualizar", answer: { method: "PUT", resource: "products", id: 42 }, done: "Produto 42 atualizado." },
  { goal: "Consulte o usuário 7", verb: "consultar", answer: { method: "GET", resource: "users", id: 7 }, done: "Dados do usuário 7 recebidos." },
  { goal: "Remova o comentário 15", verb: "remover", answer: { method: "DELETE", resource: "comments", id: 15 }, done: "Comentário 15 removido." },
  { goal: "Consulte o pedido 30", verb: "consultar", answer: { method: "GET", resource: "orders", id: 30 }, done: "Dados do pedido 30 recebidos." },
  { goal: "Atualize o usuário 12", verb: "atualizar", answer: { method: "PUT", resource: "users", id: 12 }, done: "Usuário 12 atualizado." },
  { goal: "Remova o produto 8", verb: "remover", answer: { method: "DELETE", resource: "products", id: 8 }, done: "Produto 8 removido." },
];

/** Dificuldade do .md: 1. método incorreto · 2. endpoint incorreto · 3. ID incorreto · 4. um ou mais incorretos. */
export type Flaw = "method" | "resource" | "id" | "mixed";
export const FLAWS: Flaw[] = ["method", "resource", "id", "mixed"];

export type Round = { mission: Mission; start: Request; ids: number[]; flaw: Flaw };

function otherMethod(rand: SeededRandom, method: HttpMethod, key: string) {
  return rand.pick(METHODS.filter((m) => m !== method), key);
}
function otherResource(rand: SeededRandom, resource: ResourceId, key: string) {
  return rand.pick(RESOURCE_IDS.filter((r) => r !== resource), key);
}

/**
 * Quatro rodadas na ordem de dificuldade, cada uma com outra missão. Na primeira visita, a rodada 1 é o exemplo do
 * .md: "Atualize o produto 42" com GET /products/42.
 */
export function buildRounds(rand: SeededRandom, attempt: number): Round[] {
  const pool = rand.shuffle(MISSIONS.slice(1), "missoes");
  const missions = attempt === 0 ? [MISSIONS[0], ...pool.slice(0, 3)] : rand.shuffle(MISSIONS, "todas").slice(0, 4);
  return FLAWS.map((flaw, index) => {
    const mission = missions[index];
    const a = mission.answer;
    const wrongId = a.id + rand.pick([-1, 1, 10], `id-${index}`);
    let start: Request = { ...a };
    if (flaw === "method") start = { ...a, method: attempt === 0 && index === 0 ? "GET" : otherMethod(rand, a.method, `m-${index}`) };
    if (flaw === "resource") start = { ...a, resource: otherResource(rand, a.resource, `r-${index}`) };
    if (flaw === "id") start = { ...a, id: wrongId };
    if (flaw === "mixed") {
      const both = rand.chance(0.5, `mix-${index}`);
      start = { method: otherMethod(rand, a.method, `mm-${index}`), resource: both ? otherResource(rand, a.resource, `mr-${index}`) : a.resource, id: both ? a.id : wrongId };
    }
    const ids = rand.shuffle([...new Set([a.id, wrongId, a.id + 2])], `ids-${index}`);
    return { mission, start, ids, flaw };
  });
}

export function pathOf(req: Request) {
  return `/${req.resource}/${req.id}`;
}

/** Etapa 4: explica se o problema está no método, no caminho, no ID — ou em mais de um. */
export function diagnose(req: Request, mission: Mission): string[] {
  const a = mission.answer;
  const problems: string[] = [];
  if (req.method !== a.method) problems.push(`no método: ${req.method} serve para ${INTENT[req.method]}, mas a missão pede para ${mission.verb}`);
  if (req.resource !== a.resource) problems.push(`no caminho: /${req.resource}/ aponta para ${RESOURCES[req.resource].name}, mas a missão é sobre ${RESOURCES[a.resource].name}`);
  if (req.id !== a.id) problems.push(`no ID: ${req.id} não é o ${RESOURCES[a.resource].one} da missão`);
  return problems;
}

export function explain(problems: string[]): string {
  if (problems.length === 1) return `O problema está ${problems[0]}.`;
  return `Há ${problems.length} problemas: ${problems.map((p, i) => `${i + 1}) ${p}`).join("; ")}.`;
}

/* falas e textos criados (o .md descreve as etapas sem falas) */
export const TEXT = {
  intro: "Esta requisição não faz o que a missão pede. Inspecione as partes, corrija e toque em ENVIAR.",
  round: (n: number) => `Missão ${n} de 4. Leia o objetivo e inspecione a requisição.`,
  inspectFb: "Toque no método, no caminho ou no ID para inspecionar. Corrija na área de interação e toque em ENVIAR.",
  right: "Operação concluída!",
  done: "Você corrigiu requisições usando o que aprendeu, sem escrever código nem criar uma API real.",
  doneFb: "Você corrigiu métodos, caminhos e IDs das requisições.",
} as const;

export type BannerSpec = { text: string; tone: KitTone; icon: ElementKey };

export const BANNER: Record<string, BannerSpec> = {
  goal: { text: "Encontre o problema", tone: "warning", icon: "magnifier" },
  sending: { text: "Enviando...", tone: "info", icon: "mail" },
  right: { text: "Operação concluída", tone: "success", icon: "ok" },
  wrong: { text: "Ainda tem problema", tone: "danger", icon: "error" },
  done: { text: "Requisições corrigidas!", tone: "success", icon: "ok" },
};

export const TIMING = { sending: 1000, nextRound: 3400, finish: 2600 };
