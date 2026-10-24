"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { ELEMENTS, SPRITES } from "@/config/assets";
import { cx } from "@/components/ui/cx";
import styles from "./TodoDispositivoPrecisaDeUmEndereco.module.css";

export type AddressFormProps = {
  /** envia o texto digitado (o resultado chega pela cena) */
  onSend: (value: string) => void;
  /** o texto do campo mudou (a cena atualiza a instrução "O que fazer") */
  onEdit?: (value: string) => void;
  /** tocou em Enviar com o campo vazio (a cena lembra o que fazer; o foco vai para o campo) */
  onEmpty?: () => void;
  /** mensagem a caminho: não aceita novo envio */
  busy: boolean;
  /** acertou: trava o campo */
  solved: boolean;
  /** último envio errado (borda vermelha + tremida) */
  wrong: boolean;
};

/** Campo "Para:" da mensagem: digitar o IP do destino e enviar. */
export function AddressForm({ onSend, onEdit, onEmpty, busy, solved, wrong }: AddressFormProps) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  const locked = busy || solved;
  const empty = value.trim() === "";

  // Acertou: tira o foco do campo (já travado) para o teclado virtual do tablet fechar antes de o shell
  // levar o foco até "Concluir".
  useEffect(() => {
    if (solved && document.activeElement === inputRef.current) inputRef.current?.blur();
  }, [solved]);

  const edit = (raw: string) => {
    const next = raw.replace(/,/g, ".");
    setValue(next);
    onEdit?.(next);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (locked) return;
    if (empty) {
      inputRef.current?.focus();
      onEmpty?.();
      return;
    }
    onSend(value);
  };

  return (
    <form
      className={cx(styles.form, wrong && styles.formWrong, solved && styles.formRight)}
      onSubmit={submit}
      aria-label="Mensagem para enviar"
      aria-busy={busy || undefined}
    >
      <label htmlFor={id} className={styles.formLabel}>
        <img src={ELEMENTS.mail} alt="" draggable={false} />
        Para:
      </label>
      <div className={styles.formRow}>
        <span className={styles.field}>
          <input
            ref={inputRef}
            id={id}
            type="text"
            className={styles.input}
            value={value}
            onChange={(event) => edit(event.target.value)}
            placeholder="Digite o IP"
            inputMode="decimal"
            maxLength={15}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            readOnly={locked}
            aria-invalid={wrong || undefined}
          />
          {(wrong || solved) && (
            <img src={solved ? ELEMENTS.ok : ELEMENTS.error} alt="" draggable={false} className={styles.mark} />
          )}
        </span>
        <button type="submit" className={styles.send} aria-disabled={locked || empty || undefined}>
          <img src={SPRITES.ui.next} alt="" draggable={false} />
          <span className={styles.sendText}>Enviar</span>
        </button>
      </div>
    </form>
  );
}

export default AddressForm;
