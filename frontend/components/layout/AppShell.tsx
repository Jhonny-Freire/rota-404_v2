"use client";

import type { ReactNode } from "react";
import { BonziBuddy, type BonziBuddyProps } from "@/components/bonzi/BonziBuddy";
import { Breadcrumbs, type BreadcrumbItem } from "@/components/navigation/Breadcrumbs";
import { MainNav } from "@/components/navigation/MainNav";
import { PineappleJuice } from "@/components/space/PineappleJuice";
import { cx } from "@/components/ui/cx";
import { useSettings } from "@/hooks/useSettings";
import styles from "./AppShell.module.css";

export type AppShellProps = {
  children?: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  /** trilha no celular: ver `Breadcrumbs.compact` */
  breadcrumbsCompact?: "back" | "hide";
  bonzi?: BonziBuddyProps | null;
  variant?: "default" | "immersive";
  /** a tela cabe na altura da janela (telas largas): ver `.fit` e `FitToHeight` */
  fit?: boolean;
  /** suco de abacaxi que às vezes passa pelo espaço (conquista secreta); desligado nas aulas e laboratórios */
  easterEgg?: boolean;
  className?: string;
};

export function AppShell({ children, breadcrumbs, breadcrumbsCompact, bonzi, variant = "default", fit = false, easterEgg = true, className }: AppShellProps) {
  const { settings, hydrated } = useSettings();
  const showBonzi = hydrated && Boolean(bonzi) && settings.showBonzi && bonzi?.visible !== false;
  const floatingBonzi = showBonzi && bonzi?.position !== "inline";

  return (
    <div className={cx(styles.shell, styles[variant], fit && styles.fit, className)}>
      <a href="#conteudo" className="skip-link">
        Pular para o conteúdo
      </a>
      {variant === "default" && <MainNav />}
      <div className={styles.frame}>
        {breadcrumbs && breadcrumbs.length > 0 && <Breadcrumbs items={breadcrumbs} compact={breadcrumbsCompact} />}
        <main id="conteudo" tabIndex={-1} className={cx(styles.main, floatingBonzi && styles.withBonzi)}>
          {children}
        </main>
      </div>
      {showBonzi && bonzi && <BonziBuddy {...bonzi} />}
      {easterEgg && hydrated && <PineappleJuice />}
    </div>
  );
}

export default AppShell;
