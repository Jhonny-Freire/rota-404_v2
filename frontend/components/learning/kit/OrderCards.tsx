"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { ELEMENTS, SPRITES, type ElementKey } from "@/config/assets";
import { SpriteButton } from "@/components/ui/SpriteButton";
import { useTimers } from "./useSequence";
import { cssVars, cx, resolveSprite } from "./util";
import styles from "./OrderCards.module.css";

export type OrderItem = {
  id: string;
  /** texto do cartão */
  label: ReactNode;
  element?: ElementKey;
  src?: string;
  /** nome acessível quando o label não é texto */
  ariaLabel?: string;
};

export type OrderResult = {
  correct: boolean;
  /** ordem atual (ids) */
  order: string[];
  /** primeira posição errada (−1 quando correta) — destaque só ela para não revelar a resposta */
  firstWrong: number;
};

export type OrderCardsProps = {
  /** ordem inicial (embaralhe antes com useSeededRandom(...).shuffle(items, "chave", true)) */
  items: OrderItem[];
  /** ids na ordem correta */
  correctOrder: string[];
  /** resultado ao tocar no botão de verificar */
  onResult?: (result: OrderResult) => void;
  /** a cada mudança de ordem */
  onChange?: (order: string[]) => void;
  /** rótulo do botão de verificar. Padrão "Verificar" */
  checkLabel?: string;
  /** "row" (padrão) ou "column" */
  direction?: "row" | "column";
  /** largura dos sprites em unidades do kit. Padrão 7 */
  size?: number;
  /** mostra a posição (1, 2, 3…) em cada cartão. Padrão true */
  showNumbers?: boolean;
  disabled?: boolean;
  /** quanto tempo (ms) a marca de erro fica visível. Padrão 1400 */
  retryMs?: number;
  ariaLabel?: string;
  className?: string;
};

type PointerState = { id: string; pointerId: number; x: number; y: number; dragging: boolean; over: number };

const DRAG_THRESHOLD = 8;

/**
 * Ordenar uma sequência. Formas de mover (todas acessíveis):
 * setas ◀ ▶ de cada cartão; tocar um cartão e depois outro (troca); teclado (setas movem o cartão focado);
 * arrastar com mouse/dedo.
 */
export function OrderCards({
  items,
  correctOrder,
  onResult,
  onChange,
  checkLabel = "Verificar",
  direction = "row",
  size = 7,
  showNumbers = true,
  disabled = false,
  retryMs = 1400,
  ariaLabel,
  className,
}: OrderCardsProps) {
  const timers = useTimers();
  const [order, setOrder] = useState<string[]>(() => items.map((item) => item.id));
  const [selected, setSelected] = useState<string | null>(null);
  const [wrongIndex, setWrongIndex] = useState(-1);
  const [solved, setSolved] = useState(false);
  const [drag, setDrag] = useState<{ id: string; over: number; dx: number; dy: number } | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const pointerRef = useRef<PointerState | null>(null);
  const suppressClick = useRef(false);
  const cardRefs = useRef(new Map<string, HTMLButtonElement>());
  const slotRefs = useRef(new Map<string, HTMLLIElement>());
  // Desempenho do arraste: os retângulos dos encaixes são medidos uma vez no começo do gesto (a ordem só muda ao
  // soltar) e o estado do arraste é atualizado no máximo 1 vez por quadro.
  const slotRectsRef = useRef<Array<DOMRect | null> | null>(null);
  const dragFrame = useRef(0);
  const nextDrag = useRef<{ id: string; over: number; dx: number; dy: number } | null>(null);

  useEffect(
    () => () => {
      if (dragFrame.current) cancelAnimationFrame(dragFrame.current);
    },
    [],
  );
  const byId = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);
  const locked = disabled || solved;
  const prevKey = direction === "row" ? "ArrowLeft" : "ArrowUp";
  const nextKey = direction === "row" ? "ArrowRight" : "ArrowDown";

  const nameOf = (id: string) => {
    const item = byId.get(id);
    return item?.ariaLabel ?? (typeof item?.label === "string" ? item.label : id);
  };

  const commit = (next: string[], focusId?: string) => {
    setOrder(next);
    setWrongIndex(-1);
    onChange?.(next);
    if (focusId) {
      setAnnouncement(`${nameOf(focusId)} na posição ${next.indexOf(focusId) + 1}.`);
      timers.after(0, () => cardRefs.current.get(focusId)?.focus(), { hold: true });
    }
  };

  const move = (id: string, to: number) => {
    const from = order.indexOf(id);
    const target = Math.max(0, Math.min(order.length - 1, to));
    if (from < 0 || from === target) return;
    const next = [...order];
    next.splice(from, 1);
    next.splice(target, 0, id);
    commit(next, id);
  };

  const swap = (a: string, b: string) => {
    const next = [...order];
    const ia = next.indexOf(a);
    const ib = next.indexOf(b);
    if (ia < 0 || ib < 0) return;
    [next[ia], next[ib]] = [next[ib], next[ia]];
    commit(next, b);
  };

  const onCardClick = (id: string) => {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    if (locked) return;
    if (selected === null) setSelected(id);
    else if (selected === id) setSelected(null);
    else {
      swap(selected, id);
      setSelected(null);
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, id: string) => {
    if (locked) return;
    const index = order.indexOf(id);
    if (event.key === prevKey) {
      event.preventDefault();
      move(id, index - 1);
    } else if (event.key === nextKey) {
      event.preventDefault();
      move(id, index + 1);
    } else if (event.key === "Escape") {
      setSelected(null);
    }
  };

  const indexAt = (x: number, y: number): number | null => {
    let best: number | null = null;
    let bestDistance = Infinity;
    const rects = slotRectsRef.current;
    order.forEach((id, index) => {
      const rect = rects ? rects[index] : slotRefs.current.get(id)?.getBoundingClientRect();
      if (!rect) return;
      const inside = x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
      const distance = inside ? -1 : Math.hypot(x - (rect.left + rect.width / 2), y - (rect.top + rect.height / 2));
      if (distance < bestDistance) {
        bestDistance = distance;
        best = index;
      }
    });
    return best;
  };

  const onPointerDown = (event: PointerEvent<HTMLButtonElement>, id: string) => {
    if (locked || (event.pointerType === "mouse" && event.button !== 0)) return;
    pointerRef.current = { id, pointerId: event.pointerId, x: event.clientX, y: event.clientY, dragging: false, over: order.indexOf(id) };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const p = pointerRef.current;
    if (!p || p.pointerId !== event.pointerId) return;
    const dx = event.clientX - p.x;
    const dy = event.clientY - p.y;
    if (!p.dragging && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    if (!p.dragging) {
      p.dragging = true;
      slotRectsRef.current = order.map((id) => slotRefs.current.get(id)?.getBoundingClientRect() ?? null);
    }
    const over = indexAt(event.clientX, event.clientY);
    if (over !== null) p.over = over;
    nextDrag.current = { id: p.id, over: p.over, dx, dy };
    if (!dragFrame.current) {
      dragFrame.current = requestAnimationFrame(() => {
        dragFrame.current = 0;
        if (nextDrag.current) setDrag(nextDrag.current);
      });
    }
  };

  const endPointer = (event: PointerEvent<HTMLButtonElement>, cancelled: boolean) => {
    const p = pointerRef.current;
    if (!p || p.pointerId !== event.pointerId) return;
    pointerRef.current = null;
    if (dragFrame.current) cancelAnimationFrame(dragFrame.current);
    dragFrame.current = 0;
    nextDrag.current = null;
    slotRectsRef.current = null;
    if (p.dragging) {
      suppressClick.current = true;
      setDrag(null);
      setSelected(null);
      if (!cancelled) move(p.id, p.over);
    }
  };

  const check = () => {
    const firstWrong = order.findIndex((id, i) => id !== correctOrder[i]);
    const correct = firstWrong === -1 && order.length === correctOrder.length;
    onResult?.({ correct, order, firstWrong: correct ? -1 : Math.max(0, firstWrong) });
    setSelected(null);
    if (correct) {
      setSolved(true);
      setAnnouncement("Sequência correta!");
      return;
    }
    setWrongIndex(Math.max(0, firstWrong));
    setAnnouncement(`A posição ${Math.max(0, firstWrong) + 1} ainda não está certa.`);
    timers.after(retryMs, () => setWrongIndex(-1), { hold: true });
  };

  return (
    <div className={cx(styles.root, styles[direction], className)} style={cssVars({ "--s": size })}>
      <ol className={styles.list} aria-label={ariaLabel ?? "Sequência"}>
        {order.map((id, index) => {
          const item = byId.get(id);
          if (!item) return null;
          const dragging = drag?.id === id;
          const target = drag && drag.id !== id && drag.over === index;
          return (
            <li
              key={id}
              ref={(el) => {
                if (el) slotRefs.current.set(id, el);
                else slotRefs.current.delete(id);
              }}
              className={cx(styles.slot, target && styles.target)}
            >
              <button
                ref={(el) => {
                  if (el) cardRefs.current.set(id, el);
                  else cardRefs.current.delete(id);
                }}
                type="button"
                className={cx(
                  styles.card,
                  selected === id && styles.selected,
                  wrongIndex === index && styles.wrong,
                  solved && styles.correct,
                  dragging && styles.dragging,
                )}
                style={dragging ? { transform: `translate(${drag.dx}px, ${drag.dy}px)` } : undefined}
                onClick={() => onCardClick(id)}
                onKeyDown={(event) => onKeyDown(event, id)}
                onPointerDown={(event) => onPointerDown(event, id)}
                onPointerMove={onPointerMove}
                onPointerUp={(event) => endPointer(event, false)}
                onPointerCancel={(event) => endPointer(event, true)}
                aria-pressed={selected === id}
                aria-label={`${nameOf(id)}, posição ${index + 1} de ${order.length}`}
                aria-disabled={locked || undefined}
              >
                {showNumbers && <span className={styles.number}>{index + 1}</span>}
                {(item.element || item.src) && (
                  <img src={resolveSprite(item.element, item.src)} alt="" draggable={false} className={styles.img} />
                )}
                <span className={styles.label}>{item.label}</span>
                {(wrongIndex === index || solved) && (
                  <img src={solved ? ELEMENTS.ok : ELEMENTS.error} alt="" draggable={false} className={styles.mark} />
                )}
              </button>
              {!locked && (
                <span className={styles.moves}>
                  <button
                    type="button"
                    className={styles.move}
                    onClick={() => move(id, index - 1)}
                    disabled={index === 0}
                    aria-label={`Mover ${nameOf(id)} para ${direction === "row" ? "a esquerda" : "cima"}`}
                  >
                    <img src={SPRITES.ui.back} alt="" draggable={false} />
                  </button>
                  <button
                    type="button"
                    className={styles.move}
                    onClick={() => move(id, index + 1)}
                    disabled={index === order.length - 1}
                    aria-label={`Mover ${nameOf(id)} para ${direction === "row" ? "a direita" : "baixo"}`}
                  >
                    <img src={SPRITES.ui.next} alt="" draggable={false} />
                  </button>
                </span>
              )}
            </li>
          );
        })}
      </ol>
      {!solved && (
        <SpriteButton
          sprite={ELEMENTS.ok}
          label={checkLabel}
          onClick={check}
          disabled={disabled || wrongIndex >= 0}
          variant="primary"
          size={20}
        />
      )}
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </div>
  );
}

export default OrderCards;
