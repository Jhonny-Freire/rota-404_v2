"use client";

import { useEffect, useRef, useState } from "react";
import { ELEMENTS } from "@/config/assets";
import {
  DragPiece,
  DragProvider,
  DropZone,
  Place,
  SceneSprite,
  useTimers,
  type DragMoveHandler,
  type ElementKey,
  type KitTone,
} from "@/components/learning/kit";
import { cx } from "@/components/ui/cx";
import { CONCEPTS, CONCEPT_ORDER, LINES, SORT_BANNER, SORT_GUIDE, SORT_HINTS, type ConceptId, type SceneProps } from "./concepts";
import { Banner, TONE } from "./parts";
import styles from "./IpDominioESite.module.css";

/** ordem dos cartões no monte (diferente da ordem das caixas) */
const POOL_ORDER: readonly ConceptId[] = ["page", "ip", "domain"];
const BOX_X: Record<ConceptId, number> = { ip: 18, domain: 50, page: 82 };
/** o topo (até ~13%) é da faixa de instrução: o monte fica logo abaixo dela e as caixas embaixo do monte */
const POOL_Y = 30;
const BOX_TOP = 45;
const WRONG_MS = 900;
/** quanto tempo a faixa lembra "Escolha um cartão" depois de um toque numa caixa sem cartão escolhido */
const NUDGE_MS = 1400;
/** pausa para ver o último cartão na caixa (e o "ok") antes de liberar "Concluir" */
const DONE_MS = 900;
const TOTAL = CONCEPT_ORDER.length;

const pieceId = (id: ConceptId) => `card-${id}`;
const boxId = (id: ConceptId) => `box-${id}`;
const conceptOf = (value: string, prefix: string): ConceptId | null => {
  const id = value.startsWith(prefix) ? value.slice(prefix.length) : "";
  return CONCEPT_ORDER.find((c) => c === id) ?? null;
};

type BannerSpec = { text: string; tone: KitTone; icon: ElementKey; key: string };

function CardFace({ id }: { id: ConceptId }) {
  const concept = CONCEPTS[id];
  return <span className={cx(styles.face, concept.mono && styles.faceMono)}>{concept.value}</span>;
}

/** Cena 6 — classificação: arrastar (ou tocar cartão → caixa) cada cartão para IP / Domínio / Página. */
export function SceneSort({ say, setCanAdvance, setHint, reducedMotion }: SceneProps) {
  const timers = useTimers({ reducedMotion });
  const [placed, setPlaced] = useState<ConceptId[]>([]);
  const [wrongBox, setWrongBox] = useState<ConceptId | null>(null);
  /** há um cartão selecionado (toque/Enter): o próximo passo é tocar numa caixa */
  const [picked, setPicked] = useState(false);
  /** lembrete na faixa (toque numa caixa sem cartão escolhido): 0 = nenhum; senão, o número do lembrete */
  const [nudge, setNudge] = useState(0);
  const nudgeCount = useRef(0);
  const poolRef = useRef<HTMLDivElement>(null);
  /** instrução sem cartão selecionado (null = a de `meta.hints`) */
  const restHint = useRef<string | null>(null);
  const done = placed.length === TOTAL;

  useEffect(() => {
    say(LINES.sort, "thinking");
  }, [say]);

  /**
   * Cartão do monte selecionado (toque/Enter): a instrução pede a caixa; sem seleção (tocar de novo, Esc,
   * começar a arrastar, cartão colocado) volta ao progresso. O kit avisa a seleção por `onSelect`
   * (antes: MutationObserver no aria-pressed das peças, frágil a mudanças de markup do kit).
   */
  const onSelect = (id: string | null) => {
    setPicked(id !== null);
    if (id) setNudge(0);
    setHint(id ? SORT_GUIDE.picked : restHint.current);
  };

  /**
   * Toque numa caixa sem cartão escolhido: nenhum toque fica sem resposta. A faixa lembra o primeiro passo (e
   * "salta" de novo a cada toque); o Bonzi não fala, para toques repetidos não virarem uma rajada de falas.
   * Com cartão escolhido o toque é do kit (coloca o cartão): o clique só sobe até aqui depois disso.
   */
  const remindCard = () => {
    if (done || picked) return;
    nudgeCount.current += 1;
    const id = nudgeCount.current;
    setNudge(id);
    timers.after(NUDGE_MS, () => setNudge((current) => (current === id ? 0 : current)), { hold: true });
  };

  const showHint = (text: string) => {
    restHint.current = text;
    setHint(text);
  };

  /** devolve o foco ao monte quando a peça/zona focada some (teclado e leitor de tela) */
  const refocus = (card?: ConceptId) => {
    timers.after(
      0,
      () => {
        const pool = poolRef.current;
        const active = document.activeElement;
        if (!pool || (active && active !== document.body)) return;
        const target =
          (card && pool.querySelector<HTMLElement>(`[data-card="${card}"] button`)) || pool.querySelector<HTMLElement>("button");
        target?.focus({ preventScroll: true });
      },
      { hold: true },
    );
  };

  const onMove: DragMoveHandler = (itemId, zoneId) => {
    const card = conceptOf(itemId, "card-");
    const box = conceptOf(zoneId, "box-");
    if (!card || !box || placed.includes(card)) return false;
    setNudge(0);

    if (card !== box) {
      setWrongBox(box);
      timers.after(WRONG_MS, () => setWrongBox((current) => (current === box ? null : current)), { hold: true });
      say(`Ainda não. ${SORT_HINTS[box]}`, "warning");
      showHint(SORT_GUIDE.retry);
      refocus(card);
      return false;
    }

    const next = [...placed, card];
    setPlaced(next);
    setWrongBox(null);
    if (next.length === TOTAL) {
      say(LINES.sortDone, "happy");
      showHint(SORT_GUIDE.done);
      timers.after(DONE_MS, () => setCanAdvance(true), { hold: true });
    } else {
      say(LINES.sortRight, "happy");
      showHint(SORT_GUIDE.more(TOTAL - next.length));
      refocus();
    }
    return true;
  };

  let banner: BannerSpec = { text: SORT_BANNER.count(placed.length, TOTAL), tone: "info", icon: "box", key: "count" };
  if (done) banner = { text: SORT_BANNER.done, tone: "success", icon: "ok", key: "done" };
  else if (wrongBox) banner = { text: SORT_BANNER.wrong, tone: "danger", icon: "error", key: "wrong" };
  else if (picked) banner = { text: SORT_BANNER.picked, tone: "warning", icon: "box", key: "picked" };
  else if (nudge) banner = { text: SORT_BANNER.first, tone: "warning", icon: "box", key: `nudge-${nudge}` };

  return (
    <DragProvider onMove={onMove} onSelect={onSelect} disabled={done}>
      <Banner key={banner.key} text={banner.text} tone={banner.tone} icon={banner.icon} reducedMotion={reducedMotion} />

      <Place x={50} y={POOL_Y} width={96}>
        <div ref={poolRef} className={styles.pool} role="group" aria-label="Cartões">
          {/* os cartões do monte pulsam até irem para uma caixa; com um cartão selecionado (ele já balança pelo kit)
              o próximo passo é a caixa e o monte para. Por estado, e não por :has(), que Safari antigo de tablet ignora */}
          {POOL_ORDER.filter((id) => !placed.includes(id)).map((id) => (
            <span key={id} data-card={id} className={cx(styles.poolSlot, !reducedMotion && !picked && styles.cue)}>
              <DragPiece id={pieceId(id)} label={CONCEPTS[id].value} className={styles.piece}>
                <CardFace id={id} />
              </DragPiece>
            </span>
          ))}
          {done && (
            <span className={styles.enter}>
              <SceneSprite element="ok" size={6} alt="Tudo certo" />
            </span>
          )}
        </div>
      </Place>

      {CONCEPT_ORDER.map((id) => {
        const concept = CONCEPTS[id];
        const filled = placed.includes(id);
        return (
          <Place key={id} x={BOX_X[id]} y={BOX_TOP} anchor="top" width={29} className={styles.boxPlace}>
            {/* só recebe o clique que sobe da caixa (o cartão já colocado para a propagação) */}
            <div onClick={remindCard}>
              <DropZone
                id={boxId(id)}
                label={`Caixa ${concept.name}`}
                hideLabel
                layout="stack"
                status={filled ? "correct" : wrongBox === id ? "wrong" : null}
                className={cx(styles.box, TONE[id])}
              >
                <span className={styles.boxHead}>
                  <img src={ELEMENTS[concept.element]} alt="" draggable={false} className={styles.boxIcon} />
                  {concept.name}
                </span>
                {filled ? (
                  <DragPiece id={pieceId(id)} label={concept.value} status="correct" disabled className={styles.piece}>
                    <CardFace id={id} />
                  </DragPiece>
                ) : (
                  <span className={styles.boxHint}>Solte aqui</span>
                )}
              </DropZone>
            </div>
          </Place>
        );
      })}
    </DragProvider>
  );
}
