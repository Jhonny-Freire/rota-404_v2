"use client";

import { ELEMENTS, SPRITES } from "@/config/assets";
import { FlowChain, Tag } from "@/components/learning/kit";
import { cx } from "@/components/ui/cx";
import { NODES, edgeEnds, isWireless, type EdgeKey, type NodeId } from "./network";
import styles from "./ConectandoUmaRede.module.css";

type LinkListProps = {
  edges: EdgeKey[];
  /** ligação destacada como primeiro ponto incorreto */
  faultEdge?: EdgeKey | null;
  onRemove: (key: EdgeKey) => void;
  disabled?: boolean;
};

/** Ligações feitas, cada uma removível (alternativa acessível aos X do palco). */
export function LinkList({ edges, faultEdge, onRemove, disabled = false }: LinkListProps) {
  return (
    <section className={styles.block} aria-label="Ligações feitas">
      <h3 className={styles.blockTitle}>Ligações feitas</h3>
      {edges.length === 0 ? (
        <p className={styles.empty}>Nenhuma ligação ainda.</p>
      ) : (
        <ul className={styles.linkList}>
          {edges.map((key) => {
            const [a, b] = edgeEnds(key);
            const nameA = NODES[a].label;
            const nameB = NODES[b].label;
            return (
              <li key={key}>
                <button
                  type="button"
                  className={cx(styles.linkItem, faultEdge === key && styles.linkFault)}
                  onClick={() => onRemove(key)}
                  disabled={disabled}
                  aria-label={`Remover ligação entre ${nameA} e ${nameB}${faultEdge === key ? " (ponto destacado)" : ""}`}
                  title={`${nameA} e ${nameB}`}
                >
                  <img src={ELEMENTS[NODES[a].element]} alt="" draggable={false} className={styles.linkSprite} />
                  <span className={cx(styles.linkCable, isWireless(key) && styles.linkWireless)} aria-hidden="true" />
                  <img src={ELEMENTS[NODES[b].element]} alt="" draggable={false} className={styles.linkSprite} />
                  <img src={SPRITES.ui.close} alt="" draggable={false} className={styles.linkRemove} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/** Conclusão: "Conexão funcionando" e o caminho percorrido por cada pacote. */
export function SuccessRoutes({ routes, reached }: { routes: NodeId[][]; reached: number[] }) {
  return (
    <section className={styles.block} aria-label="Conexão funcionando">
      <Tag tone="success" size="lg" icon="ok" className={styles.successTag}>
        Conexão funcionando
      </Tag>
      {routes.map((route, index) => (
        <FlowChain
          key={route.join("-")}
          items={route.map((id) => ({ id, label: NODES[id].label, element: NODES[id].element }))}
          reached={reached[index] ?? 0}
          current={reached[index] ?? 0}
          size={4}
          wrap
          className={styles.route}
          ariaLabel={`Caminho do pacote: ${route.map((id) => NODES[id].label).join(", ")}`}
        />
      ))}
    </section>
  );
}
