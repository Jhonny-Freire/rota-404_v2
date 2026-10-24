"use client";

import { useState, type ReactNode } from "react";
import { ELEMENTS, type ElementKey } from "@/config/assets";
import { SpriteButton } from "@/components/ui/SpriteButton";
import { useTimers } from "./useSequence";
import { cssVars, cx, resolveSprite } from "./util";
import styles from "./ChoiceGrid.module.css";

export type Choice = {
  id: string;
  /** texto do cartão */
  label?: ReactNode;
  element?: ElementKey;
  src?: string;
  /** conteúdo livre no lugar do sprite (ex.: <Tag>, mini cena) */
  content?: ReactNode;
  /** nome acessível quando o label não é texto */
  ariaLabel?: string;
};

export type ChoiceResult = {
  correct: boolean;
  /** ids selecionados no momento da verificação */
  selected: string[];
  /** ids selecionados que estão errados */
  wrong: string[];
  /** quantos corretos ainda faltam marcar (modo multiple) */
  missing: number;
};

export type ChoiceGridProps = {
  choices: Choice[];
  /** single: verifica no toque · multiple: marca vários e confirma no botão. Padrão "single" */
  mode?: "single" | "multiple";
  /** ids corretos. Omitido = exploração livre (sem certo/errado, só onSelect) */
  correct?: string[];
  /** resultado de cada verificação (acerto trava o grade; erro libera nova tentativa sem revelar a resposta) */
  onResult?: (result: ChoiceResult) => void;
  /** cada toque em um cartão */
  onSelect?: (id: string) => void;
  /** rótulo do botão de confirmação no modo multiple. Padrão "Confirmar" */
  confirmLabel?: string;
  /** colunas (padrão: até 4) */
  columns?: number;
  /** largura dos sprites em unidades do kit. Padrão 8 */
  size?: number;
  disabled?: boolean;
  /** quanto tempo (ms) a marca de erro fica antes de liberar nova tentativa. Padrão 1200 */
  retryMs?: number;
  ariaLabel?: string;
  className?: string;
};

/** Cartões de escolha única/múltipla com feedback correto/errado. Remonte (key) para reiniciar. */
export function ChoiceGrid({
  choices,
  mode = "single",
  correct,
  onResult,
  onSelect,
  confirmLabel = "Confirmar",
  columns,
  size = 8,
  disabled = false,
  retryMs = 1200,
  ariaLabel,
  className,
}: ChoiceGridProps) {
  const timers = useTimers();
  const [selected, setSelected] = useState<string[]>([]);
  const [wrong, setWrong] = useState<string[]>([]);
  const [solved, setSolved] = useState(false);
  const evaluate = correct !== undefined;
  const locked = disabled || solved;
  const cols = columns ?? Math.min(4, Math.max(1, choices.length));

  const check = (ids: string[]) => {
    if (!correct) return;
    const wrongIds = ids.filter((id) => !correct.includes(id));
    const missing = correct.filter((id) => !ids.includes(id)).length;
    const ok = wrongIds.length === 0 && missing === 0;
    onResult?.({ correct: ok, selected: ids, wrong: wrongIds, missing });
    if (ok) {
      setSolved(true);
      setWrong([]);
      return;
    }
    setWrong(wrongIds.length > 0 ? wrongIds : ids);
    timers.clearAll();
    timers.after(
      retryMs,
      () => {
        setWrong([]);
        setSelected((prev) => (mode === "single" ? [] : prev.filter((id) => !wrongIds.includes(id))));
      },
      { hold: true },
    );
  };

  const choose = (id: string) => {
    if (locked || wrong.length > 0) return;
    onSelect?.(id);
    if (mode === "single") {
      setSelected([id]);
      if (evaluate) check([id]);
      return;
    }
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  return (
    <div className={cx(styles.root, className)} style={cssVars({ "--cols": cols, "--s": size })}>
      <ul className={cx(styles.grid, cols > 2 && styles.many)} role="list" aria-label={ariaLabel}>
        {choices.map((choice) => {
          const isSelected = selected.includes(choice.id);
          const isWrong = wrong.includes(choice.id);
          const isCorrect = solved && isSelected;
          return (
            <li key={choice.id} className={styles.cell}>
              <button
                type="button"
                className={cx(
                  styles.card,
                  isSelected && styles.selected,
                  isWrong && styles.wrong,
                  isCorrect && styles.correct,
                  locked && !isCorrect && styles.locked,
                )}
                onClick={() => choose(choice.id)}
                aria-pressed={mode === "multiple" || !evaluate ? isSelected : undefined}
                aria-disabled={locked || undefined}
                aria-label={choice.ariaLabel}
              >
                {(choice.content || choice.element || choice.src) && (
                  <span className={styles.art}>
                    {choice.content ?? (
                      <img src={resolveSprite(choice.element, choice.src)} alt="" draggable={false} className={styles.img} />
                    )}
                  </span>
                )}
                {choice.label !== undefined && <span className={styles.label}>{choice.label}</span>}
                {(isWrong || isCorrect) && (
                  <img src={isCorrect ? ELEMENTS.ok : ELEMENTS.error} alt="" draggable={false} className={styles.mark} />
                )}
              </button>
            </li>
          );
        })}
      </ul>
      {mode === "multiple" && evaluate && !solved && (
        <div className={styles.actions}>
          <SpriteButton
            sprite={ELEMENTS.ok}
            label={confirmLabel}
            onClick={() => check(selected)}
            disabled={disabled || selected.length === 0 || wrong.length > 0}
            variant="primary"
            size={20}
          />
        </div>
      )}
      <p className="sr-only" aria-live="polite">
        {solved ? "Resposta correta." : wrong.length > 0 ? "Ainda não. Tente de novo." : ""}
      </p>
    </div>
  );
}

export default ChoiceGrid;
