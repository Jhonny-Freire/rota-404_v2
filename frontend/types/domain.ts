export type UUID = string;

export interface Timestamps {
  created_at: string;
  updated_at: string;
}

export interface AgeRange extends Timestamps {
  id: UUID;
  name: string;
  slug: string;
  min_age: number;
  max_age: number | null;
  description: string | null;
}

export interface Galaxy extends Timestamps {
  id: UUID;
  age_range_id: UUID;
  name: string;
  slug: string;
  description: string | null;
  order_index: number;
  sprite_key?: string | null;
}

export interface PlanetarySystem extends Timestamps {
  id: UUID;
  galaxy_id: UUID;
  name: string;
  slug: string;
  description: string | null;
  order_index: number;
  sprite_key?: string | null;
}

export type PlanetType = "lesson" | "lab";

export interface Planet extends Timestamps {
  id: UUID;
  planetary_system_id: UUID;
  type: PlanetType;
  name: string;
  slug: string;
  description: string | null;
  sprite_key: string | null;
  order_index: number;
}

export interface AgeRangeDetail extends AgeRange {
  galaxies: Galaxy[];
}

export interface GalaxySystem extends PlanetarySystem {
  planets?: Planet[];
}

export interface GalaxyDetail extends Galaxy {
  age_range: AgeRange;
  systems: GalaxySystem[];
}

export interface PlanetarySystemDetail extends PlanetarySystem {
  galaxy: Galaxy;
  planets: Planet[];
}

export type ProgressState = "locked" | "available" | "in_progress" | "completed";

export interface LessonContent {
  code?: string;
  engine?: string;
  central_idea?: string;
}

export interface Lesson extends Timestamps {
  id: UUID;
  planet_id: UUID;
  title: string;
  slug: string;
  order_index: number;
  content: LessonContent | null;
}

export interface LabConfig {
  code?: string;
  type?: string;
  engine?: string;
}

export interface Lab extends Timestamps {
  id: UUID;
  planet_id: UUID;
  title: string;
  slug: string;
  order_index: number;
  max_score: number;
  config: LabConfig | null;
}

export interface LessonDetail extends Lesson {
  planet: Planet;
  system: PlanetarySystem;
}

export interface LabDetail extends Lab {
  planet: Planet;
  system: PlanetarySystem;
}

/** Progresso de um planeta salvo na conta (GET/PUT /progress). */
export interface ProgressEntry {
  planet_id: UUID;
  status: "in_progress" | "completed";
  best_points: number | null;
  updated_at: string | null;
}

export interface Score {
  id: UUID;
  user_id: UUID;
  galaxy_id: UUID;
  planetary_system_id: UUID | null;
  lab_id: UUID | null;
  points: number;
  created_at: string;
  updated_at: string;
}

export type AchievementRarity = "comum" | "rara" | "lenda" | "brutal" | "secreta";

/** Catálogo do servidor (o frontend usa a cópia em config/achievements.ts, que tem as regras). */
export interface Achievement {
  id: UUID;
  slug: string;
  code: string | null;
  name: string;
  description: string | null;
  sprite_key: string | null;
  rarity: AchievementRarity;
  secret: boolean;
  order_index: number;
}

export interface UserAchievement {
  achievement_id: UUID;
  slug: string;
  unlocked_at: string;
}

export interface RankingEntry {
  position: number;
  user_id: UUID;
  display_name: string;
  avatar_slug: string | null;
  points: number;
  /** laboratórios com pontuação nesse escopo */
  completed_labs: number;
  /** conquistas da conta (todas, não só deste escopo); ausente em servidor antigo */
  achievements?: number;
}

export type RankingScope = "galaxy" | "planetary_system";

export interface Ranking {
  scope: RankingScope;
  scope_id: UUID;
  entries: RankingEntry[];
  /** posição de quem pediu (com sessão), mesmo fora do top 50 */
  me: RankingEntry | null;
}

/** Conta do aluno (apelido + senha + idade). A idade define a faixa etária. */
export interface User extends Timestamps {
  id: UUID;
  nickname: string;
  display_name: string;
  age: number;
  age_range_id: UUID | null;
  age_range: { id: UUID; slug: string; name: string } | null;
  avatar_key: string | null;
  /** nível que o aluno escolheu no cadastro (null em contas antigas) */
  knowledge_level: KnowledgeLevel | null;
}

export type KnowledgeLevel = "iniciante" | "intermediario" | "avancado";

/** Resposta de cadastro e login. */
export interface Session {
  token: string;
  user: User;
}

export interface Avatar {
  id: UUID;
  slug: string;
  name: string;
  sprite_key: string;
  order_index: number;
}

export interface HealthStatus {
  status: "ok" | "degraded";
  data_source: "supabase" | "local";
  database: "ok" | "error";
}

export type BonziState = "idle" | "speaking" | "happy" | "thinking" | "warning" | "help";

export type BonziPosition = "bottom-right" | "bottom-left" | "top-right" | "inline";
