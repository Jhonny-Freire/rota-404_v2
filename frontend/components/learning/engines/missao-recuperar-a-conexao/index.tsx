"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BonziState } from "@/types/domain";
import type { LabEngineMeta, LabEngineProps } from "@/components/learning/runtime";
import { useSeededRandom, useTimers } from "@/components/learning/kit";
import { NetworkScene, type Acting, type Inspection, type PartMarks, type TapTarget, type TestRun } from "./NetworkScene";
import { ToolPanel } from "./ToolPanel";
import {
  BANNER,
  FAULTS,
  FAULT_PART,
  FAULT_TEXT,
  PART_NAME,
  TEXT,
  TIMING,
  TOOLS,
  checkedBanner,
  flagsFor,
  type BannerSpec,
  type FaultId,
  type PartId,
} from "./model";

export const meta: LabEngineMeta = {
  kind: "lab",
  steps: ["Testar", "Investigar", "Consertar", "Testar de novo"],
};

/** Índices de meta.steps. */
const STEP = { test: 0, investigate: 1, fix: 2, retest: 3 } as const;

type Phase = "start" | "testing" | "investigate" | "acting" | "ready" | "done";

const SALT = "missao-recuperar-a-conexao";

/** o mesmo lembrete pedido de novo dentro deste tempo não recomeça a fala do Bonzi (só a faixa salta de novo) */
const REPEAT_LINE_MS = 4000;

const countMarks = (marks: PartMarks) => Object.values(marks).filter(Boolean).length;

export default function MissaoRecuperarAConexao({
  attempt,
  say,
  feedback,
  setStep,
  mistake,
  finish,
  reducedMotion,
  Stage,
  Interaction,
}: LabEngineProps) {
  // A ordem das falhas é sorteada uma vez por visita; cada "Jogar de novo" usa a próxima (componente diferente).
  const session = useSeededRandom(0, { salt: SALT });
  const rand = useSeededRandom(attempt, { salt: SALT });
  const fault = useMemo(() => {
    const order = session.shuffle(FAULTS, "falhas");
    return order[attempt % order.length];
  }, [session, attempt]);
  const tools = useMemo(() => rand.shuffle(FAULTS, "acoes", true), [rand]);
  const timers = useTimers({ reducedMotion });

  const [phase, setPhaseState] = useState<Phase>("start");
  const [observed, setObserved] = useState(false);
  /** a peça com falha já foi achada: libera as ações (continua true depois do conserto) */
  const [discovered, setDiscovered] = useState(false);
  const [fixed, setFixed] = useState(false);
  const [pending, setPending] = useState<FaultId | null>(null);
  const [tried, setTried] = useState<FaultId[]>([]);
  const [acting, setActing] = useState<Acting | null>(null);
  const [marks, setMarks] = useState<PartMarks>({});
  const [inspecting, setInspecting] = useState<Inspection | null>(null);
  const [test, setTest] = useState<TestRun | null>(null);
  const [banner, setBanner] = useState<{ spec: BannerSpec; key: number }>({ spec: BANNER.start, key: 0 });
  const phaseRef = useRef<Phase>("start");
  const runRef = useRef(0);
  const inspectRunRef = useRef(0);
  const stopInspectRef = useRef<(() => void) | null>(null);
  /** última fala pedida ao Bonzi por este laboratório e quando */
  const lineRef = useRef<{ text: string; at: number } | null>(null);

  const setPhase = useCallback((next: Phase) => {
    phaseRef.current = next;
    setPhaseState(next);
  }, []);

  const flags = flagsFor(fault, fixed);
  const brokenPart: PartId | null = fixed ? null : FAULT_PART[fault];

  useEffect(() => {
    setStep(STEP.test);
    say(TEXT.intro);
    feedback({ tone: "info", message: TEXT.start });
  }, [say, setStep, feedback]);

  /** Novo momento: a faixa do palco muda e o Bonzi fala a mesma ideia. */
  const guide = (spec: BannerSpec, line: string, state?: BonziState) => {
    setBanner((prev) => ({ spec, key: prev.key + 1 }));
    lineRef.current = { text: line, at: performance.now() };
    say(line, state);
  };

  /**
   * Toque fora de hora: a faixa (de novo, com "pop") e o Bonzi dizem o que fazer agora.
   * Toques seguidos com o mesmo lembrete só fazem a faixa saltar: a fala que o Bonzi acabou de começar
   * (texto e voz) não recomeça do zero a cada toque.
   */
  const nudge = (spec: BannerSpec) => {
    const line = `${spec.text}.`;
    const last = lineRef.current;
    if (last && last.text === line && performance.now() - last.at < REPEAT_LINE_MS) {
      setBanner((prev) => ({ spec, key: prev.key + 1 }));
      return;
    }
    guide(spec, line);
  };

  const stopInspect = () => {
    stopInspectRef.current?.();
    stopInspectRef.current = null;
    setInspecting(null);
  };

  const runTest = () => {
    const now = phaseRef.current;
    if (now !== "start" && now !== "investigate" && now !== "ready") return;
    stopInspect();
    runRef.current += 1;
    setTest({ run: runRef.current, ok: fixed, status: "running" });
    setPhase("testing");
    // "Agora ele chega?" só depois de uma ação; sem mudança na rede, volta a perguntar onde o pacote para
    guide(BANNER.watch, pending ? TEXT.rewatch : TEXT.watch);
  };

  /** Depois da pausa com o pacote parado: a próxima instrução depende do que levou a este teste. */
  const afterStop = (first: boolean, tool: FaultId | null, checked: number, foundIt: boolean) => {
    setPhase("investigate");
    if (first) {
      setObserved(true);
      setStep(STEP.investigate);
      feedback({ tone: "info", message: TEXT.stopped });
      guide(checkedBanner(checked), TEXT.investigate, "thinking");
      return;
    }
    if (tool) {
      // novo teste depois de uma ação errada: o erro conta aqui (Etapa 4)
      setPending(null);
      setTried((prev) => (prev.includes(tool) ? prev : [...prev, tool]));
      mistake();
      setStep(STEP.fix);
      feedback({ tone: "error", message: TEXT.error });
      guide(BANNER.failed, TEXT.tryOther, "warning");
      return;
    }
    // testou de novo sem mudar nada: mesmo ponto, mesma etapa
    feedback({ tone: "info", message: TEXT.sameStop });
    if (foundIt) guide(BANNER.sameStop, TEXT.sameStopFix, "thinking");
    else guide(checkedBanner(checked), TEXT.sameStopLook, "thinking");
  };

  const handleArrive = () => {
    if (!test || test.status !== "running" || phaseRef.current !== "testing") return;
    if (test.ok) {
      setTest({ ...test, status: "passed" });
      setPhase("done");
      setStep(meta.steps.length);
      feedback({ tone: "success", message: TEXT.arrived });
      guide(BANNER.success, TEXT.success, "happy");
      timers.after(TIMING.finishHold, finish, { hold: true });
      return;
    }
    // o pacote para, treme e mostra "Parou aqui!"; um instante depois vem a próxima instrução
    setTest({ ...test, status: "failed" });
    const first = !observed;
    const tool = pending;
    const checked = countMarks(marks);
    const foundIt = discovered;
    timers.after(TIMING.stopHold, () => afterStop(first, tool, checked, foundIt), { hold: true });
  };

  const inspect = (part: PartId) => {
    stopInspectRef.current?.();
    inspectRunRef.current += 1;
    const broken = brokenPart === part;
    const next: PartMarks = { ...marks, [part]: broken ? "wrong" : "correct" };
    setInspecting({ part, run: inspectRunRef.current });
    setMarks(next);
    feedback({ tone: "info", message: broken ? FAULT_TEXT[fault] : `${PART_NAME[part]} funcionando.` });
    if (broken && !discovered) {
      setDiscovered(true);
      setStep(STEP.fix);
      guide(BANNER.found, TEXT.found, "thinking");
    } else if (!discovered && countMarks(next) !== countMarks(marks)) {
      // só o contador avança; o Bonzi não repete a instrução
      setBanner((prev) => ({ spec: checkedBanner(countMarks(next)), key: prev.key + 1 }));
    }
    stopInspectRef.current = timers.after(
      TIMING.inspectHold,
      () => {
        stopInspectRef.current = null;
        setInspecting(null);
      },
      { hold: true },
    );
  };

  /** Apelidos: o cabo é da internet; a impressora ligada ao computador leva à investigação do computador. */
  const partFor = (target: TapTarget): PartId | null => {
    if (target === "cable") return "internet";
    if (target === "printer") return fault === "target" && !fixed ? "pc" : null;
    if (target === "site") return null;
    return target;
  };

  /**
   * Nenhum toque fica sem resposta: fora da investigação, a faixa (e o Bonzi) lembra o próximo passo.
   * Devolve true quando o toque já foi respondido (ou o laboratório terminou).
   */
  const remind = (): boolean => {
    switch (phaseRef.current) {
      case "start":
        nudge(BANNER.pressFirst);
        return true;
      case "testing":
        nudge(BANNER.waitPacket);
        return true;
      case "acting":
        nudge(BANNER.waitAction);
        return true;
      case "ready":
        // nada muda até o novo teste: sem marcas novas nem texto de falha
        nudge(BANNER.pressNow);
        return true;
      case "done":
        return true;
      default:
        return false;
    }
  };

  const tap = (target: TapTarget) => {
    if (remind()) return;
    const part = partFor(target);
    if (part) inspect(part);
    else feedback({ tone: "info", message: target === "site" ? TEXT.site : TEXT.printer });
  };

  const applyTool = (tool: FaultId) => {
    // ações inativas (fora de hora ou já tentadas) continuam respondendo com um lembrete
    if (remind() || !discovered) return;
    if (tried.includes(tool)) {
      nudge(BANNER.tried);
      return;
    }
    stopInspect();
    const correct = tool === fault;
    if (correct) {
      setFixed(true);
      // a peça consertada perde o selo de falha (o novo teste mostra o resultado); ação errada não apaga nada
      setMarks((prev) => {
        const next = { ...prev };
        delete next[FAULT_PART[fault]];
        return next;
      });
    }
    setTest(null);
    setPending(tool);
    setActing({ tool, correct });
    setPhase("acting");
    feedback({ tone: "info", message: `${TEXT.chose} ${TOOLS[tool].label}.` });
    timers.after(TIMING.action, () => {
      setActing(null);
      setPhase("ready");
      setStep(STEP.retest);
      guide(BANNER.ready, TEXT.retest);
    });
  };

  const canTest = phase === "start" || phase === "investigate" || phase === "ready";
  // Só o próximo passo chama atenção: "Ligar conexão" → peças ainda não investigadas → ações → "Ligar conexão".
  const hintPulse = !reducedMotion && phase === "investigate" && !discovered;
  const pulseTools = phase === "investigate" && discovered;
  const callTest = phase === "start" || phase === "ready";
  // depois de uma ação (nada mais a fazer) "Ligar conexão" recebe o foco
  const focusTest = phase === "ready";

  return (
    <>
      <Stage>
        <NetworkScene
          fault={fault}
          flags={flags}
          test={test}
          inspecting={inspecting}
          marks={marks}
          acting={acting}
          banner={banner.spec}
          bannerKey={banner.key}
          investigating={phase === "investigate"}
          hintPulse={hintPulse}
          reducedMotion={reducedMotion}
          onTap={tap}
          onArrive={handleArrive}
        />
      </Stage>
      <Interaction>
        <ToolPanel
          canTest={canTest}
          callTest={callTest}
          focusTest={focusTest}
          tools={tools}
          unlocked={discovered}
          toolsLocked={phase !== "investigate"}
          pulseTools={pulseTools}
          tried={tried}
          pending={pending}
          reducedMotion={reducedMotion}
          onTest={runTest}
          onTool={applyTool}
        />
      </Interaction>
    </>
  );
}
