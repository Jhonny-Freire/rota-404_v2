import type { ComponentType, ReactNode } from "react";
import type { BonziState } from "@/types/domain";

/**
 * `afterCurrent`: espera o Bonzi terminar a fala atual antes desta (falas em sequência na mesma cena).
 * `silent`: só o texto, sem voz (fim do laboratório: a pontuação não tem gravação e caía na voz do navegador).
 */
export type SayOptions = { afterCurrent?: boolean; silent?: boolean };

/**
 * Fala do Bonzi inline (balão + voz, se a narração estiver ligada). Estado padrão: "speaking".
 * Repetir a mesma frase fala de novo. Uma fala nova interrompe a anterior, a não ser com `{ afterCurrent: true }`.
 */
export type Say = (message: string, state?: BonziState, options?: SayOptions) => void;

/* ───────────────────────────── AULA ───────────────────────────── */

/**
 * Props do motor de AULA. O shell controla a cena atual ("Cena anterior" / "Próxima cena" / "Concluir").
 * Todas as funções têm identidade estável (seguras em deps de useEffect).
 * O motor NÃO é remontado ao trocar de cena: renderize um subcomponente por cena
 * (`{scene === 0 && <Cena1 … />}`) para reiniciar estado/timers naturalmente.
 */
export type LessonEngineProps = {
  /** cena atual, 0-based (índice em meta.scenes) */
  scene: number;
  say: Say;
  /**
   * Libera "Próxima cena"/"Concluir". O shell zera para false a cada troca de cena;
   * cena passiva chama true ao terminar sua animação; cena com microteste só após o acerto.
   */
  setCanAdvance: (ready: boolean) => void;
  /** avança programaticamente (na última cena conclui a aula) */
  next: () => void;
  /**
   * Troca a instrução "O que fazer" mostrada ao lado do botão de avançar (ex.: "Agora toque em outro aparelho",
   * "2 de 4 aparelhos na rede"). null volta para `meta.hints[cena]`. O shell zera a cada troca de cena e,
   * quando a cena libera o avanço, mostra "Toque em Próxima cena" no lugar.
   */
  setHint: (text: string | null) => void;
  reducedMotion: boolean;
};

/**
 * `scenes`: títulos curtos das cenas (quantidade = length). A última cena habilita "Concluir".
 * `hints`: instrução inicial de cada cena (mesmo índice de `scenes`), curta e no imperativo:
 * "Toque em um aparelho." numa cena interativa, "Observe a foto viajar." numa cena passiva.
 */
export type LessonEngineMeta = { kind: "lesson"; scenes: string[]; hints?: string[] };

/* ────────────────────────── LABORATÓRIO ────────────────────────── */

export type LabFeedbackTone = "success" | "error" | "info" | "hint";

/** Mensagem do painel "Feedback" (null limpa). */
export type LabFeedback = { tone: LabFeedbackTone; message: string } | null;

/** Portal: o que for filho aparece no palco 16:9 ou no painel "Área de interação". */
export type PortalSlot = ComponentType<{ children: ReactNode }>;

/**
 * Props do motor de LABORATÓRIO. O motor controla o próprio fluxo; o shell mostra Feedback, Pontuação,
 * etapas e Conclusão. Funções estáveis. O motor é remontado a cada "Jogar de novo" (attempt + 1).
 * Renderize TUDO dentro de <Stage> e/ou <Interaction> (o que ficar fora não aparece).
 */
export type LabEngineProps = {
  /** 0, 1, 2…: muda a cada "Jogar de novo" — use em useSeededRandom(attempt) para escolher a variação */
  attempt: number;
  /** labs.max_score (100) */
  maxScore: number;
  say: Say;
  feedback: (fb: LabFeedback) => void;
  /** etapa atual (índice em meta.steps) */
  setStep: (index: number) => void;
  /** erro do aluno → penalidade (−1.000 por erro, até 4.000; ver labScore em lib/progress.ts) */
  mistake: () => void;
  /** conclui com a pontuação atual → tela de conclusão (ouro ≥ 90%, prata ≥ 70%, bronze) */
  finish: () => void;
  reducedMotion: boolean;
  /** portal para o palco 16:9 principal (coloque um <SceneCanvas> dentro) */
  Stage: PortalSlot;
  /** portal para o painel "Área de interação" (paleta, botões Testar, etc.) */
  Interaction: PortalSlot;
};

/** `steps`: nomes curtos das etapas exibidas pelo shell (destaque na atual). */
export type LabEngineMeta = { kind: "lab"; steps: string[] };

/* ─────────────────────────── REGISTRO ─────────────────────────── */

export type EngineMeta = LessonEngineMeta | LabEngineMeta;

export type LessonEngineModule = { default: ComponentType<LessonEngineProps>; meta: LessonEngineMeta };
export type LabEngineModule = { default: ComponentType<LabEngineProps>; meta: LabEngineMeta };
export type EngineModule = LessonEngineModule | LabEngineModule;

export type EngineLoader = () => Promise<EngineModule>;

export function isLessonModule(mod: EngineModule): mod is LessonEngineModule {
  return mod.meta?.kind === "lesson";
}

export function isLabModule(mod: EngineModule): mod is LabEngineModule {
  return mod.meta?.kind === "lab";
}

/* ─────────────────────────── SHELL ─────────────────────────── */

/** Link do botão "Próximo planeta" (null/omitido = último do sistema). */
export type NextPlanetLink = { href: string; name: string };
