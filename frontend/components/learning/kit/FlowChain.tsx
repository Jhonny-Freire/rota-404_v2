import { Fragment, type ReactNode } from "react";
import { ELEMENTS, SPRITES, type ElementKey } from "@/config/assets";
import { cssVars, cx, resolveSprite } from "./util";
import styles from "./FlowChain.module.css";

export type FlowItem = {
  id: string;
  /** texto do item (sempre visível) */
  label: string;
  element?: ElementKey;
  src?: string;
  /** lacuna: mostra um espaço tracejado com "?" no lugar do item */
  missing?: boolean;
  /** conteúdo próprio no lugar do sprite (ex.: <Tag>) */
  content?: ReactNode;
};

export type FlowChainProps = {
  items: FlowItem[];
  /** índice do item em destaque (amarelo) */
  current?: number;
  /** itens até este índice ficam acesos; os demais apagados (omitido = todos acesos) */
  reached?: number;
  /** setas ocultas: índice i = seta entre o item i e o i+1 */
  hiddenArrows?: number[];
  /** torna cada item um botão */
  onItemClick?: (index: number, item: FlowItem) => void;
  /** largura dos sprites em unidades do kit. Padrão 7 */
  size?: number;
  /** quebra em várias linhas se faltar espaço */
  wrap?: boolean;
  ariaLabel?: string;
  className?: string;
};

/** Cadeia horizontal "A → B → C" com setas-SPRITE e destaque do item atual. */
export function FlowChain({
  items,
  current,
  reached,
  hiddenArrows = [],
  onItemClick,
  size = 7,
  wrap = false,
  ariaLabel,
  className,
}: FlowChainProps) {
  return (
    <ol
      className={cx(styles.chain, wrap && styles.wrap, className)}
      style={cssVars({ "--s": size })}
      aria-label={ariaLabel ?? items.map((item) => (item.missing ? "?" : item.label)).join(", ")}
    >
      {items.map((item, index) => {
        const lit = reached === undefined || index <= reached;
        const arrowLit = reached === undefined || index < reached;
        const isCurrent = current === index;
        const body = (
          <>
            <span className={styles.art}>
              {item.missing ? (
                <img src={ELEMENTS.question} alt="" draggable={false} className={styles.img} />
              ) : (
                (item.content ??
                ((item.element || item.src) && (
                  <img src={resolveSprite(item.element, item.src)} alt="" draggable={false} className={styles.img} />
                )))
              )}
            </span>
            <span className={styles.label}>{item.missing ? "?" : item.label}</span>
          </>
        );
        return (
          <Fragment key={item.id}>
            <li
              className={cx(styles.item, !lit && styles.unlit, isCurrent && styles.current, item.missing && styles.missing)}
              aria-current={isCurrent ? "step" : undefined}
            >
              {onItemClick ? (
                <button
                  type="button"
                  className={styles.button}
                  onClick={() => onItemClick(index, item)}
                  aria-label={item.missing ? "Item que falta" : item.label}
                >
                  {body}
                </button>
              ) : (
                <span className={styles.static}>{body}</span>
              )}
            </li>
            {index < items.length - 1 && (
              <li className={cx(styles.arrow, !arrowLit && styles.unlit, hiddenArrows.includes(index) && styles.gap)} aria-hidden="true">
                {!hiddenArrows.includes(index) && <img src={SPRITES.ui.next} alt="" draggable={false} />}
              </li>
            )}
          </Fragment>
        );
      })}
    </ol>
  );
}

export default FlowChain;
