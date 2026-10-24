import type { ElementKey, KitTone, SeededRandom } from "@/components/learning/kit";
import type { JsonValue } from "../_api/Json";

export type Phase = "explore" | "checking" | "right" | "wrong" | "done";

/** Índices de meta.steps (as 3 etapas do .md). */
export const STEP = { mission: 0, explore: 1, check: 2 } as const;

export type Round = {
  /** missão (Etapa 1), no estilo do exemplo do .md */
  mission: string;
  json: JsonValue;
  answer: string;
  /** caminho visual mostrado no acerto (ex.: produtos → Teclado → preco) */
  trail: string[];
  /** chaves destacadas no erro, uma a mais a cada erro (sem revelar o valor) */
  hints: string[];
  level: string;
};

/** Dificuldade progressiva (.md): 1. objeto principal · 2. objeto aninhado · 3. item de uma lista. Dados fictícios. */
function roundTop(rand: SeededRandom): Round {
  const json: JsonValue = { id: 7, nome: "Loja Cometa", cidade: "Recife", aberta: true };
  const pick = rand.pick(["cidade", "nome"] as const, "topo");
  return pick === "cidade"
    ? { mission: "Encontre a cidade da loja", json, answer: "cidade", trail: ["cidade"], hints: ["key:cidade"], level: "Propriedade no objeto principal" }
    : { mission: "Encontre o nome da loja", json, answer: "nome", trail: ["nome"], hints: ["key:nome"], level: "Propriedade no objeto principal" };
}

function roundNested(rand: SeededRandom): Round {
  const json: JsonValue = { pedido: 15, cliente: { nome: "Bia", cidade: "Osasco" }, entrega: { prazo: 3, frete: 10 } };
  const options: Round[] = [
    { mission: "Encontre o prazo da entrega", json, answer: "entrega.prazo", trail: ["entrega", "prazo"], hints: ["key:entrega", "key:entrega.prazo"], level: "Propriedade dentro de um objeto" },
    { mission: "Encontre a cidade do cliente", json, answer: "cliente.cidade", trail: ["cliente", "cidade"], hints: ["key:cliente", "key:cliente.cidade"], level: "Propriedade dentro de um objeto" },
    { mission: "Encontre o valor do frete", json, answer: "entrega.frete", trail: ["entrega", "frete"], hints: ["key:entrega", "key:entrega.frete"], level: "Propriedade dentro de um objeto" },
  ];
  return rand.pick(options, "aninhado");
}

function roundList(rand: SeededRandom, attempt: number): Round {
  const items = rand.shuffle(
    [
      { nome: "Mouse", preco: 60 },
      { nome: "Teclado", preco: 120 },
      { nome: "Fone", preco: 90 },
    ],
    "itens",
  );
  /* na primeira tentativa, o exemplo do .md: "Encontre o preço do produto Teclado" */
  const target = attempt === 0 ? "Teclado" : rand.pick(["Mouse", "Teclado", "Fone"], "alvo");
  const index = items.findIndex((i) => i.nome === target);
  return {
    mission: `Encontre o preço do produto ${target}`,
    json: { loja: "Cometa", produtos: items },
    answer: `produtos[${index}].preco`,
    trail: ["produtos", target, "preco"],
    hints: ["key:produtos", `produtos[${index}].nome`],
    level: "Item de uma lista",
  };
}

export function buildRounds(rand: SeededRandom, attempt: number): Round[] {
  return [roundTop(rand), roundNested(rand), roundList(rand, attempt)];
}

/* falas e textos criados (o .md descreve as etapas sem falas); a conclusão segue o texto "Conclusão" do .md */
export const TEXT = {
  intro: "Leia a missão, explore o JSON e toque no valor que você acha que é a resposta. Depois toque em CONFERIR.",
  round: (n: number, level: string) => `Missão ${n} de 3: ${level}.`,
  exploreFb: "Abra os objetos e as listas fechados, toque no valor e depois em CONFERIR.",
  picked: "Valor escolhido. Toque em CONFERIR.",
  right: "Achou! Veja o caminho que levou até o dado.",
  wrong: "Ainda não é esse. Olhe a chave destacada e tente de novo.",
  done: "Você encontrou os dados usando a estrutura e o contexto, e não só procurando números ou palavras parecidas.",
  doneFb: "Você encontrou dados no objeto principal, num objeto aninhado e numa lista.",
} as const;

export type BannerSpec = { text: string; tone: KitTone; icon: ElementKey };

export const BANNER: Record<string, BannerSpec> = {
  mission: { text: "Caça ao dado", tone: "warning", icon: "magnifier" },
  picked: { text: "Toque em CONFERIR", tone: "warning", icon: "magnifier" },
  right: { text: "Dado encontrado!", tone: "success", icon: "ok" },
  wrong: { text: "Olhe a chave destacada", tone: "danger", icon: "error" },
  done: { text: "Caça completa!", tone: "success", icon: "ok" },
};

export const TIMING = { checking: 600, nextRound: 3600, finish: 2600 };
