"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BonziState } from "@/types/domain";
import type { LabEngineMeta, LabEngineProps } from "@/components/learning/runtime";
import { useSeededRandom, useTimers } from "@/components/learning/kit";
import { FixPanel, type FixAction } from "./FixPanel";
import { FixScene } from "./FixScene";
import {
  BANNER,
  PAGE_ORDER,
  REPEAT_LINE_MS,
  STEP,
  TEXT,
  TIMING,
  buildMission,
  describe,
  effect,
  findProblems,
  howTo,
  insertInPlace,
  layoutKey,
  missingSlotId,
  problemSlots,
  type BannerSpec,
  type Layout,
  type PageKind,
  type Phase,
  type ProblemKey,
} from "./model";

/** Etapas do lab3-4.md (Fluxo 1 a 8, agrupado): observar, tocar no erro, corrigir, testar. */
export const meta: LabEngineMeta = {
  kind: "lab",
  steps: ["Observar", "Tocar no erro", "Corrigir", "Testar"],
};

const SALT = "conserte-a-pagina";

const missingKind = (problem: ProblemKey): PageKind | null => (problem.startsWith("missing:") ? (problem.slice(8) as PageKind) : null);

/** Laboratório 3.4 — Conserte a página (G1 - Internet e Web/S3 - Navegador e páginas Web/lab3-4.md) */
export default function ConserteAPagina({ attempt, say, feedback, setStep, mistake, finish, reducedMotion, Stage, Interaction }: LabEngineProps) {
  const session = useSeededRandom(0, { salt: `${SALT}:visita` });
  const rand = useSeededRandom(attempt, { salt: SALT });
  const mission = useMemo(() => buildMission(session, rand, attempt), [session, rand, attempt]);
  const timers = useTimers({ reducedMotion });

  const [layout, setLayoutState] = useState<Layout>(mission.combo.layout);
  const [phase, setPhaseState] = useState<Phase>("observe");
  const [selected, setSelected] = useState<string | null>(null);
  const [marked, setMarked] = useState<string[]>([]);
  const [okSlot, setOkSlot] = useState<string | null>(null);
  const [renderKey, setRenderKey] = useState(0);
  const [baseline, setBaseline] = useState(() => layoutKey(mission.combo.layout));
  const [banner, setBanner] = useState<{ spec: BannerSpec; key: number }>({ spec: BANNER.observe, key: 0 });
  const phaseRef = useRef<Phase>("observe");
  const layoutRef = useRef<Layout>(mission.combo.layout);
  /** problemas no último teste (ou no começo): comparados com os do novo teste */
  const prevRef = useRef<ProblemKey[]>(findProblems(mission.combo.layout));
  const targetRef = useRef<ProblemKey | null>(null);
  /** blocos do problema marcado e blocos mexidos desde o último teste: testar no meio do conserto não é erro */
  const targetIdsRef = useRef<string[]>([]);
  const touchedRef = useRef(new Set<string>());
  const cancelOk = useRef<(() => void) | null>(null);
  const lineRef = useRef<{ text: string; at: number } | null>(null);

  const setPhase = useCallback((next: Phase) => {
    phaseRef.current = next;
    setPhaseState(next);
  }, []);

  const setLayout = (next: Layout) => {
    layoutRef.current = next;
    setLayoutState(next);
  };

  const show = useCallback((spec: BannerSpec) => setBanner((prev) => ({ spec, key: prev.key + 1 })), []);

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

  // Fluxo 1: Bonzi mostra a página com problema; depois pede o toque no elemento quebrado.
  useEffect(() => {
    setStep(STEP.observe);
    guide(BANNER.observe, TEXT.intro, "thinking");
    feedback({ tone: "hint", message: TEXT.observeHint });
    return timers.after(
      TIMING.observe,
      () => {
        if (phaseRef.current !== "observe") return;
        setPhase("find");
        setStep(STEP.find);
        show(BANNER.find);
      },
      { hold: true },
    );
  }, [setStep, guide, feedback, timers, setPhase, show]);

  /** Marca um problema: o ponto na página e o bloco correspondente na estrutura (Fluxo 3). */
  const focusProblem = (problem: ProblemKey, current: Layout, tapped?: string) => {
    const kind = missingKind(problem);
    targetRef.current = problem;
    if (kind) {
      const piece = current.outside.find((s) => s.kind === kind);
      targetIdsRef.current = piece ? [piece.id] : [];
      setMarked([missingSlotId(kind), ...(piece ? [piece.id] : [])]);
      setSelected(piece?.id ?? null);
      return;
    }
    const ids = problemSlots(current, problem);
    targetIdsRef.current = ids;
    setMarked(ids);
    /* o bloco tocado na página é o que fica marcado na estrutura (Fluxo 3: "destaca o bloco correspondente") */
    if (tapped && ids.includes(tapped)) {
      setSelected(tapped);
      return;
    }
    if (problem === "order") {
      /* fora de ordem: marca o bloco que deve vir antes (o "Subir" dele conserta) */
      const rank = (id: string) => PAGE_ORDER.indexOf(current.page.find((s) => s.id === id)?.kind ?? "button");
      setSelected([...ids].sort((a, b) => rank(a) - rank(b))[0] ?? null);
      return;
    }
    setSelected(problem.startsWith("duplicate:") ? ids[ids.length - 1] : (ids[0] ?? null));
  };

  /** Fluxo 2: o aluno toca no elemento quebrado da página. */
  const pickPage = (id: string) => {
    const now = phaseRef.current;
    if (now !== "observe" && now !== "find" && now !== "fix") return;
    const current = layoutRef.current;
    const problems = findProblems(current);
    const hit = problems.find((p) => {
      const kind = missingKind(p);
      return kind ? id === missingSlotId(kind) : problemSlots(current, p).includes(id);
    });
    if (!hit) {
      cancelOk.current?.();
      setOkSlot(id);
      cancelOk.current = timers.after(TIMING.okMark, () => setOkSlot((s) => (s === id ? null : s)), { hold: true });
      feedback({ tone: "info", message: TEXT.okBlockHint });
      guide(BANNER.okBlock, TEXT.okBlock);
      return;
    }
    cancelOk.current?.();
    setOkSlot(null);
    focusProblem(hit, current, id);
    if (now !== "fix") {
      setPhase("fix");
      setStep(STEP.fix);
    }
    feedback({ tone: "hint", message: `${describe(hit)} ${howTo(hit)}` });
    guide(BANNER.fix, TEXT.found, "happy");
  };

  /** tocar num bloco da Estrutura só o marca (no celular, os botões grandes da área de interação agem nele) */
  const pickRow = (id: string) => {
    const now = phaseRef.current;
    if (now === "observe" || now === "find" || now === "fix") setSelected(id);
  };

  /**
   * Fluxo 4: mover, trocar de lugar (subir/descer), remover, encaixar ou recolocar um bloco — direto no bloco da
   * Estrutura (revisão de UX: antes era preciso marcar o bloco e usar botões noutro painel, e tudo ficava travado
   * até achar o erro na página). Tocar no erro da página continua marcando o bloco correspondente.
   */
  const act = (action: FixAction, id: string) => {
    const now = phaseRef.current;
    if (now !== "observe" && now !== "find" && now !== "fix") return;
    if (now !== "fix") {
      setPhase("fix");
      setStep(STEP.fix);
    }
    const selected = id;
    setSelected(id);
    const { page, outside } = layoutRef.current;
    let next: Layout | null = null;
    if (action === "up" || action === "down") {
      const flow = page.filter((s) => !s.floating);
      const i = flow.findIndex((s) => s.id === selected);
      const j = action === "up" ? i - 1 : i + 1;
      if (i < 0 || j < 0 || j >= flow.length) return;
      const moved = [...flow];
      [moved[i], moved[j]] = [moved[j], moved[i]];
      next = { page: [...moved, ...page.filter((s) => s.floating)], outside };
    } else if (action === "remove") {
      const slot = page.find((s) => s.id === selected);
      if (!slot) return;
      next = { page: page.filter((s) => s.id !== selected), outside: [...outside, { id: slot.id, kind: slot.kind }] };
    } else if (action === "snap") {
      const slot = page.find((s) => s.id === selected);
      if (!slot?.floating) return;
      next = { page: insertInPlace(page, slot), outside };
    } else {
      const slot = outside.find((s) => s.id === selected);
      if (!slot) return;
      const flow = page.filter((s) => !s.floating);
      next = { page: [...flow, slot, ...page.filter((s) => s.floating)], outside: outside.filter((s) => s.id !== selected) };
    }
    touchedRef.current.add(selected);
    setLayout(next);
    setMarked([]);
    show(BANNER.test);
  };

  /** Fluxo 5 a 8: testar, renderizar de novo e mostrar a versão final ou o próximo ponto. */
  const test = () => {
    const now = phaseRef.current;
    if (now === "testing" || now === "done") return;
    const current = layoutRef.current;
    if (layoutKey(current) === baseline) {
      guide(BANNER.fix, TEXT.changeFirst);
      return;
    }
    setPhase("testing");
    setStep(STEP.test);
    setSelected(null);
    setMarked([]);
    show(BANNER.testing);
    feedback({ tone: "info", message: TEXT.testing });
    setRenderKey((k) => k + 1);
    timers.after(TIMING.render, () => evaluate(current), { hold: true });
  };

  const evaluate = (current: Layout) => {
    const problems = findProblems(current);
    const prev = prevRef.current;
    const fixed = prev.filter((p) => !problems.includes(p));
    const added = problems.filter((p) => !prev.includes(p));
    prevRef.current = problems;
    setBaseline(layoutKey(current));
    const effects = fixed.map(effect).join(" ");
    const touched = [...touchedRef.current];
    touchedRef.current = new Set();

    if (problems.length === 0) {
      setPhase("done");
      setStep(meta.steps.length);
      feedback({ tone: "success", message: `${effects} ${TEXT.allFixed}`.trim() });
      guide(BANNER.fixed, TEXT.fixed, "happy");
      timers.after(TIMING.finishHold, finish, { hold: true });
      return;
    }

    setPhase("fix");
    setStep(STEP.fix);
    if (fixed.length > 0 && added.length === 0) {
      const next = problems[0];
      focusProblem(next, current);
      feedback({ tone: "success", message: `${effects} Mas ainda falta consertar: ${describe(next)} ${howTo(next)}` });
      guide(BANNER.next, TEXT.next, "thinking");
      return;
    }

    const target = targetRef.current;
    /* blocos ligados aos problemas que ainda existem (para "testou no meio do conserto": "Quase!", sem erro) */
    const relevant = target
      ? targetIdsRef.current
      : [...problems.flatMap((p) => problemSlots(current, p)), ...current.outside.map((s) => s.id)];
    if (!added.length && (!target || problems.includes(target)) && touched.some((id) => relevant.includes(id))) {
      const focusOn = target && problems.includes(target) ? target : problems[0];
      focusProblem(focusOn, current);
      feedback({ tone: "hint", message: `${describe(focusOn)} ${howTo(focusOn)}` });
      guide(BANNER.almost, TEXT.almost, "thinking");
      return;
    }

    mistake();
    const focus = added[0] ?? (target && problems.includes(target) ? target : problems[0]);
    focusProblem(focus, current);
    feedback({ tone: "error", message: `${describe(focus)} ${howTo(focus)}` });
    guide(BANNER.still, TEXT.still, "warning");
  };

  const missing = useMemo(
    () => findProblems(layout).map(missingKind).filter((k): k is PageKind => k !== null),
    [layout],
  );

  return (
    <>
      <Stage>
        <FixScene
          theme={mission.theme}
          layout={layout}
          missing={missing}
          phase={phase}
          selected={selected}
          marked={marked}
          okSlot={okSlot}
          renderKey={renderKey}
          banner={banner.spec}
          bannerKey={banner.key}
          reducedMotion={reducedMotion}
          onPagePick={pickPage}
          onRowPick={pickRow}
          onAct={act}
        />
      </Stage>
      <Interaction>
        <FixPanel
          layout={layout}
          phase={phase}
          selected={selected}
          dirty={layoutKey(layout) !== baseline}
          onAction={act}
          onTest={test}
        />
      </Interaction>
    </>
  );
}
