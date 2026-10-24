import type { ElementKey, KitTone, SeededRandom } from "@/components/learning/kit";
import type { HttpMethod } from "../_api/http";

export type Phase = "choose" | "sending" | "interpret" | "fix" | "read" | "present" | "done";

/** Índices de meta.steps (as 5 etapas do .md). */
export const STEP = { choose: 0, interpret: 1, fix: 2, read: 3, present: 4 } as const;

export type Product = { id: number; nome: string; preco: number };

export type Mission = {
  product: Product;
  /** o ID errado que já vem na requisição (Etapa 1 do .md: /products/999) */
  wrongId: number;
  ids: number[];
};

/** Rejogabilidade (.md): variar o produto e o endpoint incorreto. A 1ª tentativa é a do .md (produto 42, /products/999). */
export function buildMission(rand: SeededRandom, attempt: number): Mission {
  const products: Product[] = [
    { id: 42, nome: "Teclado", preco: 120 },
    { id: 17, nome: "Mouse", preco: 60 },
    { id: 8, nome: "Fone", preco: 90 },
  ];
  const product = attempt === 0 ? products[0] : products[(attempt + rand.int(0, 2, "produto")) % products.length];
  const wrongId = attempt === 0 ? 999 : rand.pick([999, product.id * 10, product.id + 1], "errado");
  const ids = rand.shuffle([...new Set([product.id, wrongId, product.id + 2])], "ids");
  return { product, wrongId, ids };
}

export const RESOURCES = ["/users/", "/products/", "/orders/"];

/** Etapa 1: por que cada método não serve para "encontrar" (Aula 2.2). */
export const METHOD_WHY: Record<HttpMethod, string> = {
  GET: "",
  POST: "POST envia dados para criar algo novo. Para encontrar um produto, a intenção é consultar.",
  PUT: "PUT substitui ou atualiza um recurso. Aqui você só quer consultar o produto.",
  DELETE: "DELETE pediria a remoção do produto! Para encontrar, a intenção é consultar.",
};

export const RESOURCE_WHY: Record<string, string> = {
  "/users/": "/users/ guarda usuários. A missão é sobre um produto.",
  "/orders/": "/orders/ guarda pedidos. A missão é sobre um produto.",
};

/** Etapa 2: a explicação do 404 (a certa é a do .md). */
export const EXPLANATIONS = [
  { id: "nao-encontrado", label: "O produto solicitado não foi encontrado nesse endereço", correct: true, why: "Isso! O 404 diz que não há recurso naquele endereço: o ID está errado." },
  { id: "falha", label: "O servidor teve uma falha interna", why: "Uma falha interna seria um 500. O 404 aponta que o recurso não foi encontrado." },
  { id: "login", label: "Faltou entrar na conta", why: "Falta de autenticação seria um 401. O 404 aponta que o recurso não foi encontrado." },
];

/* falas e textos criados (o .md descreve as etapas sem falas) */
export const TEXT = {
  intro: "Missão final! Encontre o nome e o preço do produto e mostre-os no cartão do produto.",
  chooseFb: "Escolha o método e o endpoint e toque em ENVIAR.",
  chooseWrong: (why: string) => `Ainda não. ${why}`,
  notFound: "A API respondeu 404 Not Found. O que isso quer dizer?",
  interpretFb: "Escolha a explicação do 404.",
  fix: "Agora corrija o endpoint com o ID certo e envie de novo.",
  fixFb: (id: number) => `Troque o ID para o produto ${id} e toque em ENVIAR.`,
  fixWrong: (id: number) => `Esse ID ainda não é o do produto da missão. Procure o ${id}.`,
  ok: "200 OK! A resposta chegou em JSON. Toque no nome e no preço.",
  readFb: "Toque nos valores de nome e preco no JSON.",
  readWrong: "Esse valor não é o nome nem o preço. Procure as chaves nome e preco.",
  readRight: "Isso!",
  present: "Agora arraste cada valor para o campo certo do cartão.",
  presentFb: "Arraste (ou toque e depois no campo) cada valor até o cartão.",
  presentWrong: "Esse valor não combina com esse campo. Olhe a chave de onde ele veio.",
  done: "Missão cumprida! Você usou API, método, endpoint, status e JSON para mostrar o produto no cartão.",
  doneFb: "A informação foi recuperada e apresentada corretamente.",
} as const;

export type BannerSpec = { text: string; tone: KitTone; icon: ElementKey };

export const BANNER: Record<string, BannerSpec> = {
  choose: { text: "Monte a requisição", tone: "warning", icon: "mail" },
  wrong: { text: "Ainda não", tone: "danger", icon: "error" },
  sending: { text: "Enviando...", tone: "info", icon: "mail" },
  notFound: { text: "404 Not Found", tone: "danger", icon: "error" },
  fix: { text: "Corrija e reenvie", tone: "warning", icon: "mail" },
  ok: { text: "200 OK", tone: "success", icon: "ok" },
  read: { text: "Toque no nome e no preço", tone: "warning", icon: "magnifier" },
  present: { text: "Monte o cartão", tone: "warning", icon: "store" },
  done: { text: "Missão cumprida!", tone: "success", icon: "ok" },
};

export const TIMING = { travel: 900, finish: 3200 };
