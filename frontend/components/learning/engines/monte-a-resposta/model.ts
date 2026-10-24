import type { ElementKey, KitTone } from "@/components/learning/kit";
import type { JsonValue } from "../_api/Json";

export type Phase = "read" | "fill" | "checking" | "wrong" | "done";

/** Índices de meta.steps (as 4 etapas do .md). */
export const STEP = { read: 0, fill: 1, view: 2, fix: 3 } as const;

export type Field = { key: string; label: string; format: (value: string) => string };

export type Template = {
  id: string;
  /** nome do cartão pronto (o aluno não cria um aplicativo) */
  name: string;
  icon: ElementKey;
  json: Record<string, string | number>;
  fields: Field[];
  /** nome acessível do JSON */
  label: string;
};

/** Variações do .md: cartão de produto, perfil simples ou placar de jogo (modelos prontos, dados fictícios). */
export const TEMPLATES: Template[] = [
  {
    id: "produto",
    name: "Cartão do produto",
    icon: "store",
    json: { nome: "Teclado", preco: 120, estoque: 35 },
    fields: [
      { key: "nome", label: "Nome", format: (v) => v },
      { key: "preco", label: "Preço", format: (v) => `R$ ${v}` },
      { key: "estoque", label: "Estoque", format: (v) => `${v} unidades` },
    ],
    label: "Produto: nome Teclado, preço 120, estoque 35",
  },
  {
    id: "perfil",
    name: "Perfil",
    icon: "person",
    json: { nome: "Ana", cidade: "Osasco", idade: 15 },
    fields: [
      { key: "nome", label: "Nome", format: (v) => v },
      { key: "cidade", label: "Cidade", format: (v) => v },
      { key: "idade", label: "Idade", format: (v) => `${v} anos` },
    ],
    label: "Perfil: nome Ana, cidade Osasco, idade 15",
  },
  {
    id: "placar",
    name: "Placar do jogo",
    icon: "gamepad",
    json: { jogador: "Nave42", pontos: 1500, fase: 7 },
    fields: [
      { key: "jogador", label: "Jogador", format: (v) => v },
      { key: "pontos", label: "Pontos", format: (v) => `${v} pontos` },
      { key: "fase", label: "Fase", format: (v) => `Fase ${v}` },
    ],
    label: "Placar: jogador Nave42, pontos 1500, fase 7",
  },
];

export const asJson = (t: Template) => t.json as JsonValue;

/* falas e textos criados (o .md descreve as etapas sem falas); a conclusão segue o texto "Conclusão" do .md */
export const TEXT = {
  intro: "Leia os dados do JSON. Depois arraste cada valor para o campo certo do cartão.",
  introFb: "Arraste cada valor (ou toque nele e depois no campo) até o cartão. Você pode trocar de lugar.",
  fullFb: "Cartão montado. Toque em CONFERIR.",
  full: "O cartão está montado com os valores que você escolheu. Toque em CONFERIR.",
  wrong: (fields: string[]) => `${fields.length === 1 ? "O campo" : "Os campos"} ${fields.join(" e ")} ${fields.length === 1 ? "recebeu" : "receberam"} um valor de outra chave. Veja o destaque e reposicione.`,
  done: "O cartão está certo! Os dados do JSON viraram uma interface que o usuário entende.",
  doneFb: "Você percebeu a diferença entre os dados em JSON e a interface que a aplicação mostra ao usuário.",
} as const;

export type BannerSpec = { text: string; tone: KitTone; icon: ElementKey };

export const BANNER: Record<string, BannerSpec> = {
  read: { text: "Leia os dados", tone: "info", icon: "magnifier" },
  fill: { text: "Preencha o cartão", tone: "warning", icon: "box" },
  full: { text: "Toque em CONFERIR", tone: "warning", icon: "magnifier" },
  wrong: { text: "Há campos trocados", tone: "danger", icon: "error" },
  done: { text: "Cartão certo!", tone: "success", icon: "ok" },
};

export const TIMING = { read: 2600, checking: 700, finish: 3000 };
