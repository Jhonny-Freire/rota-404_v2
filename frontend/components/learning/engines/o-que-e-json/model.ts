import type { LessonEngineProps } from "@/components/learning/runtime";
import type { JsonLine, JsonPart, JsonValue } from "../_api/Json";

export type SceneProps = Pick<LessonEngineProps, "say" | "setCanAdvance" | "setHint" | "reducedMotion" | "next">;

/** Fala LITERAL de faixa14-completa.md (Planeta 3.1, Cena 3). */
export const LINES = {
  lists: "Os colchetes [ ] agrupam uma lista de valores. Assim, um JSON pode guardar informações simples e coleções.",
} as const;

/*
 * Falas que seguem o texto do .md de perto (o .md descreve o que o Bonzi explica, sem aspas): Cena 1 ("uma aplicação
 * precisa de uma organização consistente para enviar e receber dados"), os 4 itens da Cena 2 e o booleano da Cena 3.
 * As da Microinteração e do Fechamento são criadas.
 */
export const EXTRA_LINES = {
  loose: "Esses dados estão soltos. Uma aplicação precisa de uma organização consistente para enviar e receber dados.",
  boolean: "Agora apareceu ativo: true. True e false representam valores booleanos: verdadeiro e falso. Uma propriedade também pode conter uma lista.",
  find: "Agora toque nas partes do JSON que eu pedir.",
  findWrong: (name: string) => `Ainda não: isso é ${name}. Tente de novo.`,
  findRight: "Isso!",
  choose: "Agora escolha qual dos dois exemplos tem a estrutura válida.",
  chooseWrong: "Esse exemplo tem problemas de estrutura. Veja os sinais que faltam, marcados em vermelho, e escolha o outro.",
  chooseRight: "Isso! Esse é o JSON válido. Veja os sinais que fazem a estrutura funcionar: aspas, dois-pontos, vírgulas, chaves e colchetes.",
  closing: "Objeto é um conjunto de propriedades. Cada propriedade é uma chave com um valor. E a lista é um conjunto ordenado de valores.",
} as const;

/** Cena 2: os quatro itens do .md (texto na tela, LITERAL) e a fala correspondente. */
export const OBJECT_NOTES: { code: string; text: string; line: string; highlight: string[]; marks?: Record<string, "hint">; punct?: boolean }[] = [
  { code: "{ }", text: "agrupam as propriedades de um objeto", line: "As chaves agrupam as propriedades de um objeto.", highlight: [""] },
  { code: "nome", text: "cada propriedade tem uma chave (como nome) e um valor", line: "Cada propriedade tem uma chave, como nome, e um valor.", highlight: ["nome"], marks: { "key:nome": "hint", nome: "hint" } },
  { code: ": ,", text: "dois-pontos separam chave e valor; vírgula separa propriedades", line: "Os dois-pontos separam a chave e o valor. A vírgula separa as propriedades.", highlight: [], punct: true },
  { code: "\"Ana\" 15", text: "texto fica entre aspas (\"Ana\"); números não precisam de aspas (15)", line: "Texto fica entre aspas, como Ana. Números não precisam de aspas, como 15.", highlight: [], marks: { nome: "hint", idade: "hint" } },
];

export const PERSON: JsonValue = { nome: "Ana", idade: 15 };
export const PERSON_FULL: JsonValue = { nome: "Ana", idade: 15, ativo: true, jogos: ["X", "Y"] };

/** Microinteração (a): o que o aluno precisa identificar, na ordem do .md. */
export const FIND: { part: JsonPart; prompt: string }[] = [
  { part: "object", prompt: "Toque no objeto (onde ele abre ou fecha)" },
  { part: "key", prompt: "Toque numa chave" },
  { part: "string", prompt: "Toque num valor textual" },
  { part: "number", prompt: "Toque num número" },
  { part: "boolean", prompt: "Toque num booleano" },
  { part: "list", prompt: "Toque na lista (onde ela abre ou fecha)" },
];

export const PART_NAMES: Record<JsonPart, string> = {
  object: "o objeto",
  key: "uma chave",
  string: "um valor textual",
  number: "um número",
  boolean: "um booleano",
  null: "um valor vazio",
  list: "a lista",
};

/**
 * Microinteração (b): o exemplo INVÁLIDO, montado à mão (falta aspas na chave, uma vírgula e a chave que fecha). Com
 * `reveal`, os sinais que faltam aparecem em vermelho.
 */
export function invalidLines(reveal: boolean): JsonLine[] {
  const miss = (text: string) => (reveal ? [{ text, kind: "missing" as const }] : []);
  return [
    { indent: 0, path: "", toks: [{ text: "{", kind: "punct" }] },
    { indent: 1, path: "nome", toks: [...miss("\""), { text: "nome", kind: "key" }, ...miss("\""), { text: ": ", kind: "punct" }, { text: "\"Ana\"", kind: "string" }, ...miss(",")] },
    { indent: 1, path: "idade", toks: [{ text: "\"idade\"", kind: "key" }, { text: ": ", kind: "punct" }, { text: "15", kind: "number" }] },
    ...(reveal ? [{ indent: 0, path: "", toks: [{ text: "}", kind: "missing" as const }] }] : []),
  ];
}
