"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AchievementToasts, type AchievementToastItem } from "@/components/gamification/AchievementToasts";
import { achievementBySlug } from "@/config/achievements";
import { listenAchievementUnlocks } from "@/lib/achievementEvents";
import { earnedFromProgress, earnedFromRanking } from "@/lib/achievements";
import { getGalaxies, getGalaxyDetails } from "@/services/catalogService";
import {
  getGalaxyRanking,
  getMyAchievements,
  getSystemRanking,
  unlockAchievement as unlockOnServer,
} from "@/services/gamificationService";
import type { GalaxyDetail } from "@/types/domain";
import { useExplorer } from "./useExplorer";
import { useLocalStorage } from "./useLocalStorage";
import { useProgress } from "./useProgress";
import { useSession } from "./useSession";

/** Cópia local (por dono, como o progresso): slug → quando foi desbloqueada. Com conta, também no servidor. */
type StoredAchievements = { owner?: string; unlocked: Record<string, string> };

export type AchievementsContextValue = {
  /** true depois de ler a cópia local e (com conta) o que está no servidor */
  ready: boolean;
  unlocked: Record<string, string>;
  isUnlocked: (slug: string) => boolean;
  /** apaga só a cópia deste aparelho (a conta continua com as conquistas) */
  resetAchievements: () => void;
};

const STORAGE_KEY = "rota404.achievements";
const EMPTY: StoredAchievements = { unlocked: {} };
/** espera o progresso chegar ao servidor antes de olhar o ranking */
const RANKING_DELAY_MS = 2500;
const TOAST_GROUP_LIMIT = 3;

const AchievementsContext = createContext<AchievementsContextValue | null>(null);

function sanitize(raw: unknown): StoredAchievements {
  const value = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const unlocked: Record<string, string> = {};
  if (value.unlocked && typeof value.unlocked === "object") {
    for (const [slug, at] of Object.entries(value.unlocked as Record<string, unknown>)) {
      if (achievementBySlug(slug) && typeof at === "string") unlocked[slug] = at;
    }
  }
  return typeof value.owner === "string" && value.owner ? { owner: value.owner, unlocked } : { unlocked };
}

export function AchievementsProvider({ children }: { children: ReactNode }) {
  const { status: sessionStatus, user, owner } = useSession();
  const { explorer } = useExplorer();
  const progress = useProgress();
  const [stored, setStored, storageHydrated] = useLocalStorage<StoredAchievements>(STORAGE_KEY, EMPTY);
  const data = useMemo(() => sanitize(stored), [stored]);
  const synced = sessionStatus === "signed-in";
  const [syncedOwner, setSyncedOwner] = useState<string | null>(null);
  const [galaxies, setGalaxies] = useState<GalaxyDetail[]>([]);
  const [toasts, setToasts] = useState<AchievementToastItem[]>([]);
  const dataRef = useRef(data);
  dataRef.current = data;
  const syncedRef = useRef(synced);
  syncedRef.current = synced;
  const toastKey = useRef(0);
  const ready = storageHydrated && owner !== null && syncedOwner === owner && data.owner === owner;

  // outra conta (ou visitante) neste aparelho: começa do zero e, com conta, junta com o que está no servidor
  useEffect(() => {
    if (!storageHydrated || owner === null) return;
    if (dataRef.current.owner !== owner) setStored({ owner, unlocked: {} });
    if (!synced) {
      setSyncedOwner(owner);
      return;
    }
    let active = true;
    getMyAchievements()
      .then(
        (mine) => {
          if (!active) return;
          const local = dataRef.current.owner === owner ? dataRef.current.unlocked : {};
          const server: Record<string, string> = {};
          for (const entry of mine) server[entry.slug] = entry.unlocked_at;
          // ganhas sem conexão (ou antes de o banco ter o catálogo) voltam para o servidor
          for (const slug of Object.keys(local)) if (!server[slug]) unlockOnServer(slug).catch(() => undefined);
          setStored({ owner, unlocked: { ...local, ...server } });
        },
        () => undefined, // sem rede: segue com a cópia local
      )
      .finally(() => {
        if (active) setSyncedOwner(owner);
      });
    return () => {
      active = false;
    };
  }, [storageHydrated, owner, synced, setStored]);

  const unlock = useCallback(
    (slugs: string[]) => {
      const current = dataRef.current;
      const fresh = slugs.filter((slug, i) => achievementBySlug(slug) && !current.unlocked[slug] && slugs.indexOf(slug) === i);
      if (fresh.length === 0) return;
      const at = new Date().toISOString();
      const unlocked = { ...current.unlocked };
      for (const slug of fresh) unlocked[slug] = at;
      dataRef.current = { ...current, unlocked };
      setStored(dataRef.current);
      if (syncedRef.current) for (const slug of fresh) unlockOnServer(slug).catch(() => undefined);
      setToasts((prev) => [
        ...prev,
        ...(fresh.length > TOAST_GROUP_LIMIT
          ? [{ key: ++toastKey.current, slugs: fresh }]
          : fresh.map((slug) => ({ key: ++toastKey.current, slugs: [slug] }))),
      ]);
    },
    [setStored],
  );

  // gatilhos de fora do progresso (404, suco de abacaxi, troca de personagem)
  useEffect(() => {
    if (!ready) return;
    return listenAchievementUnlocks((slug) => unlock([slug]));
  }, [ready, unlock]);

  // catálogo (sistemas e planetas de cada galáxia): as regras de sistema e galáxia precisam dele
  useEffect(() => {
    if (!ready) return;
    let active = true;
    getGalaxies()
      .then((list) => getGalaxyDetails(list.map((g) => g.slug)))
      .then((details) => {
        if (active) setGalaxies(details.filter((d): d is GalaxyDetail => d !== null));
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [ready]);

  const planets = progress.progress.planets;
  const nickname = synced ? (user?.nickname ?? null) : null;
  useEffect(() => {
    if (!ready || !progress.hydrated) return;
    unlock(earnedFromProgress({ planets, galaxies, nickname, avatarSlug: explorer.avatarSlug }));
  }, [ready, progress.hydrated, planets, galaxies, nickname, explorer.avatarSlug, unlock]);

  // ranking (só com conta): depois de cada laboratório concluído, a posição na galáxia e no sistema dele
  const scored = useMemo(() => {
    const ids = new Set(Object.keys(planets).filter((id) => planets[id]?.status === "completed" && planets[id]?.bestPoints !== undefined));
    const systems = galaxies.flatMap((g) => g.systems.filter((s) => (s.planets ?? []).some((p) => ids.has(p.id))).map((s) => ({ galaxy: g.slug, system: s.slug })));
    const signature = [...ids].map((id) => `${id}:${planets[id]?.bestPoints}`).sort().join(",");
    return { systems, signature };
  }, [planets, galaxies]);
  const scoredRef = useRef(scored);
  scoredRef.current = scored;
  useEffect(() => {
    if (!ready || !synced || scored.systems.length === 0) return;
    const timer = window.setTimeout(() => {
      const { systems } = scoredRef.current;
      const galaxySlugs = [...new Set(systems.map((s) => s.galaxy))];
      const position = (request: Promise<{ me: { position: number } | null }>) =>
        request.then((ranking) => ranking.me?.position ?? null).catch(() => null);
      void Promise.all([
        Promise.all(galaxySlugs.map((slug) => position(getGalaxyRanking(slug)))),
        Promise.all(systems.map((s) => position(getSystemRanking(s.system)))),
      ]).then(([galaxyPositions, systemPositions]) => {
        const best = (list: Array<number | null>) => list.reduce<number | null>((min, p) => (p !== null && (min === null || p < min) ? p : min), null);
        unlock(earnedFromRanking(best(systemPositions), best(galaxyPositions)));
      });
    }, RANKING_DELAY_MS);
    return () => window.clearTimeout(timer);
    // a assinatura (labs e melhores pontos) muda a cada laboratório concluído com pontos novos
  }, [ready, synced, scored.signature, scored.systems.length, unlock]);

  const dismissToast = useCallback((key: number) => setToasts((prev) => prev.filter((t) => t.key !== key)), []);

  const resetAchievements = useCallback(
    () => setStored({ owner: dataRef.current.owner, unlocked: {} }),
    [setStored],
  );

  const value = useMemo<AchievementsContextValue>(() => {
    const unlocked = ready ? data.unlocked : {};
    return { ready, unlocked, isUnlocked: (slug) => Boolean(unlocked[slug]), resetAchievements };
  }, [ready, data.unlocked, resetAchievements]);

  return (
    <AchievementsContext.Provider value={value}>
      {children}
      <AchievementToasts items={toasts} onDone={dismissToast} />
    </AchievementsContext.Provider>
  );
}

export function useAchievements(): AchievementsContextValue {
  const context = useContext(AchievementsContext);
  if (!context) throw new Error("useAchievements precisa estar dentro de <AchievementsProvider>.");
  return context;
}

export default useAchievements;
