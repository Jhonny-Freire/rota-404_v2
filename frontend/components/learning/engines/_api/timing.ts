import type { SequenceStep } from "@/components/learning/kit";

/** Pausas comuns dos motores da Galáxia 2 "API REST". */
export const READY_PAUSE_MS = 1400;
export const MOVE_MS = 1000;
export const REPEAT_LINE_MS = 4000;
const MS_PER_CHAR = 65;

export function speechMs(line: string): number {
  return line.length * MS_PER_CHAR;
}

/** Fases de uma cena passiva: pausas de LEITURA ({ hold }); a última cresce até a soma cobrir a fala. */
export function phases(holds: readonly number[], line: string): SequenceStep[] {
  const total = holds.reduce((sum, ms) => sum + ms, 0);
  const extra = Math.max(0, speechMs(line) - total);
  return holds.map((ms, index) => ({ hold: index === holds.length - 1 ? ms + extra : ms }));
}
