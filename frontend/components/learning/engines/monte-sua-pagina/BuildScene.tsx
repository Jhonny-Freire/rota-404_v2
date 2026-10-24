"use client";

import type { KeyboardEventHandler, PointerEventHandler, Ref } from "react";
import {
  Block,
  BrowserFrame,
  DragPiece,
  DragProvider,
  DropZone,
  PagePreview,
  Place,
  SceneCanvas,
  StageBanner,
} from "@/components/learning/kit";
import { cx } from "@/components/ui/cx";
import { KIND_NAMES, codeLine, contentOf, type BannerSpec, type ImageOption, type PageColor, type PageKind, type Phase, type Plan } from "./model";
import styles from "./MonteSuaPagina.module.css";

export const EDIT_ZONE = "edicao";

export type BuildSceneProps = {
  plan: Plan;
  placed: PageKind[];
  phase: Phase;
  image: ImageOption;
  color: PageColor;
  /** linhas de código já mostradas (Etapa 5) */
  codeShown: number;
  /** bloco recusado agora (fica marcado) */
  rejected: PageKind | null;
  banner: BannerSpec;
  bannerKey: number;
  reducedMotion: boolean;
  onMove: (itemId: string, zoneId: string) => boolean;
  rootRef: Ref<HTMLDivElement>;
  onKeyDown: KeyboardEventHandler<HTMLDivElement>;
  onPointerDown: PointerEventHandler<HTMLDivElement>;
};

/** Ícone de cada bloco em CSS (título = barra grossa, texto = linhas, imagem = moldura, botão = botão). */
function KindIcon({ kind }: { kind: PageKind }) {
  return (
    <span className={cx(styles.kindIcon, styles[`icon-${kind}`])} aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}

/** Palco do lab3-3.md: blocos à esquerda, área de edição ao centro, prévia da página à direita. */
export function BuildScene({
  plan,
  placed,
  phase,
  image,
  color,
  codeShown,
  rejected,
  banner,
  bannerKey,
  reducedMotion,
  onMove,
  rootRef,
  onKeyDown,
  onPointerDown,
}: BuildSceneProps) {
  const { theme, palette } = plan;
  const building = phase === "build";
  const viewing = phase === "view" || phase === "done";

  return (
    <SceneCanvas className={styles.canvas} label="Laboratório: monte a sua página">
      <div ref={rootRef} className={styles.root} onKeyDown={onKeyDown} onPointerDown={onPointerDown}>
        <StageBanner key={bannerKey} text={banner.text} tone={banner.tone} icon={banner.icon} reducedMotion={reducedMotion} y={10.5} />

        <DragProvider onMove={onMove} disabled={!building}>
          {/* À esquerda: os blocos */}
          <Place x={2} y={19} anchor="top-left" width={17} z={3}>
            <div className={styles.colFit}>
              <section className={styles.palette} aria-label="Blocos">
                <h3 className={styles.colTitle}>Blocos</h3>
                {palette.map((kind) => {
                  const used = placed.includes(kind);
                  return (
                    <DragPiece
                      key={kind}
                      id={kind}
                      label={KIND_NAMES[kind]}
                      disabled={used || !building}
                      status={rejected === kind ? "wrong" : used ? "correct" : undefined}
                      className={cx(styles.blockPiece, used && styles.used)}
                    >
                      <span className={styles.pieceFace}>
                        <KindIcon kind={kind} />
                        <span className={styles.pieceName}>{KIND_NAMES[kind]}</span>
                      </span>
                    </DragPiece>
                  );
                })}
              </section>
            </div>
          </Place>

          {/* Ao centro: a área de edição (ou, no fim, o código HTML) */}
          <Place x={21} y={19} anchor="top-left" width={36} z={3}>
            <div className={styles.colFit}>
              {viewing && codeShown > 0 ? (
                <section className={styles.code} aria-label="Código HTML da sua página">
                  <h3 className={styles.colTitle}>Código HTML</h3>
                  <ol className={styles.codeList}>
                    {placed.slice(0, codeShown).map((kind) => (
                      <li key={kind} className={cx(styles.codeLine, styles[`code-${kind}`], !reducedMotion && styles.lineIn)}>
                        <code>{codeLine(kind, theme, image)}</code>
                      </li>
                    ))}
                  </ol>
                </section>
              ) : (
                <DropZone
                  id={EDIT_ZONE}
                  label="Área de edição"
                  layout="stack"
                  status={phase === "ready" || viewing ? "correct" : null}
                  emptyHint="Coloque o bloco aqui"
                  className={styles.editZone}
                >
                  {placed.map((kind) => (
                    <div key={kind} className={cx(styles.row, !reducedMotion && styles.rowIn)} role="img" aria-label={`Bloco ${KIND_NAMES[kind]}`}>
                      <KindIcon kind={kind} />
                      <span className={styles.rowName}>{KIND_NAMES[kind]}</span>
                    </div>
                  ))}
                </DropZone>
              )}
            </div>
          </Place>
        </DragProvider>

        {/* À direita: a prévia da página */}
        <Place x={60} y={19} anchor="top-left" width={38} z={3}>
          <div className={cx(styles.colFit, styles.previewFit)}>
            <section className={styles.preview} aria-label="Prévia da página">
              <h3 className={styles.colTitle}>{viewing ? "Sua página" : "Prévia"}</h3>
              <div className={cx(styles.previewFrame, viewing && !reducedMotion && styles.pageOpen)}>
                <BrowserFrame url={theme.url} tabTitle={viewing ? theme.title : undefined} minHeight={14} className={styles.browser}>
                  <PagePreview
                    label={viewing ? `Sua página ${theme.url}` : "Prévia da página em montagem"}
                    dense={!viewing}
                    className={cx(styles.page, styles[`color-${color.id}`])}
                  >
                    {placed.map((kind) => (
                      <Block
                        key={kind}
                        kind={kind}
                        text={viewing ? contentOf(theme, kind) : undefined}
                        imageElement={image.element}
                        ariaLabel={kind === "image" ? `Imagem: ${image.name}` : viewing ? `${KIND_NAMES[kind]}: ${contentOf(theme, kind)}` : `${KIND_NAMES[kind]} (esboço)`}
                        className={cx(kind === "button" && styles.buttonRow, !reducedMotion && styles.blockIn)}
                      />
                    ))}
                  </PagePreview>
                </BrowserFrame>
              </div>
            </section>
          </div>
        </Place>
      </div>
    </SceneCanvas>
  );
}
