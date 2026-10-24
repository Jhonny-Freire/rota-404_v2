"use client";

import { memo, useEffect, useRef } from "react";
import { SPRITES } from "@/config/assets";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cx } from "./cx";
import { Sprite } from "./Sprite";
import styles from "./AnimatedSprite.module.css";

export type AnimatedSpriteProps = {
  frames: string[];
  fps?: number;
  playing?: boolean;
  alt: string;
  size?: number;
  className?: string;
};

/** Mostra só o quadro `index` da pilha (troca direta no DOM, sem render do React). */
function showFrame(stack: HTMLElement | null, index: number) {
  if (!stack) return;
  const frames = stack.children;
  for (let i = 0; i < frames.length; i += 1) frames[i].classList.toggle(styles.current, i === index);
}

/**
 * Sprite animado por quadros. Desempenho: o render do React marca sempre o quadro 0; a troca de quadro é feita
 * direto na classe dos <img> (antes cada quadro era um setState = um render do React; o Foguete + o Bonzi davam
 * 15 renders por segundo nas telas de mapa). Também não troca quadro com a aba oculta.
 */
function AnimatedSpriteBase({ frames, fps = 6, playing = true, alt, size, className }: AnimatedSpriteProps) {
  const reducedMotion = useReducedMotion();
  const stackRef = useRef<HTMLSpanElement>(null);
  const list = frames.length > 0 ? frames : [SPRITES.placeholder];
  const framesKey = list.join("|");
  const count = list.length;
  const animate = playing && !reducedMotion && count > 1;

  useEffect(() => {
    if (!animate) return;
    const stack = stackRef.current;
    let frame = 0;
    const id = window.setInterval(
      () => {
        if (document.hidden) return;
        frame = (frame + 1) % count;
        showFrame(stack, frame);
      },
      1000 / Math.max(0.1, fps),
    );
    return () => {
      window.clearInterval(id);
      // volta ao quadro 0, que é o que o render do React marca (ele não reaplica a classe se nada mudou)
      showFrame(stack, 0);
    };
  }, [animate, fps, count, framesKey]);

  if (count === 1) {
    return <Sprite src={list[0]} alt={alt} decorative={!alt} size={size} className={className} />;
  }

  return (
    <span
      ref={stackRef}
      className={styles.stack}
      role={alt ? "img" : undefined}
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
    >
      {list.map((src, i) => (
        <Sprite
          key={`${i}-${src}`}
          src={src}
          alt=""
          decorative
          size={size}
          className={cx(styles.frame, i === 0 && styles.current, className)}
        />
      ))}
    </span>
  );
}

export const AnimatedSprite = memo(AnimatedSpriteBase);

export default AnimatedSprite;
