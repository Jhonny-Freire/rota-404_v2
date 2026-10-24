"use client";

import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { useLocalStorage } from "./useLocalStorage";

export type Explorer = {
  name: string;
  avatarSlug: string;
  ageRangeSlug: string | null;
};

export const DEFAULT_EXPLORER: Explorer = {
  name: "Explorador",
  avatarSlug: "castor",
  ageRangeSlug: null,
};

export type ExplorerContextValue = {
  explorer: Explorer;
  setName: (name: string) => void;
  setAvatar: (slug: string) => void;
  setAgeRange: (slug: string | null) => void;
  reset: () => void;
  hydrated: boolean;
};

const STORAGE_KEY = "rota404.explorer";
const MAX_NAME_LENGTH = 24;

const ExplorerContext = createContext<ExplorerContextValue | null>(null);

function sanitize(raw: Partial<Explorer> | null | undefined): Explorer {
  const value = raw && typeof raw === "object" ? raw : {};
  return {
    name: typeof value.name === "string" ? value.name.slice(0, MAX_NAME_LENGTH) : DEFAULT_EXPLORER.name,
    avatarSlug:
      typeof value.avatarSlug === "string" && value.avatarSlug ? value.avatarSlug : DEFAULT_EXPLORER.avatarSlug,
    ageRangeSlug: typeof value.ageRangeSlug === "string" && value.ageRangeSlug ? value.ageRangeSlug : null,
  };
}

export function ExplorerProvider({ children }: { children: ReactNode }) {
  const [stored, setStored, hydrated] = useLocalStorage<Partial<Explorer>>(STORAGE_KEY, DEFAULT_EXPLORER);
  const explorer = useMemo(() => sanitize(stored), [stored]);

  const patch = useCallback(
    (partial: Partial<Explorer>) => setStored((prev) => sanitize({ ...sanitize(prev), ...partial })),
    [setStored],
  );

  const value = useMemo<ExplorerContextValue>(
    () => ({
      explorer,
      setName: (name) => patch({ name }),
      setAvatar: (avatarSlug) => patch({ avatarSlug }),
      setAgeRange: (ageRangeSlug) => patch({ ageRangeSlug }),
      reset: () => setStored(DEFAULT_EXPLORER),
      hydrated,
    }),
    [explorer, patch, setStored, hydrated],
  );

  return <ExplorerContext.Provider value={value}>{children}</ExplorerContext.Provider>;
}

export function useExplorer(): ExplorerContextValue {
  const context = useContext(ExplorerContext);
  if (!context) throw new Error("useExplorer precisa estar dentro de <ExplorerProvider>.");
  return context;
}

export function explorerDisplayName(explorer: Explorer): string {
  return explorer.name.trim() || DEFAULT_EXPLORER.name;
}

export default useExplorer;
