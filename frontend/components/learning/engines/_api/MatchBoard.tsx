"use client";

import { useRef, useState } from "react";
import { ELEMENTS } from "@/config/assets";
import { DragPiece, DragProvider, DropZone, Place, useTimers, type DragMoveHandler, type ElementKey, type KitTone } from "@/components/learning/kit";
import type { Say } from "@/components/learning/runtime";
import { cx } from "@/components/ui/cx";
import { Banner } from "./parts";
import styles from "./ApiKit.module.css";

export type MatchZone = {
  id: string;
  name: string;
  icon?: ElementKey;
  /** o que a caixa precisa, dito no erro (não revela qual cartão é o certo) */
  need: string;
};

export type MatchPiece = {
  id: string;
  label: string;
  element?: ElementKey;
  /** caixa certa */
  zone: string;
  /** texto em fonte monoespaçada (métodos, códigos, caminhos) */
  mono?: boolean;
};

export type MatchBoardProps = {
  zones: MatchZone[];
  /** na ordem do monte (embaralhe antes) */
  pieces: MatchPiece[];
  say: Say;
  setHint: (text: string | null) => void;
  reducedMotion: boolean;
  /** fala no acerto de um cartão (não o último) */
  rightLine: string;
  /** explicação própria de cada acerto (no lugar de rightLine, inclusive no último cartão) */
  explain?: (piece: MatchPiece) => string;
  /** fala quando todos estão no lugar */
  doneLine: string;
  /** chamado depois de uma pausa para ver o último cartão no lugar */
  onDone: () => void;
  /** faixa: contagem ("Ligue os serviços: 1 de 3") */
  countText: (placed: number, total: number) => string;
  doneText?: string;
  /** altura do monte e topo das caixas (% do palco) */
  poolY?: number;
  zoneTop?: number;
};

const WRONG_MS = 900;
const DONE_MS = 900;

/**
 * Associação: arrastar (ou tocar cartão → caixa, ou Enter) cada cartão do monte até a caixa certa. Caixa errada:
 * o cartão volta, a caixa fica vermelha e o Bonzi diz o que a CAIXA precisa, sem entregar a resposta.
 */
export function MatchBoard({
  zones,
  pieces,
  say,
  setHint,
  reducedMotion,
  rightLine,
  explain,
  doneLine,
  onDone,
  countText,
  doneText = "Tudo ligado!",
  poolY = 29,
  zoneTop = 44,
}: MatchBoardProps) {
  const timers = useTimers({ reducedMotion });
  const [placed, setPlaced] = useState<string[]>([]);
  const [wrongZone, setWrongZone] = useState<string | null>(null);
  const [picked, setPicked] = useState(false);
  const poolRef = useRef<HTMLDivElement>(null);
  const done = placed.length === pieces.length;
  const span = 92 / zones.length;
  const zoneWidth = span - 2.5;

  const refocus = () => {
    timers.after(
      0,
      () => {
        const active = document.activeElement;
        if (active && active !== document.body) return;
        poolRef.current?.querySelector<HTMLElement>("button")?.focus({ preventScroll: true });
      },
      { hold: true },
    );
  };

  const onSelect = (id: string | null) => {
    setPicked(id !== null);
    setHint(id ? "Agora toque na caixa certa (ou arraste o cartão até ela)." : null);
  };

  const onMove: DragMoveHandler = (itemId, zoneId) => {
    const piece = pieces.find((p) => p.id === itemId);
    const zone = zones.find((z) => z.id === zoneId);
    if (!piece || !zone || placed.includes(piece.id)) return false;
    if (piece.zone !== zone.id) {
      setWrongZone(zone.id);
      timers.after(WRONG_MS, () => setWrongZone((current) => (current === zone.id ? null : current)), { hold: true });
      say(`Ainda não. ${zone.need}`, "warning");
      setHint("Esse cartão não combina com essa caixa. Tente outra.");
      refocus();
      return false;
    }
    const next = [...placed, piece.id];
    setPlaced(next);
    setWrongZone(null);
    if (explain) say(explain(piece), "happy");
    if (next.length === pieces.length) {
      say(doneLine, "happy", explain ? { afterCurrent: true } : undefined);
      setHint(doneText);
      timers.after(DONE_MS, onDone, { hold: true });
    } else {
      if (!explain) say(rightLine, "happy");
      setHint(null);
      refocus();
    }
    return true;
  };

  let banner: { text: string; tone: KitTone; icon: ElementKey; key: string } = { text: countText(placed.length, pieces.length), tone: "info", icon: "plug", key: `count-${placed.length}` };
  if (done) banner = { text: doneText, tone: "success", icon: "ok", key: "done" };
  else if (wrongZone) banner = { text: "Tente outra caixa", tone: "danger", icon: "error", key: "wrong" };
  else if (picked) banner = { text: "Toque na caixa certa", tone: "warning", icon: "plug", key: "picked" };

  return (
    <DragProvider onMove={onMove} onSelect={onSelect} disabled={done}>
      <Banner key={banner.key} text={banner.text} tone={banner.tone} icon={banner.icon} reducedMotion={reducedMotion} />
      <Place x={50} y={poolY} width={96}>
        <div ref={poolRef} className={styles.pool} role="group" aria-label="Cartões">
          {pieces
            .filter((p) => !placed.includes(p.id))
            .map((p) => (
              <span key={p.id} className={cx(styles.poolSlot, !reducedMotion && !picked && styles.cue)}>
                <DragPiece id={p.id} label={p.label} element={p.element} size={4.2} className={cx(styles.matchPiece, p.mono && styles.pieceMono)} />
              </span>
            ))}
        </div>
      </Place>
      {zones.map((zone, index) => {
        const inside = pieces.find((p) => p.zone === zone.id && placed.includes(p.id));
        return (
          <Place key={zone.id} x={4 + span * (index + 0.5)} y={zoneTop} anchor="top" width={zoneWidth}>
            <DropZone
              id={zone.id}
              label={zone.name}
              hideLabel
              layout="stack"
              status={inside ? "correct" : wrongZone === zone.id ? "wrong" : null}
              className={styles.matchZone}
            >
              <span className={styles.zoneHead}>
                {zone.icon && <img src={ELEMENTS[zone.icon]} alt="" draggable={false} />}
                {zone.name}
              </span>
              {inside ? (
                <DragPiece id={inside.id} label={inside.label} element={inside.element} size={4.2} status="correct" disabled className={cx(styles.matchPiece, inside.mono && styles.pieceMono)} />
              ) : (
                <span className={styles.zoneHint}>Solte aqui</span>
              )}
            </DropZone>
          </Place>
        );
      })}
    </DragProvider>
  );
}
