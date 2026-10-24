"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from "react";
import { DEFAULT_EXPLORER, useExplorer } from "@/hooks/useExplorer";
import { isUnauthorized, setAuthToken } from "@/services/apiClient";
import { getAgeRanges } from "@/services/catalogService";
import {
  getCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
  signup as signupRequest,
  updateCurrentUser,
  type LoginInput,
  type SignupInput,
  type UserUpdate,
} from "@/services/userService";
import { goesToAdvancedGalaxy } from "@/lib/galaxyTrack";
import type { KnowledgeLevel, Session, User } from "@/types/domain";
import { useLocalStorage } from "./useLocalStorage";

/**
 * Conta logada, ou visitante (só quando o banco está fora do ar: joga sem ranking). `id`: cada "Jogar sem conta" é um
 * visitante novo (sem ele, o próximo herdava o progresso do anterior).
 */
type GuestSession = { guest: true; id?: string; age: number; ageRangeSlug: string | null; avatarSlug: string };
type StoredSession = { token: string; user: User } | GuestSession | null;

export type SessionStatus = "loading" | "signed-in" | "guest" | "signed-out";

export type SessionContextValue = {
  status: SessionStatus;
  /** conta atual (null para visitante ou sem sessão) */
  user: User | null;
  /** dono do progresso e das conquistas neste aparelho: id da conta, "guest:<id>" do visitante ou null sem sessão */
  owner: string | null;
  signup: (input: SignupInput) => Promise<void>;
  login: (input: LoginInput) => Promise<void>;
  /** sem conta: só quando o servidor de contas não responde; o nível (ou, sem ele, a idade) define a faixa */
  playAsGuest: (age: number, avatarSlug?: string, level?: KnowledgeLevel | null) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (update: UserUpdate) => Promise<void>;
};

const STORAGE_KEY = "rota404.session";

const SessionContext = createContext<SessionContextValue | null>(null);

function sanitize(raw: unknown): StoredSession {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;
  if (value.guest === true && typeof value.age === "number") {
    return {
      guest: true,
      id: typeof value.id === "string" && value.id ? value.id : undefined,
      age: value.age,
      ageRangeSlug: typeof value.ageRangeSlug === "string" ? value.ageRangeSlug : null,
      avatarSlug: typeof value.avatarSlug === "string" && value.avatarSlug ? value.avatarSlug : DEFAULT_EXPLORER.avatarSlug,
    };
  }
  const user = value.user as User | undefined;
  if (typeof value.token === "string" && value.token && user && typeof user.id === "string") {
    return { token: value.token, user };
  }
  return null;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [stored, setStored, hydrated] = useLocalStorage<StoredSession>(STORAGE_KEY, null);
  const session = useMemo(() => sanitize(stored), [stored]);
  const { explorer, setName, setAvatar, setAgeRange } = useExplorer();
  const token = session && "token" in session ? session.token : null;
  const user = session && "user" in session ? session.user : null;

  // no render (e não num efeito): os efeitos dos filhos, como o do progresso, rodam antes dos efeitos daqui
  const tokenRef = useRef<string | null | undefined>(undefined);
  if (tokenRef.current !== token) {
    tokenRef.current = token;
    setAuthToken(token);
  }

  const start = useCallback((next: Session) => setStored({ token: next.token, user: next.user }), [setStored]);

  // confere a sessão guardada (pode ter sido encerrada em outro aparelho) e atualiza os dados da conta
  const checkedToken = useRef<string | null>(null);
  useEffect(() => {
    if (!hydrated || !token || checkedToken.current === token) return;
    checkedToken.current = token;
    getCurrentUser().then(
      (fresh) =>
        setStored((prev) => {
          const current = sanitize(prev);
          return current && "token" in current && current.token === token ? { token, user: fresh } : prev;
        }),
      (error: unknown) => {
        if (!isUnauthorized(error)) return;
        setStored((prev) => {
          const current = sanitize(prev);
          return current && "token" in current && current.token === token ? null : prev;
        });
        // sem rede: segue com a conta guardada; o progresso sincroniza quando o servidor voltar
      },
    );
  }, [hydrated, token, setStored]);

  // o explorador (nome, personagem e faixa usados no mapa e no HUD) espelha a conta
  const guest = session && "guest" in session ? session : null;
  useEffect(() => {
    if (user) {
      if (explorer.name !== user.nickname) setName(user.nickname);
      const avatar = user.avatar_key || DEFAULT_EXPLORER.avatarSlug;
      if (explorer.avatarSlug !== avatar) setAvatar(avatar);
      const range = user.age_range?.slug ?? null;
      if (explorer.ageRangeSlug !== range) setAgeRange(range);
    } else if (guest) {
      if (explorer.name !== "Visitante") setName("Visitante");
      if (explorer.avatarSlug !== guest.avatarSlug) setAvatar(guest.avatarSlug);
      if (explorer.ageRangeSlug !== guest.ageRangeSlug) setAgeRange(guest.ageRangeSlug);
    }
  }, [user, guest, explorer, setName, setAvatar, setAgeRange]);

  const signup = useCallback(async (input: SignupInput) => start(await signupRequest(input)), [start]);
  const login = useCallback(async (input: LoginInput) => start(await loginRequest(input)), [start]);

  const playAsGuest = useCallback(
    async (age: number, avatarSlug: string = DEFAULT_EXPLORER.avatarSlug, level: KnowledgeLevel | null = null) => {
      let ageRangeSlug: string | null = null;
      try {
        const ranges = [...(await getAgeRanges())].sort((a, b) => a.min_age - b.min_age);
        const range = level
          ? ranges[goesToAdvancedGalaxy(age, level) ? ranges.length - 1 : 0]
          : ranges.find((r) => age >= r.min_age && (r.max_age === null || age <= r.max_age));
        ageRangeSlug = range?.slug ?? null;
      } catch {
        // catálogo também fora: sem faixa, todas as galáxias ficam abertas
      }
      const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now());
      setStored({ guest: true, id, age, ageRangeSlug, avatarSlug });
    },
    [setStored],
  );

  const logout = useCallback(async () => {
    if (token) await logoutRequest().catch(() => undefined);
    setStored(null);
  }, [token, setStored]);

  const updateUser = useCallback(
    async (update: UserUpdate) => {
      const current = sanitize(stored);
      if (current && "guest" in current) {
        // visitante: o personagem fica só neste aparelho
        if (update.avatar_key) setStored({ ...current, avatarSlug: update.avatar_key });
        return;
      }
      const fresh = await updateCurrentUser(update);
      setStored((prev) => {
        const current = sanitize(prev);
        return current && "token" in current ? { token: current.token, user: fresh } : prev;
      });
    },
    [stored, setStored],
  );

  const value = useMemo<SessionContextValue>(() => {
    let status: SessionStatus = "signed-out";
    if (!hydrated) status = "loading";
    else if (user) status = "signed-in";
    else if (session && "guest" in session) status = "guest";
    let owner: string | null = null;
    if (status === "signed-in" && user) owner = user.id;
    else if (status === "guest" && session && "guest" in session) owner = session.id ? `guest:${session.id}` : "guest";
    return { status, user, owner, signup, login, playAsGuest, logout, updateUser };
  }, [hydrated, user, session, signup, login, playAsGuest, logout, updateUser]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) throw new Error("useSession precisa estar dentro de <SessionProvider>.");
  return context;
}

export default useSession;
