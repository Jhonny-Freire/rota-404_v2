"use client";

import { useId, type CSSProperties, type KeyboardEvent, type Ref } from "react";
import { ELEMENTS, SPRITES, type ElementKey } from "@/config/assets";
import { cx } from "@/components/ui/cx";
import { ActionButton, FlowChain, type FlowItem } from "@/components/learning/kit";
import { iconWidth } from "./model";
import styles from "./MissaoEncontrarOServidor.module.css";

export type PanelChoice = {
  id: string;
  name: string;
  element: ElementKey;
  ip?: string;
  /** caminho sem saída já testado */
  tried: boolean;
  /** direção indicada pelo Bonzi */
  hint: boolean;
};

export type MissionPanelProps = {
  domain: string;
  ip: string;
  received: boolean;
  ipShown: boolean;
  /** etapas possíveis no cruzamento atual, na ordem do mapa (vazio fora dele) */
  choices: PanelChoice[];
  /** requisição em movimento: escolhas inativas (o toque só traz um lembrete) */
  locked: boolean;
  /** vez da criança escolher: as etapas possíveis pulsam (só a da seta, quando o Bonzi ajuda) */
  invite: boolean;
  chain: FlowItem[];
  chainCurrent: number;
  reducedMotion: boolean;
  /** raiz do painel (o foco do teclado procura as etapas livres aqui) */
  rootRef?: Ref<HTMLDivElement>;
  onReceive: () => void;
  /** também para as inativas: quem decide o lembrete é o motor */
  onChoose: (id: string) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void;
  onPointerDown?: () => void;
};

/** ícone em ampliação inteira (×2 ou ×3, conforme o tamanho nativo) */
function Icon({ element }: { element: ElementKey }) {
  return (
    <img
      src={ELEMENTS[element]}
      alt=""
      draggable={false}
      className={styles.btnIcon}
      style={{ "--icon-w": `${iconWidth(element)}px` } as CSSProperties}
    />
  );
}

export function MissionPanel({
  domain,
  ip,
  received,
  ipShown,
  choices,
  locked,
  invite,
  chain,
  chainCurrent,
  reducedMotion,
  rootRef,
  onReceive,
  onChoose,
  onKeyDown,
  onPointerDown,
}: MissionPanelProps) {
  const choicesId = useId();
  const chainId = useId();
  const guided = choices.some((choice) => choice.hint && !choice.tried);

  return (
    <div ref={rootRef} className={cx(styles.panel, reducedMotion && styles.reduced)} onKeyDown={onKeyDown} onPointerDown={onPointerDown}>
      <section className={cx(styles.card, received && styles.cardReady)} aria-label="Destino da requisição">
        <img src={ELEMENTS.pin} alt="" draggable={false} className={styles.cardPin} />
        <div className={styles.cardBody}>
          <span className={styles.cardLabel}>Destino</span>
          {received ? <span className={styles.cardDomain}>{domain}</span> : <span className={styles.cardWaiting}>Aguardando</span>}
          {ipShown && (
            <span className={styles.cardIp}>
              <img src={SPRITES.ui.next} alt="" draggable={false} className={styles.cardArrow} />
              IP {ip}
            </span>
          )}
        </div>
      </section>

      {!received && (
        <ActionButton label="Receber destino" element="mail" onClick={onReceive} attention className={styles.receive} />
      )}

      {choices.length > 0 && (
        <section className={styles.section} aria-labelledby={choicesId}>
          <h3 id={choicesId} className={styles.sectionTitle}>
            Próxima etapa
          </h3>
          <div className={styles.choiceList}>
            {choices.map((choice) => {
              const inactive = locked || choice.tried;
              const element: ElementKey = choice.tried && choice.ip ? "serverError" : choice.element;
              let note: string | undefined;
              if (choice.tried) note = "sem saída";
              else if (choice.hint) note = "dica do Bonzi: siga por aqui";
              else if (locked) note = "espere a requisição";
              return (
                <button
                  key={choice.id}
                  type="button"
                  data-choice={choice.tried ? "tried" : "open"}
                  className={cx(
                    styles.btn,
                    styles.choice,
                    choice.tried && styles.tried,
                    choice.hint && !choice.tried && styles.hint,
                    inactive && styles.inactive,
                    invite && !inactive && (!guided || choice.hint) && styles.pulse,
                  )}
                  aria-disabled={inactive || undefined}
                  onClick={() => onChoose(choice.id)}
                >
                  <span className={styles.btnArt}>
                    <Icon element={element} />
                  </span>
                  <span className={styles.btnText}>
                    <span className={styles.btnLabel}>{choice.name}</span>
                    {choice.ip && <span className={styles.btnIp}>IP {choice.ip}</span>}
                  </span>
                  {choice.tried && <img src={ELEMENTS.error} alt="" draggable={false} className={styles.btnMark} />}
                  {choice.hint && !choice.tried && <img src={SPRITES.ui.next} alt="" draggable={false} className={styles.btnArrow} />}
                  {note && <span className="sr-only"> ({note})</span>}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {received && (
        <section className={styles.section} aria-labelledby={chainId}>
          <h3 id={chainId} className={styles.sectionTitle}>
            Caminho
          </h3>
          <FlowChain
            items={chain}
            current={chainCurrent}
            size={3.5}
            wrap
            ariaLabel={`Caminho da requisição: ${chain.map((item) => (item.missing ? "próxima etapa" : item.label)).join(", ")}`}
            className={styles.chain}
          />
        </section>
      )}
    </div>
  );
}

export default MissionPanel;
