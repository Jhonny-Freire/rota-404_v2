import type { ElementKey } from "@/config/assets";
import type { KitTone, SeededRandom } from "@/components/learning/kit";

export type Outcome = {
  /** sprites da "animação simples" do resultado */
  art: ElementKey[];
  text: string;
  good: boolean;
};

export type Option = { id: string; text: string; correct: boolean; outcome: Outcome };

export type Scenario = {
  id: string;
  /** nome da etapa (= meta.steps) */
  title: string;
  /** a situação, com os sprites que a ilustram */
  art: ElementKey[];
  situation: string;
  question: string;
  options: Option[];
  /** fala do Bonzi no acerto: LITERAL do lab4-4.md */
  line: string;
  /** prática de segurança aplicada (resumo final) */
  practice: string;
  /** dica relacionada (resumo final) */
  tip: string;
};

/** lab4-4.md (LITERAL) */
export const INTRO =
  "Agora você vai enfrentar situações do dia a dia na internet. Suas escolhas vão ajudar a manter suas informações seguras!";

/*
 * Os 5 cenários do .md, na ordem. Opções e falas de acerto do .md; os textos de resultado de cada opção (o "o que
 * acontece") foram criados.
 */
export const SCENARIOS: Scenario[] = [
  {
    id: "senha",
    title: "Senha",
    art: ["key", "lockOpen"],
    situation: "Você criou uma conta num jogo e precisa protegê-la.",
    question: "Qual senha você vai usar?",
    options: [
      { id: "123", text: "Usar 123456", correct: false, outcome: { art: ["hacker", "lockOpen"], good: false, text: "Essa é uma das senhas mais usadas do mundo: um invasor adivinha rapidinho." } },
      { id: "nome", text: "Usar o próprio nome e a data de nascimento", correct: false, outcome: { art: ["hacker", "lockOpen"], good: false, text: "Quem conhece você, ou vê o seu perfil, consegue adivinhar essa senha." } },
      { id: "forte", text: "Criar uma senha longa e difícil de adivinhar, que não seja usada em outras contas", correct: true, outcome: { art: ["hacker", "lockClosed"], good: true, text: "O invasor tentou, tentou... e não conseguiu abrir a conta." } },
    ],
    line: "Uma senha forte e exclusiva ajuda a proteger sua conta!",
    practice: "Senha longa, difícil e só daquela conta",
    tip: "Não use senhas fáceis nem dados seus na senha.",
  },
  {
    id: "permissao",
    title: "Permissão",
    art: ["webpage", "microphone"],
    situation: "Você instalou um aplicativo de desenho e ele pede acesso ao microfone.",
    question: "O que você faz?",
    options: [
      { id: "permitir", text: "Permitir sem verificar", correct: false, outcome: { art: ["microphone", "error"], good: false, text: "O app ganhou acesso ao microfone sem precisar dele para desenhar." } },
      { id: "negar", text: "Negar e verificar se o acesso é realmente necessário", correct: true, outcome: { art: ["microphone", "lockClosed"], good: true, text: "Você continua desenhando normalmente, e o microfone fica protegido." } },
      { id: "tudo", text: "Liberar também outras permissões, mesmo sem necessidade", correct: false, outcome: { art: ["camera", "pin"], good: false, text: "Câmera e localização liberadas para um app de desenho: dados expostos à toa!" } },
    ],
    line: "Muito bem! Permita apenas os acessos de que o aplicativo realmente precisa.",
    practice: "Só permitir o que o app realmente precisa",
    tip: "Pense: para que esse app precisa desse acesso?",
  },
  {
    id: "perfil",
    title: "Perfil público",
    art: ["person", "webpage"],
    situation: "Um jogo deixa você criar um perfil público.",
    question: "Quais informações você vai colocar?",
    options: [
      { id: "tudo", text: "Nome completo, endereço e escola", correct: false, outcome: { art: ["house", "pin"], good: false, text: "Qualquer pessoa descobre quem você é e onde encontrar você." } },
      { id: "apelido", text: "Apelido e avatar, sem informações pessoais desnecessárias", correct: true, outcome: { art: ["person", "ok"], good: true, text: "Seu perfil ficou divertido e as suas informações continuam privadas." } },
      { id: "telefone", text: "Telefone pessoal para qualquer pessoa ver", correct: false, outcome: { art: ["cellphone", "error"], good: false, text: "Desconhecidos podem ligar ou mandar mensagens para você." } },
    ],
    line: "Você pode personalizar seu perfil sem revelar informações que devem continuar privadas!",
    practice: "Perfil com apelido e avatar",
    tip: "Endereço, escola e telefone não vão no perfil público.",
  },
  {
    id: "compartilhado",
    title: "Computador compartilhado",
    art: ["pc", "person"],
    situation: "Você terminou de usar a sua conta num computador da biblioteca.",
    question: "E agora?",
    options: [
      { id: "janela", text: "Fechar apenas a janela", correct: false, outcome: { art: ["person", "lockOpen"], good: false, text: "A conta continuou aberta, e a próxima pessoa entrou nela!" } },
      { id: "salvar", text: "Salvar a senha para a próxima pessoa", correct: false, outcome: { art: ["key", "hacker"], good: false, text: "A senha ficou guardada no computador: qualquer um pode entrar na sua conta." } },
      { id: "sair", text: "Sair da conta e verificar se a sessão foi encerrada", correct: true, outcome: { art: ["door", "lockClosed"], good: true, text: "A conta foi fechada: quem usar o computador depois não entra nela." } },
    ],
    line: "Boa! Em um computador compartilhado, saia da conta e confira se ela realmente foi encerrada.",
    practice: "Sair da conta em computador compartilhado",
    tip: "Fechar a janela não basta: saia da conta.",
  },
  {
    id: "ajuda",
    title: "Pedir ajuda",
    art: ["mail", "question"],
    situation: "Uma mensagem pede uma informação pessoal e você não sabe se deve responder.",
    question: "O que você faz?",
    options: [
      { id: "responder", text: "Responder mesmo sem entender o motivo", correct: false, outcome: { art: ["mail", "hacker"], good: false, text: "Seus dados foram parar com alguém que você nem conhece." } },
      { id: "adulto", text: "Procurar orientação de um adulto de confiança", correct: true, outcome: { art: ["person", "ok"], good: true, text: "Com ajuda, vocês descobriram juntos o que fazer, sem expor nada." } },
      { id: "mais", text: "Enviar mais informações para descobrir o que acontece", correct: false, outcome: { art: ["mail", "error"], good: false, text: "Quanto mais informação você manda, maior o risco." } },
    ],
    line: "Você não precisa resolver tudo sozinho. Pedir ajuda também é uma forma de se proteger!",
    practice: "Pedir ajuda a um adulto de confiança",
    tip: "Na dúvida, pergunte antes de compartilhar dados.",
  },
];

/** Ordem das opções de cada cenário, embaralhada por tentativa (a certa muda de lugar). */
export function buildOrder(rand: SeededRandom): Record<string, Option[]> {
  return Object.fromEntries(SCENARIOS.map((s) => [s.id, rand.shuffle(s.options, s.id, true)]));
}

/** play: escolhendo · solved: acertou (pode explorar as outras opções) · summary: resumo final */
export type Phase = "play" | "solved" | "summary";

export const TEXT = {
  /* falas e textos criados */
  wrongSay: "Hmm, veja o que aconteceu. Tente outra escolha.",
  explore: "Quer ver o que aconteceria com outra escolha? Toque nela.",
  summarySay: "Missão cumprida! Veja o resumo das suas decisões.",
  chooseFb: (question: string) => `${question} Toque na escolha que você faria.`,
  solvedFb: "Isso! Toque nas outras opções para ver o que aconteceria, ou siga para a próxima situação.",
  summaryFb: "Veja o resumo e toque em Concluir. Em Jogar de novo, você pode repetir as escolhas.",
};

export type BannerSpec = { text: string; tone: KitTone; icon: ElementKey };
const spec = (text: string, tone: KitTone, icon: ElementKey): BannerSpec => ({ text, tone, icon });

export const BANNER = {
  choose: spec("Escolha como agir", "warning", "magnifier"),
  wrong: spec("Tente outra escolha", "danger", "error"),
  right: spec("Escolha segura!", "success", "ok"),
  explore: spec("Veja o que aconteceria", "info", "magnifier"),
  summary: spec("Missão cumprida!", "success", "ok"),
};

export const REPEAT_LINE_MS = 4000;
