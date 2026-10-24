"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import type { BonziState } from "@/types/domain";
import type { LabEngineMeta, LabEngineProps } from "@/components/learning/runtime";
import { useSeededRandom, useTimers } from "@/components/learning/kit";
import { revealFocus } from "@/components/ui/revealFocus";
import { BuildPanel } from "./BuildPanel";
import { BuildScene, EDIT_ZONE } from "./BuildScene";
import {
  BANNER,
  BUILD_ORDER,
  COLORS,
  REPEAT_LINE_MS,
  STEP,
  TEXT,
  TIMING,
  buildPlan,
  type BannerSpec,
  type ImageOption,
  type PageColor,
  type PageKind,
  type Phase,
} from "./model";

/** Etapas do lab3-3.md (Fluxo): Estrutura, Conteúdo, Elemento visual, Ação, Visualização. */
export const meta: LabEngineMeta = {
  kind: "lab",
  steps: ["Estrutura", "Conteúdo", "Elemento visual", "Ação", "Visualização"],
};

const SALT = "monte-sua-pagina";
const REJECT_MS = 1200;

/** Laboratório 3.3 — Monte sua página (G1 - Internet e Web/S3 - Navegador e páginas Web/lab3-3.md) */
export default function MonteSuaPagina({ attempt, say, feedback, setStep, mistake, finish, reducedMotion, Stage, Interaction }: LabEngineProps) {
  const session = useSeededRandom(0, { salt: `${SALT}:visita` });
  const rand = useSeededRandom(attempt, { salt: SALT });
  const plan = useMemo(() => buildPlan(session, rand, attempt), [session, rand, attempt]);
  const { theme } = plan;
  const timers = useTimers({ reducedMotion });

  const [placed, setPlaced] = useState<PageKind[]>([]);
  const [phase, setPhaseState] = useState<Phase>("build");
  const [image, setImage] = useState<ImageOption>(theme.images[0]);
  const [color, setColor] = useState<PageColor>(COLORS[0]);
  const [codeShown, setCodeShown] = useState(0);
  const [rejected, setRejected] = useState<PageKind | null>(null);
  const [banner, setBanner] = useState<{ spec: BannerSpec; key: number }>({ spec: BANNER.need("title"), key: 0 });
  const phaseRef = useRef<Phase>("build");
  const placedRef = useRef<PageKind[]>([]);
  /** erros já contados: "bloco pedido:bloco solto" (o mesmo engano repetido não tira pontos de novo) */
  const triedRef = useRef(new Set<string>());
  const cancelReject = useRef<(() => void) | null>(null);
  const lineRef = useRef<{ text: string; at: number } | null>(null);
  const keyboardRef = useRef(false);
  const stageRef = useRef<HTMLDivElement>(null);

  const setPhase = useCallback((next: Phase) => {
    phaseRef.current = next;
    setPhaseState(next);
  }, []);

  const show = useCallback((spec: BannerSpec) => setBanner((prev) => ({ spec, key: prev.key + 1 })), []);

  /** Novo momento: a faixa muda e o Bonzi fala a mesma ideia, uma vez (repetir logo em seguida só faz a faixa saltar). */
  const guide = useCallback(
    (spec: BannerSpec, line: string, state?: BonziState) => {
      show(spec);
      const last = lineRef.current;
      if (last && last.text === line && performance.now() - last.at < REPEAT_LINE_MS) return;
      lineRef.current = { text: line, at: performance.now() };
      say(line, state);
    },
    [show, say],
  );

  const markKeyboard = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") keyboardRef.current = true;
  }, []);

  const markPointer = useCallback(() => {
    keyboardRef.current = false;
  }, []);

  // Etapa 1 (lab3-3.md): o sistema pede "Coloque um título."
  useEffect(() => {
    setStep(STEP.title);
    guide(BANNER.need("title"), TEXT.title);
    feedback({ tone: "hint", message: TEXT.how("title") });
  }, [setStep, guide, feedback]);

  /** No teclado, depois de soltar um bloco o foco volta para a coluna de blocos (o alvo de soltar some). */
  const focusPalette = () => {
    if (!keyboardRef.current) return;
    timers.after(0, () => revealFocus(stageRef.current?.querySelector<HTMLElement>('[data-kit-piece]:not([aria-disabled="true"])')), { hold: true });
  };

  const onMove = (itemId: string, zoneId: string): boolean => {
    if (phaseRef.current !== "build" || zoneId !== EDIT_ZONE) return false;
    const kind = itemId as PageKind;
    const done = placedRef.current;
    const needed = BUILD_ORDER[done.length];
    if (done.includes(kind)) return false;

    if (kind !== needed) {
      const key = `${needed}:${kind}`;
      if (!triedRef.current.has(key)) {
        triedRef.current.add(key);
        mistake();
      }
      cancelReject.current?.();
      setRejected(kind);
      cancelReject.current = timers.after(REJECT_MS, () => setRejected((r) => (r === kind ? null : r)), { hold: true });
      feedback({ tone: "error", message: TEXT.wrong(kind, needed) });
      guide(BANNER.wrong(needed), TEXT.wrongSay(needed), "warning");
      return false;
    }

    const now = [...done, kind];
    const next = BUILD_ORDER[now.length] ?? null;
    placedRef.current = now;
    setPlaced(now);
    cancelReject.current?.();
    setRejected(null);
    feedback({ tone: "success", message: TEXT.placed(kind, next) });
    if (next) {
      timers.after(
        TIMING.nextAsk,
        () => {
          setStep(STEP[next]);
          guide(BANNER.need(next), TEXT[next]);
        },
        { hold: true },
      );
      focusPalette();
    } else {
      setPhase("ready");
      timers.after(
        TIMING.nextAsk,
        () => {
          setStep(STEP.view);
          guide(BANNER.ready, TEXT.ready, "happy");
          feedback({ tone: "hint", message: TEXT.pickImage });
        },
        { hold: true },
      );
    }
    return true;
  };

  /** Etapa 5: a estrutura vira página; depois o código HTML aparece linha a linha, como recompensa. */
  const view = () => {
    const now = phaseRef.current;
    if (now === "build") {
      const needed = BUILD_ORDER[placedRef.current.length];
      guide(BANNER.need(needed), TEXT.notReady(needed));
      return;
    }
    if (now !== "ready") return;
    setPhase("view");
    setStep(STEP.view);
    guide(BANNER.view, TEXT.view, "happy");
    feedback({ tone: "success", message: TEXT.viewing });
    timers.after(
      TIMING.viewHold,
      () => {
        guide(BANNER.code, TEXT.code, "happy");
        feedback({ tone: "success", message: TEXT.coded });
        BUILD_ORDER.forEach((_, index) => timers.after(TIMING.codeLine * index, () => setCodeShown(index + 1), { hold: true }));
        timers.after(
          TIMING.codeLine * BUILD_ORDER.length + TIMING.finishHold,
          () => {
            setPhase("done");
            setStep(meta.steps.length);
            finish();
          },
          { hold: true },
        );
      },
      { hold: true },
    );
  };

  return (
    <>
      <Stage>
        <BuildScene
          plan={plan}
          placed={placed}
          phase={phase}
          image={image}
          color={color}
          codeShown={codeShown}
          rejected={rejected}
          banner={banner.spec}
          bannerKey={banner.key}
          reducedMotion={reducedMotion}
          onMove={onMove}
          rootRef={stageRef}
          onKeyDown={markKeyboard}
          onPointerDown={markPointer}
        />
      </Stage>
      <Interaction>
        <BuildPanel
          theme={theme}
          phase={phase}
          hasImage={placed.includes("image")}
          image={image}
          color={color}
          onImage={setImage}
          onColor={setColor}
          onView={view}
          onKeyDown={markKeyboard}
          onPointerDown={markPointer}
        />
      </Interaction>
    </>
  );
}
