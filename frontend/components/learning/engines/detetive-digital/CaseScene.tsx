"use client";

import { ELEMENTS } from "@/config/assets";
import { DragPiece, DragProvider, DropZone, Place, SceneCanvas, StageBanner } from "@/components/learning/kit";
import { cx } from "@/components/ui/cx";
import { CATEGORIES, CATEGORY_NAME, type BannerSpec, type Case, type Category, type Phase, type Signal } from "./model";
import styles from "./DetetiveDigital.module.css";

export type CaseStatus = "open" | "right" | "review";

export type ResultData = { total: number; firstTry: number; signals: string[] };

export type CaseSceneProps = {
  phase: Phase;
  cases: Case[];
  status: Record<string, CaseStatus>;
  reviewing: boolean;
  current: Case | null;
  examined: string[];
  /** categoria recusada agora (fica vermelha) */
  rejected: Category | null;
  result: ResultData;
  banner: BannerSpec;
  bannerKey: number;
  reducedMotion: boolean;
  onPick: (id: string) => void;
  onExamine: (evidenceId: string) => void;
  onMove: (itemId: string, zoneId: string) => boolean;
};

const SIGNAL_ICON: Record<Signal, string> = { risk: ELEMENTS.error, ok: ELEMENTS.ok, doubt: ELEMENTS.question };
const SIGNAL_NAME: Record<Signal, string> = { risk: "sinal de alerta", ok: "tudo certo", doubt: "falta informação" };

/** Palco do lab4-3.md: quadro de casos, investigação (pistas + categorias), indícios e painel final. */
export function CaseScene(props: CaseSceneProps) {
  const { phase, banner, bannerKey, reducedMotion } = props;
  return (
    <SceneCanvas className={styles.canvas} label="Laboratório: detetive digital">
      <StageBanner key={bannerKey} text={banner.text} tone={banner.tone} icon={banner.icon} reducedMotion={reducedMotion} y={9} />
      {phase === "board" && <Board {...props} />}
      {(phase === "examine" || phase === "wrong" || phase === "reveal") && props.current && <Investigation {...props} current={props.current} />}
      {phase === "result" && <Result result={props.result} />}
    </SceneCanvas>
  );
}

function Board({ cases, status, reviewing, onPick }: CaseSceneProps) {
  return (
    <Place x={50} y={20} anchor="top" width={94} z={3}>
      <div className={styles.fit}>
        <ul className={styles.board} aria-label="Casos para investigar">
          {cases.map((c) => {
            const st = status[c.id] ?? "open";
            const locked = reviewing ? st !== "review" : st !== "open";
            return (
              <li key={c.id}>
                <button
                  type="button"
                  className={cx(styles.caseCard, st === "right" && styles.caseDone, st === "review" && styles.caseReview, !locked && styles.caseOpen)}
                  onClick={() => onPick(c.id)}
                  aria-disabled={locked || undefined}
                  aria-label={`${c.kind}: ${c.title}${st === "right" ? ", resolvido" : st === "review" ? ", para revisar" : ""}`}
                >
                  <img src={ELEMENTS[c.icon]} alt="" draggable={false} className={styles.caseIcon} />
                  <span className={styles.caseText}>
                    <span className={styles.caseKind}>{c.kind}</span>
                    <span className={styles.caseTitle}>{c.title}</span>
                  </span>
                  {st !== "open" && (
                    <span className={cx(styles.caseChip, st === "right" ? styles.chipDone : styles.chipReview)}>
                      <img src={st === "right" ? ELEMENTS.ok : ELEMENTS.magnifier} alt="" draggable={false} />
                      {st === "right" ? CATEGORY_NAME[c.category] : "Revisar"}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </Place>
  );
}

function Investigation({ phase, current, examined, reviewing, rejected, onExamine, onMove }: CaseSceneProps & { current: Case }) {
  const revealed = phase === "reveal";
  const evidence = (
    <Place x={3} y={19} anchor="top-left" width={52} z={3}>
      <div className={styles.fit}>
        <section className={cx(styles.casePanel, revealed && styles.casePanelDone)} aria-label={`${current.kind}: ${current.title}`}>
          <header className={styles.caseHead}>
            <img src={ELEMENTS[current.icon]} alt="" draggable={false} />
            <span>
              <span className={styles.caseKind}>{current.kind}</span>
              <span className={styles.caseTitle}>{current.title}</span>
            </span>
          </header>
          {revealed && <h3 className={styles.clueTitle}>Indícios</h3>}
          <ul className={styles.clues}>
            {current.evidence.map((ev) => {
              const seen = examined.includes(ev.id);
              const key = reviewing && !revealed && ev.id === current.key;
              return (
                <li key={ev.id}>
                  <button
                    type="button"
                    className={cx(styles.clue, seen && styles.clueSeen, key && styles.clueKey, revealed && styles[`clue-${ev.signal}`])}
                    onClick={() => onExamine(ev.id)}
                    aria-pressed={seen}
                    aria-label={`${ev.label}: ${ev.value}${revealed ? `, ${SIGNAL_NAME[ev.signal]}` : ""}${key ? ", pista marcada" : ""}`}
                  >
                    <span className={styles.clueLabel}>{ev.label}</span>
                    <span className={styles.clueValue}>{ev.value}</span>
                    {(revealed || seen) && (
                      <img src={revealed ? SIGNAL_ICON[ev.signal] : ELEMENTS.magnifier} alt="" draggable={false} className={styles.clueMark} />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </Place>
  );

  const zones = (
    <Place x={59} y={19} anchor="top-left" width={38} z={3}>
      <div className={styles.fit}>
        <div className={styles.sort}>
          {!revealed && (
            <div className={styles.pieceRow}>
              <DragPiece id={current.id} label={`Caso: ${current.title}`} className={styles.piece}>
                <span className={styles.pieceFace}>
                  <img src={ELEMENTS[current.icon]} alt="" draggable={false} />
                  <span>Este caso</span>
                </span>
              </DragPiece>
            </div>
          )}
          {CATEGORIES.map((cat) => (
            <DropZone
              key={cat.id}
              id={cat.id}
              label={cat.name}
              layout="wrap"
              status={revealed && cat.id === current.category ? "correct" : rejected === cat.id ? "wrong" : null}
              className={cx(styles.zone, styles[`zone-${cat.id}`])}
              emptyHint={<span className={styles.zoneInfo}>{cat.info}</span>}
            >
              {revealed && cat.id === current.category ? (
                <span className={styles.placed}>
                  <img src={ELEMENTS[current.icon]} alt="" draggable={false} />
                  Este caso
                </span>
              ) : null}
            </DropZone>
          ))}
        </div>
      </div>
    </Place>
  );

  return (
    <DragProvider onMove={onMove} disabled={phase !== "examine"}>
      {evidence}
      {zones}
    </DragProvider>
  );
}

function Result({ result }: { result: ResultData }) {
  return (
    <Place x={50} y={20} anchor="top" width={80} z={3}>
      <div className={styles.fit}>
        <section className={styles.result} aria-label="Painel do detetive">
          <h3 className={styles.resultTitle}>Painel do detetive</h3>
          <dl className={styles.stats}>
            <div>
              <dt>Situações analisadas</dt>
              <dd>{result.total}</dd>
            </div>
            <div>
              <dt>Classificações corretas de primeira</dt>
              <dd>
                {result.firstTry} de {result.total}
              </dd>
            </div>
          </dl>
          <h4 className={styles.signalsTitle}>Sinais de risco identificados</h4>
          <ul className={styles.signals}>
            {result.signals.map((signal) => (
              <li key={signal}>
                <img src={ELEMENTS.magnifier} alt="" draggable={false} />
                {signal}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Place>
  );
}
