"use client";

import { memo, useCallback, useEffect, useId, useMemo, useRef, useState, type ComponentType } from "react";
import { ELEMENTS, SPRITES } from "@/config/assets";
import { ProgressBar } from "@/components/progress/ProgressBar";
import { Sprite } from "@/components/ui/Sprite";
import { SpriteButton } from "@/components/ui/SpriteButton";
import { cx } from "@/components/ui/cx";
import { useBonziSpeaking } from "@/hooks/useBonziSpeaking";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { whenIdle } from "@/services/narrationService";
import { useBonziLine } from "./useBonziLine";
import { CompletionPanel, type CompletionAction } from "./CompletionPanel";
import { ListenButton, useGuideVoice } from "./GuideVoice";
import { Narrator } from "./Narrator";
import { SceneStage } from "./SceneStage";
import { playSceneIn } from "./sceneTransition";
import { ShellHeader } from "./ShellHeader";
import { EngineBoundary } from "./runtime/EngineBoundary";
import type { LessonEngineMeta, LessonEngineProps, NextPlanetLink, Say } from "./runtime/types";
import type { BonziState } from "@/types/domain";
import styles from "./LessonShell.module.css";

/** quantas falas da cena o "Repetir" guarda (as últimas) */
const MAX_REPEAT_LINES = 6;

export type LessonShellProps = {
  title: string;
  tags?: string[];
  preview?: boolean;
  meta: LessonEngineMeta;
  Engine: ComponentType<LessonEngineProps>;
  backHref: string;
  backLabel?: string;
  nextPlanet?: NextPlanetLink | null;
  /** todas as cenas navegáveis desde o início (aula já concluída) */
  allScenesOpen?: boolean;
  onComplete?: () => void;
};

/** Instrução quando o motor não define `meta.hints` nem chama `setHint`. */
const DEFAULT_HINT = "Acompanhe a cena e siga as dicas do Bonzi.";

export function LessonShell({
  title,
  tags = [],
  preview = false,
  meta,
  Engine,
  backHref,
  backLabel = "Voltar ao sistema",
  nextPlanet = null,
  allScenesOpen = false,
  onComplete,
}: LessonShellProps) {
  const reducedMotion = useReducedMotion();
  const speaking = useBonziSpeaking();
  // Desempenho: o motor só re-renderiza quando as props dele mudam (cena, movimento reduzido) ou pelo próprio estado.
  // Sem isto, cada fala do Bonzi, dica, "pronto" ou troca de cena do shell re-renderizava a cena inteira.
  // Todas as funções passadas ao motor já são estáveis (useCallback).
  const EngineView = useMemo(() => memo(Engine), [Engine]);
  const scenes = meta.scenes.length > 0 ? meta.scenes : ["Cena"];
  const total = scenes.length;
  const [scene, setScene] = useState(0);
  const [visited, setVisited] = useState(0);
  const [ready, setReady] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [run, setRun] = useState(0);
  const bonzi = useBonziLine();
  const { line } = bonzi;
  const [hint, setHintState] = useState<string | null>(null);
  const trackId = useId();
  const guideId = useId();
  const stageRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const onCompleteRef = useRef(onComplete);
  const positionRef = useRef({ scene, total });
  const last = scene >= total - 1;
  const isOpen = (index: number) => allScenesOpen || index <= visited;
  /* o avanço só libera quando o Bonzi termina de falar (a não ser revendo cenas já vistas) */
  const canNext = (ready && !speaking) || allScenesOpen || scene < visited;
  const waitingSpeech = ready && speaking && !allScenesOpen && scene >= visited;
  const nextLabel = last ? "Concluir" : "Próxima cena";
  const sceneHint = hint ?? meta.hints?.[scene] ?? DEFAULT_HINT;
  const guideText = waitingSpeech ? "Muito bem! Escute o Bonzi até o fim." : ready ? `Muito bem! Agora toque em "${nextLabel}".` : sceneHint;
  /** falas do Bonzi nesta cena, na ordem: o "Repetir" fala todas (antes só a última) */
  const sceneLines = useRef<Array<{ message: string; state: BonziState }>>([]);
  // a instrução "O que fazer" também é lida em voz alta, depois da fala do Bonzi ("Escute o Bonzi" não é lida)
  const listen = useGuideVoice(completed || waitingSpeech ? null : guideText, line.message);

  useEffect(() => {
    onCompleteRef.current = onComplete;
    positionRef.current = { scene, total };
  });

  // a cena nova entra deslizando e aparecendo (antes trocava de uma vez)
  useEffect(() => {
    playSceneIn(contentRef.current, reducedMotion);
  }, [scene, run, reducedMotion]);

  const { say: queueLine, reset: resetLine, sayAll } = bonzi;

  /** toda fala entra na fila do Bonzi (nunca corta a atual; `afterCurrent` virou o padrão) e fica guardada para o "Repetir" */
  const say = useCallback<Say>(
    (message, state = "speaking") => {
      const lines = sceneLines.current;
      if (lines[lines.length - 1]?.message !== message) sceneLines.current = [...lines, { message, state }].slice(-MAX_REPEAT_LINES);
      queueLine(message, state);
    },
    [queueLine],
  );

  /** "Repetir": o Bonzi fala de novo todas as falas da cena, uma depois da outra */
  const repeatScene = useCallback(() => {
    if (sceneLines.current.length > 0) sayAll(sceneLines.current);
  }, [sayAll]);

  const setCanAdvance = useCallback((value: boolean) => setReady(Boolean(value)), []);

  const setHint = useCallback((text: string | null) => setHintState(text && text.trim() ? text : null), []);

  const goTo = useCallback((index: number) => {
    const target = Math.max(0, Math.min(positionRef.current.total - 1, index));
    // cena nova: nada da cena anterior continua sendo falado nem fica na fila
    sceneLines.current = [];
    resetLine();
    setScene(target);
    setReady(false);
    setHintState(null);
    setVisited((v) => Math.max(v, target));
  }, [resetLine]);

  const complete = useCallback(() => {
    setCompleted(true);
    resetLine();
    // só escrito, como o fim do laboratório (pedido da equipe, 24/10/2026)
    queueLine("Aula concluída! Você mandou muito bem.", "happy", { silent: true });
    onCompleteRef.current?.();
  }, [resetLine, queueLine]);

  /** Avanço pedido pelo motor: espera o Bonzi terminar a fala para não cortá-la. */
  const next = useCallback(() => {
    const from = positionRef.current.scene;
    whenIdle().then(() => {
      const { scene: current, total: count } = positionRef.current;
      if (current !== from) return;
      if (current >= count - 1) complete();
      else goTo(current + 1);
    });
  }, [complete, goTo]);

  /**
   * Setas de navegação: o foco passa para o palco da cena nova (o botão "Próxima cena" fica desabilitado
   * até a cena terminar, quando o foco volta para ele).
   */
  const navigate = (index: number) => {
    const focusWasOnNav = navRef.current?.contains(document.activeElement) ?? false;
    goTo(index);
    if (focusWasOnNav) stageRef.current?.focus({ preventScroll: true });
  };

  const review = () => {
    sceneLines.current = [];
    resetLine();
    setCompleted(false);
    setScene(0);
    setReady(false);
    setHintState(null);
    setRun((r) => r + 1);
  };

  const progress = completed ? 1 : (scene + (ready ? 1 : 0)) / total;

  const actions: CompletionAction[] = [
    ...(nextPlanet ? [{ label: "Próximo planeta", sprite: SPRITES.ui.next, href: nextPlanet.href, primary: true }] : []),
    { label: "Voltar ao sistema", sprite: SPRITES.ui.map, href: backHref, primary: !nextPlanet },
    { label: "Rever aula", sprite: SPRITES.ui.play, onClick: review },
  ];

  return (
    <div className={styles.shell}>
      <ShellHeader
        kind="lesson"
        title={title}
        tags={tags}
        preview={preview}
        back={{ href: backHref, label: backLabel }}
      />

      <div className={styles.workspace}>
        <div className={styles.main}>
          {completed ? (
            <CompletionPanel sprite={SPRITES.rewards.trophy} spriteAlt="Troféu" title="Aula concluída!" actions={actions}>
              {nextPlanet && <p className={styles.nextName}>Próximo: {nextPlanet.name}</p>}
            </CompletionPanel>
          ) : (
            <SceneStage label={`Cena ${scene + 1} de ${total}: ${scenes[scene]}`} ready={ready} frameRef={stageRef} contentRef={contentRef}>
              <EngineBoundary key={run}>
                <EngineView
                  scene={scene}
                  say={say}
                  setCanAdvance={setCanAdvance}
                  next={next}
                  setHint={setHint}
                  reducedMotion={reducedMotion}
                />
              </EngineBoundary>
            </SceneStage>
          )}
        </div>

        <aside className={styles.side} aria-label="Guia da aula">
          <Narrator line={line} onRepeat={repeatScene} />

          {!completed && (
            <section className={cx(styles.guide, ready && styles.guideReady)} aria-labelledby={guideId}>
              <div className={styles.todo}>
                <Sprite
                  src={ready ? ELEMENTS.ok : ELEMENTS.magnifier}
                  alt=""
                  decorative
                  size={30}
                  className={styles.todoIcon}
                />
                <div className={styles.todoBody}>
                  <h2 id={guideId} className={styles.todoLabel}>
                    {ready && !waitingSpeech ? "Cena concluída" : "O que fazer"}
                  </h2>
                  <p className={styles.todoText} role="status" aria-live="polite">
                    {guideText}
                  </p>
                </div>
                {!waitingSpeech && <ListenButton onListen={listen} className={styles.todoListen} />}
              </div>

              <nav ref={navRef} className={styles.controls} aria-label="Navegação da aula">
                <SpriteButton
                  sprite={SPRITES.ui.back}
                  label="Cena anterior"
                  showLabel={false}
                  onClick={() => navigate(scene - 1)}
                  disabled={scene === 0}
                  size={22}
                />
                <SpriteButton
                  sprite={last ? ELEMENTS.ok : SPRITES.ui.next}
                  label={nextLabel}
                  onClick={last ? complete : () => navigate(scene + 1)}
                  disabled={!canNext}
                  variant="primary"
                  attention={ready && !speaking}
                  focusOnAttention
                  size={22}
                  className={styles.primary}
                />
              </nav>
            </section>
          )}

          <section className={styles.track} aria-labelledby={trackId}>
            <div className={styles.trackHead}>
              <p className={styles.count}>{completed ? "Aula concluída" : `Cena ${scene + 1} de ${total}`}</p>
            </div>
            <h2 id={trackId} className={styles.sceneTitle}>
              {completed ? title : scenes[scene]}
            </h2>
            <ol className={styles.steps}>
              {scenes.map((sceneTitle, index) => {
                const open = isOpen(index) && !completed;
                return (
                  <li key={index}>
                    <button
                      type="button"
                      className={cx(
                        styles.step,
                        index === scene && !completed && styles.current,
                        (completed || index < Math.max(visited, scene) || (index === scene && ready)) && styles.done,
                      )}
                      onClick={(event) => {
                        // o botão clicado fica desabilitado (cena atual): leva o foco ao palco, como as setas
                        const hadFocus = event.currentTarget === document.activeElement;
                        goTo(index);
                        if (hadFocus) stageRef.current?.focus({ preventScroll: true });
                      }}
                      disabled={!open || index === scene}
                      aria-current={index === scene && !completed ? "step" : undefined}
                      aria-label={`Cena ${index + 1}: ${sceneTitle}${isOpen(index) ? "" : " (ainda não visitada)"}`}
                      title={sceneTitle}
                    >
                      {index + 1}
                    </button>
                  </li>
                );
              })}
            </ol>
            <span className="sr-only">
              <ProgressBar value={progress} label="Progresso da aula" />
            </span>
          </section>
        </aside>
      </div>
    </div>
  );
}

export default LessonShell;
