"use client";

import { SPRITES, type ElementKey } from "@/config/assets";
import { SpriteButton } from "@/components/ui/SpriteButton";
import { resolveSprite } from "./util";

export type ActionButtonProps = {
  /** texto do botão ("Testar", "Ligar conexão", "Ver página"…) */
  label: string;
  onClick?: () => void;
  /** ícone: chave de ELEMENTS… */
  element?: ElementKey;
  /** …ou caminho de config/assets (padrão SPRITES.ui.play) */
  sprite?: string;
  /** "primary" (amarelo, padrão), "default" ou "ghost" */
  variant?: "primary" | "default" | "ghost";
  disabled?: boolean;
  /** tamanho do ícone em px. Padrão 24 */
  size?: number;
  /** destaca o botão quando ele é o próximo passo (anel pulsando) */
  attention?: boolean;
  /** junto com `attention`: move o foco para o botão quando ele passa a ser o próximo passo */
  focusOnAttention?: boolean;
  className?: string;
};

/** Botão pixel grande para ações do motor (usa SpriteButton). */
export function ActionButton({
  label,
  onClick,
  element,
  sprite,
  variant = "primary",
  disabled = false,
  size = 24,
  attention = false,
  focusOnAttention = false,
  className,
}: ActionButtonProps) {
  return (
    <SpriteButton
      sprite={sprite ?? (element ? resolveSprite(element) : SPRITES.ui.play)}
      label={label}
      onClick={onClick}
      variant={variant}
      disabled={disabled}
      size={size}
      attention={attention}
      focusOnAttention={focusOnAttention}
      className={className}
    />
  );
}

export default ActionButton;
