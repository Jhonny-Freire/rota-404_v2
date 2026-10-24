"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ROCKET_FRAMES } from "@/config/assets";
import { AnimatedSprite } from "@/components/ui/AnimatedSprite";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import styles from "./FlightProvider.module.css";

/*
 * Viagem da nave ao entrar num destino (portada do Rota 404 antigo, components/flight/FlightProvider.js):
 * a nave sai da vaga ao lado do destino, plana até a borda da órbita, dá meia volta por cima dele fechando até o
 * centro (pouso), o destino "aproxima" e a página troca em hiperespaço. Na tela nova a nave da vaga desce do alto.
 * Tudo por Web Animations (só transform/opacity) e a lógica por temporizador.
 */
const T = { glide: 250, orbit: 450, zoom: 350 };
const LAND_MS = T.glide + T.orbit;
const WARP_OUT_MS = 400;
const ARRIVAL_MS = 900;
const ROCKET_W = 54;

type Point = { x: number; y: number };
type Flight = { from: Point; to: Point; radius: number; href: string; target: HTMLElement; id: number };
type FlyOptions = { from: HTMLElement | null; target: HTMLElement | null; href: string };

const FlightContext = createContext<{ flyTo: (opts: FlyOptions) => void; flying: boolean }>({ flyTo: () => {}, flying: false });

const centerOf = (rect: DOMRect): Point => ({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
const heading = (a: Point, b: Point) => (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI + 90;
const frame = (offset: number, p: Point, angle: number, scale: number): Keyframe => ({
  offset,
  transform: `translate(${p.x}px, ${p.y}px) translate(-50%, -50%) rotate(${angle}deg) scale(${scale})`,
});

/** Planeio da vaga até a borda da órbita + meia órbita por cima do alvo, fechando até o centro. */
function landingKeyframes(from: Point, to: Point, radius: number): Keyframe[] {
  const at = (ms: number) => ms / LAND_MS;
  const entry = { x: to.x - radius, y: to.y };
  const glide = heading(from, entry);
  const frames = [frame(0, from, glide, 1), frame(at(T.glide), entry, glide, 1)];
  const steps = 12;
  for (let i = 1; i <= steps; i += 1) {
    const t = i / steps;
    const eased = 1 - (1 - t) * (1 - t);
    const angle = Math.PI + eased * Math.PI;
    const r = radius * (1 - eased * 0.9);
    const p = { x: to.x + Math.cos(angle) * r, y: to.y + Math.sin(angle) * r * 0.75 };
    const tangent = { x: p.x - Math.sin(angle), y: p.y + Math.cos(angle) * 0.75 };
    frames.push(frame(at(T.glide + T.orbit * t), p, heading(p, tangent), 0.96 - eased * 0.5));
  }
  return frames;
}

export function FlightProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();
  const [flight, setFlight] = useState<Flight | null>(null);
  const [warp, setWarp] = useState<"in" | "out" | null>(null);
  const rocketRef = useRef<HTMLSpanElement>(null);
  const busy = useRef(false);
  const lastPath = useRef(pathname);
  const tripTimers = useRef<number[]>([]);
  const endTimers = useRef<number[]>([]);

  const schedule = (group: { current: number[] }, fn: () => void, ms: number) => group.current.push(window.setTimeout(fn, ms));
  const cancel = (group: { current: number[] }) => {
    group.current.forEach(clearTimeout);
    group.current = [];
  };

  const finish = useCallback(() => {
    cancel(tripTimers);
    cancel(endTimers);
    setWarp("out");
    setFlight(null);
    document.body.dataset.arriving = "true";
    schedule(endTimers, () => {
      setWarp(null);
      busy.current = false;
      delete document.body.dataset.flying;
    }, WARP_OUT_MS);
    schedule(endTimers, () => delete document.body.dataset.arriving, ARRIVAL_MS);
  }, []);

  const flyTo = useCallback(
    ({ from, target, href }: FlyOptions) => {
      if (busy.current) return;
      const fromRect = from?.getBoundingClientRect();
      const targetRect = target?.getBoundingClientRect();
      if (reducedMotion || !target || !targetRect || !fromRect || fromRect.width === 0) {
        router.push(href);
        return;
      }
      busy.current = true;
      router.prefetch(href);
      document.body.dataset.flying = "true";
      setFlight({
        from: centerOf(fromRect),
        to: centerOf(targetRect),
        radius: Math.max(40, Math.max(targetRect.width, targetRect.height) * 0.6),
        href,
        target,
        id: Date.now(),
      });
    },
    [router, reducedMotion],
  );

  useEffect(() => {
    if (!flight) return;
    const rocketAnim = rocketRef.current?.animate(landingKeyframes(flight.from, flight.to, flight.radius), {
      duration: LAND_MS,
      easing: "linear",
      fill: "forwards",
    });
    let targetAnim: Animation | undefined;
    schedule(tripTimers, () => {
      targetAnim = flight.target.animate([{ transform: "scale(1)", opacity: 1 }, { transform: "scale(1.8)", opacity: 0.85 }], {
        duration: T.zoom,
        easing: "ease-in",
        fill: "forwards",
      });
    }, LAND_MS);
    const warpAt = LAND_MS + T.zoom * 0.4;
    schedule(tripTimers, () => setWarp("in"), warpAt);
    schedule(tripTimers, () => {
      router.push(flight.href);
      schedule(tripTimers, finish, 3000); // segurança: mesma rota ou compilação lenta
    }, warpAt + 250);
    return () => {
      cancel(tripTimers);
      rocketAnim?.cancel();
      targetAnim?.cancel();
    };
  }, [flight, router, finish]);

  // Página nova carregada: sai do hiperespaço.
  useEffect(() => {
    if (pathname === lastPath.current) return;
    lastPath.current = pathname;
    if (warp === "in") finish();
  }, [pathname, warp, finish]);

  useEffect(
    () => () => {
      cancel(tripTimers);
      cancel(endTimers);
    },
    [],
  );

  const value = useMemo(() => ({ flyTo, flying: Boolean(flight) || Boolean(warp) }), [flyTo, flight, warp]);

  return (
    <FlightContext.Provider value={value}>
      {children}
      {flight && (
        <div className={styles.layer} style={{ "--tx": `${flight.to.x}px`, "--ty": `${Math.max(0, flight.to.y)}px` } as CSSProperties} aria-hidden="true">
          <div className={styles.spotlight} />
          <span
            key={flight.id}
            ref={rocketRef}
            className={styles.rocket}
            style={{ transform: `translate(${flight.from.x}px, ${flight.from.y}px) translate(-50%, -50%)` }}
          >
            <AnimatedSprite frames={ROCKET_FRAMES} fps={14} alt="" size={ROCKET_W} />
          </span>
        </div>
      )}
      {warp && <div className={`${styles.warp} ${warp === "out" ? styles.warpOut : ""}`} aria-hidden="true" />}
    </FlightContext.Provider>
  );
}

export const useFlight = () => useContext(FlightContext);
