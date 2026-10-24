export type NarrationOptions = {
  enabled?: boolean;
  /** 0–100 (mesma escala de settings.volume) */
  volume?: number;
  /** identifica quem está falando; stop(owner) só interrompe a fala desse dono */
  owner?: string;
  /** reservado para áudio pré-gravado (não usado com a voz do navegador) */
  audioSrc?: string;
};

const RATE = 1.05;
const PITCH = 1.15;
const MAX_CHUNK = 180;
const START_DELAY_MS = 40;

let currentOwner: string | null = null;
let currentFinish: (() => void) | null = null;
let startTimer: ReturnType<typeof setTimeout> | null = null;
let cachedVoice: SpeechSynthesisVoice | null | undefined;
let listening = false;

function getSynth(): SpeechSynthesis | null {
  if (typeof window === "undefined") return null;
  if (!("speechSynthesis" in window) || typeof window.SpeechSynthesisUtterance === "undefined") return null;
  return window.speechSynthesis;
}

export function isNarrationSupported(): boolean {
  return getSynth() !== null;
}

function normalizeLang(lang: string | undefined): string {
  return (lang ?? "").toLowerCase().replace("_", "-");
}

function pickVoice(synth: SpeechSynthesis): SpeechSynthesisVoice | null {
  if (!listening) {
    listening = true;
    synth.addEventListener?.("voiceschanged", () => {
      cachedVoice = undefined;
    });
  }
  if (cachedVoice !== undefined) return cachedVoice;
  const voices = synth.getVoices();
  if (voices.length === 0) return null;
  const portuguese = voices.filter((v) => normalizeLang(v.lang).startsWith("pt"));
  const brazilian = portuguese.filter((v) => normalizeLang(v.lang) === "pt-br");
  const quality = (v: SpeechSynthesisVoice) => (/natural|online|google/i.test(v.name) ? 0 : 1);
  const ranked = [...(brazilian.length > 0 ? brazilian : portuguese)].sort((a, b) => quality(a) - quality(b));
  cachedVoice = ranked[0] ?? null;
  return cachedVoice;
}

/** Remove aspas, markup e notação que não deve ser lida em voz alta. */
export function cleanForSpeech(message: string): string {
  return message
    .replace(/<\/?\s*([a-z][a-z0-9]*)[^>]*>/gi, " $1 ")
    .replace(/[“”„"«»`*_#~|\\]/g, "")
    .replace(/(^|[\s(])['‘’]+|['‘’]+(?=[\s.,!?;:)]|$)/g, "$1")
    .replace(/\s*(→|->|=>)\s*/g, ", ")
    .replace(/[✓✔✕✗★•▶◀]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function splitChunks(text: string): string[] {
  const sentences = text.match(/[^.!?…]+[.!?…]*\s*/g) ?? [text];
  const chunks: string[] = [];
  let current = "";
  for (const sentence of sentences) {
    if (current && (current + sentence).length > MAX_CHUNK) {
      chunks.push(current.trim());
      current = "";
    }
    current += sentence;
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

function cancelCurrent(synth: SpeechSynthesis | null): void {
  if (startTimer !== null) {
    clearTimeout(startTimer);
    startTimer = null;
  }
  const finish = currentFinish;
  currentFinish = null;
  currentOwner = null;
  try {
    synth?.cancel();
  } catch {
    // navegador sem suporte completo
  }
  finish?.();
}

/**
 * Fala a mensagem com a voz do navegador (pt-BR preferida). Cancela a fala anterior.
 * Resolve quando a fala termina, é interrompida ou quando não há suporte (no-op seguro).
 */
export function speak(message: string, opts: NarrationOptions = {}): Promise<void> {
  const synth = getSynth();
  const text = cleanForSpeech(message);
  if (!synth || opts.enabled === false || !text) return Promise.resolve();

  cancelCurrent(synth);
  const owner = opts.owner ?? null;
  const volume = Math.min(1, Math.max(0, (opts.volume ?? 100) / 100));

  return new Promise<void>((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      if (currentFinish === finish) {
        currentFinish = null;
        currentOwner = null;
      }
      resolve();
    };
    currentFinish = finish;
    currentOwner = owner;

    startTimer = setTimeout(() => {
      startTimer = null;
      if (settled) return;
      try {
        if (synth.paused) synth.resume();
        const voice = pickVoice(synth);
        const chunks = splitChunks(text);
        chunks.forEach((chunk, index) => {
          const utterance = new SpeechSynthesisUtterance(chunk);
          utterance.lang = voice?.lang ?? "pt-BR";
          if (voice) utterance.voice = voice;
          utterance.rate = RATE;
          utterance.pitch = PITCH;
          utterance.volume = volume;
          if (index === chunks.length - 1) utterance.onend = finish;
          utterance.onerror = finish;
          synth.speak(utterance);
        });
      } catch {
        finish();
      }
    }, START_DELAY_MS);
  });
}

/** Interrompe a fala atual. Com `owner`, só interrompe se a fala atual for desse dono. */
export function stop(owner?: string): void {
  if (owner && currentOwner !== null && owner !== currentOwner) return;
  if (owner && currentOwner === null && currentFinish === null) return;
  cancelCurrent(getSynth());
}

export const narrationService = { speak, stop, isSupported: isNarrationSupported, cleanForSpeech };
