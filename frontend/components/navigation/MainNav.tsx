"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SPRITES } from "@/config/assets";
import { NAV_ITEMS, isNavItemActive } from "@/config/navigation";
import { ROUTES } from "@/config/routes";
import { Avatar } from "@/components/avatar/Avatar";
import { Sprite } from "@/components/ui/Sprite";
import { SpriteButton } from "@/components/ui/SpriteButton";
import { cx } from "@/components/ui/cx";
import { explorerDisplayName, useExplorer } from "@/hooks/useExplorer";
import styles from "./MainNav.module.css";

export function MainNav() {
  const pathname = usePathname() ?? "/";
  const { explorer, hydrated } = useExplorer();
  const name = explorerDisplayName(explorer);
  const profileActive = pathname === ROUTES.profile || pathname.startsWith(`${ROUTES.profile}/`);

  return (
    <header className={styles.hud}>
      <div className={styles.inner}>
        <Link href={ROUTES.home} className={styles.logo} aria-label="Rota 404, voltar ao início">
          <Sprite src={SPRITES.brand.logoSmall} alt="" decorative size={306} height={54} className={styles.logoImage} />
          <Sprite src={SPRITES.brand.mark} alt="" decorative size={50} height={54} className={styles.logoMark} />
        </Link>

        <nav aria-label="Navegação principal" className={styles.nav}>
          <ul className={styles.items}>
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <SpriteButton
                  sprite={item.sprite}
                  label={item.label}
                  href={item.href}
                  size={28}
                  variant="ghost"
                  active={isNavItemActive(item, pathname)}
                  className={styles.navButton}
                />
              </li>
            ))}
          </ul>
        </nav>

        <Link
          href={ROUTES.profile}
          className={cx(styles.chip, profileActive && styles.chipActive, hydrated && styles.chipReady)}
          aria-label={`Perfil de ${name}`}
          aria-current={profileActive ? "page" : undefined}
        >
          <Avatar slug={explorer.avatarSlug} size={40} framed className={styles.chipAvatar} />
          <span className={styles.chipText}>
            <span className={styles.chipName}>{name}</span>
            <span className={styles.chipCaption}>Perfil</span>
          </span>
        </Link>
      </div>
    </header>
  );
}

export default MainNav;
