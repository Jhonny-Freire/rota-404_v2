import type { Achievement, ProgressEntry, ProgressState, Ranking, Score, UserAchievement } from "@/types/domain";
import { apiGet, apiPost, apiPut } from "./apiClient";

const enc = encodeURIComponent;

export function getProgress(): Promise<ProgressEntry[]> {
  return apiGet<ProgressEntry[]>("/progress");
}

export function updateProgress(planetId: string, status: ProgressState): Promise<ProgressEntry> {
  return apiPut<ProgressEntry>(`/progress/${enc(planetId)}`, { status });
}

export function getScores(): Promise<Score[]> {
  return apiGet<Score[]>("/scores");
}

export function submitScore(labId: string, points: number): Promise<Score> {
  return apiPost<Score>("/scores", { lab_id: labId, points });
}

export function getAchievements(): Promise<Achievement[]> {
  return apiGet<Achievement[]>("/achievements");
}

export function getMyAchievements(): Promise<UserAchievement[]> {
  return apiGet<UserAchievement[]>("/achievements/me");
}

export function getGalaxyRanking(ref: string): Promise<Ranking> {
  return apiGet<Ranking>(`/rankings/galaxies/${enc(ref)}`);
}

export function getSystemRanking(ref: string): Promise<Ranking> {
  return apiGet<Ranking>(`/rankings/systems/${enc(ref)}`);
}

export const gamificationService = {
  getProgress,
  updateProgress,
  getScores,
  submitScore,
  getAchievements,
  getMyAchievements,
  getGalaxyRanking,
  getSystemRanking,
};
