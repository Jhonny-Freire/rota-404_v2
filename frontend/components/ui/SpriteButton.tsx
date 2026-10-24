"use client";

import Link from "next/link";
import { useEffect, useRef, type Ref } from "react";
import { cx } from "./cx";
import { revealFocus } from "./revealFocus";
import { Sprite } from "./Sprite";
import styles from "./SpriteButton.module.css";

export type SpriteButtonProps = {
  sprite: string;
  label: string;
  href?: string;
  onClick?: () => void;
  showLabel?: boolean;
  size?: number;
  active?: boolean;
  disabled?: boolean;
  variant?: "default" | "primary" | "ghost";
  /** chama atenção para o botão ("é aqui agora"): anel amarelo pulsando e ícone indicando o avanço */
  attention?: boolean;
  /** quando `attention` liga, o botão recebe o foco (e a página rola até ele se estiver fora da tela) */
  focusOnAttention?: boolean;
  className?: string;
};

export function SpriteButton({
  sprite,
  label,
  href,
  onClick,
  showLabel = true,
  size = 32,
  active = false,
  disabled = false,
  variant = "default",
  attention = false,
  focusOnAttention = false,
  className,
}: SpriteButtonProps) {
  const ref = useRef<HTMLElement>(null);
  const calling = attention && !disabled;

  useEffect(() => {
    if (calling && focusOnAttention) revealFocus(ref.current);
  }, [calling, focusOnAttention]);

  const classes = cx(
    styles.button,
    variant === "primary" && styles.primary,
    variant === "ghost" && styles.ghost,
    active && styles.active,
    disabled && styles.disabled,
    !showLabel && styles.iconOnly,
    calling && styles.attention,
    className,
  );

  const content = (
    <>
      <span className={styles.icon}>
        <Sprite src={sprite} alt="" decorative size={size} />
      </span>
      {showLabel && (
        <span className={styles.label} data-sprite-label="">
          {label}
        </span>
      )}
    </>
  );

  const a11y = showLabel ? {} : { "aria-label": label, title: label };

  if (href && !disabled) {
    return (
      <Link
        ref={ref as Ref<HTMLAnchorElement>}
        href={href}
        className={classes}
        onClick={onClick}
        aria-current={active ? "true" : undefined}
        {...a11y}
      >
        {content}
      </Link>
    );
  }

  if (href) {
    return (
      <span className={classes} role="link" aria-disabled="true" {...a11y}>
        {content}
      </span>
    );
  }

  return (
    <button
      ref={ref as Ref<HTMLButtonElement>}
      type="button"
      className={classes}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active ? true : undefined}
      {...a11y}
    >
      {content}
    </button>
  );
}

export default SpriteButton;
