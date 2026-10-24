import type { ScenePoint, SequenceStep } from "@/components/learning/kit";
import type { LessonEngineProps } from "@/components/learning/runtime";

export type SceneProps = Pick<LessonEngineProps, "say" | "setCanAdvance" | "setHint" | "reducedMotion"> & {
  /** a informação fictícia que o aluno digitou na cena 1 (atravessa as cenas) */
  info: string;
};

export const SITE = "exemplo.com";
/** usado se o aluno ainda não digitou nada (ex.: abriu a cena 2 pela trilha) */
export const DEFAULT_INFO = "Cometa42";
export const INFO_MAX = 14;

/** Falas do Bonzi: LITERAIS do aula4-2.md. */
export const LINES = {
  send: "Quando você envia uma informação para um site, ela precisa viajar pela internet até chegar ao destino!",
  http: "No HTTP, as informações não são protegidas por criptografia durante a comunicação. Isso pode permitir que alguém que consiga interceptar os dados os leia.",
  httpRead: "Essa não! Um hacker que interceptou a mensagem conseguiu ver o conteúdo!",
  httpSwitch: "Vamos mudar para uma conexão mais segura.",
  https: "O HTTPS usa criptografia para proteger as informações enquanto elas viajam entre o navegador e o site.",
  httpsBlocked: "O hacker interceptou a mensagem de novo, mas dessa vez não conseguiu ver o conteúdo!",
  compare:
    "Os dois permitem a comunicação. A diferença é que o HTTPS adiciona proteção para dificultar que outras pessoas leiam ou alterem os dados durante o caminho.",
  lock: "O cadeado indica uma conexão protegida. Mas atenção: isso não significa que o site seja necessariamente confiável!",
  closing:
    "Sempre que possível, prefira conexões HTTPS. E lembre-se: uma conexão protegida é importante, mas também precisamos verificar se o site é confiável!",
} as const;

/** Rótulos do Encerramento: LITERAIS do .md (`HTTP → comunicação sem criptografia`). */
export const SUMMARY = {
  http: "comunicação sem criptografia",
  https: "comunicação protegida por criptografia",
} as const;

/* Mundo das cenas 1 a 3 (% do SceneCanvas): navegador à esquerda, hacker no caminho, servidor à direita. */
export const LINE_Y = 46;
export const SERVER_AT: ScenePoint = { x: 88, y: LINE_Y };
export const HACKER_AT: ScenePoint = { x: 63, y: 74 };
export const STOPS = {
  client: { x: 50, y: LINE_Y },
  hacker: { x: 63, y: LINE_Y },
  server: { x: 76, y: LINE_Y },
} satisfies Record<string, ScenePoint>;
export const WIRE = { from: { x: 46, y: LINE_Y }, to: { x: 83, y: LINE_Y } };

export const READY_PAUSE_MS = 1400;
export const MOVE_MS = 1100;
const MS_PER_CHAR = 65;

export function speechMs(line: string): number {
  return line.length * MS_PER_CHAR;
}

/** Fases de uma cena passiva: pausas de LEITURA ({ hold }); a última cresce até a soma cobrir `speech` ms. */
export function phases(holds: readonly number[], speech: number): SequenceStep[] {
  const total = holds.reduce((sum, ms) => sum + ms, 0);
  const extra = Math.max(0, speech - total);
  return holds.map((ms, index) => ({ hold: index === holds.length - 1 ? ms + extra : ms }));
}

/** Uma fase que dura até a fala começada em `startedAt` (ms desde o início da cena) terminar. */
export function untilSpoken(line: string, startedAt: number, min = 600): { hold: number } {
  return { hold: Math.max(min, speechMs(line) - startedAt) };
}
