"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cx } from "@/components/ui/cx";
import { Connection, type Point } from "./Connection";
import { Rocket } from "./Rocket";
import styles from "./SpaceMap.module.css";

export type SpaceMapNode = {
  id: string;
  x: number;
  y: number;
  content: ReactNode;
  locked?: boolean;
};

export type SpaceMapProps = {
  nodes: SpaceMapNode[];
  edges?: Array<[string, string]>;
  rocketAt?: string;
  aspectRatio?: number;
  ariaLabel: string;
  className?: string;
};

type Box = { x: number; y: number; w: number; h: number; stacked: boolean; rocketX: number; rocketY: number };

const ROCKET_SIZE = 44;
const ROCKET_HEIGHT = (ROCKET_SIZE * 900) / 540;
const FLIGHT_MS = 900;

function trim(box: Box, ux: number, uy: number): number {
  if (!box.stacked) return Math.min(box.w, box.h) * 0.42;
  const rx = ux ? box.w / 2 / Math.abs(ux) : Infinity;
  const ry = uy ? box.h / 2 / Math.abs(uy) : Infinity;
  return Math.min(rx, ry) + 6;
}

function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, value));
}

export function SpaceMap({ nodes, edges, rocketAt, aspectRatio = 16 / 9, ariaLabel, className }: SpaceMapProps) {
  const containerRef = useRef<HTMLElement>(null);
  const nodeRefs = useRef(new Map<string, HTMLLIElement>());
  const [boxes, setBoxes] = useState<Record<string, Box>>({});
  const boxesRef = useRef(boxes);
  const lastRocketId = useRef(rocketAt);
  const [tilt, setTilt] = useState(0);
  const layoutKey = nodes.map((n) => `${n.id}:${n.x}:${n.y}`).join("|");

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const base = container.getBoundingClientRect();
        const next: Record<string, Box> = {};
        nodeRefs.current.forEach((el, id) => {
          const art = el.querySelector<HTMLElement>("[data-map-anchor]") ?? el;
          const stacked = getComputedStyle(el).position === "static";
          const target = stacked ? el : art;
          const rect = target.getBoundingClientRect();
          const artRect = art.getBoundingClientRect();
          next[id] = {
            x: rect.left - base.left + rect.width / 2,
            y: rect.top - base.top + rect.height / 2,
            w: target.offsetWidth,
            h: target.offsetHeight,
            stacked,
            rocketX: artRect.left - base.left + artRect.width / 2,
            rocketY: artRect.top - base.top + art.offsetHeight * 0.08,
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

  useEffect(() => {
    boxesRef.current = boxes;
  }, [boxes]);

  useEffect(() => {
    const from = lastRocketId.current;
    lastRocketId.current = rocketAt;
    if (!from || !rocketAt || from === rocketAt) return;
    const a = boxesRef.current[from];
    const b = boxesRef.current[rocketAt];
    if (!a || !b) return;
    let angle = (Math.atan2(b.rocketY - a.rocketY, b.rocketX - a.rocketX) * 180) / Math.PI + 90;
    if (angle > 180) angle -= 360;
    setTilt(angle);
    const id = window.setTimeout(() => setTilt(0), FLIGHT_MS);
    return () => window.clearTimeout(id);
  }, [rocketAt]);

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

  const rocketBox = rocketAt ? boxes[rocketAt] : undefined;

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

      <ol className={styles.list}>
        {nodes.map((node) => (
          <li
            key={node.id}
            ref={(el) => {
              if (el) nodeRefs.current.set(node.id, el);
              else nodeRefs.current.delete(node.id);
            }}
            className={cx(styles.item, node.id === rocketAt && styles.current)}
            style={{ left: `${clampPercent(node.x)}%`, top: `${clampPercent(node.y)}%` }}
          >
            {node.content}
          </li>
        ))}
      </ol>

      {rocketBox && (
        <span
          className={styles.rocket}
          aria-hidden="true"
          style={{
            transform: `translate3d(${rocketBox.rocketX - ROCKET_SIZE / 2}px, ${rocketBox.rocketY - ROCKET_HEIGHT + 8}px, 0)`,
          }}
        >
          <Rocket size={ROCKET_SIZE} angle={tilt} />
        </span>
      )}
    </section>
  );
}

export default SpaceMap;
