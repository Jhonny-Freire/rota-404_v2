"use client";

import {
  Children,
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { ELEMENTS, type ElementKey } from "@/config/assets";
import type { MarkStatus } from "./types";
import { useTimers } from "./useSequence";
import { cssVars, cx, resolveSprite } from "./util";
import styles from "./DragBoard.module.css";

/** Zona de origem das peças no <DragBoard>. */
export const POOL_ZONE = "pool";

/**
 * Chamado quando o aluno solta/coloca uma peça numa zona (arrastando, tocando peça → zona, ou Enter).
 * Retorne `false` para recusar (a peça treme e fica onde estava).
 */
export type DragMoveHandler = (itemId: string, zoneId: string) => boolean | void;

type GhostVisual = { label: string; src?: string };

/**
 * Zona sob o dedo durante o arraste, fora do valor do contexto: quando ela muda, só as duas DropZones afetadas
 * re-renderizam (antes todas as peças e zonas re-renderizavam a cada zona cruzada).
 */
type HoverStore = {
  get: () => string | null;
  set: (zone: string | null) => void;
  subscribe: (listener: () => void) => () => void;
};

function createHoverStore(): HoverStore {
  let value: string | null = null;
  const listeners = new Set<() => void>();
  return {
    get: () => value,
    set: (zone) => {
      if (zone === value) return;
      value = zone;
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

type DragContextValue = {
  selected: string | null;
  draggingId: string | null;
  hover: HoverStore;
  rejected: string | null;
  disabled: boolean;
  toggleSelect: (id: string) => void;
  attempt: (itemId: string, zoneId: string) => void;
  beginDrag: (id: string, visual: GhostVisual, x: number, y: number) => void;
  moveDrag: (x: number, y: number) => void;
  endDrag: (x: number, y: number, cancelled: boolean) => void;
  registerPiece: (id: string, label: string) => () => void;
  registerZone: (id: string, label: string) => () => void;
  labelOf: (id: string | null) => string;
};

const DragContext = createContext<DragContextValue | null>(null);

function useDragContext(component: string): DragContextValue {
  const context = useContext(DragContext);
  if (!context) throw new Error(`<${component}> precisa estar dentro de <DragProvider> ou <DragBoard>.`);
  return context;
}

type GhostHandle = { move: (x: number, y: number) => void };

const ghostTransform = (x: number, y: number) => `translate(${x}px, ${y}px) translate(-50%, -50%)`;

/**
 * Peça "fantasma" que segue o dedo/mouse. Desempenho: a posição é escrita direto no style (sem render do React a
 * cada pointermove); a posição inicial vem do primeiro render.
 */
const Ghost = forwardRef<GhostHandle, { visual: GhostVisual; x: number; y: number }>(function Ghost({ visual, x, y }, ref) {
  const el = useRef<HTMLDivElement>(null);
  useImperativeHandle(
    ref,
    () => ({
      move: (nx, ny) => {
        if (el.current) el.current.style.transform = ghostTransform(nx, ny);
      },
    }),
    [],
  );
  return createPortal(
    <div ref={el} className={styles.ghost} style={{ transform: ghostTransform(x, y) }} aria-hidden="true">
      {visual.src && <img src={visual.src} alt="" draggable={false} />}
      <span>{visual.label}</span>
    </div>,
    document.body,
  );
});

function zoneAt(x: number, y: number): string | null {
  const el = document.elementFromPoint(x, y);
  return el?.closest<HTMLElement>("[data-kit-zone]")?.dataset.kitZone ?? null;
}

export type DragProviderProps = {
  children: ReactNode;
  /** valida/aplica o movimento (o motor atualiza o próprio estado de posições) */
  onMove: DragMoveHandler;
  disabled?: boolean;
  /**
   * Opcional: avisa quando a peça selecionada (tocar/Enter na peça) muda — id da peça ou null. Não é chamado na
   * montagem. Use no lugar de observar o DOM (aria-pressed) para trocar a dica do momento.
   */
  onSelect?: (id: string | null) => void;
};

/**
 * Base do arrastar-e-soltar acessível. Peças (<DragPiece>) e zonas (<DropZone>) podem ficar em qualquer lugar
 * dentro do provider — inclusive em portais diferentes (palco e painel de interação).
 */
export function DragProvider({ children, onMove, disabled = false, onSelect }: DragProviderProps) {
  const timers = useTimers();
  const [selected, setSelected] = useState<string | null>(null);
  const [drag, setDrag] = useState<{ id: string; visual: GhostVisual; x: number; y: number } | null>(null);
  const [hover] = useState(createHoverStore);
  const [rejected, setRejected] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const onMoveRef = useRef(onMove);
  const onSelectRef = useRef(onSelect);
  const ghostRef = useRef<GhostHandle>(null);
  // pointermove: o fantasma anda na hora (style direto); a zona sob o dedo (elementFromPoint) é lida no máximo
  // 1 vez por quadro, com o último ponto
  const pendingPoint = useRef<{ x: number; y: number } | null>(null);
  const frameRef = useRef(0);
  const selectedRef = useRef<string | null>(null);
  const pieces = useRef(new Map<string, string>());
  const zones = useRef(new Map<string, string>());

  useEffect(() => {
    onMoveRef.current = onMove;
    onSelectRef.current = onSelect;
  });

  useEffect(() => {
    if (selectedRef.current === selected) return;
    selectedRef.current = selected;
    onSelectRef.current?.(selected);
  }, [selected]);

  useEffect(
    () => () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    },
    [],
  );

  const flushHover = useCallback(() => {
    frameRef.current = 0;
    const point = pendingPoint.current;
    pendingPoint.current = null;
    if (point) hover.set(zoneAt(point.x, point.y));
  }, [hover]);

  useEffect(() => {
    if (disabled) setSelected(null);
  }, [disabled]);

  useEffect(() => {
    if (selected === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [selected]);

  const labelOf = useCallback((id: string | null) => (id ? (pieces.current.get(id) ?? id) : ""), []);

  const attempt = useCallback(
    (itemId: string, zoneId: string) => {
      setSelected(null);
      const piece = pieces.current.get(itemId) ?? itemId;
      const zone = zones.current.get(zoneId) ?? zoneId;
      const result = onMoveRef.current(itemId, zoneId);
      if (result === false) {
        setRejected(itemId);
        setAnnouncement(`${piece} não pode ficar em ${zone}.`);
        timers.after(700, () => setRejected((r) => (r === itemId ? null : r)), { hold: true });
      } else {
        setAnnouncement(`${piece} colocado em ${zone}.`);
      }
    },
    [timers],
  );

  const value = useMemo<DragContextValue>(
    () => ({
      selected,
      draggingId: drag?.id ?? null,
      hover,
      rejected,
      disabled,
      labelOf,
      attempt,
      toggleSelect: (id) => {
        if (disabled) return;
        const next = selected === id ? null : id;
        setSelected(next);
        setAnnouncement(next ? `${pieces.current.get(id) ?? id} selecionado. Escolha onde colocar.` : "");
      },
      beginDrag: (id, visual, x, y) => {
        if (disabled) return;
        setSelected(null);
        hover.set(null);
        setDrag({ id, visual, x, y });
      },
      moveDrag: (x, y) => {
        ghostRef.current?.move(x, y);
        pendingPoint.current = { x, y };
        if (!frameRef.current) frameRef.current = requestAnimationFrame(flushHover);
      },
      endDrag: (x, y, cancelled) => {
        if (frameRef.current) cancelAnimationFrame(frameRef.current);
        frameRef.current = 0;
        pendingPoint.current = null;
        const id = drag?.id;
        const zone = cancelled ? null : zoneAt(x, y);
        hover.set(null);
        setDrag(null);
        if (id && zone) attempt(id, zone);
      },
      registerPiece: (id, label) => {
        pieces.current.set(id, label);
        return () => {
          if (pieces.current.get(id) === label) pieces.current.delete(id);
        };
      },
      registerZone: (id, label) => {
        zones.current.set(id, label);
        return () => {
          if (zones.current.get(id) === label) zones.current.delete(id);
        };
      },
    }),
    [selected, drag, hover, rejected, disabled, labelOf, attempt, flushHover],
  );

  return (
    <DragContext.Provider value={value}>
      {children}
      {drag && <Ghost ref={ghostRef} visual={drag.visual} x={drag.x} y={drag.y} />}
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </DragContext.Provider>
  );
}

export type DragPieceProps = {
  id: string;
  /** nome da peça (texto visível e acessível) */
  label: string;
  element?: ElementKey;
  src?: string;
  /** largura do sprite em unidades do kit. Padrão 7 */
  size?: number;
  /** esconde o texto (fica só no nome acessível) */
  hideLabel?: boolean;
  /** conteúdo próprio no lugar de sprite + texto (ex.: um <Block>) */
  children?: ReactNode;
  /** marca de correção */
  status?: MarkStatus;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
};

const DRAG_THRESHOLD = 8;

/** Peça arrastável: arrastar, ou tocar/Enter na peça e depois na zona. */
export function DragPiece({ id, label, element, src, size = 7, hideLabel = false, children, status, disabled = false, className, style }: DragPieceProps) {
  const ctx = useDragContext("DragPiece");
  const pointer = useRef<{ pointerId: number; x: number; y: number; dragging: boolean } | null>(null);
  const suppressClick = useRef(false);
  const sprite = element || src ? resolveSprite(element, src) : undefined;
  const isSelected = ctx.selected === id;
  const isDragging = ctx.draggingId === id;
  const locked = disabled || ctx.disabled;
  const { registerPiece } = ctx;

  useEffect(() => registerPiece(id, label), [registerPiece, id, label]);

  const onPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (locked || (event.pointerType === "mouse" && event.button !== 0)) return;
    pointer.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, dragging: false };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const p = pointer.current;
    if (!p || p.pointerId !== event.pointerId) return;
    if (!p.dragging) {
      if (Math.hypot(event.clientX - p.x, event.clientY - p.y) < DRAG_THRESHOLD) return;
      p.dragging = true;
      ctx.beginDrag(id, { label, src: sprite }, event.clientX, event.clientY);
      return;
    }
    ctx.moveDrag(event.clientX, event.clientY);
  };

  const endPointer = (event: PointerEvent<HTMLButtonElement>, cancelled: boolean) => {
    const p = pointer.current;
    if (!p || p.pointerId !== event.pointerId) return;
    pointer.current = null;
    if (p.dragging) {
      suppressClick.current = true;
      ctx.endDrag(event.clientX, event.clientY, cancelled);
    }
  };

  return (
    <button
      type="button"
      data-kit-piece={id}
      className={cx(
        styles.piece,
        isSelected && styles.selected,
        isDragging && styles.dragging,
        ctx.rejected === id && styles.rejected,
        status === "correct" && styles.correct,
        status === "wrong" && styles.wrong,
        className,
      )}
      style={cssVars({ "--s": size }, style)}
      onClick={(event) => {
        event.stopPropagation();
        if (suppressClick.current) {
          suppressClick.current = false;
          return;
        }
        if (!locked) ctx.toggleSelect(id);
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={(event) => endPointer(event, false)}
      onPointerCancel={(event) => endPointer(event, true)}
      aria-pressed={isSelected}
      aria-label={label}
      aria-disabled={locked || undefined}
    >
      {children ?? (
        <>
          {sprite && <img src={sprite} alt="" draggable={false} className={styles.img} />}
          {!hideLabel && <span className={styles.label}>{label}</span>}
        </>
      )}
      {(status === "correct" || status === "wrong") && (
        <img src={status === "correct" ? ELEMENTS.ok : ELEMENTS.error} alt="" draggable={false} className={styles.mark} />
      )}
    </button>
  );
}

export type DropZoneProps = {
  id: string;
  /** nome da zona (título visível e nome acessível) */
  label: string;
  /** esconde o título visível */
  hideLabel?: boolean;
  /** peças (<DragPiece>) que estão nesta zona e/ou decoração */
  children?: ReactNode;
  /** destaque da zona */
  status?: "correct" | "wrong" | "highlight" | null;
  /** "wrap" (padrão): peças lado a lado · "stack": uma abaixo da outra · "free": sem layout (use Place/posição própria) */
  layout?: "wrap" | "stack" | "free";
  /** texto/elemento mostrado quando a zona está vazia */
  emptyHint?: ReactNode;
  /** zona sem moldura (ex.: área do palco inteira) */
  bare?: boolean;
  className?: string;
  style?: CSSProperties;
};

/** Zona que recebe peças. Com uma peça selecionada, tocar/Enter na zona coloca a peça aqui. */
export function DropZone({ id, label, hideLabel = false, children, status, layout = "wrap", emptyHint, bare = false, className, style }: DropZoneProps) {
  const ctx = useDragContext("DropZone");
  const { registerZone } = ctx;
  const armed = ctx.selected !== null && !ctx.disabled;
  const dragging = ctx.draggingId !== null;
  const { hover } = ctx;
  const hovered = useSyncExternalStore(
    hover.subscribe,
    () => hover.get() === id,
    () => false,
  );
  const empty = Children.toArray(children).length === 0;

  useEffect(() => registerZone(id, label), [registerZone, id, label]);

  return (
    <div
      data-kit-zone={id}
      role="group"
      aria-label={label}
      className={cx(
        styles.zone,
        bare && styles.bare,
        (armed || dragging) && styles.armed,
        hovered && styles.hovered,
        status === "correct" && styles.zoneCorrect,
        status === "wrong" && styles.zoneWrong,
        status === "highlight" && styles.zoneHighlight,
        className,
      )}
      style={style}
    >
      {armed && (
        <button
          type="button"
          className={styles.dropTarget}
          onClick={() => ctx.selected && ctx.attempt(ctx.selected, id)}
          aria-label={`Colocar ${ctx.labelOf(ctx.selected)} em ${label}`}
        />
      )}
      {!hideLabel && <span className={styles.zoneLabel}>{label}</span>}
      <div className={cx(styles.zoneBody, styles[layout])}>
        {children}
        {empty && emptyHint && <span className={styles.empty}>{emptyHint}</span>}
      </div>
    </div>
  );
}

export type DragBoardItem = {
  id: string;
  label: string;
  element?: ElementKey;
  src?: string;
  /** conteúdo próprio da peça (ex.: <Block kind="title" />) */
  content?: ReactNode;
};

export type DragBoardZone = {
  id: string;
  label: string;
  /** texto quando vazia (ex.: "Solte aqui") */
  hint?: ReactNode;
};

export type DragBoardProps = {
  items: DragBoardItem[];
  zones: DragBoardZone[];
  /** controlado: itemId → zoneId (ausente = POOL_ZONE) */
  value?: Record<string, string>;
  /** não controlado: posição inicial */
  defaultValue?: Record<string, string>;
  /** nova distribuição após cada movimento aceito */
  onChange?: (value: Record<string, string>) => void;
  /** valide cada colocação; retorne false para recusar (a peça volta tremendo) */
  onDrop?: (itemId: string, zoneId: string) => boolean | void;
  /** marca por peça */
  itemStatus?: Record<string, MarkStatus>;
  /** destaque por zona */
  zoneStatus?: Record<string, "correct" | "wrong" | "highlight" | null | undefined>;
  /** título da área de origem. Padrão "Peças" */
  poolLabel?: string;
  /** "side": origem à esquerda das zonas · "stack": origem acima. Padrão "stack" */
  layout?: "side" | "stack";
  /** largura dos sprites em unidades do kit. Padrão 7 */
  size?: number;
  disabled?: boolean;
  className?: string;
};

/** Itens → zonas, pronto para usar (origem + zonas). Para layouts livres use DragProvider + DragPiece + DropZone. */
export function DragBoard({
  items,
  zones,
  value,
  defaultValue,
  onChange,
  onDrop,
  itemStatus,
  zoneStatus,
  poolLabel = "Peças",
  layout = "stack",
  size = 7,
  disabled = false,
  className,
}: DragBoardProps) {
  const [inner, setInner] = useState<Record<string, string>>(() => defaultValue ?? {});
  const placement = value ?? inner;
  const zoneOf = (itemId: string) => placement[itemId] ?? POOL_ZONE;

  const handleMove: DragMoveHandler = (itemId, zoneId) => {
    if (zoneOf(itemId) === zoneId) return;
    if (onDrop?.(itemId, zoneId) === false) return false;
    const next = { ...placement, [itemId]: zoneId };
    if (value === undefined) setInner(next);
    onChange?.(next);
  };

  const renderPieces = (zoneId: string) =>
    items
      .filter((item) => zoneOf(item.id) === zoneId)
      .map((item) => (
        <DragPiece
          key={item.id}
          id={item.id}
          label={item.label}
          element={item.element}
          src={item.src}
          size={size}
          status={itemStatus?.[item.id]}
        >
          {item.content}
        </DragPiece>
      ));

  return (
    <DragProvider onMove={handleMove} disabled={disabled}>
      <div className={cx(styles.board, styles[layout], className)}>
        <DropZone id={POOL_ZONE} label={poolLabel} className={styles.pool} emptyHint=" ">
          {renderPieces(POOL_ZONE)}
        </DropZone>
        <div className={styles.zones}>
          {zones.map((zone) => (
            <DropZone key={zone.id} id={zone.id} label={zone.label} status={zoneStatus?.[zone.id]} emptyHint={zone.hint ?? "Solte aqui"}>
              {renderPieces(zone.id)}
            </DropZone>
          ))}
        </div>
      </div>
    </DragProvider>
  );
}

export default DragBoard;
