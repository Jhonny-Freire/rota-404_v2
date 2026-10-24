/**
 * Tempos de referência de cada laboratório (em segundos), usados no bônus de tempo da pontuação
 * (lib/progress.ts → labScore):
 * - min: até aqui o aluno não perde nada pelo tempo;
 * - avg: tempo médio esperado. De min até avg some a 1ª metade do bônus (2.500); de avg até 2 × avg, a 2ª metade.
 *
 * Os valores abaixo são ESTIMATIVAS iniciais (contam também as falas do Bonzi): calibre com o "Tempo" que a tela de
 * resultado mostra quando a equipe testar cada laboratório.
 */
export type LabTiming = { min: number; avg: number };

export const DEFAULT_LAB_TIMING: LabTiming = { min: 90, avg: 240 };

export const LAB_TIMING: Record<string, LabTiming> = {
  // Galáxia 1 — Internet e Web
  "conectando-uma-rede": { min: 90, avg: 240 },
  "missao-recuperar-a-conexao": { min: 90, avg: 240 },
  "encontrando-o-destino": { min: 90, avg: 240 },
  "missao-encontrar-o-servidor": { min: 90, avg: 240 },
  "monte-sua-pagina": { min: 90, avg: 240 },
  "conserte-a-pagina": { min: 90, avg: 240 },
  "detetive-digital": { min: 120, avg: 300 },
  "missao-navegacao-segura": { min: 90, avg: 240 },
  // Galáxia 2 — API REST (estimativas pela duração das animações e falas de cada lab; calibrar com a equipe)
  "faca-uma-pergunta-ao-servidor": { min: 60, avg: 150 },
  "o-servidor-respondeu": { min: 90, avg: 210 },
  "qual-metodo-devo-usar": { min: 60, avg: 180 },
  "encontre-o-problema": { min: 75, avg: 210 },
  "caca-ao-dado": { min: 60, avg: 180 },
  "monte-a-resposta": { min: 45, avg: 120 },
  "diagnostico-da-api": { min: 90, avg: 240 },
  "desafio-final-missao-api": { min: 90, avg: 240 },
};

export function labTiming(engineKey: string): LabTiming {
  const timing = LAB_TIMING[engineKey] ?? DEFAULT_LAB_TIMING;
  // proteção contra valores digitados errados (avg precisa ser maior que min)
  return timing.avg > timing.min && timing.min >= 0 ? timing : DEFAULT_LAB_TIMING;
}
