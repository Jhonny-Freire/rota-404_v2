import type { ElementKey, KitTone, SeededRandom } from "@/components/learning/kit";
import { METHODS, type HttpMethod } from "../_api/http";

export type Phase = "choose" | "testing" | "right" | "wrong" | "done";

/** Índices de meta.steps (as 4 etapas do .md). */
export const STEP = { read: 0, choose: 1, effect: 2, vary: 3 } as const;

export type ResourceId = "products" | "users" | "orders" | "comments";

export type Row = { id: number; text: string };

/** Etapa 4 (.md): casos sobre usuários, produtos, pedidos e comentários. Dados fictícios. */
export const RESOURCES: Record<ResourceId, { name: string; one: string; element: ElementKey; rows: Row[] }> = {
  products: { name: "Produtos", one: "produto", element: "box", rows: [{ id: 9, text: "Fone, R$ 90" }, { id: 12, text: "Teclado, R$ 120" }, { id: 17, text: "Mouse gamer, R$ 80" }] },
  users: { name: "Usuários", one: "usuário", element: "person", rows: [{ id: 3, text: "Ana" }, { id: 7, text: "Caio" }] },
  orders: { name: "Pedidos", one: "pedido", element: "receipt", rows: [{ id: 8, text: "Teclado, a caminho" }, { id: 11, text: "Fone, separando" }] },
  comments: { name: "Comentários", one: "comentário", element: "mail", rows: [{ id: 2, text: "Bom produto." }, { id: 5, text: "Chegou rápido." }] },
};

export type Mission = {
  method: HttpMethod;
  resource: ResourceId;
  /** a carta da missão (Etapa 1) */
  text: string;
  path: string;
  body?: string;
  /** "a missão pede para ..." */
  verb: string;
  /** em quem a operação errada mexeria */
  target: string;
  /** efeito certo na lista */
  effect: { type: "lit" | "new" | "changed" | "removed"; id: number; text?: string };
  result: string;
};

/** As 16 missões (4 métodos × 4 recursos). Textos criados no estilo do exemplo do .md ("Consulte o produto 17"). */
export const MISSIONS: Mission[] = [
  { method: "GET", resource: "products", text: "Consulte o produto 17", path: "/products/17", verb: "consultar o produto 17", target: "o produto 17", effect: { type: "lit", id: 17 }, result: "Produto 17: Mouse gamer, R$ 80. Nada mudou na lista." },
  { method: "GET", resource: "users", text: "Veja os dados do usuário 3", path: "/users/3", verb: "ver os dados do usuário 3", target: "o usuário 3", effect: { type: "lit", id: 3 }, result: "Usuário 3: Ana. Nada mudou na lista." },
  { method: "GET", resource: "orders", text: "Confira o pedido 8", path: "/orders/8", verb: "conferir o pedido 8", target: "o pedido 8", effect: { type: "lit", id: 8 }, result: "Pedido 8: Teclado, a caminho. Nada mudou na lista." },
  { method: "GET", resource: "comments", text: "Leia o comentário 5", path: "/comments/5", verb: "ler o comentário 5", target: "o comentário 5", effect: { type: "lit", id: 5 }, result: "Comentário 5: Chegou rápido. Nada mudou na lista." },
  { method: "POST", resource: "products", text: "Registre um produto novo: Webcam", path: "/products", body: "nome: Webcam · preço: 150", verb: "registrar um produto novo", target: "um produto que já existe", effect: { type: "new", id: 20, text: "Webcam, R$ 150" }, result: "Produto 20 registrado: Webcam, R$ 150." },
  { method: "POST", resource: "users", text: "Cadastre a usuária Bia", path: "/users", body: "nome: Bia", verb: "cadastrar uma usuária nova", target: "um usuário que já existe", effect: { type: "new", id: 8, text: "Bia" }, result: "Usuária 8 cadastrada: Bia." },
  { method: "POST", resource: "orders", text: "Faça um pedido do produto 17", path: "/orders", body: "produto: 17", verb: "fazer um pedido novo", target: "um pedido que já existe", effect: { type: "new", id: 12, text: "Mouse gamer, aguardando" }, result: "Pedido 12 criado: Mouse gamer, aguardando." },
  { method: "POST", resource: "comments", text: "Publique o comentário: Adorei!", path: "/comments", body: "texto: Adorei!", verb: "publicar um comentário novo", target: "um comentário que já existe", effect: { type: "new", id: 6, text: "Adorei!" }, result: "Comentário 6 publicado: Adorei!" },
  { method: "PUT", resource: "products", text: "Atualize o preço do produto 12 para R$ 50", path: "/products/12", body: "nome: Teclado · preço: 50", verb: "atualizar o preço do produto 12", target: "o produto 12", effect: { type: "changed", id: 12, text: "Teclado, R$ 50" }, result: "Produto 12 atualizado: Teclado, R$ 50." },
  { method: "PUT", resource: "users", text: "Troque o nome do usuário 7 para Leo", path: "/users/7", body: "nome: Leo", verb: "trocar o nome do usuário 7", target: "o usuário 7", effect: { type: "changed", id: 7, text: "Leo" }, result: "Usuário 7 atualizado: Leo." },
  { method: "PUT", resource: "orders", text: "Atualize o endereço do pedido 8", path: "/orders/8", body: "endereço: Rua Lua, 7", verb: "atualizar o endereço do pedido 8", target: "o pedido 8", effect: { type: "changed", id: 8, text: "Teclado, para a Rua Lua, 7" }, result: "Pedido 8 atualizado: entregar na Rua Lua, 7." },
  { method: "PUT", resource: "comments", text: "Corrija o comentário 2 para: Muito bom!", path: "/comments/2", body: "texto: Muito bom!", verb: "corrigir o comentário 2", target: "o comentário 2", effect: { type: "changed", id: 2, text: "Muito bom!" }, result: "Comentário 2 atualizado: Muito bom!" },
  { method: "DELETE", resource: "products", text: "Remova o produto 9 do catálogo", path: "/products/9", verb: "remover o produto 9", target: "o produto 9", effect: { type: "removed", id: 9 }, result: "Produto 9 removido da lista." },
  { method: "DELETE", resource: "users", text: "Apague a conta do usuário 7", path: "/users/7", verb: "apagar o usuário 7", target: "o usuário 7", effect: { type: "removed", id: 7 }, result: "Usuário 7 removido da lista." },
  { method: "DELETE", resource: "orders", text: "Remova o pedido 11", path: "/orders/11", verb: "remover o pedido 11", target: "o pedido 11", effect: { type: "removed", id: 11 }, result: "Pedido 11 removido da lista." },
  { method: "DELETE", resource: "comments", text: "Remova o comentário 5", path: "/comments/5", verb: "remover o comentário 5", target: "o comentário 5", effect: { type: "removed", id: 5 }, result: "Comentário 5 removido da lista." },
];

/** Uma missão por método, cada uma num recurso diferente, em ordem sorteada (muda a cada "Jogar de novo"). */
export function buildMissions(rand: SeededRandom): Mission[] {
  const resources = rand.shuffle(Object.keys(RESOURCES) as ResourceId[], "recursos");
  const picked = METHODS.map((method, index) => MISSIONS.find((m) => m.method === method && m.resource === resources[index])!);
  return rand.shuffle(picked, "ordem");
}

/** Feedback do .md: relacionar a intenção ao método — não basta dizer "errado". */
export function explainWrong(chosen: HttpMethod, mission: Mission): string {
  const needs = `A missão pede para ${mission.verb}: use o método dessa intenção.`;
  switch (chosen) {
    case "GET":
      return `GET só consultaria ${mission.target}, sem mudar nada. ${needs}`;
    case "POST":
      return `POST enviaria dados para criar um ${RESOURCES[mission.resource].one} novo. ${needs}`;
    case "PUT":
      return `PUT substituiria os dados de ${mission.target}. ${needs}`;
    default:
      return `DELETE removeria ${mission.target}. ${needs}`;
  }
}

/* falas e textos criados (o .md descreve as etapas sem falas) */
export const TEXT = {
  intro: "Leia a missão, escolha o método que combina com a intenção e toque em TESTAR.",
  mission: (n: number, total: number) => `Missão ${n} de ${total}. Leia a carta e escolha o método.`,
  chooseFb: "Escolha um método e toque em TESTAR.",
  pickedFb: (m: HttpMethod) => `Método escolhido: ${m}. Toque em TESTAR.`,
  right: "Isso! O método combina com a intenção da missão.",
  done: "Você escolheu o método certo para cada situação!",
  doneFb: "Você identificou o método apropriado em diferentes situações.",
  review: "Aqui estão as intenções da Aula 2.2. Leia e tente de novo.",
} as const;

export type BannerSpec = { text: string; tone: KitTone; icon: ElementKey };

export const BANNER: Record<string, BannerSpec> = {
  read: { text: "Leia a missão", tone: "warning", icon: "receipt" },
  picked: { text: "Toque em TESTAR", tone: "warning", icon: "mail" },
  testing: { text: "Testando...", tone: "info", icon: "mail" },
  right: { text: "Método certo!", tone: "success", icon: "ok" },
  wrong: { text: "Não atende ao pedido", tone: "danger", icon: "error" },
  done: { text: "Todas as missões!", tone: "success", icon: "ok" },
};

export const TIMING = { testing: 1000, nextMission: 3600, finish: 2600 };
