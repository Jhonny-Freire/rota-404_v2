import { SPRITES } from "@/config/assets";
import { Sprite } from "@/components/ui/Sprite";
import { SpriteButton } from "@/components/ui/SpriteButton";
import styles from "./LockedPlanet.module.css";

export type LockedPlanetProps = {
  title: string;
  backHref: string;
  backLabel?: string;
  message?: string;
};

/** Planeta bloqueado aberto pela URL. */
export function LockedPlanet({ title, backHref, backLabel = "Voltar ao sistema", message = "Conclua o planeta anterior para liberar este." }: LockedPlanetProps) {
  return (
    <div className={styles.locked} role="status" aria-live="polite">
      <div className={styles.art}>
        <Sprite src={SPRITES.status.locked} alt="" decorative className={styles.lock} />
      </div>
      <h2 className={styles.title}>Planeta bloqueado</h2>
      <p className={styles.name}>{title}</p>
      <p className={styles.message}>{message}</p>
      <SpriteButton sprite={SPRITES.ui.back} label={backLabel} href={backHref} variant="primary" size={24} />
    </div>
  );
}

export default LockedPlanet;
