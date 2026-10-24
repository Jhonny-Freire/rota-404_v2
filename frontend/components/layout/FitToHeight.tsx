"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cx } from "@/components/ui/cx";
import styles from "./FitToHeight.module.css";

/** largura mínima em que a tela se ajusta à altura da janela (abaixo disso a página rola, como antes) */
const FIT_QUERY = "(min-width: 900px)";

/**
 * Encolhe o conteúdo por igual (scale) até caber na altura que sobra na tela, sem rolagem. O espaço vem do layout
 * (`AppShell fit`: a tela tem a altura da janela e este bloco ocupa o resto). Nunca aumenta além do tamanho natural.
 * A escala é escrita direto no estilo (sem render do React) e recalculada só quando um dos dois tamanhos muda.
 */
export function FitToHeight({
  children,
  minScale = 0.55,
  align = "center",
  className,
}: {
  children: ReactNode;
  minScale?: number;
  /** "center" (mapas) ou "top" (páginas de conteúdo: ficha, ajustes, conquistas) */
  align?: "center" | "top";
  className?: string;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const box = boxRef.current;
    const inner = innerRef.current;
    if (!box || !inner || typeof ResizeObserver === "undefined") return;
    const media = window.matchMedia(FIT_QUERY);
    // direto no callback do ResizeObserver (que já agrupa as medidas): sem rAF, que para com a aba oculta
    const apply = () => {
      if (!media.matches) {
        inner.style.removeProperty("--fit-scale");
        box.style.removeProperty("--fit-h");
        return;
      }
      const natural = inner.offsetHeight;
      const room = box.clientHeight;
      const scale = natural > 0 && room > 0 ? Math.max(minScale, Math.min(1, room / natural)) : 1;
      inner.style.setProperty("--fit-scale", String(scale));
      box.style.setProperty("--fit-h", `${Math.round(natural * scale)}px`);
    };
    const observer = new ResizeObserver(apply);
    observer.observe(box);
    observer.observe(inner);
    media.addEventListener("change", apply);
    apply();
    return () => {
      observer.disconnect();
      media.removeEventListener("change", apply);
    };
  }, [minScale]);

  return (
    <div ref={boxRef} className={cx(styles.box, align === "top" && styles.top, className)}>
      <div ref={innerRef} className={styles.inner}>
        {children}
      </div>
    </div>
  );
}

export default FitToHeight;
