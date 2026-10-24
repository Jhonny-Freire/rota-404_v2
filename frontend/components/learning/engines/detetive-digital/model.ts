import type { ElementKey } from "@/config/assets";
import type { KitTone, SeededRandom } from "@/components/learning/kit";

/** As três categorias do lab4-3.md (Etapa 2). */
export type Category = "seguro" | "verificar" | "suspeito";

export const CATEGORIES: { id: Category; name: string; info: string; tone: KitTone; icon: ElementKey }[] = [
  { id: "seguro", name: "Seguro", info: "Não há sinais de risco no contexto.", tone: "success", icon: "ok" },
  { id: "verificar", name: "Precisa verificar", info: "Faltam informações para decidir.", tone: "warning", icon: "question" },
  { id: "suspeito", name: "Suspeito", info: "Há sinais de fraude ou abuso.", tone: "danger", icon: "error" },
];

export const CATEGORY_NAME: Record<Category, string> = { seguro: "Seguro", verificar: "Precisa verificar", suspeito: "Suspeito" };

/** risk: sinal de alerta · ok: sinal de que está tudo certo · doubt: falta informação */
export type Signal = "risk" | "ok" | "doubt";

export type Evidence = {
  id: string;
  /** o que o aluno examina (lab4-3.md: endereço, remetente, conteúdo, informações solicitadas, finalidade) */
  label: string;
  value: string;
  /** o que o detetive percebe ao examinar (painel) */
  note: string;
  signal: Signal;
  /** pergunta do Bonzi ao examinar (as duas do .md são LITERAIS) */
  question?: string;
};

export type Case = {
  id: string;
  kind: "Mensagem" | "E-mail" | "Site" | "Aplicativo";
  title: string;
  icon: ElementKey;
  evidence: Evidence[];
  category: Category;
  /** fala do Bonzi quando o caso é resolvido (Etapa 3) */
  reveal: string;
  /** indício destacado na revisão (Etapa 4) */
  key: string;
  /** sinais para o painel de resultado */
  signals: string[];
};

/** lab4-3.md, Etapa 1 (LITERAIS) */
export const Q_ADDRESS = "O endereço parece correto?";
export const Q_PERMISSION = "Por que esse aplicativo precisa dessa permissão?";

/*
 * Casos: os 6 exemplos da "Tela" do .md + 2 criados (para haver mais de um "Precisa verificar"). Falas de revelação
 * LITERAIS quando o .md dá o exemplo (senha urgente, plataforma da escola, localização); as outras foram criadas.
 */
export const CASES: Case[] = [
  {
    id: "premio",
    kind: "Mensagem",
    title: "Você ganhou um celular!",
    icon: "cellphone",
    category: "suspeito",
    key: "texto",
    evidence: [
      { id: "remetente", label: "Remetente", value: "Número desconhecido", note: "Você não sabe quem mandou a mensagem.", signal: "risk" },
      { id: "texto", label: "Conteúdo", value: "Você ganhou um celular! Clique para receber.", note: "Um prêmio de um sorteio do qual você nem participou.", signal: "risk" },
      { id: "link", label: "Endereço do link", value: "premio-celular.xyz", note: "Não é o endereço de nenhuma loja conhecida.", signal: "risk", question: Q_ADDRESS },
    ],
    reveal: "Prêmio surpresa e link desconhecido: são sinais de golpe!",
    signals: ["Prêmio que você não pediu", "Link desconhecido"],
  },
  {
    id: "escola",
    kind: "E-mail",
    title: "Atividade nova da escola",
    icon: "mail",
    category: "seguro",
    key: "acesso",
    evidence: [
      { id: "remetente", label: "Remetente", value: "professora@minhaescola.edu.br", note: "É o endereço da sua escola, que você já conhece.", signal: "ok" },
      { id: "texto", label: "Conteúdo", value: "A atividade de Ciências já está na plataforma.", note: "O aviso combina com o que a professora falou na aula.", signal: "ok" },
      { id: "acesso", label: "Como acessar", value: "Pela plataforma de sempre, com o seu login", note: "Nada de link estranho: você entra pelo caminho conhecido.", signal: "ok" },
    ],
    reveal: "Boa! A situação faz sentido e o acesso foi feito pelo caminho conhecido.",
    signals: [],
  },
  {
    id: "parecido",
    kind: "Site",
    title: "Site da loja de brinquedos?",
    icon: "webpage",
    category: "suspeito",
    key: "endereco",
    evidence: [
      { id: "endereco", label: "Endereço do site", value: "lojja-brinquedos.com", note: "Tem um \"j\" a mais: o site conhecido é loja-brinquedos.com.", signal: "risk", question: Q_ADDRESS },
      { id: "pedido", label: "Informações pedidas", value: "Dados do cartão para ganhar 90% de desconto", note: "Desconto enorme pedindo dados de pagamento é isca comum.", signal: "risk" },
      { id: "visual", label: "Aparência", value: "Igualzinho ao site da loja", note: "Copiar o visual de um site conhecido é um truque comum.", signal: "risk" },
    ],
    reveal: "O endereço tem uma letra diferente do site conhecido. Desconfie!",
    signals: ["Endereço quase igual ao de um site conhecido"],
  },
  {
    id: "video",
    kind: "Aplicativo",
    title: "Chamada de vídeo pede a câmera",
    icon: "camera",
    category: "seguro",
    key: "pedido",
    evidence: [
      { id: "app", label: "Aplicativo", value: "Chamada de vídeo com a família", note: "Você mesmo abriu o app para falar com a família.", signal: "ok" },
      { id: "pedido", label: "Finalidade da permissão", value: "Acesso à câmera para a chamada", note: "Para aparecer na chamada de vídeo, a câmera é necessária.", signal: "ok", question: Q_PERMISSION },
      { id: "quando", label: "Quando", value: "Só na hora da chamada", note: "O pedido aparece no momento em que faz sentido.", signal: "ok" },
    ],
    reveal: "Faz sentido! Um aplicativo de chamada de vídeo precisa da câmera.",
    signals: [],
  },
  {
    id: "senha",
    kind: "Mensagem",
    title: "Sua conta será bloqueada!",
    icon: "lockOpen",
    category: "suspeito",
    key: "texto",
    evidence: [
      { id: "remetente", label: "Remetente", value: "\"Suporte\" de um número desconhecido", note: "O suporte de verdade não manda mensagem de um número qualquer.", signal: "risk" },
      { id: "texto", label: "Conteúdo", value: "Sua conta será bloqueada em 5 minutos! Informe sua senha neste link.", note: "A mensagem apressa você para não dar tempo de pensar.", signal: "risk" },
      { id: "pedido", label: "Informações pedidas", value: "A sua senha", note: "Ninguém de confiança pede a sua senha por mensagem.", signal: "risk" },
    ],
    reveal: "A mensagem cria urgência e pede sua senha por um link. São sinais de alerta!",
    signals: ["Urgência para apressar você", "Pedido de senha por link"],
  },
  {
    id: "loja",
    kind: "Site",
    title: "Loja oficial de sempre",
    icon: "house",
    category: "seguro",
    key: "endereco",
    evidence: [
      { id: "endereco", label: "Endereço do site", value: "loja-brinquedos.com (o de sempre)", note: "É o endereço que você já conhece e digitou certinho.", signal: "ok", question: Q_ADDRESS },
      { id: "conteudo", label: "Conteúdo", value: "Produtos e preços normais", note: "Nada de oferta impossível ou pressa.", signal: "ok" },
      { id: "pedido", label: "Informações pedidas", value: "Nenhuma informação pessoal", note: "Só para olhar os produtos, ninguém pede seus dados.", signal: "ok" },
    ],
    reveal: "Endereço conhecido e nada estranho: dá para navegar com tranquilidade.",
    signals: [],
  },
  {
    id: "localizacao",
    kind: "Aplicativo",
    title: "Jogo pede a sua localização",
    icon: "pin",
    category: "verificar",
    key: "finalidade",
    evidence: [
      { id: "app", label: "Aplicativo", value: "Jogo de quebra-cabeça", note: "Um quebra-cabeça não costuma precisar saber onde você está.", signal: "doubt" },
      { id: "pedido", label: "Informações pedidas", value: "Acesso à sua localização", note: "Localização é uma informação pessoal.", signal: "doubt", question: Q_PERMISSION },
      { id: "finalidade", label: "Finalidade da permissão", value: "O aplicativo não explica", note: "Você ainda não sabe para que ela será usada.", signal: "doubt" },
    ],
    reveal: "Antes de permitir, descubra por que o aplicativo precisa desse acesso.",
    signals: ["Permissão sem motivo explicado"],
  },
  {
    id: "amigo",
    kind: "Mensagem",
    title: "Amigo com número novo",
    icon: "person",
    category: "verificar",
    key: "remetente",
    evidence: [
      { id: "remetente", label: "Remetente", value: "Número novo que diz ser o seu amigo Leo", note: "Pode ser ele mesmo, mas você ainda não tem certeza.", signal: "doubt" },
      { id: "texto", label: "Conteúdo", value: "Oi! Troquei de número. Salva aí!", note: "Não pede nada estranho, mas também não prova quem é.", signal: "doubt" },
      { id: "pedido", label: "Informações pedidas", value: "Nada por enquanto", note: "Ainda não pediu dados nem dinheiro.", signal: "ok" },
    ],
    reveal: "Pode ser o seu amigo mesmo! Confirme com ele por outro caminho antes de confiar.",
    signals: ["Remetente que ainda não dá para confirmar"],
  },
];

/** Casos por partida: 2 suspeitos, 2 seguros e 1 "precisa verificar", em ordem embaralhada. */
export function buildCases(rand: SeededRandom): Case[] {
  const of = (category: Category) => CASES.filter((c) => c.category === category);
  const picked = [
    ...rand.shuffle(of("suspeito"), "suspeito").slice(0, 2),
    ...rand.shuffle(of("seguro"), "seguro").slice(0, 2),
    ...rand.shuffle(of("verificar"), "verificar").slice(0, 1),
  ];
  return rand.shuffle(picked, "ordem");
}

/**
 * board: escolher um caso · examine: analisar e classificar (Etapas 1-2) · wrong: classificou errado, volta ao quadro ·
 * reveal: indícios (Etapa 3) ·
 * result: painel final.
 */
export type Phase = "board" | "examine" | "wrong" | "reveal" | "result";

export const STEP = { analyze: 0, classify: 1, reveal: 2, review: 3 } as const;

export const TEXT = {
  /** lab4-3.md (LITERAL) */
  intro: "Um bom detetive não acredita em tudo, mas também não desconfia de tudo! Vamos investigar cada caso.",
  /* falas e textos criados */
  pick: "Escolha um caso para investigar.",
  examine: "Toque nas pistas para examinar. Depois arraste o cartão para uma categoria.",
  wrong: "Hmm, não é bem isso. Esse caso vai voltar para a revisão.",
  wrongReview: "Ainda não. Olhe de novo a pista marcada.",
  review: "Agora vamos rever os casos que ficaram para trás.",
  reviewOpen: "Olhe com atenção a pista marcada antes de classificar de novo.",
  done: "Investigação concluída! Veja o seu painel de detetive.",

  // painel Feedback
  howPick: "Toque num cartão de caso para abrir a investigação.",
  howExamine: "Toque nas pistas do caso para examinar. Depois arraste o cartão (ou toque nele e depois na categoria): Seguro, Precisa verificar ou Suspeito.",
  wrongFb: "Essa não é a melhor categoria para este caso. Ele vai para a revisão no fim.",
  wrongReviewFb: "Ainda não. Leia de novo a pista marcada e pense no contexto.",
  rightFb: (category: Category) => `Isso! Este caso é: ${CATEGORY_NAME[category]}. Veja os indícios.`,
  reviewFb: "Hora de rever! Os casos marcados para revisão estão no quadro.",
  resultFb: "Investigação concluída! Toque em Concluir para ver a sua pontuação.",
};

export type BannerSpec = { text: string; tone: KitTone; icon: ElementKey };

const spec = (text: string, tone: KitTone, icon: ElementKey): BannerSpec => ({ text, tone, icon });

export const BANNER = {
  pick: spec("Escolha um caso", "info", "magnifier"),
  examine: spec("Examine e classifique", "warning", "magnifier"),
  wrong: spec("Vai para a revisão", "danger", "error"),
  wrongReview: spec("Ainda não. Olhe a pista", "danger", "error"),
  right: spec("Caso resolvido!", "success", "ok"),
  review: spec("Reveja os marcados", "warning", "magnifier"),
  result: spec("Tudo investigado!", "success", "ok"),
};

export const REPEAT_LINE_MS = 4000;
export const MS_PER_CHAR = 65;
