import type { ElementKey } from "@/config/assets";
import type { BlockKind, KitTone, SeededRandom } from "@/components/learning/kit";

export type PageKind = Extract<BlockKind, "title" | "text" | "image" | "button">;

/** Ordem certa da página (a mesma das aulas 3.2 e 3.3). */
export const PAGE_ORDER: PageKind[] = ["title", "text", "image", "button"];

/** Um bloco da estrutura. `floating`: imagem "sem posição", solta fora do fluxo da página. */
export type Slot = { id: string; kind: PageKind; floating?: boolean };

/** A página = blocos na página (em ordem) + blocos fora dela (removidos ou que faltam). */
export type Layout = { page: Slot[]; outside: Slot[] };

/**
 * Problemas de estrutura (lab3-4.md, "Tela": título no lugar errado, imagem sem posição, botão ausente, blocos em
 * ordem incorreta; "remove" do Fluxo = bloco repetido). Prioridade = ordem desta lista.
 */
export type ProblemKey =
  | `missing:${PageKind}`
  | `duplicate:${PageKind}`
  | "floating"
  | "title"
  | "order";

const KINDS = PAGE_ORDER;

/** Problemas da página, do mais importante ao menos (o sistema destaca só o primeiro). */
export function findProblems(layout: Layout): ProblemKey[] {
  const placed = layout.page;
  const out: ProblemKey[] = [];
  for (const kind of KINDS) if (!placed.some((s) => s.kind === kind)) out.push(`missing:${kind}`);
  for (const kind of KINDS) if (placed.filter((s) => s.kind === kind).length > 1) out.push(`duplicate:${kind}`);
  if (placed.some((s) => s.floating)) out.push("floating");
  const flow = placed.filter((s) => !s.floating);
  if (flow.length && flow[0].kind !== "title" && flow.some((s) => s.kind === "title")) out.push("title");
  const rest = dedupe(flow.filter((s) => s.kind !== "title").map((s) => s.kind));
  const expected = PAGE_ORDER.filter((k) => k !== "title" && rest.includes(k));
  if (rest.join() !== expected.join()) out.push("order");
  return out;
}

function dedupe(list: PageKind[]): PageKind[] {
  return list.filter((k, i) => list.indexOf(k) === i);
}

/** Blocos da página que mostram o problema (o aluno toca num deles para achá-lo). */
export function problemSlots(layout: Layout, problem: ProblemKey): string[] {
  const flow = layout.page.filter((s) => !s.floating);
  if (problem === "floating") return layout.page.filter((s) => s.floating).map((s) => s.id);
  if (problem === "title") return flow.filter((s) => s.kind === "title").map((s) => s.id);
  if (problem.startsWith("duplicate:")) {
    const kind = problem.slice(10) as PageKind;
    return layout.page.filter((s) => s.kind === kind).map((s) => s.id);
  }
  if (problem === "order") {
    const rest = flow.filter((s) => s.kind !== "title");
    const expected = PAGE_ORDER.filter((k) => rest.some((s) => s.kind === k));
    return rest.filter((s, i) => s.kind !== expected[i]).map((s) => s.id);
  }
  return [];
}

/** O espaço tracejado de um bloco que falta (id fixo, para tocar nele na página). */
export const missingSlotId = (kind: PageKind) => `missing-${kind}`;

export type Combo = { id: string; layout: Layout };

const s = (id: string, kind: PageKind, floating = false): Slot => (floating ? { id, kind, floating } : { id, kind });

/**
 * Páginas quebradas, cada uma com 2 problemas (o .md: "Se ainda houver problema, o sistema destaca somente o próximo
 * ponto relevante"). Toda correção razoável leva à página certa (sem armadilhas de ordem).
 */
export const COMBOS: Combo[] = [
  /* título no lugar errado + botão ausente */
  { id: "titulo-botao", layout: { page: [s("t1", "text"), s("i1", "image"), s("h1", "title")], outside: [s("b1", "button")] } },
  /* imagem sem posição + blocos em ordem incorreta */
  { id: "imagem-ordem", layout: { page: [s("h1", "title"), s("b1", "button"), s("t1", "text"), s("i1", "image", true)], outside: [] } },
  /* bloco repetido + título no lugar errado */
  { id: "repetido-titulo", layout: { page: [s("t1", "text"), s("h1", "title"), s("i1", "image"), s("b1", "button"), s("b2", "button")], outside: [] } },
  /* imagem sem posição + botão ausente */
  { id: "imagem-botao", layout: { page: [s("h1", "title"), s("t1", "text"), s("i1", "image", true)], outside: [s("b1", "button")] } },
  /* blocos em ordem incorreta + botão ausente */
  { id: "ordem-botao", layout: { page: [s("h1", "title"), s("i1", "image"), s("t1", "text")], outside: [s("b1", "button")] } },
];

export type Theme = { url: string; title: string; text: string; image: ElementKey; imageName: string; button: string };

/* texto criado: conteúdos das páginas quebradas */
export const THEMES: Theme[] = [
  { url: "zoo.com", title: "Zoológico", text: "Venha ver os bichos de perto.", image: "photo", imageName: "Foto", button: "Comprar" },
  { url: "robos.com", title: "Feira de robôs", text: "Robôs que dançam e conversam.", image: "robot", imageName: "Robô", button: "Ver robôs" },
  { url: "cinema.com", title: "Cinema", text: "Filme novo toda semana.", image: "camera", imageName: "Câmera", button: "Assistir" },
  { url: "escola.com", title: "Minha escola", text: "Aqui a gente aprende brincando.", image: "house", imageName: "Escola", button: "Visitar" },
];

export type Mission = { combo: Combo; theme: Theme };

/** Página quebrada por tentativa: avança com o attempt a partir de um início sorteado na visita (sempre muda). */
export function buildMission(session: SeededRandom, rand: SeededRandom, attempt: number): Mission {
  const start = session.int(0, COMBOS.length - 1, "combo");
  return { combo: COMBOS[(start + attempt) % COMBOS.length], theme: rand.pick(THEMES, "theme") };
}

export const KIND_NAMES: Record<PageKind, string> = { title: "Título", text: "Texto", image: "Imagem", button: "Botão" };

const ARTICLE: Record<PageKind, { a: string; the: string }> = {
  title: { a: "um título", the: "o título" },
  text: { a: "um texto", the: "o texto" },
  image: { a: "uma imagem", the: "a imagem" },
  button: { a: "um botão", the: "o botão" },
};

export function contentOf(theme: Theme, kind: PageKind): string | undefined {
  if (kind === "title") return theme.title;
  if (kind === "text") return theme.text;
  if (kind === "button") return theme.button;
  return undefined;
}

const kindOf = (problem: ProblemKey) => problem.split(":")[1] as PageKind;

/** O que está errado (painel e fala). Texto criado. */
export function describe(problem: ProblemKey): string {
  if (problem.startsWith("missing:")) return `Falta ${ARTICLE[kindOf(problem)].the} na página.`;
  if (problem.startsWith("duplicate:")) return `Tem ${ARTICLE[kindOf(problem)].a} repetido na página.`;
  if (problem === "floating") return "A imagem está solta, sem posição na página.";
  if (problem === "title") return "O título não está no alto da página.";
  return "Os blocos estão fora de ordem.";
}

/** Como consertar (painel "O que fazer"). Texto criado. */
export function howTo(problem: ProblemKey): string {
  if (problem.startsWith("missing:")) return `Na estrutura, toque em "${KIND_NAMES[kindOf(problem)]}" (fora da página) e depois em Colocar na página.`;
  if (problem.startsWith("duplicate:")) return "Um dos blocos repetidos está marcado na estrutura. Toque em Remover.";
  if (problem === "floating") return "A imagem está marcada na estrutura. Toque em Encaixar para pôr a imagem no lugar dela.";
  if (problem === "title") return "O título está marcado na estrutura. Toque em Subir até ele ficar no alto.";
  return "Use Subir e Descer para deixar a ordem: título, texto, imagem e botão.";
}

/** Efeito da correção (lab3-4.md, "Feedback": o sistema explica o efeito). */
export function effect(problem: ProblemKey): string {
  /** lab3-4.md, exemplo literal */
  if (problem === "title") return "Agora o título está no lugar certo.";
  /* textos criados no mesmo modelo do exemplo do .md */
  if (problem.startsWith("missing:")) return `Agora a página tem ${ARTICLE[kindOf(problem)].a}.`;
  if (problem.startsWith("duplicate:")) return "Agora não tem mais bloco repetido.";
  if (problem === "floating") return "Agora a imagem está no lugar dela.";
  return "Agora os blocos estão na ordem certa.";
}

/**
 * observe: Bonzi mostra a página (Fluxo 1) · find: tocar no elemento quebrado (2) · fix: mexer na estrutura (3-4) ·
 * testing: a página é renderizada de novo (5-6) · done: página certa (7).
 */
export type Phase = "observe" | "find" | "fix" | "testing" | "done";

export const STEP = { observe: 0, find: 1, fix: 2, test: 3 } as const;

export const TEXT = {
  /* falas criadas: o .md só dá o exemplo de feedback */
  intro: "Ih, esta página está quebrada! Toque no que está estranho nela.",
  found: "Achou! Veja: o bloco ficou marcado na estrutura.",
  okBlock: "Esse bloco está certo. Procure outra coisa estranha.",
  changeFirst: "Mude a estrutura antes de testar.",
  testing: "Testando a página...",
  next: "Ainda tem um problema. Olha o que ficou marcado!",
  still: "A página ainda não ficou certa. Tente de novo.",
  almost: "Quase lá! Você está mexendo no bloco certo. Continue.",
  fixed: "A página está consertada! Título, texto, imagem e botão, cada um no seu lugar.",

  // painel Feedback
  observeHint: "Olhe a página e procure o que está esquisito: algo fora do lugar, faltando ou repetido.",
  okBlockHint: "Esse bloco está no lugar certo. Toque em outra parte da página.",
  allFixed: "Página consertada! Esta é a versão final.",
};

export type BannerSpec = { text: string; tone: KitTone; icon: ElementKey };

const spec = (text: string, tone: KitTone, icon: ElementKey): BannerSpec => ({ text, tone, icon });

export const BANNER = {
  observe: spec("Veja a página quebrada", "warning", "error"),
  find: spec("Toque no que está estranho", "warning", "magnifier"),
  okBlock: spec("Esse está certo. Procure outro", "info", "ok"),
  fix: spec("Conserte na estrutura", "info", "webpage"),
  test: spec("Agora toque em Testar", "warning", "magnifier"),
  testing: spec("Testando a página...", "info", "webpage"),
  next: spec("Conserte o próximo ponto", "warning", "error"),
  still: spec("Ainda não. Tente de novo", "danger", "error"),
  almost: spec("Quase! Continue consertando", "warning", "webpage"),
  fixed: spec("Página consertada!", "success", "ok"),
};

export const TIMING = {
  /** Bonzi mostra a página antes de pedir o toque (hold, cobre a fala intro de ~63 caracteres) */
  observe: 4200,
  /** a página é renderizada de novo */
  render: 1100,
  /** página certa antes da conclusão (cobre a fala final, ~80 caracteres) */
  finishHold: 5400,
  /** bloco certo tocado fica marcado */
  okMark: 1200,
};

export const REPEAT_LINE_MS = 4000;

/** Encaixa a imagem solta no lugar dela (entre os blocos certos). */
export function insertInPlace(page: Slot[], slot: Slot): Slot[] {
  const rank = PAGE_ORDER.indexOf(slot.kind);
  const at = page.findIndex((s) => !s.floating && PAGE_ORDER.indexOf(s.kind) > rank);
  const copy = page.filter((s) => s.id !== slot.id);
  const index = at === -1 ? copy.length : copy.findIndex((s) => s.id === page[at].id);
  copy.splice(index === -1 ? copy.length : index, 0, { id: slot.id, kind: slot.kind });
  return copy;
}

export function layoutKey(layout: Layout): string {
  return `${layout.page.map((s) => `${s.id}${s.floating ? "*" : ""}`).join(",")}|${layout.outside.map((s) => s.id).join(",")}`;
}
