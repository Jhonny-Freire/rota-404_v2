import type { CSSProperties, ReactNode } from "react";
import { ELEMENTS, type ElementKey } from "@/config/assets";
import { cx, resolveSprite } from "./util";
import styles from "./PagePreview.module.css";

export type BlockKind = "title" | "text" | "image" | "button" | "input" | "link";

export type BlockState = "normal" | "highlighted" | "dimmed" | "selected" | "correct" | "wrong";

/** Etiqueta HTML de cada tipo de bloco (para a cena "HTML visual"). */
export const BLOCK_TAGS: Record<BlockKind, string> = {
  title: "<h1>",
  text: "<p>",
  image: "<img>",
  button: "<button>",
  input: "<input>",
  link: "<a>",
};

/** Nome em português de cada tipo de bloco. */
export const BLOCK_LABELS: Record<BlockKind, string> = {
  title: "Título",
  text: "Texto",
  image: "Imagem",
  button: "Botão",
  input: "Campo",
  link: "Link",
};

export type BlockProps = {
  kind: BlockKind;
  /** texto do título/parágrafo/botão/campo/link; sem texto o bloco vira um esboço (linhas CSS) */
  text?: string;
  /** mostra a etiqueta HTML (BLOCK_TAGS[kind] ou `tag`) */
  showTag?: boolean;
  /** etiqueta personalizada (ex.: "<h2>") */
  tag?: string;
  state?: BlockState;
  /** fora do lugar (inclinado e deslocado — página quebrada) */
  misplaced?: boolean;
  /** espaço vazio tracejado (bloco ausente) */
  missing?: boolean;
  /** sprite da imagem (padrão ELEMENTS.photo) */
  imageElement?: ElementKey;
  imageSrc?: string;
  /** torna o bloco clicável (toque/Enter) */
  onClick?: () => void;
  /** nome acessível (padrão: tipo + texto) */
  ariaLabel?: string;
  className?: string;
  style?: CSSProperties;
};

/** Bloco de página em CSS: título, texto, imagem, botão, campo, link. */
export function Block({
  kind,
  text,
  showTag = false,
  tag,
  state = "normal",
  misplaced = false,
  missing = false,
  imageElement = "photo",
  imageSrc,
  onClick,
  ariaLabel,
  className,
  style,
}: BlockProps) {
  const name = ariaLabel ?? `${BLOCK_LABELS[kind]}${text ? `: ${text}` : ""}`;
  const classes = cx(
    styles.block,
    styles[kind],
    state !== "normal" && styles[state],
    misplaced && styles.misplaced,
    missing && styles.missing,
    onClick && styles.clickable,
    className,
  );

  const body = missing ? (
    <span className={styles.missingText}>?</span>
  ) : (
    <>
      {kind === "title" && <span className={styles.titleText}>{text ?? <span className={styles.sketchWide} />}</span>}
      {kind === "text" &&
        (text ? (
          <span className={styles.paragraph}>{text}</span>
        ) : (
          <span className={styles.lines}>
            <span />
            <span />
            <span />
          </span>
        ))}
      {kind === "image" && (
        <span className={styles.picture}>
          <img src={resolveSprite(imageElement, imageSrc)} alt="" draggable={false} />
        </span>
      )}
      {kind === "button" && <span className={styles.buttonFace}>{text ?? "Botão"}</span>}
      {kind === "input" && <span className={styles.inputFace}>{text ?? ""}</span>}
      {kind === "link" && <span className={styles.linkText}>{text ?? "link"}</span>}
    </>
  );

  const content = (
    <>
      {body}
      {showTag && <span className={styles.tag}>{tag ?? BLOCK_TAGS[kind]}</span>}
      {(state === "correct" || state === "wrong") && (
        <img src={state === "correct" ? ELEMENTS.ok : ELEMENTS.error} alt="" draggable={false} className={styles.mark} />
      )}
    </>
  );

  if (onClick) {
    return (
      <button type="button" className={classes} style={style} onClick={onClick} aria-label={name}>
        {content}
      </button>
    );
  }

  return (
    <div className={classes} style={style} role="img" aria-label={name}>
      {content}
    </div>
  );
}

export type PagePreviewProps = {
  /** blocos (<Block>) na ordem da página */
  children?: ReactNode;
  /** nome acessível da página */
  label?: string;
  /** espaçamento menor entre blocos */
  dense?: boolean;
  /** fundo claro (padrão) ou escuro */
  theme?: "light" | "dark";
  className?: string;
  style?: CSSProperties;
};

/** Página simples feita de blocos CSS (use dentro de <BrowserFrame> ou sozinha). */
export function PagePreview({ children, label = "Prévia da página", dense = false, theme = "light", className, style }: PagePreviewProps) {
  return (
    <div className={cx(styles.page, dense && styles.dense, theme === "dark" && styles.dark, className)} style={style} role="group" aria-label={label}>
      {children}
    </div>
  );
}

export default PagePreview;
