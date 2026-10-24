import type { AgeRange, KnowledgeLevel } from "@/types/domain";

/**
 * O nível de conhecimento escolhe a galáxia (mesma regra do servidor, `user_service._age_range_for`): até 13 anos,
 * só "Já manjo bastante" vai para a galáxia 2 (API REST); de 14 anos ou mais, só "Estou começando" fica na galáxia 1.
 */
export function goesToAdvancedGalaxy(age: number, level: KnowledgeLevel): boolean {
  return level === "avancado" || (level === "intermediario" && age >= 14);
}

/**
 * Nome mostrado no lugar da faixa etária do catálogo ("13 anos ou menos"): a faixa agora vem do nível, e um aluno de
 * 15 anos que está começando não deve ler "13 anos ou menos" na ficha dele.
 */
export function trackName(range: Pick<AgeRange, "max_age">): string {
  return range.max_age === null ? "Mais desafios" : "Primeiros passos";
}
