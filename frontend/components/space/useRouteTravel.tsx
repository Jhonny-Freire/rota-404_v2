"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { BONZI_FRAMES, ROCKET_FRAMES, SPRITES } from "@/config/assets";
import { AnimatedSprite } from "@/components/ui/AnimatedSprite";
import { SpriteButton } from "@/components/ui/SpriteButton";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useSettings } from "@/hooks/useSettings";
import { narrationService } from "@/services/narrationService";
import { useFlight } from "./FlightProvider";
import { Rocket } from "./Rocket";
import styles from "./useRouteTravel.module.css";

/*
 * Nave estacionada nos mapas (portada do RouteMap do Rota 404 antigo): ela fica numa vaga ao lado de um destino e
 * lembra onde parou (por mapa). Tocar num destino faz a nave andar pelo traçado, passando pelos destinos do meio,
 * estacionar ao lado dele e entrar: pouso + hiperespaço (FlightProvider). Por padrão é um toque só (revisão de
 * navegação de 23/10/2026); com `confirm` (mapa da galáxia), o Bonzi pergunta "Quer entrar?" antes de pousar.
 */

const STORAGE_KEY = "rota404.parked";
const SPEED = 0.42; // px por ms
const MIN_MS = 700;
const MAX_MS = 3200;
const TURN = 26; // px usados para virar a nave em cada curva do traçado

export type TravelStop = { id: string; href?: string; locked?: boolean; title: string; kicker?: string; completed?: boolean };

/** Vaga da nave em relação ao topo-centro do destino (px), tamanho (largura) e inclinação de estacionada. */
export type RocketDock = { x: number; y: number; size: number; tilt: number };

type Point = { x: number; y: number };
type Travel = { to: string; keyframes: Keyframe[]; duration: number; id: number };

function readParked(mapId: string): string | null {
  try {
    return (JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}") as Record<string, string>)[mapId] ?? null;
  } catch {
    return null;
  }
}

function writeParked(mapId: string, id: string) {
  try {
    const all = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}") as Record<string, string>;
    all[mapId] = id;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // sem localStorage: a nave só não lembra onde parou
  }
}

/** Esquece onde a nave parou em todos os mapas (a próxima pessoa a entrar começa do próprio caminho). */
export function forgetParked() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // sem localStorage: nada guardado
  }
}

/** centro do elemento nas coordenadas do mapa; `scale` desfaz o encolhimento do mapa (FitToHeight) */
const centerIn = (el: Element, box: DOMRect, scale = 1): Point => {
  const r = el.getBoundingClientRect();
  return { x: (r.left + r.width / 2 - box.left) / scale, y: (r.top + r.height / 2 - box.top) / scale };
};

/** Quadros-chave da nave passando pelos pontos: vira rápido em cada curva, segue reta e termina inclinada. */
function routeKeyframes(points: Point[], tilt: number): { keyframes: Keyframe[]; duration: number } {
  const marks = [{ ...points[0], angle: tilt, scale: 1 }];
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1];
    const b = points[i];
    const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const ux = (b.x - a.x) / len;
    const uy = (b.y - a.y) / len;
    const angle = (Math.atan2(uy, ux) * 180) / Math.PI + 90;
    const r = Math.min(TURN, len / 3);
    marks.push({ x: a.x + ux * r, y: a.y + uy * r, angle, scale: 1.08 });
    marks.push({ x: b.x - ux * r, y: b.y - uy * r, angle, scale: 1.08 });
  }
  marks.push({ ...points[points.length - 1], angle: tilt, scale: 1 });
  for (let i = 1; i < marks.length; i += 1) {
    let { angle } = marks[i];
    while (angle - marks[i - 1].angle > 180) angle -= 360;
    while (angle - marks[i - 1].angle < -180) angle += 360;
    marks[i].angle = angle;
  }
  const dist = [0];
  for (let i = 1; i < marks.length; i += 1) dist.push(dist[i - 1] + Math.hypot(marks[i].x - marks[i - 1].x, marks[i].y - marks[i - 1].y));
  const total = dist[dist.length - 1] || 1;
  const keyframes = marks.map((m, i) => ({
    offset: dist[i] / total,
    transform: `translate(${m.x}px, ${m.y}px) translate(-50%, -50%) rotate(${m.angle}deg) scale(${m.scale})`,
  }));
  return { keyframes, duration: Math.min(MAX_MS, Math.max(MIN_MS, total / SPEED)) };
}

export type RouteTravelOptions = {
  mapId: string;
  /** destinos na ordem do traçado */
  stops: TravelStop[];
  defaultId?: string;
  containerRef: RefObject<HTMLElement | null>;
  dock: RocketDock;
  /** false: a nave vai direto (sem passar pelos destinos do meio) */
  connect?: boolean;
  /** true: ao chegar, o Bonzi pergunta "Quer entrar?" (Entrar / Agora não) em vez de entrar direto */
  confirm?: boolean;
};

export function useRouteTravel({ mapId, stops, defaultId, containerRef, dock, connect = true, confirm = false }: RouteTravelOptions) {
  const reducedMotion = useReducedMotion();
  const { settings } = useSettings();
  const { flyTo } = useFlight();
  const travelerRef = useRef<HTMLSpanElement>(null);
  const [stored, setStored] = useState<string | null>(null);
  const [travel, setTravel] = useState<Travel | null>(null);
  /** destino a entrar assim que a nave estiver na vaga dele (depois do render) */
  const [entering, setEntering] = useState<string | null>(null);
  /** com `confirm`: destino em que a nave parou, esperando "Entrar" */
  const [briefing, setBriefing] = useState<string | null>(null);
  /** a nave chegou ao destino: entra direto ou (com `confirm`) pergunta antes */
  const arrive = useCallback((id: string) => (confirm ? setBriefing(id) : setEntering(id)), [confirm]);

  useEffect(() => setStored(readParked(mapId)), [mapId]);

  const byId = new Map(stops.map((s) => [s.id, s]));
  const fallback = defaultId && byId.get(defaultId) && !byId.get(defaultId)?.locked ? defaultId : stops.find((s) => !s.locked)?.id;
  const storedStop = stored ? byId.get(stored) : undefined;
  const parked = storedStop && !storedStop.locked ? storedStop.id : fallback;

  const park = useCallback(
    (id: string) => {
      setStored(id);
      writeParked(mapId, id);
    },
    [mapId],
  );

  const stopEl = (id: string) => containerRef.current?.querySelector<HTMLElement>(`[data-stop-id="${CSS.escape(id)}"]`) ?? null;

  const select = (id: string) => {
    const stop = byId.get(id);
    if (travel || entering || !stop || stop.locked) return;
    const container = containerRef.current;
    const fromEl = parked ? stopEl(parked)?.querySelector("[data-rocket-dock]") : null;
    const toEl = stopEl(id)?.querySelector("[data-dock-slot]");
    if (id === parked || reducedMotion || !container || !fromEl || !toEl) {
      park(id);
      arrive(id);
      return;
    }
    const box = container.getBoundingClientRect();
    const order = stops.map((s) => s.id);
    const i = parked ? order.indexOf(parked) : -1;
    const j = order.indexOf(id);
    const between: Element[] = [];
    if (connect && i >= 0) {
      const step = j > i ? 1 : -1;
      for (let k = i + step; k !== j; k += step) {
        const anchor = stopEl(order[k])?.querySelector("[data-map-anchor]");
        if (anchor) between.push(anchor);
      }
    }
    const scale = container instanceof HTMLElement && container.offsetWidth > 0 ? box.width / container.offsetWidth : 1;
    const points = [fromEl, ...between, toEl].map((el) => centerIn(el, box, scale));
    setBriefing(null);
    setTravel({ to: id, id: Date.now(), ...routeKeyframes(points, dock.tilt) });
  };

  // Viagem: Web Animations na nave; a chegada é por temporizador (funciona mesmo sem quadros desenhados).
  useLayoutEffect(() => {
    if (!travel) return;
    const anim = travelerRef.current?.animate(travel.keyframes, { duration: travel.duration, easing: "ease-in-out", fill: "forwards" });
    const timer = window.setTimeout(() => {
      park(travel.to);
      setTravel(null);
      arrive(travel.to);
    }, travel.duration);
    return () => {
      window.clearTimeout(timer);
      anim?.cancel();
    };
  }, [travel, park, arrive]);

  const close = useCallback(() => {
    setBriefing(null);
    narrationService.stop("route-briefing");
  }, []);

  useEffect(() => {
    if (!briefing) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [briefing, close]);

  const open = briefing ? byId.get(briefing) : undefined;
  const question = open?.completed ? "Você já passou por aqui. Quer revisitar?" : "Quer entrar?";
  const speech = open ? `${open.title}. ${question}` : null;

  useEffect(() => {
    if (!speech) return;
    narrationService.speak(speech, { enabled: settings.narrationEnabled, volume: settings.volume, owner: "route-briefing" });
    return () => narrationService.stop("route-briefing");
  }, [speech, settings.narrationEnabled, settings.volume]);

  const enterBriefing = () => {
    if (!open) return;
    setBriefing(null);
    setEntering(open.id);
  };

  /** Tocar num destino (link dentro de um `[data-stop-id]`): em vez de abrir, a nave vai até lá. */
  const onClickCapture = (event: MouseEvent<HTMLElement>) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = (event.target as HTMLElement).closest<HTMLAnchorElement>("a[href]");
    const id = link?.closest<HTMLElement>("[data-stop-id]")?.dataset.stopId;
    if (!link || !id || !byId.get(id)) return;
    event.preventDefault();
    select(id);
  };

  // a nave chegou (ou já estava lá): pousa e entra
  useEffect(() => {
    if (!entering) return;
    setEntering(null);
    const stop = byId.get(entering);
    if (!stop?.href) return;
    const el = stopEl(stop.id);
    flyTo({
      from: el?.querySelector<HTMLElement>("[data-rocket-dock]") ?? null,
      target: el?.querySelector<HTMLElement>("[data-map-anchor]") ?? null,
      href: stop.href,
    });
  }, [entering]);

  const rocketHeight = (dock.size * 900) / 540;
  const dockStyle = { "--dock-x": `${dock.x}px`, top: dock.y } as CSSProperties;

  /** Vaga ao lado do destino: a nave estacionada (fonte da viagem) ou o lugar vazio onde ela vai parar. */
  const dockFor = (id: string): ReactNode =>
    parked === id && !travel ? (
      <span className={styles.dock} style={dockStyle} data-rocket-dock="" aria-hidden="true">
        <Rocket size={dock.size} angle={dock.tilt} />
      </span>
    ) : (
      <span className={styles.dock} style={{ ...dockStyle, width: dock.size, height: rocketHeight }} data-dock-slot="" aria-hidden="true" />
    );

  const overlay = (
    <>
      {travel && (
        <span key={travel.id} ref={travelerRef} className={styles.traveler} style={{ transform: String(travel.keyframes[0].transform) }} aria-hidden="true">
          <AnimatedSprite frames={ROCKET_FRAMES} fps={14} alt="" size={dock.size} />
        </span>
      )}
      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div className={styles.briefing} role="dialog" aria-label={`${open.title}: ${question}`}>
            <img src={BONZI_FRAMES.speaking[0]} alt="" className={styles.bonzi} draggable={false} />
            <div className={styles.text}>
              {open.kicker && <span className={styles.kicker}>{open.kicker}</span>}
              <strong className={styles.title}>{open.title}</strong>
              <span className={styles.question}>{question}</span>
              <div className={styles.actions}>
                <SpriteButton
                  sprite={SPRITES.ui.play}
                  label={open.completed ? "Revisitar" : "Entrar"}
                  variant="primary"
                  onClick={enterBriefing}
                  attention
                  focusOnAttention
                  size={22}
                />
                <SpriteButton sprite={SPRITES.ui.back} label="Agora não" onClick={close} size={22} />
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );

  return { parked, travelling: travel !== null, onClickCapture, dockFor, overlay };
}
