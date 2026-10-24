import { BACKGROUNDS } from "@/config/assets";
import styles from "./SpaceBackground.module.css";

export function SpaceBackground() {
  return (
    <div className={styles.background} aria-hidden="true">
      <div className={styles.nebula} />
      <div className={`${styles.layer} ${styles.far}`} style={{ backgroundImage: `url(${BACKGROUNDS.starfieldFar})` }} />
      <div className={`${styles.layer} ${styles.near}`} style={{ backgroundImage: `url(${BACKGROUNDS.starfield})` }} />
      <div className={styles.vignette} />
    </div>
  );
}

export default SpaceBackground;
