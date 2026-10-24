"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SpriteButton } from "@/components/ui/SpriteButton";
import { cx } from "@/components/ui/cx";
import { SPRITES } from "@/config/assets";
import { ROUTES } from "@/config/routes";
import { useProgress } from "@/hooks/useProgress";
import { useSession } from "@/hooks/useSession";
import { exitToHome } from "./SessionGate";
import styles from "./FinishJourney.module.css";

/**
 * "Finalizar viagem": encerra a sessão a qualquer momento (nem todo mundo joga até o fim) e volta para a capa,
 * pronta para o próximo aluno. Pede confirmação antes. Conta: o progresso fica salvo no servidor. Visitante: o
 * progresso local é apagado, para o próximo visitante começar do zero.
 */
export function FinishJourney({ size = 22, className }: { size?: number; className?: string }) {
  const router = useRouter();
  const { status, logout } = useSession();
  const progress = useProgress();
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const confirmRef = useRef<HTMLDivElement>(null);
  const guest = status === "guest";

  useEffect(() => {
    if (asking) confirmRef.current?.querySelector<HTMLElement>("a, button")?.focus();
  }, [asking]);

  if (status !== "signed-in" && !guest) return null;

  const finish = async () => {
    setBusy(true);
    if (guest) progress.resetProgress();
    exitToHome();
    await logout();
    router.replace(ROUTES.home);
  };

  if (!asking) {
    return (
      <SpriteButton sprite={SPRITES.ui.close} label="Finalizar viagem" onClick={() => setAsking(true)} size={size} className={className} />
    );
  }

  return (
    <div ref={confirmRef} className={cx(styles.confirm, className)} role="group" aria-label="Confirmar fim da viagem">
      <p className={styles.question}>
        Finalizar a viagem?{" "}
        <span className={styles.note}>
          {guest ? "Sem conta, o progresso deste aparelho será apagado." : "Seu progresso e seus pontos ficam salvos na conta."}
        </span>
      </p>
      <div className={styles.buttons}>
        <SpriteButton sprite={SPRITES.ui.home} label={busy ? "Saindo..." : "Sim, finalizar"} onClick={() => void finish()} disabled={busy} variant="primary" size={size} />
        <SpriteButton sprite={SPRITES.ui.back} label="Continuar jogando" onClick={() => setAsking(false)} disabled={busy} size={size} />
      </div>
    </div>
  );
}
