"use client";

import { useSyncExternalStore } from "react";
import { isSpeaking, subscribeSpeaking } from "@/services/narrationService";

/** true enquanto a voz do Bonzi está falando (sempre false com a narração desligada ou sem suporte). */
export function useBonziSpeaking(): boolean {
  return useSyncExternalStore(subscribeSpeaking, isSpeaking, () => false);
}
