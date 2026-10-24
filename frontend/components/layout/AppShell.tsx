"use client";

import type { ReactNode } from "react";
import { BonziBuddy, type BonziBuddyProps } from "@/components/bonzi/BonziBuddy";
import { Breadcrumbs, type BreadcrumbItem } from "@/components/navigation/Breadcrumbs";
import { MainNav } from "@/components/navigation/MainNav";
import { cx } from "@/components/ui/cx";
import { useSettings } from "@/hooks/useSettings";
import styles from "./AppShell.module.css";

export type AppShellProps = {
  children?: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  bonzi?: BonziBuddyProps | null;
  variant?: "default" | "immersive";
  className?: string;
};

export function AppShell({ children, breadcrumbs, bonzi, variant = "default", className }: AppShellProps) {
  const { settings, hydrated } = useSettings();
  const showBonzi = hydrated && Boolean(bonzi) && settings.showBonzi && bonzi?.visible !== false;
  const floatingBonzi = showBonzi && bonzi?.position !== "inline";

  return (
    <div className={cx(styles.shell, styles[variant], className)}>
      <a href="#conteudo" className="skip-link">
        Pular para o conteúdo
      </a>
      {variant === "default" && <MainNav />}
      <div className={styles.frame}>
        {breadcrumbs && breadcrumbs.length > 0 && <Breadcrumbs items={breadcrumbs} />}
        <main id="conteudo" tabIndex={-1} className={cx(styles.main, floatingBonzi && styles.withBonzi)}>
          {children}
        </main>
      </div>
      {showBonzi && bonzi && <BonziBuddy {...bonzi} />}
    </div>
  );
}

export default AppShell;
