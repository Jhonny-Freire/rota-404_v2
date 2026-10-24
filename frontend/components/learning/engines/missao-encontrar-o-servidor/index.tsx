"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import type { BonziState } from "@/types/domain";
import type { LabEngineMeta, LabEngineProps } from "@/components/learning/runtime";
import { revealFocus } from "@/components/ui/revealFocus";
import { useSeededRandom, useTimers, type FlowItem, type ScenePoint } from "@/components/learning/kit";
import { MapScene } from "./MapScene";
import { MissionPanel, type PanelChoice } from "./MissionPanel";
import {
  BANNER,
  HELP_AFTER,
  INTERNET_ID,
  JUNCTION_PHASES,
  LAST_LAYER,
  REPEAT_LINE_MS,
  START_ID,
  TEXT,
  TIMING,
  buildMission,
  center,
  restPoint,
  travelMs,
  type BannerSpec,
  type Phase,
  type Trip,
} from "./model";

/**
 * Lab 2.4 (lab2-4.md, "Fluxo"): receber o destino -> escolher cada etapa do caminho (Wi-Fi, roteador, internet) ->
 * achar o servidor pelo IP -> a resposta volta e a página aparece. Etapas com verbos curtos (faixa de 40 px do shell).
 */
export const meta: LabEngineMeta = {
  kind: "lab",
  steps: ["Receber", "Escolher", "Chegar", "Ver a página"],
};

/** Índices de meta.steps. */
const STEP = { receive: 0, choose: 1, arrive: 2, page: 3 } as const;

const SALT = "missao-encontrar-o-servidor";

/** onde a criança está escolhendo pelo teclado */
type Area = "map" | "panel";

/** primeira etapa livre (de cima para baixo) de cada área: para onde vai o foco quando o botão usado some */
const FIRST_CHOICE: Record<Area, string> = {
  map: '[data-choice="open"] button',
  panel: 'button[data-choice="open"]',
};

/** a faixa vira fala: "Espere a requisição" -> "Espere a requisição." */
const spoken = (text: string) => (/[.!?]$/.test(text) ? text : `${text}.`);

type Nudge = { spec: BannerSpec; moment: string; key: number };

export default function MissaoEncontrarOServidor({
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
  const rand = useSeededRandom(attempt, { salt: SALT });
  const session = useSeededRandom(0, { salt: `${SALT}:visita` });
  const mission = useMemo(() => buildMission(rand, session, attempt), [rand, session, attempt]);
  const { destino, ip, byId, layers } = mission;
  const timers = useTimers({ reducedMotion });

  const [phase, setPhaseState] = useState<Phase>("intro");
  const [route, setRoute] = useState<string[]>([START_ID]);
  const [tried, setTried] = useState<string[]>([]);
  const [misses, setMisses] = useState(0);
  const [trip, setTripState] = useState<Trip>(() => ({
    id: 0,
    kind: "rest",
    target: START_ID,
    path: [restPoint(mission.start)],
    durationMs: 0,
    blocked: false,
  }));
  /** lembrete de um toque fora de hora: vale só no momento em que foi pedido */
  const [nudgeState, setNudgeState] = useState<Nudge | null>(null);
  const phaseRef = useRef<Phase>("intro");
  const tripRef = useRef(trip);
  const tripSeq = useRef(0);
  const handledTrip = useRef(0);
  const missesRef = useRef(0);
  const helpSaid = useRef(false);
  const nudgeSeq = useRef(0);
  /** última fala pedida ao Bonzi por este laboratório e quando */
  const lineRef = useRef<{ text: string; at: number } | null>(null);
  /** última escolha feita pelo teclado (Enter/Espaço) e em que área; null depois de um toque ou clique */
  const keyboardRef = useRef<Area | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const setPhase = useCallback((next: Phase) => {
    phaseRef.current = next;
    setPhaseState(next);
  }, []);

  /** Bonzi fala a instrução do momento (uma vez por momento) */
  const speak = useCallback(
    (line: string, state?: BonziState) => {
      lineRef.current = { text: line, at: performance.now() };
      say(line, state);
    },
    [say],
  );

  const startTrip = (kind: Trip["kind"], target: string, path: ScenePoint[], blocked = false) => {
    tripSeq.current += 1;
    const next: Trip = { id: tripSeq.current, kind, target, path, blocked, durationMs: travelMs(path, TIMING.requestPerUnit) };
    tripRef.current = next;
    setTripState(next);
  };

  useEffect(() => {
    setStep(STEP.receive);
    speak(TEXT.intro);
    feedback({ tone: "hint", message: TEXT.introHint });
  }, [speak, setStep, feedback]);

  const received = phase !== "intro";
  const current = byId[route[route.length - 1]] ?? mission.start;
  const atJunction = JUNCTION_PHASES.includes(phase);
  const nextLayer = atJunction ? (layers[current.layer + 1] ?? []) : [];
  const help = misses >= HELP_AFTER;
  const guided = help && nextLayer.some((node) => node.correct);
  const ipShown = route.includes(INTERNET_ID);
  /** vez da criança: a requisição parou num cruzamento e espera a próxima etapa */
  const choosing = phase === "choose";
  /** este cruzamento já teve um caminho sem saída (a requisição voltou para cá) */
  const retried = nextLayer.some((node) => tried.includes(node.id));
  const toServer = current.layer + 1 === LAST_LAYER;

  /* ---------- faixa do palco: o que fazer agora ---------- */
  let banner: BannerSpec;
  if (phase === "intro") banner = BANNER.receive;
  else if (phase === "choose") {
    if (guided) banner = BANNER.follow;
    else if (toServer) banner = retried ? BANNER.backServer(ip) : BANNER.findServer(ip);
    else banner = retried ? BANNER.back : BANNER.choose(route.length);
  } else if (phase === "going") banner = BANNER.watch;
  else if (phase === "blocked" || phase === "returning") {
    banner = byId[trip.target]?.layer === LAST_LAYER ? BANNER.wrongServer : BANNER.deadEnd;
  } else if (phase === "responding") banner = BANNER.responding;
  else banner = BANNER.page;

  /** muda quando a criança passa para outra parte da tarefa: o lembrete de um toque fora de hora expira */
  const moment = `${phase}|${route.length}|${tried.length}`;
  const nudged = nudgeState && nudgeState.moment === moment ? nudgeState : null;
  const shownBanner = nudged?.spec ?? banner;
  const bannerKey = nudged ? `nudge-${nudged.key}` : "banner";

  /**
   * Toque fora de hora: a faixa salta de novo (com o lembrete) e o Bonzi diz o mesmo. O mesmo lembrete pedido de
   * novo logo em seguida só faz a faixa saltar: a fala que acabou de começar não recomeça a cada toque.
   */
  const nudge = (spec: BannerSpec) => {
    nudgeSeq.current += 1;
    setNudgeState({ spec, moment, key: nudgeSeq.current });
    const line = spoken(spec.text);
    const last = lineRef.current;
    if (last && last.text === line && performance.now() - last.at < REPEAT_LINE_MS) return;
    speak(line);
  };

  /** toque no palco fora de uma peça que pode ser escolhida: lembra o que fazer agora */
  const tapBackground = () => {
    if (phase === "responding" || phase === "page") return;
    nudge(banner);
  };

  const receive = () => {
    if (phaseRef.current !== "intro") return;
    setPhase("choose");
    setStep(STEP.choose);
    speak(TEXT.received(destino.domain));
    feedback({ tone: "hint", message: TEXT.chooseHint });
  };

  const choose = (id: string) => {
    const now = phaseRef.current;
    if (now === "going" || now === "blocked" || now === "returning") {
      nudge(BANNER.wait);
      return;
    }
    if (now !== "choose") return;
    const node = byId[id];
    if (!node || node.layer !== current.layer + 1) return;
    if (tried.includes(id)) {
      nudge(node.layer === LAST_LAYER ? BANNER.triedServer : BANNER.tried);
      return;
    }
    const path = node.correct
      ? [restPoint(current), center(current), center(node), restPoint(node)]
      : [restPoint(current), center(current), center(node)];
    setPhase("going");
    feedback({ tone: "info", message: TEXT.going(node) });
    startTrip("go", id, path, !node.correct);
  };

  const handleArrive = (tripId: number) => {
    const done = tripRef.current;
    if (done.id !== tripId || done.kind === "rest" || handledTrip.current === done.id) return;
    handledTrip.current = done.id;

    if (done.kind === "back") {
      setPhase("choose");
      // de volta ao ponto seguro: diz o que fazer agora (com a seta do Bonzi, se a ajuda já apareceu)
      if (missesRef.current >= HELP_AFTER) {
        if (!helpSaid.current) {
          helpSaid.current = true;
          speak(TEXT.help, "help");
        }
        feedback({ tone: "hint", message: TEXT.helpFeedback });
        return;
      }
      feedback({ tone: "hint", message: toServer ? TEXT.retryServer(ip) : TEXT.retry });
      return;
    }

    const node = byId[done.target];
    if (!node.correct) {
      const safe = current;
      missesRef.current += 1;
      setMisses(missesRef.current);
      setTried((prev) => (prev.includes(node.id) ? prev : [...prev, node.id]));
      mistake();
      setPhase("blocked");
      const message = node.layer === LAST_LAYER ? TEXT.wrongServer : TEXT.wrongPath(node.phrase);
      feedback({ tone: "error", message });
      speak(message, "warning");
      // o pacote treme no caminho sem saída; depois de uma pausa de leitura, volta ao último ponto seguro
      timers.after(
        TIMING.wrongHold,
        () => {
          setPhase("returning");
          startTrip("back", node.id, [center(node), center(safe), restPoint(safe)]);
        },
        { hold: true },
      );
      return;
    }

    setRoute((prev) => (prev.includes(node.id) ? prev : [...prev, node.id]));
    if (node.layer === LAST_LAYER) {
      setPhase("responding");
      setStep(STEP.page);
      speak(TEXT.server(destino.domain), "happy");
      feedback({ tone: "success", message: TEXT.serverFeedback });
      return;
    }
    setPhase("choose");
    if (node.id === INTERNET_ID) {
      setStep(STEP.arrive);
      speak(TEXT.ipFound(destino.domain, ip), "thinking");
      feedback({ tone: "info", message: TEXT.ipFeedback(ip) });
    } else {
      speak(TEXT.right, "happy");
      feedback({ tone: "success", message: TEXT.rightFeedback });
    }
  };

  const handleResponse = () => {
    if (phaseRef.current !== "responding") return;
    setPhase("page");
    // todas as etapas concluídas enquanto a página fica na tela
    setStep(meta.steps.length);
    speak(TEXT.page, "happy");
    feedback({ tone: "success", message: TEXT.pageFeedback(mission.start.name, destino.domain) });
    timers.after(TIMING.finishHold, finish, { hold: true });
  };

  /*
   * Teclado: a etapa escolhida vira ponto seguro (e deixa de ser botão), ou "Receber destino" some. Se o foco caiu
   * no começo da página, ele vai para a primeira etapa livre (de cima para baixo) da mesma área.
   */
  useEffect(() => {
    if (phase !== "choose") return;
    const area = keyboardRef.current;
    if (!area) return;
    const active = document.activeElement;
    if (active && active !== document.body) return;
    const root = area === "map" ? mapRef.current : panelRef.current;
    revealFocus(root?.querySelector<HTMLElement>(FIRST_CHOICE[area]));
  }, [phase, route.length]);

  const markKeys = useMemo(
    () => ({
      map: (event: KeyboardEvent<HTMLElement>) => {
        if (event.key === "Enter" || event.key === " ") keyboardRef.current = "map";
      },
      panel: (event: KeyboardEvent<HTMLElement>) => {
        if (event.key === "Enter" || event.key === " ") keyboardRef.current = "panel";
      },
    }),
    [],
  );

  const markPointer = useCallback(() => {
    keyboardRef.current = null;
  }, []);

  // na ordem do mapa (de cima para baixo): a lista não pode entregar a resposta
  const choices: PanelChoice[] = nextLayer.map((node) => ({
    id: node.id,
    name: node.name,
    element: node.element,
    ip: node.ip,
    tried: tried.includes(node.id),
    hint: help && node.correct,
  }));

  const chain: FlowItem[] = route.map((id) => ({ id, label: byId[id].name, element: byId[id].element }));
  if (atJunction) chain.push({ id: "proxima", label: "?", missing: true });
  if (phase === "page") chain.push({ id: "pagina", label: "Página", element: "webpage" });

  return (
    <>
      <Stage>
        <MapScene
          mission={mission}
          phase={phase}
          route={route}
          tried={tried}
          trip={trip}
          received={received}
          help={help}
          invite={choosing}
          banner={shownBanner}
          bannerKey={bannerKey}
          reducedMotion={reducedMotion}
          rootRef={mapRef}
          onReceive={receive}
          onChoose={choose}
          onArrive={handleArrive}
          onResponse={handleResponse}
          onBackground={tapBackground}
          onKeyDown={markKeys.map}
          onPointerDown={markPointer}
        />
      </Stage>
      <Interaction>
        <MissionPanel
          domain={destino.domain}
          ip={ip}
          received={received}
          ipShown={ipShown}
          choices={choices}
          locked={!choosing}
          invite={choosing}
          chain={chain}
          chainCurrent={route.length - 1}
          reducedMotion={reducedMotion}
          rootRef={panelRef}
          onReceive={receive}
          onChoose={choose}
          onKeyDown={markKeys.panel}
          onPointerDown={markPointer}
        />
      </Interaction>
    </>
  );
}
