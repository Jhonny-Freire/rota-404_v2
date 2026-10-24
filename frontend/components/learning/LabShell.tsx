"use client";

import { memo, useCallback, useEffect, useId, useMemo, useRef, useState, type ComponentType } from "react";
import { ELEMENTS, SPRITES } from "@/config/assets";
import { ScoreCounter, formatPoints } from "@/components/gamification/ScoreCounter";
import { Sprite } from "@/components/ui/Sprite";
import { cx } from "@/components/ui/cx";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { whenIdle } from "@/services/narrationService";
import type { LabTiming } from "@/config/labTiming";
import { LAB_SCORE, MEDAL_LABELS, MEDAL_SPRITES, formatDuration, labScore, medalFor, type LabScore, type Medal } from "@/lib/progress";
import { CompletionPanel, type CompletionAction } from "./CompletionPanel";
import { ListenButton, useGuideVoice } from "./GuideVoice";
import { Narrator } from "./Narrator";
import { useBonziLine } from "./useBonziLine";
import { SceneStage } from "./SceneStage";
import { playSceneIn } from "./sceneTransition";
import { ShellHeader } from "./ShellHeader";
import { EngineBoundary } from "./runtime/EngineBoundary";
import { Interaction, PortalTargets, Stage } from "./runtime/portals";
import type { LabEngineMeta, LabEngineProps, LabFeedback, LabFeedbackTone, NextPlanetLink } from "./runtime/types";
import styles from "./LabShell.module.css";

export type LabShellProps = {
  title: string;
  tags?: string[];
  preview?: boolean;
  meta: LabEngineMeta;
  Engine: ComponentType<LabEngineProps>;
  /** labs.max_score */
  maxScore: number;
  /** tempos de referência do bônus de tempo (config/labTiming.ts) */
  timing: LabTiming;
  /** melhor pontuação salva (antes/depois de concluir) */
  bestPoints?: number | null;
  backHref: string;
  backLabel?: string;
  nextPlanet?: NextPlanetLink | null;
  /** chamado uma vez por partida concluída, com a pontuação final e os erros da partida */
  onFinish?: (points: number, mistakes: number) => void;
};

/** Ícone de cada tipo de mensagem, em tamanho inteiro da arte (ok/erro: 22px = 1×; ? e lupa: 2×). */
const FEEDBACK_ICONS: Record<LabFeedbackTone, { src: string; size: number }> = {
  success: { src: ELEMENTS.ok, size: 22 },
  error: { src: ELEMENTS.error, size: 22 },
  hint: { src: ELEMENTS.question, size: 28 },
  info: { src: ELEMENTS.magnifier, size: 26 },
};

/** Rótulo conforme o tipo de mensagem: a criança sabe se é instrução, erro ou acerto antes de ler. */
const FEEDBACK_TITLES: Record<LabFeedbackTone, string> = {
  hint: "O que fazer",
  info: "Acompanhe",
  error: "Ops!",
  success: "Muito bem!",
};

/** A moldura do guia só muda de cor nos momentos que importam: erro (vermelho) e acerto (verde). */
const GUIDE_TONES: Partial<Record<LabFeedbackTone, string>> = {
  error: styles.guideError,
  success: styles.guideSuccess,
};

type Result = { points: number; medal: Medal; previousBest: number | null; score: LabScore; seconds: number };

/** Cronômetro da partida: só conta com a aba visível (aba escondida não gasta o bônus de tempo). */
function createStopwatch() {
  let acc = 0;
  let since: number | null = typeof document === "undefined" || !document.hidden ? performance.now() : null;
  return {
    seconds: () => (acc + (since === null ? 0 : performance.now() - since)) / 1000,
    hide: () => {
      if (since !== null) acc += performance.now() - since;
      since = null;
    },
    show: () => {
      if (since === null) since = performance.now();
    },
  };
}

type Stopwatch = ReturnType<typeof createStopwatch>;

/**
 * HUD ao vivo (tempo) num componente próprio: o tique de 1 s re-renderiza só este pedaço, nunca o laboratório.
 * Os pontos só aparecem na conclusão: ver a pontuação caindo durante o jogo desanima a criança.
 */
function LiveHud({ stopwatch, result }: { stopwatch: Stopwatch; result: Result | null }) {
  const [, tick] = useState(0);
  useEffect(() => {
    if (result) return;
    const id = window.setInterval(() => tick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, [result]);
  const seconds = result ? result.seconds : stopwatch.seconds();
  return (
    <>
      {result && (
        <>
          <div className={styles.stat}>
            <Sprite src={SPRITES.rewards.star} alt="" decorative size={28} className={styles.hudStar} />
            <span className={styles.statText}>
              <span className={cx(styles.statValue, styles.pointsValue)}>{formatPoints(result.points)}</span>
              <span className={styles.statLabel}>Pontos</span>
            </span>
          </div>
          <span className={styles.hudDivider} aria-hidden="true" />
        </>
      )}
      <div className={styles.stat}>
        <span className={styles.statText}>
          <span className={styles.statValue}>{formatDuration(seconds)}</span>
          <span className={styles.statLabel}>Tempo</span>
        </span>
      </div>
    </>
  );
}

export function LabShell({
  title,
  tags = [],
  preview = false,
  meta,
  Engine,
  maxScore,
  timing,
  bestPoints = null,
  backHref,
  backLabel = "Voltar ao sistema",
  nextPlanet = null,
  onFinish,
}: LabShellProps) {
  const reducedMotion = useReducedMotion();
  // Desempenho: o motor só re-renderiza quando as props dele mudam (tentativa, movimento reduzido) ou pelo próprio
  // estado. Sem isto, cada say/feedback/setStep/mistake re-renderizava o laboratório inteiro (2 renders por toque).
  // Todas as funções passadas ao motor já são estáveis (useCallback); Stage/Interaction são do módulo.
  const EngineView = useMemo(() => memo(Engine), [Engine]);
  const safeMax = Math.max(0, Math.round(maxScore || 0));
  const steps = meta.steps;
  const [attempt, setAttempt] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [step, setStepState] = useState(0);
  const [fb, setFb] = useState<LabFeedback>(null);
  const [result, setResult] = useState<Result | null>(null);
  const bonzi = useBonziLine();
  const { line, say, clear: clearLine } = bonzi;
  // o resultado/instrução do painel também é lido em voz alta, depois da fala do Bonzi
  const listen = useGuideVoice(result ? null : (fb?.message ?? null), line.message);
  const [stageEl, setStageEl] = useState<HTMLDivElement | null>(null);
  const [interactionEl, setInteractionEl] = useState<HTMLDivElement | null>(null);
  const guideId = useId();
  const controlsId = useId();
  const mistakesRef = useRef(0);
  const finishedRef = useRef(false);
  const attemptRef = useRef(0);
  const bestRef = useRef(bestPoints);
  const onFinishRef = useRef(onFinish);
  const maxRef = useRef(safeMax);
  const timingRef = useRef(timing);
  const stopwatchRef = useRef<Stopwatch | null>(null);
  if (stopwatchRef.current === null) stopwatchRef.current = createStopwatch();
  /** segundos no momento em que o motor chamou finish (a espera pela última fala do Bonzi não conta) */
  const finishSecondsRef = useRef(0);

  useEffect(() => {
    bestRef.current = bestPoints;
    onFinishRef.current = onFinish;
    maxRef.current = safeMax;
    timingRef.current = timing;
  });

  // "Jogar de novo": a nova tentativa entra suave no palco
  useEffect(() => {
    playSceneIn(stageEl, reducedMotion);
  }, [attempt, stageEl, reducedMotion]);

  useEffect(() => {
    const onVisibility = () => (document.hidden ? stopwatchRef.current?.hide() : stopwatchRef.current?.show());
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // `say` vem da fila do Bonzi (useBonziLine): uma fala nova espera a atual terminar, nunca a corta

  const feedback = useCallback((value: LabFeedback) => setFb(value), []);

  const setStep = useCallback((index: number) => setStepState(Math.max(0, Math.floor(index))), []);

  const mistake = useCallback(() => {
    if (finishedRef.current) return;
    mistakesRef.current += 1;
    setMistakes(mistakesRef.current);
  }, []);

  /** Conclui: espera o Bonzi terminar a última fala do laboratório antes de mostrar o resultado. */
  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    finishSecondsRef.current = stopwatchRef.current?.seconds() ?? 0;
    const run = attemptRef.current;
    whenIdle(12000).then(() => {
      if (attemptRef.current === run) showResult();
    });
  }, []);

  const showResult = () => {
    const max = maxRef.current;
    const seconds = finishSecondsRef.current;
    const score = labScore(mistakesRef.current, seconds, timingRef.current, max);
    const final = score.total;
    const previousBest = bestRef.current ?? null;
    const medal = medalFor(final, max);
    setResult({ points: final, medal, previousBest, score, seconds });
    // só escrito: a pontuação não tem gravação (caía na voz do navegador), pedido da equipe em 24/10
    say(`Laboratório concluído! Você fez ${formatPoints(final)} pontos.`, "happy", { silent: true });
    onFinishRef.current?.(final, mistakesRef.current);
  };

  const playAgain = () => {
    attemptRef.current += 1;
    finishedRef.current = false;
    mistakesRef.current = 0;
    stopwatchRef.current = createStopwatch();
    setMistakes(0);
    setStepState(0);
    setFb(null);
    setResult(null);
    clearLine();
    setAttempt((a) => a + 1);
  };

  const best = result ? Math.max(result.points, result.previousBest ?? 0) : bestPoints;
  const newRecord = result !== null && result.previousBest !== null && result.points > result.previousBest;

  const actions: CompletionAction[] = [
    { label: "Jogar de novo", sprite: SPRITES.ui.play, onClick: playAgain },
    ...(nextPlanet ? [{ label: "Próximo planeta", sprite: SPRITES.ui.next, href: nextPlanet.href, primary: true }] : []),
    { label: "Voltar ao sistema", sprite: SPRITES.ui.map, href: backHref, primary: !nextPlanet },
  ];

  return (
    <div className={styles.shell}>
      <ShellHeader
        kind="lab"
        title={title}
        tags={tags}
        preview={preview}
        back={{ href: backHref, label: backLabel }}
        aside={
          <section className={cx(styles.hud, result && styles.hudDone)} aria-label="Placar do laboratório">
            <LiveHud stopwatch={stopwatchRef.current} result={result} />
            <span className={styles.hudDivider} aria-hidden="true" />
            <div className={cx(styles.stat, mistakes > 0 && styles.statWarn)}>
              <Sprite src={ELEMENTS.error} alt="" decorative size={22} className={styles.mistakeIcon} />
              <span className={styles.statText}>
                <span className={styles.statValue}>{mistakes}</span>
                <span className={styles.statLabel}>{mistakes === 1 ? "Erro" : "Erros"}</span>
              </span>
            </div>
          </section>
        }
      />

      <div className={styles.workspace}>
        <div className={styles.main}>
          {/* palco + etapas como uma peça só: a faixa das etapas fica presa no topo da moldura do palco */}
          <div className={cx(styles.board, result && styles.boardDone)}>
            {steps.length > 0 && (
              <ol
                className={cx(styles.stepper, steps.length > 4 && styles.stepperLong)}
                aria-label="Etapas do laboratório"
              >
                {steps.map((name, index) => {
                  const done = result !== null || index < step;
                  const current = result === null && index === step;
                  return (
                    <li
                      key={`${index}-${name}`}
                      className={cx(styles.step, done && styles.stepDone, current && styles.stepCurrent)}
                      aria-current={current ? "step" : undefined}
                    >
                      <span className={styles.stepNode}>
                        {done ? <Sprite src={ELEMENTS.ok} alt="" decorative size={22} className={styles.stepCheck} /> : index + 1}
                      </span>
                      <span className={styles.stepName}>{name}</span>
                      {done && <span className="sr-only"> (concluída)</span>}
                    </li>
                  );
                })}
              </ol>
            )}

            {result ? (
              <CompletionPanel
                sprite={MEDAL_SPRITES[result.medal]}
                spriteAlt={MEDAL_LABELS[result.medal]}
                title={newRecord ? "Novo recorde!" : "Laboratório concluído!"}
                actions={actions}
              >
                <ScoreCounter points={result.points} label={`de ${formatPoints(safeMax)} pontos`} size="lg" />
                <span className={styles.medalName}>{MEDAL_LABELS[result.medal]}</span>
                <dl className={styles.breakdown} aria-label="Como a pontuação foi calculada">
                  <div>
                    <dt>Conclusão</dt>
                    <dd>{formatPoints(result.score.completion)}</dd>
                  </div>
                  <div>
                    <dt>Erros ({mistakes})</dt>
                    <dd>
                      {formatPoints(result.score.errors)} de {formatPoints((LAB_SCORE.errors * safeMax) / LAB_SCORE.max)}
                    </dd>
                  </div>
                  <div>
                    <dt>Tempo ({formatDuration(result.seconds)})</dt>
                    <dd>
                      {formatPoints(result.score.time)} de {formatPoints((2 * LAB_SCORE.timeHalf * safeMax) / LAB_SCORE.max)}
                    </dd>
                  </div>
                </dl>
                <span className={styles.best}>
                  Melhor pontuação: <strong>{formatPoints(best ?? result.points)}</strong>
                </span>
              </CompletionPanel>
            ) : (
              <SceneStage
                contentRef={setStageEl}
                showPlaceholder={false}
                label="Palco do laboratório"
                className={styles.stageFrame}
              />
            )}
          </div>
        </div>

        <aside className={styles.side} aria-label="Painéis do laboratório">
          {/* guia: a fala do Bonzi é o texto principal; o resultado da última ação vem embaixo, na cor do tom */}
          <section className={cx(styles.guide, fb && GUIDE_TONES[fb.tone])} aria-labelledby={guideId}>
            <h2 id={guideId} className="sr-only">
              Dicas do Bonzi
            </h2>
            <Narrator line={line} variant="portrait" size={60} />
            <div className={styles.feedbackSlot} aria-live="polite">
              {fb && (
                <div key={`${fb.tone}:${fb.message}`} className={cx(styles.feedback, styles[fb.tone])}>
                  <span className={styles.feedbackIcon}>
                    <Sprite
                      src={FEEDBACK_ICONS[fb.tone].src}
                      alt=""
                      decorative
                      size={FEEDBACK_ICONS[fb.tone].size}
                      className={styles.feedbackSprite}
                    />
                  </span>
                  <p className={styles.feedbackBody}>
                    <strong className={styles.feedbackLabel}>{FEEDBACK_TITLES[fb.tone]}</strong>{" "}
                    <span className={styles.feedbackText}>{fb.message}</span>
                  </p>
                  <ListenButton onListen={listen} className={styles.feedbackListen} />
                </div>
              )}
            </div>
          </section>

          {!result && (
            <section className={styles.controls} aria-labelledby={controlsId}>
              <h2 id={controlsId} className={styles.controlsTitle}>
                Área de interação
              </h2>
              <div ref={setInteractionEl} className={styles.interaction} />
            </section>
          )}
        </aside>
      </div>

      {!result && (
        <div className={styles.engineHost}>
          <PortalTargets stage={stageEl} interaction={interactionEl}>
            <EngineBoundary key={attempt} wrap={(node) => <Stage>{node}</Stage>}>
              <EngineView
                attempt={attempt}
                maxScore={safeMax}
                say={say}
                feedback={feedback}
                setStep={setStep}
                mistake={mistake}
                finish={finish}
                reducedMotion={reducedMotion}
                Stage={Stage}
                Interaction={Interaction}
              />
            </EngineBoundary>
          </PortalTargets>
        </div>
      )}
    </div>
  );
}

export default LabShell;
