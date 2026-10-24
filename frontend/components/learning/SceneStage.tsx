"use client";

import { useImperativeHandle, useLayoutEffect, useRef, type ReactNode, type Ref } from "react";
import { PLANET_PLACEHOLDERS } from "@/config/assets";
import { Sprite } from "@/components/ui/Sprite";
import { cx } from "@/components/ui/cx";
import styles from "./SceneStage.module.css";

export type SceneStageProps = {
  children?: ReactNode;
  /** ref do contêiner da cena (alvo do portal <Stage> dos laboratórios) */
  contentRef?: Ref<HTMLDivElement>;
  /** mostra "Cena em construção" quando não há children. Padrão true */
  showPlaceholder?: boolean;
  placeholderSprite?: string;
  placeholderLabel?: string;
  label?: string;
  /** cena terminada: os cantos do palco ficam amarelos e piscam (o botão de avançar foi liberado) */
  ready?: boolean;
  /** ref da moldura (focável com tabIndex -1: recebe o foco ao trocar de cena pelo teclado) */
  frameRef?: Ref<HTMLElement>;
  className?: string;
};

/**
 * Moldura 16:9 do palco. A largura é limitada pela altura que sobra na janela abaixo do topo do palco
 * (`--stage-top`, medido aqui) menos `--stage-bottom` (definido pelo shell), para caber sem rolar.
 */
export function SceneStage({
  children,
  contentRef,
  showPlaceholder = true,
  placeholderSprite = PLANET_PLACEHOLDERS.lesson,
  placeholderLabel = "Cena em construção",
  label = "Área da cena",
  ready = false,
  frameRef,
  className,
}: SceneStageProps) {
  const stageRef = useRef<HTMLElement>(null);
  useImperativeHandle(frameRef, () => stageRef.current as HTMLElement, []);
  const empty = children === undefined || children === null || children === false;

  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const update = () => {
      const top = Math.round(el.getBoundingClientRect().top + window.scrollY);
      if (el.style.getPropertyValue("--stage-top") !== `${top}px`) el.style.setProperty("--stage-top", `${top}px`);
    };
    update();
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(update) : null;
    observer?.observe(document.body);
    window.addEventListener("resize", update);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <section
      ref={stageRef}
      className={cx(styles.stage, ready && styles.ready, className)}
      aria-label={label}
      tabIndex={frameRef ? -1 : undefined}
    >
      <div className={styles.screen}>
        <div ref={contentRef} className={styles.content}>
          {children}
        </div>
        {empty && showPlaceholder && (
          <div className={styles.placeholder}>
            <span className={styles.floor} aria-hidden="true" />
            <Sprite src={placeholderSprite} alt="" decorative className={styles.planet} />
            <p className={styles.label}>{placeholderLabel}</p>
          </div>
        )}
        <span className={styles.corners} aria-hidden="true" />
      </div>
    </section>
  );
}

export default SceneStage;
