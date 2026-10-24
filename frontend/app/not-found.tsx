"use client";

import { useEffect } from "react";
import type { BonziBuddyProps } from "@/components/bonzi/BonziBuddy";
import { AppShell } from "@/components/layout/AppShell";
import { Sprite } from "@/components/ui/Sprite";
import { SpriteButton } from "@/components/ui/SpriteButton";
import { SPRITES } from "@/config/assets";
import { ROUTES } from "@/config/routes";
import { unlockAchievement } from "@/lib/achievementEvents";
import styles from "./not-found.module.css";

const BONZI: BonziBuddyProps = {
  state: "warning",
  message: "Ops! Essa rota saiu do mapa. Vamos voltar?",
};

export default function NotFound() {
  // conquista secreta S-02: achar uma rota que não existe
  useEffect(() => unlockAchievement("s-02"), []);

  return (
    <AppShell bonzi={BONZI}>
      <section className={styles.lost} aria-labelledby="not-found-title">
        <div className={styles.door}>
          <Sprite src={SPRITES.objects.door404} alt="" decorative size={144} height={240} className={styles.doorSprite} />
        </div>
        <h1 id="not-found-title" className={styles.title}>
          <span className={styles.code}>Rota 404</span>
          <span className="sr-only"> — </span>
          <span className={styles.subtitle}>planeta não encontrado</span>
        </h1>
        <p className={styles.message}>Esta coordenada não existe no mapa.</p>
        <div className={styles.actions}>
          <SpriteButton sprite={SPRITES.ui.home} label="Início" href={ROUTES.home} variant="primary" size={28} />
          <SpriteButton sprite={SPRITES.ui.map} label="Mapa" href={ROUTES.galaxies} size={28} />
        </div>
      </section>
    </AppShell>
  );
}
