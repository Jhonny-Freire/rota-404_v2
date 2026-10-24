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

export interface ProgressEntry {
  planet_id: UUID;
  status: ProgressState;
  started_at: string | null;
  completed_at: string | null;
}

export interface Score {
  id: UUID;
  user_id: UUID;
  lab_id: UUID;
  points: number;
  created_at: string;
}

export type AchievementRarity = "comum" | "rara" | "lenda";

export interface Achievement {
  id: UUID;
  slug: string;
  name: string;
  description: string | null;
  sprite_key: string | null;
  rarity: AchievementRarity;
}

export interface UserAchievement {
  achievement_id: UUID;
  unlocked_at: string;
}

export interface RankingEntry {
  position: number;
  user_id: UUID;
  display_name: string;
  avatar_slug: string | null;
  points: number;
}

export type RankingScope = "galaxy" | "planetary_system";

export interface Ranking {
  scope: RankingScope;
  scope_id: UUID;
  entries: RankingEntry[];
}

export interface User extends Timestamps {
  id: UUID;
  display_name: string;
  avatar_id: UUID | null;
  age_range_id: UUID | null;
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
