"use client";

import { useSyncExternalStore } from "react";
import { useSettings } from "./useSettings";

const QUERY = "(prefers-reduced-motion: reduce)";

/** Uma única MediaQueryList para o app inteiro (antes: um matchMedia + listener + estado por componente). */
let mediaQuery: MediaQueryList | null | undefined;

function getQuery(): MediaQueryList | null {
  if (mediaQuery === undefined) {
    mediaQuery = typeof window !== "undefined" && typeof window.matchMedia === "function" ? window.matchMedia(QUERY) : null;
  }
  return mediaQuery;
}

function subscribe(onChange: () => void): () => void {
  const query = getQuery();
  query?.addEventListener("change", onChange);
  return () => query?.removeEventListener("change", onChange);
}

const getSnapshot = () => getQuery()?.matches ?? false;
const getServerSnapshot = () => false;

export function useReducedMotion(): boolean {
  const { settings } = useSettings();
  const systemPrefers = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return settings.reducedMotion || systemPrefers;
}

export default useReducedMotion;
