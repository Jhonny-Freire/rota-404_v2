"use client";

import { SPRITES } from "@/config/assets";
import { BLOCK_TAGS, Block, BrowserFrame, PagePreview, Place, SceneCanvas, StageBanner, type BlockState } from "@/components/learning/kit";
import { cx } from "@/components/ui/cx";
import type { FixAction } from "./FixPanel";
import {
  KIND_NAMES,
  contentOf,
  missingSlotId,
  type BannerSpec,
  type Layout,
  type PageKind,
  type Phase,
  type Slot,
  type Theme,
} from "./model";
import styles from "./ConserteAPagina.module.css";

export type FixSceneProps = {
  theme: Theme;
  layout: Layout;
  /** blocos que faltam na página (espaço tracejado) */
  missing: PageKind[];
  phase: Phase;
  selected: string | null;
  /** pontos do problema destacados (página e estrutura) */
  marked: string[];
  /** bloco certo que o aluno tocou agora */
  okSlot: string | null;
  /** muda a cada "Testar": a página é renderizada de novo */
  renderKey: number;
  banner: BannerSpec;
  bannerKey: number;
  reducedMotion: boolean;
  onPagePick: (id: string) => void;
  /** tocar no bloco da Estrutura (marca o bloco) */
  onRowPick: (id: string) => void;
  /** mexer num bloco da Estrutura, direto pelo botão do próprio bloco */
  onAct: (action: FixAction, id: string) => void;
};

/** Botão pequeno de um bloco da Estrutura (seta, remover...). */
function RowButton({ label, sprite, text, onClick, disabled, rotate }: { label: string; sprite?: string; text?: string; onClick: () => void; disabled?: boolean; rotate?: boolean }) {
  return (
    <button type="button" className={cx(styles.rowAction, text && styles.rowActionText)} onClick={onClick} disabled={disabled} aria-label={label} title={label}>
      {sprite && <img src={sprite} alt="" draggable={false} className={cx(rotate && styles.rotated)} />}
      {text && <span>{text}</span>}
    </button>
  );
}

function rowLabel(slot: Slot): string {
  return slot.floating ? `${KIND_NAMES[slot.kind]} (solta)` : KIND_NAMES[slot.kind];
}

/** Palco do lab3-4.md: a página quebrada à esquerda e, ao lado, a estrutura em blocos. */
export function FixScene({
  theme,
  layout,
  missing,
  phase,
  selected,
  marked,
  okSlot,
  renderKey,
  banner,
  bannerKey,
  reducedMotion,
  onPagePick,
  onRowPick,
  onAct,
}: FixSceneProps) {
  const done = phase === "done";
  const flow = layout.page.filter((s) => !s.floating);
  const loose = layout.page.filter((s) => s.floating);
  const canPick = phase === "observe" || phase === "find" || phase === "fix";
  const rowsOpen = canPick;
  const flowIds = flow.map((s) => s.id);

  const stateOf = (id: string): BlockState | undefined => {
    if (okSlot === id) return "correct";
    if (selected === id) return "selected";
    if (marked.includes(id)) return "highlighted";
    return undefined;
  };

  const block = (slot: Slot) => (
    <Block
      key={slot.id}
      kind={slot.kind}
      text={contentOf(theme, slot.kind)}
      imageElement={theme.image}
      misplaced={slot.floating}
      state={stateOf(slot.id)}
      onClick={canPick ? () => onPagePick(slot.id) : undefined}
      ariaLabel={slot.kind === "image" ? `Imagem: ${theme.imageName}${slot.floating ? ", solta" : ""}` : `${KIND_NAMES[slot.kind]}: ${contentOf(theme, slot.kind)}`}
      className={cx(slot.kind === "button" && styles.buttonRow, slot.floating && styles.loose)}
    />
  );

  return (
    <SceneCanvas className={styles.canvas} label="Laboratório: conserte a página">
      <StageBanner key={bannerKey} text={banner.text} tone={banner.tone} icon={banner.icon} reducedMotion={reducedMotion} y={10.5} />

      <Place x={3} y={19} anchor="top-left" width={47} z={3}>
        <div className={cx(styles.colFit, styles.pageFit)}>
          <div className={cx(styles.window, done && styles.windowDone)}>
            <BrowserFrame url={theme.url} tabTitle={theme.title} minHeight={16} className={styles.browser} loading={phase === "testing"}>
              <div key={renderKey} className={cx(styles.render, renderKey > 0 && !reducedMotion && styles.rerender)}>
                <PagePreview label={done ? `Página ${theme.url} consertada` : `Página ${theme.url}`} className={styles.page}>
                  {flow.map(block)}
                  {missing.map((kind) => (
                    <Block
                      key={missingSlotId(kind)}
                      kind={kind}
                      missing
                      state={stateOf(missingSlotId(kind))}
                      onClick={canPick ? () => onPagePick(missingSlotId(kind)) : undefined}
                      ariaLabel={`Espaço vazio: falta ${KIND_NAMES[kind].toLowerCase()}`}
                    />
                  ))}
                  {loose.map(block)}
                </PagePreview>
              </div>
            </BrowserFrame>
          </div>
        </div>
      </Place>

      <Place x={54} y={19} anchor="top-left" width={43} z={3}>
        <div className={cx(styles.colFit, styles.treeFit)}>
          <section className={styles.tree} aria-label="Estrutura da página em blocos">
            <h3 className={styles.colTitle}>Estrutura</h3>
            <ol className={styles.rows}>
              {layout.page.map((slot) => {
                const at = flowIds.indexOf(slot.id);
                const name = rowLabel(slot);
                return (
                  <li
                    key={slot.id}
                    className={cx(
                      styles.row,
                      slot.floating && styles.rowLoose,
                      marked.includes(slot.id) && styles.rowMarked,
                      selected === slot.id && styles.rowSelected,
                      done && styles.rowDone,
                    )}
                    onClick={rowsOpen ? () => onRowPick(slot.id) : undefined}
                    aria-label={`${name}${marked.includes(slot.id) ? ", marcado" : ""}`}
                  >
                    <span className={styles.rowName}>{name}</span>
                    <span className={styles.rowTag}>{BLOCK_TAGS[slot.kind]}</span>
                    {rowsOpen && (
                      <span className={styles.rowActions}>
                        {slot.floating ? (
                          <RowButton label={`Encaixar ${KIND_NAMES[slot.kind]}`} text="Encaixar" onClick={() => onAct("snap", slot.id)} />
                        ) : (
                          <>
                            <RowButton label={`Subir ${name}`} sprite={SPRITES.ui.back} rotate onClick={() => onAct("up", slot.id)} disabled={at <= 0} />
                            <RowButton label={`Descer ${name}`} sprite={SPRITES.ui.next} rotate onClick={() => onAct("down", slot.id)} disabled={at < 0 || at >= flowIds.length - 1} />
                            <RowButton label={`Remover ${name}`} sprite={SPRITES.ui.close} onClick={() => onAct("remove", slot.id)} />
                          </>
                        )}
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
            {layout.outside.length > 0 && (
              <>
                <h4 className={styles.subTitle}>Fora da página</h4>
                <ul className={styles.rows}>
                  {layout.outside.map((slot) => (
                    <li
                      key={slot.id}
                      className={cx(styles.row, styles.rowOutside, marked.includes(slot.id) && styles.rowMarked, selected === slot.id && styles.rowSelected)}
                      onClick={rowsOpen ? () => onRowPick(slot.id) : undefined}
                      aria-label={`${KIND_NAMES[slot.kind]}, fora da página${marked.includes(slot.id) ? ", marcado" : ""}`}
                    >
                      <span className={styles.rowName}>{KIND_NAMES[slot.kind]}</span>
                      <span className={styles.rowTag}>{BLOCK_TAGS[slot.kind]}</span>
                      {rowsOpen && (
                        <span className={styles.rowActions}>
                          <RowButton label={`Colocar ${KIND_NAMES[slot.kind]} na página`} text="Colocar" onClick={() => onAct("place", slot.id)} />
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        </div>
      </Place>
    </SceneCanvas>
  );
}
