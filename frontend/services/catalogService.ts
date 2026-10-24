import type {
  AgeRange,
  AgeRangeDetail,
  Galaxy,
  GalaxyDetail,
  HealthStatus,
  PlanetarySystem,
  PlanetarySystemDetail,
} from "@/types/domain";
import { apiGet } from "./apiClient";

const enc = encodeURIComponent;

export function getHealth(): Promise<HealthStatus> {
  return apiGet<HealthStatus>("/health");
}

export function getAgeRanges(): Promise<AgeRange[]> {
  return apiGet<AgeRange[]>("/age-ranges");
}

export function getAgeRange(ref: string): Promise<AgeRangeDetail> {
  return apiGet<AgeRangeDetail>(`/age-ranges/${enc(ref)}`);
}

export function getGalaxies(filters: { ageRange?: string } = {}): Promise<Galaxy[]> {
  return apiGet<Galaxy[]>("/galaxies", { age_range: filters.ageRange });
}

export function getGalaxy(ref: string): Promise<GalaxyDetail> {
  return apiGet<GalaxyDetail>(`/galaxies/${enc(ref)}`);
}

/** Detalhes de várias galáxias (sistemas + planetas), em paralelo e na ordem de `refs`; uma falha individual vira null. */
export function getGalaxyDetails(refs: string[]): Promise<Array<GalaxyDetail | null>> {
  return Promise.all(refs.map((ref) => getGalaxy(ref).catch((): GalaxyDetail | null => null)));
}

export function getSystems(filters: { galaxy?: string } = {}): Promise<PlanetarySystem[]> {
  return apiGet<PlanetarySystem[]>("/systems", { galaxy: filters.galaxy });
}

export function getSystem(ref: string): Promise<PlanetarySystemDetail> {
  return apiGet<PlanetarySystemDetail>(`/systems/${enc(ref)}`);
}

export const catalogService = {
  getHealth,
  getAgeRanges,
  getAgeRange,
  getGalaxies,
  getGalaxy,
  getGalaxyDetails,
  getSystems,
  getSystem,
};
