import type { ElementKey } from "@/components/learning/kit";
import type { LessonEngineProps } from "@/components/learning/runtime";

export type SceneProps = Pick<LessonEngineProps, "say" | "setCanAdvance" | "setHint" | "reducedMotion" | "next">;

/** Falas LITERAIS de faixa14-completa.md (Planeta 4.1); a do Fechamento é o texto "Fechamento" do .md. */
export const LINES = {
  many: "Um mesmo aplicativo pode precisar de informações e funções fornecidas por serviços diferentes.",
  shared: "Uma API pode ser usada por mais de uma aplicação, desde que cada uma respeite as regras e os recursos que ela oferece.",
  limits: "Uma API não dá acesso automático a tudo. Ela oferece operações específicas, e o cliente precisa usar os recursos disponibilizados pelo serviço.",
  closing: "As APIs conectam aplicações a serviços especializados e permitem reutilizar dados ou funções sem reconstruir toda a solução.",
} as const;

/* falas criadas: a Cena 2 e a Microinteração não têm falas no .md */
export const EXTRA_LINES = {
  split: "Veja cada pedido separado: quem pede é o cliente, a API faz a ponte e o serviço responde.",
  match: "Ligue cada solicitação ao serviço mais adequado para atendê-la.",
  matchRight: "Isso! Esse serviço é o especialista nisso.",
  matchDone: "Muito bem! Agora monte o diagrama: cliente, API e serviço.",
  diagram: "Coloque cada peça no lugar certo do diagrama.",
  diagramRight: "Isso!",
  diagramDone: "Diagrama completo: o cliente pede pela API e o serviço responde.",
} as const;

/** Cena 2 (.md): os três pedidos do app de viagem. */
export const FLOWS: { id: string; client: string; clientIcon: ElementKey; api: string; service: string; badge: ElementKey; request: string; response: string }[] = [
  { id: "mapa", client: "Mapa", clientIcon: "map", api: "API de mapas", service: "Serviço de mapas", badge: "pin", request: "ROTA?", response: "LOCALIZAÇÃO" },
  { id: "clima", client: "Tela de clima", clientIcon: "weather", api: "API meteorológica", service: "Serviço meteorológico", badge: "weather", request: "PREVISÃO?", response: "PREVISÃO" },
  { id: "compra", client: "Compra", clientIcon: "card", api: "API de pagamento", service: "Serviço de pagamento", badge: "card", request: "PAGAR", response: "APROVADO" },
];

/** Cena 4: uma consulta oferecida e outra não (texto criado no espírito do .md). */
export const OPERATIONS = ["Previsão de hoje", "Previsão da semana"];
export const ASKS = [
  { text: "Previsão de hoje em Osasco", offered: true, result: "24 °C e sol" },
  { text: "Lista de todos os usuários do serviço", offered: false, result: "Operação não oferecida pela API" },
];

/** Microinteração (a): três solicitações e o serviço mais adequado. */
export const REQUESTS = [
  { id: "req-rota", label: "Mostrar a rota até o hotel", element: "map" as ElementKey, zone: "srv-mapas" },
  { id: "req-chuva", label: "Ver se vai chover amanhã", element: "weather" as ElementKey, zone: "srv-clima" },
  { id: "req-reserva", label: "Pagar a reserva", element: "card" as ElementKey, zone: "srv-pagamento" },
];
export const SERVICES = [
  { id: "srv-mapas", name: "Serviço de mapas", icon: "pin" as ElementKey, need: "O serviço de mapas cuida de rotas e localização." },
  { id: "srv-clima", name: "Serviço meteorológico", icon: "weather" as ElementKey, need: "O serviço meteorológico cuida da previsão do tempo." },
  { id: "srv-pagamento", name: "Serviço de pagamento", icon: "card" as ElementKey, need: "O serviço de pagamento cuida das compras e reservas." },
];

/** Microinteração (b): o diagrama cliente → API → serviço. */
export const DIAGRAM_ZONES = [
  { id: "d-cliente", name: "Cliente", icon: "cellphone" as ElementKey, need: "O cliente é quem faz o pedido." },
  { id: "d-api", name: "API", icon: "plug" as ElementKey, need: "A API define como o pedido é feito." },
  { id: "d-servico", name: "Serviço", icon: "server" as ElementKey, need: "O serviço processa o pedido e responde." },
];
export const DIAGRAM_PIECES = [
  { id: "p-app", label: "App de viagem", element: "cellphone" as ElementKey, zone: "d-cliente" },
  { id: "p-api", label: "API de pagamento", element: "plug" as ElementKey, zone: "d-api" },
  { id: "p-servico", label: "Serviço de pagamento", element: "card" as ElementKey, zone: "d-servico" },
];
