"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import type { BonziState } from "@/types/domain";
import type { LabEngineMeta, LabEngineProps } from "@/components/learning/runtime";
import { useSeededRandom, useTimers } from "@/components/learning/kit";
import { revealFocus } from "@/components/ui/revealFocus";
import { DomainPanel } from "./DomainPanel";
import { MapScene } from "./MapScene";
import {
  BANNER,
  DOMAIN_SELECTOR,
  REPEAT_LINE_MS,
  SERVERS,
  TEXT,
  TIMING,
  buildMatch,
  serverSelector,
  spokenBanner,
  testPath,
  travelMs,
  type BannerSpec,
  type Phase,
  type ServerId,
  type TestRun,
} from "./model";

/** Etapas do lab2-3.md (Fluxo): receber o domínio, tocar nele, escolher o servidor, conectar. */
export const meta: LabEngineMeta = {
  kind: "lab",
  steps: ["Receber", "Tocar no domínio", "Escolher", "Conectar"],
};

/** Índices de meta.steps. Cada site novo recomeça na etapa 1; ao conectar, todas ficam marcadas. */
const STEP = { receive: 0, tapDomain: 1, choose: 2, connect: 3 } as const;

const SALT = "encontrando-o-destino";

export default function EncontrandoODestino({
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
  const session = useSeededRandom(0, { salt: `${SALT}:visita` });
  const rand = useSeededRandom(attempt, { salt: SALT });
  const match = useMemo(() => buildMatch(session, rand, attempt), [session, rand, attempt]);
  const timers = useTimers({ reducedMotion });

  const [round, setRound] = useState(0);
  const [phase, setPhaseState] = useState<Phase>("arriving");
  const [tried, setTried] = useState<ServerId[]>([]);
  const [test, setTest] = useState<TestRun | null>(null);
  const [banner, setBanner] = useState<{ spec: BannerSpec; key: number }>(() => ({
    spec: BANNER.tapDomain(match.rounds[0].domain),
    key: 0,
  }));
  const phaseRef = useRef<Phase>("arriving");
  const runRef = useRef(0);
  const keyboardRef = useRef(false);
  const stageRef = useRef<HTMLDivElement>(null);
  /** última fala pedida ao Bonzi por este laboratório e quando */
  const lineRef = useRef<{ text: string; at: number } | null>(null);

  const total = match.rounds.length;
  const current = match.rounds[Math.min(round, total - 1)];
  const domain = current.domain;
  const lastRound = round >= total - 1;

  const setPhase = useCallback((next: Phase) => {
    phaseRef.current = next;
    setPhaseState(next);
  }, []);

  /** A faixa do palco muda (com "pop") sem fala nova. */
  const show = useCallback((spec: BannerSpec) => {
    setBanner((prev) => ({ spec, key: prev.key + 1 }));
  }, []);

  /** Novo momento: a faixa do palco muda e o Bonzi fala a mesma ideia, uma vez. */
  const guide = useCallback(
    (spec: BannerSpec, line: string, state?: BonziState) => {
      show(spec);
      lineRef.current = { text: line, at: performance.now() };
      say(line, state);
    },
    [show, say],
  );

  /**
   * Toque fora de hora: a faixa (de novo, com "pop") e o Bonzi dizem o que fazer agora. Toques seguidos com o mesmo
   * lembrete só fazem a faixa saltar: a fala que o Bonzi acabou de começar não recomeça a cada toque.
   */
  const nudge = useCallback(
    (spec: BannerSpec) => {
      const line = spokenBanner(spec);
      const last = lineRef.current;
      if (last && last.text === line && performance.now() - last.at < REPEAT_LINE_MS) {
        show(spec);
        return;
      }
      guide(spec, line);
    },
    [show, guide],
  );

  // Só move o foco quando o aluno está usando o teclado (o próximo alvo fica em outra área do palco).
  const focusStage = useCallback((selector: string) => {
    if (!keyboardRef.current) return;
    revealFocus(stageRef.current?.querySelector<HTMLElement>(selector));
  }, []);

  const markKeyboard = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") keyboardRef.current = true;
  }, []);

  const markPointer = useCallback(() => {
    keyboardRef.current = false;
  }, []);

  // Etapa 1 (lab2-3.md): o domínio chega e o Bonzi diz "Encontre onde este site está." A faixa cita o domínio pelo nome.
  useEffect(() => {
    setStep(STEP.receive);
    guide(BANNER.tapDomain(domain), round === 0 ? TEXT.find : TEXT.nextSite);
    feedback({ tone: "hint", message: TEXT.tapHint(domain.name) });
    return timers.after(TIMING.arrive, () => {
      if (phaseRef.current !== "arriving") return;
      setPhase("waiting");
      setStep(STEP.tapDomain);
      focusStage(DOMAIN_SELECTOR);
    });
  }, [round, domain, guide, feedback, setStep, timers, setPhase, focusStage]);

  /** Lembrete do próximo passo para um toque fora de hora. Devolve true quando o toque já foi respondido. */
  const remind = (): boolean => {
    switch (phaseRef.current) {
      case "lookup":
        nudge(BANNER.wait);
        return true;
      case "testing":
        nudge(BANNER.waitConnection);
        return true;
      case "connected":
        // o Bonzi está comemorando: só a faixa salta, a fala não recomeça
        show(lastRound ? BANNER.connected : BANNER.connectedNext);
        return true;
      case "done":
        return true;
      default:
        return false;
    }
  };

  /** Etapa 2: o toque no domínio revela o endereço que precisa ser encontrado no mapa. */
  const tapDomain = () => {
    if (remind()) return;
    const ip = current.server.ip;
    if (phaseRef.current === "choose") {
      nudge(BANNER.findServer(ip));
      return;
    }
    const first = match.columns[0];
    const name = domain.name;
    setPhase("lookup");
    setStep(STEP.tapDomain);
    show(BANNER.lookup);
    feedback({ tone: "info", message: TEXT.lookup });
    timers.after(
      TIMING.lookup,
      () => {
        setPhase("choose");
        setStep(STEP.choose);
        feedback({ tone: "hint", message: TEXT.compare(name, ip) });
        guide(BANNER.findServer(ip), TEXT.whichServer, "thinking");
        focusStage(serverSelector(first));
      },
      { hold: true },
    );
  };

  /** Etapa 4, errado: a conexão falha e o laboratório pede nova tentativa (o IP procurado é lembrado). */
  const failed = (run: number, id: ServerId) => {
    setTest((t) => (t && t.run === run ? { ...t, status: "failed" } : t));
    setTried((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setPhase("choose");
    setStep(STEP.choose);
    mistake();
    feedback({ tone: "error", message: TEXT.failed(SERVERS[id], current.server.ip) });
    guide(BANNER.failed, TEXT.retry, "warning");
    timers.after(TIMING.failHold, () => setTest((t) => (t && t.run === run ? null : t)), { hold: true });
  };

  /** Etapa 4, certo: as linhas domínio → endereço → servidor ficam acesas e o servidor ganha o site. */
  const connected = (run: number) => {
    const last = lastRound;
    const { domain: site, server } = current;
    setTest((t) => (t && t.run === run ? { ...t, status: "ok" } : t));
    setPhase("connected");
    setStep(meta.steps.length);
    feedback({ tone: "success", message: TEXT.connected(site.name, server) });
    guide(last ? BANNER.connected : BANNER.connectedNext, last ? TEXT.connectedSay : TEXT.connectedNext, "happy");
    timers.after(
      last ? TIMING.lastHold : TIMING.connectedHold,
      () => {
        if (last) {
          setPhase("done");
          feedback({ tone: "success", message: TEXT.allDone });
          guide(BANNER.done, TEXT.final, "happy");
          timers.after(TIMING.finishHold, finish, { hold: true });
          return;
        }
        setTest(null);
        setTried([]);
        setPhase("arriving");
        setRound((r) => r + 1);
      },
      { hold: true },
    );
  };

  /** Etapa 3: o aluno escolhe um servidor e a conexão viaja até ele. */
  const pickServer = (id: ServerId) => {
    if (remind()) return;
    const now = phaseRef.current;
    if (now === "arriving" || now === "waiting") {
      nudge(BANNER.domainFirst(domain));
      return;
    }
    if (now !== "choose") return;
    if (tried.includes(id)) {
      nudge(BANNER.tried);
      return;
    }
    const ok = id === current.server.id;
    const path = testPath(match.positions[id], ok);
    const durationMs = travelMs(path);
    runRef.current += 1;
    const run = runRef.current;
    setTest({ run, server: id, ok, status: "travel", path, durationMs });
    setPhase("testing");
    setStep(STEP.connect);
    show(BANNER.connecting);
    feedback({ tone: "info", message: TEXT.chose(SERVERS[id]) });
    timers.after(durationMs + TIMING.settle, () => (ok ? connected(run) : failed(run, id)));
  };

  return (
    <>
      <Stage>
        <MapScene
          match={match}
          round={round}
          phase={phase}
          test={test}
          tried={tried}
          banner={banner.spec}
          bannerKey={banner.key}
          reducedMotion={reducedMotion}
          rootRef={stageRef}
          onDomain={tapDomain}
          onServer={pickServer}
          onKeyDown={markKeyboard}
          onPointerDown={markPointer}
        />
      </Stage>
      <Interaction>
        <DomainPanel
          rounds={match.rounds}
          round={round}
          phase={phase}
          reducedMotion={reducedMotion}
          onDomain={tapDomain}
          onKeyDown={markKeyboard}
          onPointerDown={markPointer}
        />
      </Interaction>
    </>
  );
}
