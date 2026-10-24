"use client";

import { SPRITES } from "@/config/assets";
import { Rocket } from "@/components/space/Rocket";
import { Sprite } from "@/components/ui/Sprite";
import { SpriteButton } from "@/components/ui/SpriteButton";
import { cx } from "@/components/ui/cx";
import styles from "./StatusView.module.css";

export type StatusKind = "loading" | "error" | "empty" | "not-found" | "coming-soon";

export type StatusViewProps = {
  kind: StatusKind;
  title?: string;
  message?: string;
  onRetry?: () => void;
  action?: { label: string; href: string };
};

const DEFAULTS: Record<StatusKind, { title: string; message: string }> = {
  loading: { title: "Carregando", message: "Aquecendo os propulsores do foguete..." },
  error: { title: "Falha na comunicação", message: "Não foi possível falar com a base. Verifique se o servidor está ligado." },
  empty: { title: "Nada por aqui", message: "Este setor do espaço ainda está vazio." },
  "not-found": { title: "Rota não encontrada", message: "Esta coordenada não existe no mapa do Rota 404." },
  "coming-soon": { title: "Em breve", message: "Este recurso está sendo preparado para as próximas missões." },
};

const ART: Record<Exclude<StatusKind, "loading">, { src: string; size: number }> = {
  error: { src: SPRITES.status.error, size: 88 },
  empty: { src: SPRITES.placeholder, size: 96 },
  "not-found": { src: SPRITES.objects.door404, size: 72 },
  "coming-soon": { src: SPRITES.objects.vault, size: 132 },
};

export function StatusView({ kind, title, message, onRetry, action }: StatusViewProps) {
  const text = DEFAULTS[kind];
  const isError = kind === "error";

  return (
    <div
      className={cx(styles.status, styles[kind])}
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      aria-busy={kind === "loading" || undefined}
    >
      <div className={styles.art}>
        {kind === "loading" ? (
          <Rocket size={56} />
        ) : (
          <Sprite src={ART[kind].src} alt="" decorative size={ART[kind].size} className={styles.sprite} />
        )}
      </div>
      <h2 className={styles.title}>
        {title ?? text.title}
        {kind === "loading" && (
          <span className={styles.dots} aria-hidden="true">
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </span>
        )}
      </h2>
      <p className={styles.message}>{message ?? text.message}</p>
      {(onRetry || action) && (
        <div className={styles.actions}>
          {onRetry && <SpriteButton sprite={SPRITES.ui.play} label="Tentar de novo" onClick={onRetry} variant="primary" size={24} />}
          {action && <SpriteButton sprite={SPRITES.ui.back} label={action.label} href={action.href} size={24} />}
        </div>
      )}
    </div>
  );
}

export default StatusView;
