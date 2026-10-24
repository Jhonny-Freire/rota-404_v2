import type { Lab, LabDetail, Lesson, LessonDetail } from "@/types/domain";
import { apiGet } from "./apiClient";

const enc = encodeURIComponent;

export type LearningFilters = {
  /** id ou slug do sistema planetário */
  system?: string;
};

export function listLessons(filters: LearningFilters = {}): Promise<Lesson[]> {
  return apiGet<Lesson[]>("/lessons", { system: filters.system });
}

/** ref = id da aula | slug da aula | id do planeta | slug do planeta */
export function getLesson(ref: string): Promise<LessonDetail> {
  return apiGet<LessonDetail>(`/lessons/${enc(ref)}`);
}

export function listLabs(filters: LearningFilters = {}): Promise<Lab[]> {
  return apiGet<Lab[]>("/labs", { system: filters.system });
}

/** ref = id do laboratório | slug do laboratório | id do planeta | slug do planeta */
export function getLab(ref: string): Promise<LabDetail> {
  return apiGet<LabDetail>(`/labs/${enc(ref)}`);
}

export const learningService = { listLessons, getLesson, listLabs, getLab };
