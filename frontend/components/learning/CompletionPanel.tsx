"use client";

import type { ReactNode } from "react";
import { Sprite } from "@/components/ui/Sprite";
import { SpriteButton } from "@/components/ui/SpriteButton";
import styles from "./CompletionPanel.module.css";

export type CompletionAction = {
  label: string;
  sprite: string;
  href?: string;
  onClick?: () => void;
  /** ação principal (amarela): recebe o foco e fica destacada ao abrir a tela */
  primary?: boolean;
};

export type CompletionPanelProps = {
  sprite: string;
  spriteAlt: string;
  title: string;
  children?: ReactNode;
  actions: CompletionAction[];
};

/**
 * Tela de conclusão exibida no lugar do palco. O foco vai direto para a ação principal ("Próximo planeta"), que fica
 * no canto inferior direito (avançar = para a direita, como na leitura); as outras ações ficam à esquerda.
 */
export function CompletionPanel({ sprite, spriteAlt, title, children, actions }: CompletionPanelProps) {
  const ordered = [...actions.filter((action) => !action.primary), ...actions.filter((action) => action.primary)];
  const primaryIndex = ordered.findIndex((action) => action.primary);

  return (
    <section className={styles.panel} aria-labelledby="conclusao-titulo">
      <span className={styles.rays} aria-hidden="true" />
      <Sprite src={sprite} alt={spriteAlt} className={styles.sprite} />
      <h2 id="conclusao-titulo" className={styles.title}>
        {title}
      </h2>
      {children && <div className={styles.body}>{children}</div>}
      <div className={styles.actions}>
        {ordered.map((action, index) => (
          <SpriteButton
            key={action.label}
            sprite={action.sprite}
            label={action.label}
            href={action.href}
            onClick={action.onClick}
            variant={action.primary ? "primary" : "default"}
            attention={index === primaryIndex}
            focusOnAttention
            size={22}
            className={action.primary ? styles.forward : undefined}
          />
        ))}
      </div>
    </section>
  );
}

export default CompletionPanel;
