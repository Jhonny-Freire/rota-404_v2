"use client";

import { useId, type CSSProperties } from "react";
import { ELEMENTS } from "@/config/assets";
import { cx } from "@/components/ui/cx";
import { ActionButton } from "@/components/learning/kit";
import { TOOLS, type FaultId } from "./model";
import styles from "./MissaoRecuperarAConexao.module.css";

type PanelButtonProps = {
  label: string;
  icon: string;
  /** largura do ícone em px */
  iconWidth: number;
  onClick: () => void;
  /** aria-disabled: continua focável; o clique só traz um lembrete do próximo passo (quem decide é o onClick) */
  inactive?: boolean;
  pulse?: boolean;
  active?: boolean;
  failed?: boolean;
  note?: string;
};

function PanelButton({ label, icon, iconWidth, onClick, inactive, pulse, active, failed, note }: PanelButtonProps) {
  return (
    <button
      type="button"
      className={cx(
        styles.btn,
        inactive && styles.inactive,
        pulse && !inactive && styles.pulse,
        active && styles.active,
        failed && styles.failed,
      )}
      aria-disabled={inactive || undefined}
      onClick={onClick}
    >
      <img
        src={icon}
        alt=""
        draggable={false}
        className={styles.btnIcon}
        style={{ "--icon-w": `${iconWidth}px` } as CSSProperties}
      />
      <span className={styles.btnLabel}>{label}</span>
      {failed && <img src={ELEMENTS.error} alt="" draggable={false} className={styles.btnMark} />}
      {note && <span className="sr-only"> ({note})</span>}
    </button>
  );
}

export type ToolPanelProps = {
  canTest: boolean;
  /** "Ligar conexão" é o próximo passo (anel amarelo do kit) */
  callTest: boolean;
  /** junto com `callTest`: leva o foco para "Ligar conexão" (nada mais a fazer na etapa) */
  focusTest: boolean;
  tools: readonly FaultId[];
  /** a peça com problema já foi encontrada: as ações aparecem (antes, um cartão trancado) */
  unlocked: boolean;
  /** ações visíveis, mas inativas (pacote viajando, ação em andamento, hora de testar): o toque só lembra o próximo passo */
  toolsLocked: boolean;
  /** pulsa as ações ainda não tentadas (hora de escolher uma) */
  pulseTools: boolean;
  tried: readonly FaultId[];
  pending: FaultId | null;
  reducedMotion: boolean;
  onTest: () => void;
  onTool: (tool: FaultId) => void;
};

export function ToolPanel({
  canTest,
  callTest,
  focusTest,
  tools,
  unlocked,
  toolsLocked,
  pulseTools,
  tried,
  pending,
  reducedMotion,
  onTest,
  onTool,
}: ToolPanelProps) {
  const titleId = useId();

  return (
    <div className={cx(styles.panel, reducedMotion && styles.reduced)}>
      <ActionButton
        label="Ligar conexão"
        element="box"
        size={28}
        onClick={onTest}
        disabled={!canTest}
        attention={callTest}
        focusOnAttention={focusTest}
        className={styles.testBtn}
      />
      <section className={styles.tools} aria-labelledby={titleId}>
        <h3 id={titleId} className={styles.toolsTitle}>
          Ações
        </h3>
        {unlocked ? (
          <div className={styles.toolGrid}>
            {tools.map((tool) => {
              const failed = tried.includes(tool);
              const isPending = pending === tool;
              return (
                <PanelButton
                  key={tool}
                  label={TOOLS[tool].label}
                  icon={ELEMENTS[TOOLS[tool].element]}
                  iconWidth={TOOLS[tool].native * 2}
                  onClick={() => onTool(tool)}
                  inactive={failed || toolsLocked}
                  pulse={pulseTools && !failed}
                  active={isPending}
                  failed={failed}
                  note={failed ? "não resolveu" : isPending ? "ação escolhida" : undefined}
                />
              );
            })}
          </div>
        ) : (
          <p className={styles.locked}>
            <img src={ELEMENTS.magnifier} alt="" draggable={false} className={styles.lockedIcon} />
            <span>Ache a peça com problema primeiro</span>
          </p>
        )}
      </section>
    </div>
  );
}

export default ToolPanel;
