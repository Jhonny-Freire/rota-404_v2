import { badgeSprite } from "@/config/assets";
import type { AchievementRarity } from "@/types/domain";

/**
 * Conquistas da tabela da equipe (24/10/2026). O slug é o código ("c-01"), a arte vem de BADGE_ART (config/assets.ts) e as
 * regras de desbloqueio ficam em lib/achievements.ts. Linhas sem regra na tabela (C-07, R-01, R-06, R-07, L-05 a
 * L-07) ainda não existem. O banco espelha esta lista (supabase/migrations/20261024000000_achievements.sql, seed.sql e
 * backend/app/data/seed.json; um teste do backend confere slug, raridade e nome, nesta ordem).
 */
export type AchievementDef = {
  slug: string;
  rarity: AchievementRarity;
  name: string;
  /** como desbloquear (secretas: só aparece depois de desbloquear) */
  description: string;
  sprite: string;
  secret: boolean;
};

type Entry = Omit<AchievementDef, "sprite" | "secret">;

const ENTRIES: Entry[] = [
  { slug: "c-01", rarity: "comum", name: "Traje novo", description: "Trocar de personagem no perfil." },
  { slug: "c-02", rarity: "comum", name: "Primeiro pouso", description: "Completar um planeta." },
  { slug: "c-03", rarity: "comum", name: "Sistema explorado", description: "Completar um sistema planetário." },
  { slug: "c-04", rarity: "comum", name: "Cabeça fria", description: "Completar um laboratório sem cometer nenhum erro." },
  { slug: "c-05", rarity: "comum", name: "Estrela em ascensão", description: "Fazer mais de 7.000 pontos em um laboratório." },
  { slug: "c-06", rarity: "comum", name: "Segunda volta", description: "Refazer um laboratório." },
  { slug: "r-02", rarity: "rara", name: "Brilho de supernova", description: "Fazer mais de 9.000 pontos em um laboratório." },
  { slug: "r-03", rarity: "rara", name: "Mente brilhante", description: "Completar um sistema planetário sem cometer nenhum erro nos laboratórios." },
  { slug: "r-04", rarity: "rara", name: "Pódio do sistema", description: "Ficar entre os 3 primeiros no ranking de um sistema planetário." },
  { slug: "r-05", rarity: "rara", name: "Entre os dez", description: "Ficar entre os 10 primeiros no ranking da galáxia." },
  { slug: "l-01", rarity: "lenda", name: "Nota máxima", description: "Fazer a pontuação máxima (10.000) em um laboratório." },
  { slug: "l-02", rarity: "lenda", name: "Sistema perfeito", description: "Fazer a pontuação máxima em todos os laboratórios de um sistema planetário." },
  { slug: "l-03", rarity: "lenda", name: "Viajante da galáxia", description: "Completar uma galáxia." },
  { slug: "l-04", rarity: "lenda", name: "Lenda do ranking", description: "Ficar entre os 3 primeiros no ranking da galáxia." },
  { slug: "b-01", rarity: "brutal", name: "Gênio da galáxia", description: "Completar uma galáxia sem cometer nenhum erro nos laboratórios." },
  { slug: "b-02", rarity: "brutal", name: "Incansável", description: "Refazer todos os laboratórios de uma galáxia." },
  { slug: "s-01", rarity: "secreta", name: "Piaba ao quadrado", description: "Usar o apelido Piaba com o personagem Piaba." },
  { slug: "s-02", rarity: "secreta", name: "Perdido no espaço", description: "Encontrar um endereço que não existe." },
  { slug: "s-03", rarity: "secreta", name: "Refrescante", description: "Pegar um suco de abacaxi perdido no espaço." },
];

export const ACHIEVEMENTS: AchievementDef[] = ENTRIES.map((entry) => ({
  ...entry,
  sprite: badgeSprite(entry.slug),
  secret: entry.rarity === "secreta",
}));

export const ACHIEVEMENT_RARITIES: AchievementRarity[] = ["comum", "rara", "lenda", "brutal", "secreta"];

export function achievementBySlug(slug: string): AchievementDef | undefined {
  return ACHIEVEMENTS.find((a) => a.slug === slug);
}
