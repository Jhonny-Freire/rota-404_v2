import type { LessonEngineProps } from "@/components/learning/runtime";
import type { CatalogRow, HttpMethod, RowState } from "../_api/http";

export type SceneProps = Pick<LessonEngineProps, "say" | "setCanAdvance" | "setHint" | "reducedMotion" | "next">;

/** Fala do Bonzi: LITERAL de faixa14-completa.md (Planeta 2.2). */
export const LINES = {
  intents: "Essas são as intenções mais comuns em APIs REST. O efeito exato depende das regras da API, mas o método ajuda o servidor a entender o que o cliente quer fazer.",
} as const;

/** As quatro intenções: textos LITERAIS do .md (lidos pelo Bonzi um de cada vez). */
export const INTENTS: { method: HttpMethod; name: string; text: string }[] = [
  { method: "GET", name: "consultar", text: "busca um recurso sem pedir sua alteração." },
  { method: "POST", name: "enviar/criar", text: "envia dados para criar um recurso ou executar uma operação definida pela API." },
  { method: "PUT", name: "substituir/atualizar", text: "envia uma representação para substituir ou atualizar um recurso, conforme as regras da API." },
  { method: "DELETE", name: "remover", text: "solicita a remoção de um recurso." },
];

/* falas criadas: o .md não define falas para a Demonstração, a Microinteração e o Fechamento */
export const EXTRA_LINES = {
  demo: "Agora toque em cada método e veja o que acontece com o catálogo. Você pode reiniciar quando quiser.",
  demoDone: "Você testou os quatro métodos!",
  match: "Ligue cada pedido ao método que combina com a intenção dele.",
  matchRight: "Isso! O método combina com a intenção.",
  matchDone: "Muito bem! Cada pedido está com o seu método.",
  closing: "GET consulta, POST envia ou cria, PUT substitui ou atualiza e DELETE remove.",
} as const;

/** Catálogo fictício inicial da Demonstração. */
export const START_ROWS: CatalogRow[] = [
  { id: 1, name: "Teclado", price: 120 },
  { id: 2, name: "Mouse", price: 60 },
  { id: 3, name: "Monitor", price: 900 },
];

export type Demo = {
  method: HttpMethod;
  path: string;
  /** dados enviados (POST/PUT), mostrados abaixo da linha */
  body?: string;
  line: string;
  result: string;
  apply: (rows: CatalogRow[]) => CatalogRow[];
  states: (rows: CatalogRow[]) => Record<number, RowState>;
  changedField?: "name" | "price";
};

/** Demonstração (.md): consultar produto, registrar produto, atualizar dados de um produto e remover um produto. */
export const DEMOS: Record<HttpMethod, Demo> = {
  GET: {
    method: "GET",
    path: "/products/2",
    line: "GET consulta: o servidor mostrou o produto 2, e o catálogo não mudou.",
    result: "Produto 2 encontrado: Mouse, R$ 60. Nada mudou no catálogo.",
    apply: (rows) => rows,
    states: () => ({ 2: "lit" }),
  },
  POST: {
    method: "POST",
    path: "/products",
    body: "nome: Fone · preço: 90",
    line: "POST envia dados: um produto novo foi registrado no catálogo.",
    result: "Produto novo registrado: Fone, R$ 90.",
    apply: (rows) => (rows.some((r) => r.name === "Fone") ? rows : [...rows, { id: 4, name: "Fone", price: 90 }]),
    states: (rows) => {
      const fone = rows.find((r) => r.name === "Fone");
      return fone ? { [fone.id]: "new" } : {};
    },
  },
  PUT: {
    method: "PUT",
    path: "/products/1",
    body: "nome: Teclado · preço: 110",
    line: "PUT atualiza: os dados do produto 1 foram substituídos pelos novos.",
    result: "Produto 1 atualizado: o preço agora é R$ 110.",
    apply: (rows) => rows.map((r) => (r.id === 1 ? { ...r, name: "Teclado", price: 110 } : r)),
    states: (rows): Record<number, RowState> => (rows.some((r) => r.id === 1) ? { 1: "changed" } : {}),
    changedField: "price",
  },
  DELETE: {
    method: "DELETE",
    path: "/products/3",
    line: "DELETE remove: o produto 3 saiu do catálogo.",
    result: "Produto 3 removido do catálogo.",
    /* a linha aparece riscada por um instante e depois sai (a cena aplica com atraso) */
    apply: (rows) => rows.filter((r) => r.id !== 3),
    states: (rows): Record<number, RowState> => (rows.some((r) => r.id === 3) ? { 3: "removed" } : {}),
  },
};

/** Microinteração (.md): os quatro pedidos e o método de cada um. */
export const MATCH_ZONES = [
  { id: "GET", name: "GET", need: "GET serve para consultar, sem pedir alteração." },
  { id: "POST", name: "POST", need: "POST envia dados para criar algo novo." },
  { id: "PUT", name: "PUT", need: "PUT substitui ou atualiza os dados de algo que já existe." },
  { id: "DELETE", name: "DELETE", need: "DELETE pede a remoção de algo." },
];
export const MATCH_PIECES = [
  { id: "ver", label: "ver produto", element: "magnifier" as const, zone: "GET" },
  { id: "registrar", label: "registrar produto", element: "box" as const, zone: "POST" },
  { id: "alterar", label: "alterar dados do produto", element: "receipt" as const, zone: "PUT" },
  { id: "remover", label: "remover produto", element: "boxEmpty" as const, zone: "DELETE" },
];
