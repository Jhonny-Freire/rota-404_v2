"use client";

import type { CSSProperties } from "react";
import type { BonziBuddyProps } from "@/components/bonzi/BonziBuddy";
import { FinishJourney } from "@/components/auth/FinishJourney";
import { AppShell } from "@/components/layout/AppShell";
import { Rocket } from "@/components/space/Rocket";
import { Sprite } from "@/components/ui/Sprite";
import { SpriteButton } from "@/components/ui/SpriteButton";
import { cx } from "@/components/ui/cx";
import { SPRITES, galaxySprite, planetSprite, systemSprite } from "@/config/assets";
import { NAV_ITEMS } from "@/config/navigation";
import { ROUTES } from "@/config/routes";
import { useJourney } from "@/hooks/useJourney";
import { useSession } from "@/hooks/useSession";
import styles from "./page.module.css";

const QUICK_LINKS = [
  { label: "Perfil", href: ROUTES.profile, sprite: SPRITES.ui.profile },
  ...NAV_ITEMS.filter((item) => item.href !== ROUTES.galaxies),
];

const JOURNEY = [
  { key: "galaxy", sprite: galaxySprite("api-rest"), term: "Galáxias", meaning: "módulos" },
  { key: "system", sprite: systemSprite("conhecendo-uma-api", 0), term: "Sistemas", meaning: "assuntos" },
  { key: "planet", sprite: planetSprite("o-que-e-uma-rede", "lesson"), term: "Planetas", meaning: "aulas e laboratórios" },
] as const;

/** Sprite dos pontos da trilha para o ::before animado (ver .trail em page.module.css). */
const TRAIL_STYLE = { "--trail": `url(${SPRITES.space.trailDot})` } as CSSProperties;

const BONZI: BonziBuddyProps = {
  state: "speaking",
  message: "Olá! Eu sou o Bonzi Buddy, seu co-piloto. Vamos decolar?",
};

export default function HomePage() {
  const { status, user } = useSession();
  const aboard = status === "signed-in" || status === "guest";
  const journey = useJourney({ withNext: aboard });
  const bonzi: BonziBuddyProps =
    status === "signed-in" && user ? { state: "happy", message: `Bem-vindo de volta, ${user.nickname}! Vamos decolar?` } : BONZI;

  return (
    <AppShell variant="immersive" bonzi={bonzi} fit>
      <div className={styles.landing}>
        <nav aria-label="Atalhos" className={styles.quickNav}>
          <ul className={styles.quickList}>
            {QUICK_LINKS.map((link) => (
              <li key={link.href}>
                <SpriteButton
                  sprite={link.sprite}
                  label={link.label}
                  href={link.href}
                  size={22}
                  variant="ghost"
                  className={styles.quickButton}
                />
              </li>
            ))}
          </ul>
        </nav>

        <section className={styles.hero} aria-labelledby="landing-title">
          <h1 id="landing-title" className={styles.title}>
            <Sprite src={SPRITES.brand.logo} alt="Rota 404" size={865} height={360} className={styles.logo} />
          </h1>
          <p className={styles.tagline}>Uma viagem pela tecnologia, planeta por planeta.</p>

          <div className={styles.actions}>
            <span className={styles.rocket}>
              <Rocket size={104} angle={28} />
            </span>
            <SpriteButton
              sprite={SPRITES.ui.play}
              label={aboard ? "Continuar viagem" : "Iniciar viagem"}
              href={aboard ? journey.nextHref : ROUTES.login}
              variant="primary"
              size={30}
              className={styles.start}
            />
            <SpriteButton sprite={SPRITES.ui.map} label="Ver mapa" href={journey.mapHref} size={28} />
          </div>
          {aboard && <FinishJourney size={24} className={styles.finish} />}
        </section>

        <section className={styles.journey} aria-labelledby="journey-title">
          <h2 id="journey-title" className="sr-only">
            Como funciona a viagem
          </h2>
          <ol className={styles.steps}>
            {JOURNEY.map((step, index) => (
              <li key={step.key} className={styles.step}>
                {index > 0 && <span className={styles.trail} aria-hidden="true" style={TRAIL_STYLE} />}
                <span className={cx(styles.stepArt, styles[step.key])}>
                  <Sprite src={step.sprite} alt="" decorative className={styles.stepSprite} />
                </span>
                <span className={styles.stepCaption}>
                  <span className={styles.term}>{step.term}</span>
                  <span className={styles.meaning}>= {step.meaning}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </AppShell>
  );
}
