import type { LessonEngineProps } from "@/components/learning/runtime";
import type { JsonValue } from "../_api/Json";

export type SceneProps = Pick<LessonEngineProps, "say" | "setCanAdvance" | "setHint" | "reducedMotion" | "next">;

/** Falas LITERAIS de faixa14-completa.md (Planeta 3.2); a do Fechamento é o texto "Fechamento" do .md. */
export const LINES = {
  receive: "Cada chave indica que tipo de informação está guardada. Para encontrar a cidade, procure a propriedade cidade e leia seu valor.",
  nested: "Uma propriedade pode guardar outro objeto ou uma lista. Nesse caso, siga os nomes dos campos até encontrar a informação.",
  closing: "A resposta JSON contém os dados; a aplicação localiza os campos e transforma seus valores em informações que o usuário consegue entender.",
} as const;

/* falas criadas: Cena 2 (o .md pede para destacar cada campo e relembrar o tipo), Cena 4 e Microinteração */
export const EXTRA_LINES = {
  list: "Aqui, produtos é uma lista. Cada cartão é um objeto. Toque num item para abrir e ver as propriedades dele.",
  listOpened: "Isso! Dentro do item estão as propriedades: id, nome e preço.",
  quiz: "Agora responda: toque no valor certo. Se precisar, abra os objetos e as listas.",
  right: "Isso mesmo!",
  done: "Muito bem! Você encontrou cada dado seguindo os nomes dos campos.",
} as const;

/** Cena 1 e 2: a resposta simulada do .md. */
export const PERSON: JsonValue = { id: 42, nome: "Ana", cidade: "Osasco", ativo: true };

/** Cena 2: os campos, um por vez, com o tipo de valor (Aula 3.1). */
export const FIELDS: { key: string; type: string; line: string }[] = [
  { key: "id", type: "número", line: "id: o valor 42 é um número." },
  { key: "nome", type: "texto", line: "nome: Ana é um texto, por isso fica entre aspas." },
  { key: "cidade", type: "texto", line: "cidade: Osasco também é um texto." },
  { key: "ativo", type: "booleano", line: "ativo: true é um booleano, verdadeiro ou falso." },
];

/** Cena 3: um objeto produto dentro de um objeto maior (texto criado: o pedido 7). */
export const ORDER: JsonValue = { pedido: 7, produto: { nome: "Teclado", preco: 120 } };

/** Cena 4: produtos como uma lista de objetos. */
export const PRODUCTS: JsonValue = {
  produtos: [
    { id: 1, nome: "Teclado", preco: 120 },
    { id: 2, nome: "Mouse", preco: 60 },
    { id: 3, nome: "Monitor", preco: 900 },
  ],
};

export type Question = {
  /** pergunta (as três do .md; a 3ª foi adaptada para ter uma resposta tocável) */
  text: string;
  json: JsonValue;
  /** caminhos abertos no começo */
  expanded: string[];
  answer: string;
  /** pista sem revelar o valor */
  hint: string;
};

/**
 * Microinteração (.md): "Qual é a cidade?", "Qual é o preço do produto?" e "Qual produto tem este nome?". A 3ª
 * virou "Qual é o id do produto com o nome Mouse?" (interpretação: o aluno abre a lista e toca no id do item).
 */
export const QUESTIONS: Question[] = [
  { text: "Qual é a cidade?", json: PERSON, expanded: [], answer: "cidade", hint: "Procure a chave cidade e toque no valor dela." },
  { text: "Qual é o preço do produto?", json: ORDER, expanded: [], answer: "produto.preco", hint: "Abra o objeto produto e procure a chave preco." },
  { text: "Qual é o id do produto com o nome Mouse?", json: PRODUCTS, expanded: ["produtos"], answer: "produtos[1].id", hint: "Abra os itens da lista produtos e procure o que tem o nome Mouse." },
];
