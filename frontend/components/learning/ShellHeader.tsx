import { Fragment, type ReactNode } from "react";
import { SPRITES } from "@/config/assets";
import { Sprite } from "@/components/ui/Sprite";
import { SpriteButton } from "@/components/ui/SpriteButton";
import { cx } from "@/components/ui/cx";
import styles from "./ShellHeader.module.css";

export type ShellHeaderProps = {
  kind: "lesson" | "lab";
  title: string;
  /** viram parte da etiqueta acima do título (ex.: "Planeta 1.3") */
  tags?: string[];
  preview?: boolean;
  /** painel à direita do título (ex.: HUD de pontos do laboratório) */
  aside?: ReactNode;
  /** botão "Voltar", no fim do lado direito, com a mesma altura do painel */
  back?: { href: string; label: string };
};

const KIND_LABELS = { lesson: "Aula", lab: "Laboratório" } as const;

/**
 * Cabeçalho das aulas e laboratórios, no mesmo desenho da página do sistema:
 * etiqueta pequena ("LABORATÓRIO · PLANETA 1.3") em cima do título à esquerda; HUD e "Voltar" à direita.
 */
export function ShellHeader({ kind, title, tags = [], preview = false, aside, back }: ShellHeaderProps) {
  return (
    <header className={cx(styles.header, styles[kind])}>
      <div className={styles.intro}>
        <p className={styles.eyebrow}>
          <Sprite
            src={kind === "lesson" ? SPRITES.space.tagLesson : SPRITES.space.tagLab}
            alt=""
            decorative
            size={20}
            className={styles.kindIcon}
          />
          <span className={styles.kindLabel}>{KIND_LABELS[kind]}</span>
          {tags.map((tag, i) => (
            <Fragment key={`${i}-${tag}`}>
              {" "}
              <span className={styles.dot} aria-hidden="true" />{" "}
              <span>{tag}</span>
            </Fragment>
          ))}
          {preview && (
            <>
              {" "}
              <span className={styles.preview}>Prévia</span>
            </>
          )}
        </p>
        <h1 className={styles.title}>{title}</h1>
      </div>

      {(aside || back) && (
        <div className={styles.aside}>
          {aside}
          {back && (
            <SpriteButton sprite={SPRITES.ui.map} label={back.label} href={back.href} size={20} className={styles.back} />
          )}
        </div>
      )}
    </header>
  );
}

export default ShellHeader;
