/**
 * Entrada suave do conteúdo do palco (troca de cena nas aulas, "Jogar de novo" nos labs): só opacity e transform,
 * pela Web Animations API (não mexe no estado nem no tempo da lição). Com movimento reduzido, nada acontece.
 */
export function playSceneIn(el: HTMLElement | null, reducedMotion: boolean) {
  if (!el || reducedMotion || typeof el.animate !== "function") return;
  el.animate(
    [
      { opacity: 0, transform: "translateX(1.5%)" },
      { opacity: 1, transform: "none" },
    ],
    { duration: 420, easing: "cubic-bezier(0.2, 0.7, 0.2, 1)" },
  );
}
