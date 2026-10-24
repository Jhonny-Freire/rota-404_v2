import type { KnowledgeLevel, Session, User } from "@/types/domain";
import { apiDelete, apiGet, apiPatch, apiPost } from "./apiClient";

export type SignupInput = {
  nickname: string;
  password: string;
  age: number;
  avatar_key?: string;
  knowledge_level?: KnowledgeLevel;
};

export type LoginInput = {
  nickname: string;
  password: string;
};

export type UserUpdate = {
  avatar_key?: string;
  age?: number;
  knowledge_level?: KnowledgeLevel;
};

export function signup(input: SignupInput): Promise<Session> {
  return apiPost<Session>("/users", input);
}

export function login(input: LoginInput): Promise<Session> {
  return apiPost<Session>("/sessions", input);
}

export function logout(): Promise<{ ok: boolean }> {
  return apiDelete<{ ok: boolean }>("/sessions/me");
}

export function getCurrentUser(): Promise<User> {
  return apiGet<User>("/users/me");
}

export function updateCurrentUser(input: UserUpdate): Promise<User> {
  return apiPatch<User>("/users/me", input);
}

export const userService = { signup, login, logout, getCurrentUser, updateCurrentUser };
