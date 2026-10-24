"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { ELEMENTS, SPRITES } from "@/config/assets";
import { SpriteButton } from "@/components/ui/SpriteButton";
import { useTimers } from "./useSequence";
import { cx } from "./util";
import styles from "./AnswerInput.module.css";

export type AnswerInputProps = {
  /** rótulo visível ("Digite o IP do destino") */
  label: string;
  /** valide a resposta: true = certo (trava), false = errado (treme, mantém o texto). */
  onSubmit: (value: string) => boolean | void;
  placeholder?: string;
  /** texto do botão. Padrão "Enviar" */
  submitLabel?: string;
  /** teclado no celular: "decimal" mostra o ponto (bom para IPs) */
  inputMode?: "text" | "numeric" | "decimal";
  maxLength?: number;
  /** fonte monoespaçada (IPs, domínios) */
  mono?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  /** escreve um texto no campo (ex.: tocar num item da lista para começar); `key` novo = escreve de novo */
  fill?: { text: string; key: number } | null;
  className?: string;
};

/** Campo de resposta digitada com botão de envio e feedback certo/errado. */
export function AnswerInput({
  label,
  onSubmit,
  placeholder,
  submitLabel = "Enviar",
  inputMode = "text",
  maxLength = 40,
  mono = true,
  disabled = false,
  autoFocus = false,
  fill = null,
  className,
}: AnswerInputProps) {
  const id = useId();
  const timers = useTimers();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<"idle" | "correct" | "wrong">("idle");
  const locked = disabled || status === "correct";

  useEffect(() => {
    if (!fill || locked) return;
    setValue(fill.text.slice(0, maxLength));
    const input = inputRef.current;
    if (!input) return;
    input.focus();
    // cursor no fim: a criança continua digitando depois do texto escrito
    timers.after(0, () => input.setSelectionRange(input.value.length, input.value.length), { hold: true });
  }, [fill?.key]);

  const submit = () => {
    if (locked || !value.trim()) return;
    const result = onSubmit(value.trim());
    if (result === true) setStatus("correct");
    else if (result === false) {
      setStatus("wrong");
      timers.after(1200, () => setStatus((s) => (s === "wrong" ? "idle" : s)), { hold: true });
    }
  };

  return (
    <form
      className={cx(styles.form, styles[status], className)}
      onSubmit={(event: FormEvent) => {
        event.preventDefault();
        submit();
      }}
    >
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <div className={styles.row}>
        <span className={styles.field}>
          <input
            ref={inputRef}
            id={id}
            type="text"
            className={cx(styles.input, mono && styles.mono)}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={placeholder}
            inputMode={inputMode}
            maxLength={maxLength}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            disabled={locked}
            autoFocus={autoFocus}
            aria-invalid={status === "wrong" || undefined}
          />
          {status !== "idle" && (
            <img src={status === "correct" ? ELEMENTS.ok : ELEMENTS.error} alt="" draggable={false} className={styles.mark} />
          )}
        </span>
        <button type="submit" className={styles.hiddenSubmit} tabIndex={-1} aria-hidden="true" />
        <SpriteButton
          sprite={SPRITES.ui.next}
          label={submitLabel}
          onClick={submit}
          disabled={locked || !value.trim()}
          variant="primary"
          size={20}
        />
      </div>
      <p className="sr-only" aria-live="polite">
        {status === "correct" ? "Resposta correta." : status === "wrong" ? "Resposta incorreta. Tente de novo." : ""}
      </p>
    </form>
  );
}

export default AnswerInput;
