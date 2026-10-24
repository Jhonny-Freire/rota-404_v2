/** Folga (px) para considerar o elemento "à vista" dentro da janela. */
const MARGIN = 12;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return true;
  return document.documentElement.dataset.reducedMotion === "true" || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Move o foco para `el` sem pular a página e, se ele estiver fora da janela (ex.: painel abaixo do palco
 * no tablet), rola só o necessário até ele. Com movimento reduzido a rolagem é instantânea.
 */
export function revealFocus(el: HTMLElement | null | undefined): void {
  if (!el || typeof window === "undefined" || !el.isConnected) return;
  el.focus({ preventScroll: true });
  const rect = el.getBoundingClientRect();
  if (rect.top < MARGIN || rect.bottom > window.innerHeight - MARGIN) {
    el.scrollIntoView({ block: "nearest", inline: "nearest", behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }
}

export default revealFocus;
