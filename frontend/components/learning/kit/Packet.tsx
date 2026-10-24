"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { ElementKey } from "@/config/assets";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { DEFAULT_RATIO, type ScenePoint } from "./types";
import { cssVars, cx, resolveSprite, round, sceneDistance } from "./util";
import styles from "./Packet.module.css";

export type PacketProps = {
  /** caminho em % do canvas: [A, B] ou [A, B, C, …] */
  path: ScenePoint[];
  /** sprite do pacote (padrão ELEMENTS.box) */
  element?: ElementKey;
  src?: string;
  /** largura em unidades do kit. Padrão 5 */
  size?: number;
  /** duração total da viagem (ms); dividida pelos trechos conforme o comprimento. Padrão 1600 */
  durationMs?: number;
  /** espera antes de partir (ms). Padrão 0 */
  delayMs?: number;
  /** índice do ponto em que o pacote para (ponto de falha). Padrão: último */
  stopAt?: number;
  /** marca visual de bloqueio ao parar (tremida + brilho vermelho) */
  blocked?: boolean;
  /** recomeça depois de chegar */
  loop?: boolean;
  /** pausa entre voltas do loop (ms). Padrão 400 */
  loopPauseMs?: number;
  /** some ao chegar */
  hideOnArrive?: boolean;
  /** chamado ao chegar (por timer — nunca por animationend) */
  onArrive?: () => void;
  /** chamado ao alcançar cada ponto do caminho (índice) */
  onReach?: (index: number) => void;
  /** etiqueta sobre o pacote (ex.: <Tag>REQUISIÇÃO</Tag>) */
  label?: ReactNode;
  /** nome acessível do pacote */
  alt?: string;
  /** proporção do SceneCanvas, se não for 16:9 */
  ratio?: number;
  z?: number;
  className?: string;
};

const FIRST_MOVE_MS = 40;

/**
 * Sprite que viaja pelo caminho dentro de um <SceneCanvas>.
 * Para repetir a viagem, troque a `key` do componente.
 */
export function Packet({
  path,
  element = "box",
  src,
  size = 5,
  durationMs = 1600,
  delayMs = 0,
  stopAt,
  blocked = false,
  loop = false,
  loopPauseMs = 400,
  hideOnArrive = false,
  onArrive,
  onReach,
  label,
  alt,
  ratio = DEFAULT_RATIO,
  z,
  className,
}: PacketProps) {
  const reducedMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [arrived, setArrived] = useState(false);
  const onArriveRef = useRef(onArrive);
  const onReachRef = useRef(onReach);
  const points = path.length > 0 ? path : [{ x: 50, y: 50 }];
  const last = Math.min(points.length - 1, Math.max(0, stopAt ?? points.length - 1));
  const pathKey = points.map((p) => `${round(p.x)},${round(p.y)}`).join(";");

  const segments: number[] = [];
  for (let i = 1; i <= last; i++) segments.push(sceneDistance(points[i - 1], points[i], ratio));
  const fullLength = Math.max(
    0.0001,
    points.slice(1).reduce((sum, p, i) => sum + sceneDistance(points[i], p, ratio), 0),
  );
  const travel = reducedMotion ? 0 : Math.max(0, durationMs);
  const segmentMs = segments.map((len) => (travel * len) / fullLength);
  const timingKey = segmentMs.map((ms) => Math.round(ms)).join(",");

  useEffect(() => {
    onArriveRef.current = onArrive;
    onReachRef.current = onReach;
  });

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const durations = timingKey ? timingKey.split(",").map(Number) : [];
    setIndex(0);
    setArrived(false);
    let at = Math.max(reducedMotion ? 0 : FIRST_MOVE_MS, delayMs);
    durations.forEach((ms, i) => {
      const target = i + 1;
      timers.push(setTimeout(() => setIndex(target), at));
      at += ms;
      timers.push(setTimeout(() => onReachRef.current?.(target), at));
    });
    timers.push(
      setTimeout(() => {
        setArrived(true);
        onArriveRef.current?.();
        if (loop) timers.push(setTimeout(() => setCycle((c) => c + 1), Math.max(0, loopPauseMs)));
      }, at),
    );
    return () => timers.forEach(clearTimeout);
  }, [pathKey, timingKey, delayMs, loop, loopPauseMs, reducedMotion, cycle]);

  const current = points[Math.min(index, last)];
  const transitionMs = index === 0 ? 0 : (segmentMs[index - 1] ?? 0);

  return (
    <div
      className={cx(styles.packet, arrived && hideOnArrive && styles.hidden, arrived && blocked && styles.blocked, className)}
      style={cssVars({
        "--x": round(current.x),
        "--y": round(current.y),
        "--dur": `${Math.round(transitionMs)}ms`,
        "--s": size,
        "--z": z,
      })}
      role={alt ? "img" : undefined}
      aria-label={alt}
      aria-hidden={alt ? undefined : true}
    >
      {label !== undefined && label !== null && <span className={styles.label}>{label}</span>}
      <img src={resolveSprite(element, src)} alt="" draggable={false} className={styles.img} />
    </div>
  );
}

export default Packet;
