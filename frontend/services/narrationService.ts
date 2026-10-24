import { BONZI_VOICE, BONZI_VOICE_DIR } from "@/config/bonziVoice";
import { BONZI_VOICE_PATTERNS } from "@/config/bonziVoicePatterns";

export type NarrationOptions = {
  enabled?: boolean;
  /** 0–100 (mesma escala de settings.volume) */
  volume?: number;
  /** identifica quem está falando; stop(owner) só interrompe a fala desse dono */
  owner?: string;
  /** áudio pré-gravado; sem ele, a dublagem é procurada pelo texto (config/bonziVoice.ts) */
  audioSrc?: string;
  /**
   * Leitura de apoio (ex.: o texto "O que fazer" do painel): não conta como "o Bonzi está falando", então não segura
   * o avanço das cenas nem os `whenIdle` dos motores. Qualquer fala nova do Bonzi a interrompe.
   */
  background?: boolean;
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
let watchdog: ReturnType<typeof setTimeout> | null = null;
/** gravação da dublagem tocando agora */
let currentAudio: HTMLAudioElement | null = null;
/** a fala atual é leitura de apoio (`background`) */
let currentBackground = false;
/** leitura de apoio: parar no fim da frase atual (alguém está esperando a vez) */
let stopAfterSentence = false;
/** quem espera a voz ficar livre (`yieldBackground`) */
const freeWaiters: Array<() => void> = [];

/*
 * "O Bonzi está ocupado?" — os shells usam para só liberar o avanço (e só trocar de cena) quando ele termina.
 * Ocupado = a voz está falando OU ainda há falas na fila do shell (`setPendingLines`, ver useBonziLine): entre duas
 * falas da fila a voz fica um instante em silêncio, e nada pode ser liberado nesse intervalo.
 * Antes o avanço era liberado por estimativa (~65 ms por letra) e a voz real, mais lenta, era cortada no meio.
 */
let speaking = false;
let pendingLines = 0;
let busy = false;
const speakingListeners = new Set<() => void>();
const idleWaiters: Array<() => void> = [];
const silenceWaiters: Array<() => void> = [];

function refreshBusy(): void {
  const next = speaking || pendingLines > 0;
  if (busy === next) return;
  busy = next;
  speakingListeners.forEach((listener) => listener());
  if (!next) idleWaiters.splice(0).forEach((resolve) => resolve());
}

function setSpeaking(value: boolean): void {
  if (speaking === value) return;
  speaking = value;
  if (!value) silenceWaiters.splice(0).forEach((resolve) => resolve());
  refreshBusy();
}

/** Falas do Bonzi esperando na fila do shell (inclui a que acabou de aparecer e ainda não começou a ser falada). */
export function setPendingLines(count: number): void {
  pendingLines = Math.max(0, count);
  refreshBusy();
}

/** true enquanto o Bonzi fala ou tem falas na fila */
export function isSpeaking(): boolean {
  return busy;
}

export function subscribeSpeaking(listener: () => void): () => void {
  speakingListeners.add(listener);
  return () => speakingListeners.delete(listener);
}

function waitFor(list: Array<() => void>, ready: boolean, maxMs: number): Promise<void> {
  if (ready) return Promise.resolve();
  return new Promise<void>((resolve) => {
    const timer = setTimeout(done, maxMs);
    function done() {
      clearTimeout(timer);
      const index = list.indexOf(done);
      if (index >= 0) list.splice(index, 1);
      resolve();
    }
    list.push(done);
  });
}

/** Resolve quando o Bonzi termina tudo: a fala atual e as da fila (na hora, se está livre). `maxMs`: segurança. */
export function whenIdle(maxMs = 15000): Promise<void> {
  return waitFor(idleWaiters, !busy, maxMs);
}

/** Resolve quando a voz atual termina (a fila do shell usa para passar à próxima fala). */
export function whenSilent(maxMs = 30000): Promise<void> {
  return waitFor(silenceWaiters, !speaking, maxMs);
}

function getSynth(): SpeechSynthesis | null {
  if (typeof window === "undefined") return null;
  if (!("speechSynthesis" in window) || typeof window.SpeechSynthesisUtterance === "undefined") return null;
  return window.speechSynthesis;
}

export function isNarrationSupported(): boolean {
  return getSynth() !== null || (typeof window !== "undefined" && typeof window.Audio !== "undefined");
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

function splitChunks(text: string, max = MAX_CHUNK): string[] {
  const sentences = text.match(/[^.!?…]+[.!?…]*\s*/g) ?? [text];
  const chunks: string[] = [];
  let current = "";
  for (const sentence of sentences) {
    if (current && (current + sentence).length > max) {
      chunks.push(current.trim());
      current = "";
    }
    current += sentence;
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

/* ───────── dublagem: fala gravada no lugar da voz do navegador ───────── */

type Part = { text: string; src: string | null };

const voiceKey = (text: string) => cleanForSpeech(text).normalize("NFC").toLowerCase();
let clips: Map<string, string> | null = null;

let patterns: Array<{ test: RegExp; spoken: string }> | null = null;

const escapeRegExp = (text: string) => text.replace(/[.+?^${}()|[\]\\]/g, "\\$&");

function exactClip(text: string): string | null {
  clips ??= new Map(BONZI_VOICE.map(([line, file]) => [voiceKey(line), `${BONZI_VOICE_DIR}/${file}`]));
  return clips.get(voiceKey(text)) ?? null;
}

/** Gravação da fala: a do texto exato; senão, a de um molde com valor livre (config/bonziVoicePatterns.ts). */
function clipFor(text: string): string | null {
  const exact = exactClip(text);
  if (exact) return exact;
  // `*` sai antes da limpeza do texto (cleanForSpeech também remove asteriscos)
  patterns ??= BONZI_VOICE_PATTERNS.map(([pattern, spoken]) => ({
    test: new RegExp(`^${pattern.split("*").map((piece) => escapeRegExp(voiceKey(piece))).join(".+?")}$`),
    spoken,
  }));
  const key = voiceKey(text);
  const match = patterns.find((p) => p.test.test(key));
  return match ? exactClip(match.spoken) : null;
}

/** Pedaços de uma fala montada no código: cada frase e cada "Rótulo:" ("Ainda não." + o motivo, "Remetente:" + a pista). */
function voiceSegments(text: string): string[] {
  return text
    .replace(/([.!?…:])\s+/g, "$1\n")
    .split("\n")
    .map((part) => part.trim())
    .filter(Boolean);
}

/**
 * A fala gravada inteira; senão, uma gravação por pedaço, se TODOS os pedaços foram gravados; senão, null (voz do
 * navegador para a fala toda: nunca mistura as duas vozes numa fala).
 */
function recordedParts(text: string): Part[] | null {
  const whole = clipFor(text);
  if (whole) return [{ text, src: whole }];
  const pieces = voiceSegments(text);
  if (pieces.length < 2) return null;
  const parts = pieces.map((piece) => ({ text: piece, src: clipFor(piece) }));
  return parts.every((part) => part.src) ? parts : null;
}

function stopAudio(): void {
  const audio = currentAudio;
  currentAudio = null;
  if (!audio) return;
  audio.onended = null;
  audio.onerror = null;
  audio.onloadedmetadata = null;
  try {
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
  } catch {
    // áudio já descartado
  }
}

/** `replacing`: uma fala nova já vai começar (não marca "em silêncio" no meio da troca) */
function cancelCurrent(synth: SpeechSynthesis | null, replacing = false): void {
  if (startTimer !== null) {
    clearTimeout(startTimer);
    startTimer = null;
  }
  if (watchdog !== null) {
    clearTimeout(watchdog);
    watchdog = null;
  }
  const finish = currentFinish;
  currentFinish = null;
  currentOwner = null;
  currentBackground = false;
  stopAudio();
  try {
    synth?.cancel();
  } catch {
    // navegador sem suporte completo
  }
  finish?.();
  // nada está tocando agora (antes um stop() deixava "falando" ligado para sempre e o avanço travava)
  if (!replacing) setSpeaking(false);
  freeWaiters.splice(0).forEach((done) => done());
}

/**
 * Fala a mensagem com a dublagem do Bonzi (gravação, se a fala existe em config/bonziVoice.ts) ou com a voz do
 * navegador (pt-BR preferida). Cancela a fala anterior.
 * Resolve quando a fala termina, é interrompida ou quando não há suporte (no-op seguro).
 */
export function speak(message: string, opts: NarrationOptions = {}): Promise<void> {
  const synth = getSynth();
  const text = cleanForSpeech(message);
  const recorded = !text ? null : opts.audioSrc ? [{ text, src: opts.audioSrc }] : recordedParts(text);
  if (opts.enabled === false || !text || (!synth && !recorded)) return Promise.resolve();
  // em desenvolvimento, o console mostra cada fala sem gravação (o que ainda falta dublar)
  if (!recorded && process.env.NODE_ENV !== "production") console.info("[Bonzi] sem gravação:", text);

  cancelCurrent(synth, true);
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
        currentBackground = false;
        stopAudio();
        if (watchdog !== null) {
          clearTimeout(watchdog);
          watchdog = null;
        }
        setSpeaking(false);
        freeWaiters.splice(0).forEach((done) => done());
      }
      resolve();
    };
    currentFinish = finish;
    currentOwner = owner;
    currentBackground = Boolean(opts.background);
    stopAfterSentence = false;
    setSpeaking(!opts.background);
    // segurança: se o navegador nunca disparar "onend", a fala é dada como terminada (~120 ms por letra + folga)
    const arm = (ms: number) => {
      if (watchdog !== null) clearTimeout(watchdog);
      watchdog = setTimeout(finish, ms);
    };
    arm(text.length * 120 + 4000);

    startTimer = setTimeout(() => {
      startTimer = null;
      if (settled) return;
      try {
        if (synth?.paused) synth.resume();
        const voice = synth ? pickVoice(synth) : null;
        // leitura de apoio: uma frase por vez, para poder parar no fim da frase (yieldBackground) sem cortar no meio
        const parts: Part[] =
          recorded ?? (opts.background ? splitChunks(text, 1) : splitChunks(text)).map((chunk) => ({ text: chunk, src: null }));
        let index = 0;
        const say = (chunk: string) => {
          if (!synth) {
            speakNext();
            return;
          }
          const utterance = new SpeechSynthesisUtterance(chunk);
          utterance.lang = voice?.lang ?? "pt-BR";
          if (voice) utterance.voice = voice;
          utterance.rate = RATE;
          utterance.pitch = PITCH;
          utterance.volume = volume;
          utterance.onend = speakNext;
          utterance.onerror = finish;
          synth.speak(utterance);
        };
        const play = (part: Part & { src: string }) => {
          const audio = new Audio(part.src);
          currentAudio = audio;
          audio.volume = volume;
          let failed = false;
          // gravação que não carrega: a mesma frase com a voz do navegador
          const fail = () => {
            if (failed || currentAudio !== audio) return;
            failed = true;
            currentAudio = null;
            say(part.text);
          };
          audio.onended = () => {
            if (currentAudio !== audio) return;
            currentAudio = null;
            speakNext();
          };
          audio.onerror = fail;
          audio.onloadedmetadata = () => {
            const rest = parts.slice(index).reduce((sum, next) => sum + next.text.length, 0);
            if (Number.isFinite(audio.duration)) arm(audio.duration * 1000 + rest * 120 + 4000);
          };
          audio.play().catch(fail);
        };
        const speakNext = () => {
          if (settled) return;
          if (index >= parts.length || (index > 0 && stopAfterSentence && currentFinish === finish)) {
            finish();
            return;
          }
          const part = parts[index];
          index += 1;
          if (part.src) play({ ...part, src: part.src });
          else say(part.text);
        };
        speakNext();
      } catch {
        finish();
      }
    }, START_DELAY_MS);
  });
}

/**
 * Vez de outra fala: se a voz está numa leitura de apoio, ela termina a frase atual e para; resolve quando a voz fica
 * livre (na hora, se não há leitura de apoio). Uma fala do Bonzi nunca é interrompida por aqui.
 */
export function yieldBackground(): Promise<void> {
  if (!currentFinish || !currentBackground) return Promise.resolve();
  stopAfterSentence = true;
  return new Promise<void>((resolve) => freeWaiters.push(resolve));
}

/** Interrompe a fala atual. Com `owner`, só interrompe se a fala atual for desse dono. */
export function stop(owner?: string): void {
  if (owner && currentOwner !== null && owner !== currentOwner) return;
  if (owner && currentOwner === null && currentFinish === null) return;
  cancelCurrent(getSynth());
}

export const narrationService = {
  speak,
  stop,
  isSupported: isNarrationSupported,
  cleanForSpeech,
  isSpeaking,
  subscribeSpeaking,
  whenIdle,
  whenSilent,
  setPendingLines,
  yieldBackground,
};
