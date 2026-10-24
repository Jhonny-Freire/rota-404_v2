"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { ELEMENTS, SPRITES } from "@/config/assets";
import { Sprite } from "@/components/ui/Sprite";
import { SpriteButton } from "@/components/ui/SpriteButton";
import styles from "./EngineBoundary.module.css";

type Props = {
  children: ReactNode;
  onReset?: () => void;
  /** onde mostrar o aviso (ex.: dentro do portal do palco) */
  wrap?: (node: ReactNode) => ReactNode;
};
type State = { failed: boolean };

/** Isola falhas de um motor: mostra um aviso na cena em vez de derrubar a página. */
export class EngineBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("[Rota 404] Falha no motor da cena:", error, info.componentStack);
  }

  private reset = () => {
    this.setState({ failed: false });
    this.props.onReset?.();
  };

  render() {
    if (!this.state.failed) return this.props.children;
    const node = (
      <div className={styles.failed} role="alert">
        <Sprite src={ELEMENTS.error} alt="" decorative size={56} />
        <p className={styles.text}>Ops! Esta cena encontrou um problema.</p>
        <SpriteButton sprite={SPRITES.ui.play} label="Tentar de novo" onClick={this.reset} size={20} />
      </div>
    );
    return this.props.wrap ? this.props.wrap(node) : node;
  }
}

export default EngineBoundary;
