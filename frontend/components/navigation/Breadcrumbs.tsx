import Link from "next/link";
import { SPRITES } from "@/config/assets";
import { Sprite } from "@/components/ui/Sprite";
import { cx } from "@/components/ui/cx";
import styles from "./Breadcrumbs.module.css";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export type BreadcrumbsProps = {
  items: BreadcrumbItem[];
  /**
   * Celular (até 560 px), onde a trilha inteira ocupava várias linhas: "back" mostra só "Voltar para <nível de cima>";
   * "hide" esconde a trilha (a tela já tem o próprio botão de voltar, como as aulas e os laboratórios).
   */
  compact?: "back" | "hide";
};

export function Breadcrumbs({ items, compact = "back" }: BreadcrumbsProps) {
  if (items.length === 0) return null;
  const parent = compact === "back" ? items.slice(0, -1).reverse().find((item) => item.href) : undefined;

  return (
    <nav aria-label="Trilha" className={cx(styles.breadcrumbs, compact === "hide" && styles.hideCompact)}>
      {parent?.href && (
        <Link href={parent.href} className={styles.back}>
          <Sprite src={SPRITES.ui.back} alt="" decorative size={18} />
          <span>Voltar para {parent.label}</span>
        </Link>
      )}
      <ol className={cx(styles.list, parent && styles.full)}>
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className={styles.item}>
              {index > 0 && (
                <span className={styles.separator} aria-hidden="true">
                  <Sprite src={SPRITES.ui.separator} alt="" decorative size={14} />
                </span>
              )}
              {item.href && !last ? (
                <Link href={item.href} className={styles.link}>
                  {item.label}
                </Link>
              ) : (
                <span className={styles.current} aria-current={last ? "page" : undefined}>
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default Breadcrumbs;
