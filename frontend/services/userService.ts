import type { UUID, User } from "@/types/domain";
import { apiGet, apiPatch, apiPost } from "./apiClient";

export type UserInput = {
  display_name: string;
  avatar_id?: UUID | null;
  age_range_id?: UUID | null;
};

export function getCurrentUser(): Promise<User> {
  return apiGet<User>("/users/me");
}

export function createUser(input: UserInput): Promise<User> {
  return apiPost<User>("/users", input);
}

export function updateCurrentUser(input: Partial<UserInput>): Promise<User> {
  return apiPatch<User>("/users/me", input);
}

export const userService = { getCurrentUser, createUser, updateCurrentUser };
