"use client";

import { BACKGROUNDS } from "@/config/assets";
import {
  BLOCK_LABELS,
  Block,
  BrowserFrame,
  PagePreview,
  Place,
  StageBanner,
  type BlockState,
  type ElementKey,
  type KitTone,
} from "@/components/learning/kit";
import { cx } from "@/components/ui/cx";
import { contentOf, type PageKind, type SiteContent } from "./model";
import styles from "./HtmlOsBlocosDeUmaPagina.module.css";

export function Starfield() {
  return <div className={styles.starfield} style={{ backgroundImage: `url(${BACKGROUNDS.starfieldFar})` }} aria-hidden="true" />;
}

export function Live({ text }: { text: string }) {
  return (
    <p className="sr-only" role="status" aria-live="polite">
      {text}
    </p>
  );
}

/** Faixa curta no alto do palco. live={false}: a cena já anuncia pelo <Live> e pelo Bonzi. */
export function Banner({ text, tone = "info", icon, reducedMotion }: { text: string; tone?: KitTone; icon?: ElementKey; reducedMotion: boolean }) {
  return <StageBanner text={text} tone={tone} icon={icon} reducedMotion={reducedMotion} y={9} live={false} />;
}

/** "full": bloco na página; "in": entra agora (pop); "empty": espaço vazio tracejado (o bloco saiu). */
export type SlotState = "full" | "in" | "empty";

export type PageWindowProps = {
  site: SiteContent;
  order: readonly PageKind[];
  /** ausente = "full" */
  slots?: Partial<Record<PageKind, SlotState>>;
  /** blocos que mostram a etiqueta HTML */
  tagged?: readonly PageKind[];
  states?: Partial<Record<PageKind, BlockState>>;
  /** torna os blocos tocáveis (microteste) */
  onPick?: (kind: PageKind) => void;
  /** posição e largura do navegador no palco */
  x?: number;
  y?: number;
  width?: number;
  /** ao lado da bandeja (cenas 2 a 4): no celular encolhe mais */
  split?: boolean;
  label?: string;
};

/** Navegador com a página feita de blocos (Block do kit). */
export function PageWindow({ site, order, slots = {}, tagged = [], states = {}, onPick, x = 50, y = 15, width = 46, split = false, label }: PageWindowProps) {
  return (
    <Place x={x} y={y} anchor="top" width={width} z={3}>
      <div className={cx(styles.windowFit, split && styles.windowSplit)}>
        <BrowserFrame url={site.url} tabTitle={site.title} className={styles.browser}>
          <PagePreview label={label ?? `Página ${site.url}`} className={styles.page}>
            {order.map((kind) => {
              const slot = slots[kind] ?? "full";
              if (slot === "empty") {
                return <Block key={kind} kind={kind} missing ariaLabel={`Espaço vazio do bloco ${BLOCK_LABELS[kind].toLowerCase()}`} />;
              }
              return (
                <Block
                  key={kind}
                  kind={kind}
                  text={contentOf(site, kind)}
                  imageElement={site.image}
                  showTag={tagged.includes(kind)}
                  state={states[kind]}
                  onClick={onPick ? () => onPick(kind) : undefined}
                  ariaLabel={kind === "image" ? `Bloco: imagem (${site.imageAlt})` : `Bloco: ${contentOf(site, kind)}`}
                  className={cx(slot === "in" && styles.blockIn, kind === "button" && styles.buttonRow)}
                />
              );
            })}
          </PagePreview>
        </BrowserFrame>
      </div>
    </Place>
  );
}

/** "hidden": ainda na página; "in": acabou de sair dela (entra voando); "shown": na bandeja; "placed": voltou à página. */
export type PieceState = "hidden" | "in" | "shown" | "placed";

export type TrayProps = {
  site: SiteContent;
  order: readonly PageKind[];
  pieces: Partial<Record<PageKind, PieceState>>;
  tagged?: readonly PageKind[];
  /** etiqueta que acabou de aparecer (destaque) */
  current?: PageKind | null;
};

/** Bandeja à direita: os blocos separados da página, cada um com o nome (e, depois, a etiqueta HTML). */
export function Tray({ site, order, pieces, tagged = [], current = null }: TrayProps) {
  return (
    <Place x={75} y={15} anchor="top" width={44} z={4}>
      <div className={styles.trayFit}>
        <ul className={styles.tray} aria-label="Blocos da página">
          {order.map((kind) => {
            const state = pieces[kind] ?? "hidden";
            const hidden = state === "hidden" || state === "placed";
            return (
              <li
                key={kind}
                className={cx(styles.piece, state === "in" && styles.flyIn, state === "placed" && styles.placed, state === "hidden" && styles.ghost)}
                aria-hidden={hidden || undefined}
              >
                <span className={styles.pieceLabel}>{BLOCK_LABELS[kind]}</span>
                <div className={cx(styles.pieceCard, current === kind && styles.pieceCurrent)}>
                  <Block
                    kind={kind}
                    text={contentOf(site, kind)}
                    imageElement={site.image}
                    showTag={tagged.includes(kind)}
                    ariaLabel={`${BLOCK_LABELS[kind]}${tagged.includes(kind) ? `, etiqueta ${tagLabel(kind)}` : ""}`}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </Place>
  );
}

const TAG_NAMES: Record<PageKind, string> = { title: "h1", text: "p", image: "img", button: "button" };

/** nome falado da etiqueta (leitor de tela) */
export function tagLabel(kind: PageKind): string {
  return TAG_NAMES[kind];
}
