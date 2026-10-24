"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from "react";
import { useLocalStorage } from "./useLocalStorage";

export type Settings = {
  narrationEnabled: boolean;
  soundEnabled: boolean;
  volume: number;
  showBonzi: boolean;
  reducedMotion: boolean;
  /** modo apresentação: todos os planetas liberados */
  unlockAll: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  narrationEnabled: true,
  soundEnabled: true,
  volume: 70,
  showBonzi: true,
  reducedMotion: false,
  unlockAll: false,
};

export type SettingsContextValue = {
  settings: Settings;
  updateSettings: (partial: Partial<Settings>) => void;
  resetSettings: () => void;
  hydrated: boolean;
};

const STORAGE_KEY = "rota404.settings";

const SettingsContext = createContext<SettingsContextValue | null>(null);

function sanitize(raw: Partial<Settings> | null | undefined): Settings {
  const merged = { ...DEFAULT_SETTINGS, ...(raw && typeof raw === "object" ? raw : {}) };
  const volume = Number(merged.volume);
  return {
    narrationEnabled: Boolean(merged.narrationEnabled),
    soundEnabled: Boolean(merged.soundEnabled),
    volume: Number.isFinite(volume) ? Math.min(100, Math.max(0, Math.round(volume))) : DEFAULT_SETTINGS.volume,
    showBonzi: Boolean(merged.showBonzi),
    reducedMotion: Boolean(merged.reducedMotion),
    unlockAll: Boolean(merged.unlockAll),
  };
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [stored, setStored, hydrated] = useLocalStorage<Partial<Settings>>(STORAGE_KEY, DEFAULT_SETTINGS);
  const settings = useMemo(() => sanitize(stored), [stored]);

  useEffect(() => {
    const root = document.documentElement;
    if (settings.reducedMotion) root.dataset.reducedMotion = "true";
    else delete root.dataset.reducedMotion;
  }, [settings.reducedMotion]);

  const updateSettings = useCallback(
    (partial: Partial<Settings>) => setStored((prev) => sanitize({ ...sanitize(prev), ...partial })),
    [setStored],
  );

  const resetSettings = useCallback(() => setStored(DEFAULT_SETTINGS), [setStored]);

  const value = useMemo(
    () => ({ settings, updateSettings, resetSettings, hydrated }),
    [settings, updateSettings, resetSettings, hydrated],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (!context) throw new Error("useSettings precisa estar dentro de <SettingsProvider>.");
  return context;
}

export default useSettings;
