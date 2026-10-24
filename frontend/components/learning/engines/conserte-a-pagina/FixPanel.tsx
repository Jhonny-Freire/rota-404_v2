"use client";

import { SPRITES } from "@/config/assets";
import { ActionButton } from "@/components/learning/kit";
import { KIND_NAMES, type Layout, type Phase } from "./model";
import styles from "./ConserteAPagina.module.css";

export type FixAction = "up" | "down" | "remove" | "snap" | "place";

export type FixPanelProps = {
  layout: Layout;
  phase: Phase;
  selected: string | null;
  /** a estrutura mudou desde o último teste */
  dirty: boolean;
  onAction: (action: FixAction, id: string) => void;
  onTest: () => void;
};

/**
 * Área de interação: a instrução curta e "Testar". Os botões de mexer ficam no próprio bloco da Estrutura
 * (revisão de UX da 3.4: o fluxo marcar-bloco + painel travado era pouco intuitivo). No celular a Estrutura é
 * encolhida e os botões do bloco ficam pequenos demais para o dedo: lá aparecem também botões grandes para o bloco
 * tocado (sempre liberados).
 */
export function FixPanel({ layout, phase, selected, dirty, onAction, onTest }: FixPanelProps) {
  const open = phase === "observe" || phase === "find" || phase === "fix";
  const onPage = layout.page.find((s) => s.id === selected) ?? null;
  const outside = layout.outside.find((s) => s.id === selected) ?? null;
  const slot = onPage ?? outside;
  const flow = layout.page.filter((s) => !s.floating);
  const at = onPage && !onPage.floating ? flow.findIndex((s) => s.id === selected) : -1;
  const lock = !open || !slot;
  const run = (action: FixAction) => slot && onAction(action, slot.id);

  return (
    <div className={styles.panel}>
      <p className={styles.selection} aria-live="polite">
        {phase === "done"
          ? "Página consertada!"
          : "Use os botões de cada bloco da Estrutura (subir, descer, remover, encaixar ou colocar) e depois toque em Testar."}
      </p>
      {open && (
        <div className={styles.phoneActions} role="group" aria-label="Mexer no bloco tocado">
          <p className={styles.phoneSelection}>
            {slot ? (
              <>
                Bloco: <strong>{KIND_NAMES[slot.kind]}</strong>
                {onPage?.floating ? " (solto)" : outside ? " (fora da página)" : ""}
              </>
            ) : (
              "Toque num bloco da Estrutura para mexer nele."
            )}
          </p>
          <button type="button" className={styles.action} onClick={() => run("up")} disabled={lock || at <= 0}>
            <img src={SPRITES.ui.back} alt="" draggable={false} className={styles.rotated} />
            Subir
          </button>
          <button type="button" className={styles.action} onClick={() => run("down")} disabled={lock || at < 0 || at >= flow.length - 1}>
            <img src={SPRITES.ui.next} alt="" draggable={false} className={styles.rotated} />
            Descer
          </button>
          {onPage?.floating ? (
            <button type="button" className={styles.action} onClick={() => run("snap")} disabled={lock}>
              Encaixar
            </button>
          ) : outside ? (
            <button type="button" className={styles.action} onClick={() => run("place")} disabled={lock}>
              Colocar na página
            </button>
          ) : (
            <button type="button" className={styles.action} onClick={() => run("remove")} disabled={lock || !onPage}>
              Remover
            </button>
          )}
        </div>
      )}
      <div className={styles.testRow}>
        <ActionButton
          label="Testar"
          element="webpage"
          onClick={onTest}
          disabled={!open}
          variant={dirty && open ? "primary" : "default"}
          attention={dirty && open}
        />
      </div>
    </div>
  );
}
