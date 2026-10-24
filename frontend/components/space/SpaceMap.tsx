"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cx } from "@/components/ui/cx";
import { Connection, type Point } from "./Connection";
import { useRouteTravel, type RocketDock, type TravelStop } from "./useRouteTravel";
import styles from "./SpaceMap.module.css";

export type SpaceMapNode = {
  id: string;
  x: number;
  y: number;
  content: ReactNode;
  locked?: boolean;
  /** nome do destino (com `confirmEnter`, o Bonzi o diz na pergunta "Quer entrar?") */
  title?: string;
  kicker?: string;
  href?: string;
  completed?: boolean;
};

export type SpaceMapProps = {
  nodes: SpaceMapNode[];
  edges?: Array<[string, string]>;
  /** onde a nave estaciona se ainda não parou em nenhum destino deste mapa */
  rocketAt?: string;
  /** identifica o mapa (a nave lembra onde parou em cada um) */
  mapId: string;
  /** vaga da nave ao lado de cada destino */
  dock: RocketDock;
  aspectRatio?: number;
  ariaLabel: string;
  className?: string;
  /** o Bonzi pergunta "Quer entrar?" antes de pousar (ver useRouteTravel) */
  confirmEnter?: boolean;
};

type Box = { x: number; y: number; w: number; h: number; stacked: boolean };

function trim(box: Box, ux: number, uy: number): number {
  if (!box.stacked) return Math.min(box.w, box.h) * 0.42;
  const rx = ux ? box.w / 2 / Math.abs(ux) : Infinity;
  const ry = uy ? box.h / 2 / Math.abs(uy) : Infinity;
  return Math.min(rx, ry) + 6;
}

function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, value));
}

export function SpaceMap({
  nodes,
  edges,
  rocketAt,
  mapId,
  dock,
  aspectRatio = 16 / 9,
  ariaLabel,
  className,
  confirmEnter = false,
}: SpaceMapProps) {
  const containerRef = useRef<HTMLElement>(null);
  const nodeRefs = useRef(new Map<string, HTMLLIElement>());
  const [boxes, setBoxes] = useState<Record<string, Box>>({});
  const layoutKey = nodes.map((n) => `${n.id}:${n.x}:${n.y}`).join("|");

  const stops: TravelStop[] = nodes.map((n) => ({
    id: n.id,
    href: n.href,
    locked: n.locked,
    title: n.title ?? "",
    kicker: n.kicker,
    completed: n.completed,
  }));
  const route = useRouteTravel({
    mapId,
    stops,
    defaultId: rocketAt,
    containerRef,
    dock,
    connect: edges === undefined || edges.length > 0,
    confirm: confirmEnter,
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const base = container.getBoundingClientRect();
        // mapa encolhido (FitToHeight): as medidas da tela voltam para as coordenadas do próprio mapa
        const scale = container.offsetWidth > 0 ? base.width / container.offsetWidth : 1;
        const next: Record<string, Box> = {};
        nodeRefs.current.forEach((el, id) => {
          const art = el.querySelector<HTMLElement>("[data-map-anchor]") ?? el;
          const stacked = getComputedStyle(el).position === "static";
          const target = stacked ? el : art;
          const rect = target.getBoundingClientRect();
          next[id] = {
            x: (rect.left - base.left + rect.width / 2) / scale,
            y: (rect.top - base.top + rect.height / 2) / scale,
            w: target.offsetWidth,
            h: target.offsetHeight,
            stacked,
          };
        });
        setBoxes(next);
      });
    };
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    nodeRefs.current.forEach((el) => observer.observe(el));
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [layoutKey]);

  const pairs: Array<[string, string]> = edges ?? nodes.slice(1).map((node, i) => [nodes[i].id, node.id]);
  const lockedIds = new Set(nodes.filter((n) => n.locked).map((n) => n.id));

  const links = pairs.flatMap(([a, b]) => {
    const A = boxes[a];
    const B = boxes[b];
    if (!A || !B) return [];
    const dx = B.x - A.x;
    const dy = B.y - A.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 1) return [];
    const ux = dx / distance;
    const uy = dy / distance;
    const ra = trim(A, ux, uy);
    const rb = trim(B, ux, uy);
    if (distance - ra - rb < 16) return [];
    const from: Point = { x: A.x + ux * ra, y: A.y + uy * ra };
    const to: Point = { x: B.x - ux * rb, y: B.y - uy * rb };
    const state: "active" | "locked" = lockedIds.has(a) || lockedIds.has(b) ? "locked" : "active";
    return [{ key: `${a}->${b}`, from, to, state }];
  });

  return (
    <section
      ref={containerRef}
      aria-label={ariaLabel}
      className={cx(styles.map, className)}
      style={{ "--map-ratio": String(aspectRatio) } as CSSProperties}
    >
      <div className={styles.links} aria-hidden="true">
        {links.map((link) => (
          <Connection key={link.key} from={link.from} to={link.to} state={link.state} />
        ))}
      </div>

      <ol className={styles.list} onClickCapture={route.onClickCapture}>
        {nodes.map((node) => (
          <li
            key={node.id}
            ref={(el) => {
              if (el) nodeRefs.current.set(node.id, el);
              else nodeRefs.current.delete(node.id);
            }}
            className={cx(styles.item, node.id === route.parked && styles.current)}
            style={{ left: `${clampPercent(node.x)}%`, top: `${clampPercent(node.y)}%` }}
          >
            <div className={styles.stop} data-stop-id={node.id}>
              {!node.locked && route.dockFor(node.id)}
              {node.content}
            </div>
          </li>
        ))}
      </ol>

      {route.overlay}
    </section>
  );
}

export default SpaceMap;
