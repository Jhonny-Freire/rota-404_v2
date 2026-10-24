import type { ElementKey } from "@/components/learning/kit";
import type { LessonEngineProps } from "@/components/learning/runtime";

export type SceneProps = Pick<LessonEngineProps, "say" | "setCanAdvance" | "setHint" | "reducedMotion" | "next">;

/** Falas do Bonzi: LITERAIS de faixa14-completa.md (Planeta 1.1). */
export const LINES = {
  problem: "O aplicativo sabe mostrar a previsão, mas precisa de um serviço que forneça esses dados. Como os dois podem se comunicar?",
  api: "API é uma interface com regras definidas para um sistema pedir informações ou usar funções de outro. Ela indica como fazer o pedido e como receber o resultado.",
  result: "O aplicativo não precisou produzir a previsão. Pediu o dado ao serviço e usou a resposta recebida.",
  uses: "APIs permitem que sistemas trabalhem juntos sem que cada um precise desenvolver tudo sozinho.",
  rest: "Neste módulo veremos APIs REST. REST é um estilo de organizar APIs em torno de recursos — como usuários, produtos e pedidos — acessados por endereços e operações padronizadas. Nos próximos assuntos você conhecerá os métodos HTTP usados nessas operações.",
  closing: "A API define como o pedido é feito e como o sistema recebe a resposta.",
} as const;

/* falas criadas: o .md não define falas para a Microinteração */
export const EXTRA_LINES = {
  match: "Agora ligue cada aplicativo ao serviço que ele poderia usar.",
  matchRight: "Isso! Esse serviço fornece o que o aplicativo precisa.",
  matchDone: "Tudo ligado! Veja uma dessas comunicações acontecendo.",
} as const;

export const CITY = "Osasco";
export const TEMP = "24 °C";

/** Cena 4: exemplos rápidos (.md: mapa + localização, loja + pagamento, jogo + servidor). */
export const USES: { id: string; app: string; appIcon: ElementKey; service: string; badge?: ElementKey }[] = [
  { id: "map", app: "Mapa", appIcon: "map", service: "Dados de localização", badge: "pin" },
  { id: "store", app: "Loja", appIcon: "store", service: "Serviço de pagamento", badge: "card" },
  { id: "game", app: "Jogo", appIcon: "gamepad", service: "Servidor do jogo" },
];

/** Cena 5: os três recursos do .md. */
export const RESOURCES: { path: string; name: string; element: ElementKey }[] = [
  { path: "/users", name: "Usuários", element: "person" },
  { path: "/products", name: "Produtos", element: "box" },
  { path: "/orders", name: "Pedidos", element: "receipt" },
];

/** Microinteração: aplicativo → serviço (.md: clima → meteorológico; loja → pagamento; mapa → mapas). */
export const MATCH_APPS = [
  { id: "app-clima", name: "App de clima", icon: "cellphone" as ElementKey, need: "O app de clima precisa de dados do tempo." },
  { id: "app-loja", name: "Loja on-line", icon: "store" as ElementKey, need: "A loja precisa receber os pagamentos das compras." },
  { id: "app-mapa", name: "App de mapas", icon: "map" as ElementKey, need: "O app de mapas precisa de dados de localização." },
];
export const MATCH_SERVICES = [
  { id: "srv-tempo", label: "Serviço meteorológico", element: "weather" as ElementKey, zone: "app-clima" },
  { id: "srv-pagamento", label: "Serviço de pagamento", element: "card" as ElementKey, zone: "app-loja" },
  { id: "srv-mapas", label: "Serviço de mapas", element: "pin" as ElementKey, zone: "app-mapa" },
];
