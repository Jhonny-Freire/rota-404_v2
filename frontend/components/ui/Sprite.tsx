import { cx } from "./cx";
import styles from "./Sprite.module.css";

export type SpriteProps = {
  src: string;
  alt: string;
  size?: number;
  height?: number;
  className?: string;
  pixelated?: boolean;
  decorative?: boolean;
};

export function Sprite({ src, alt, size, height, className, pixelated = true, decorative = false }: SpriteProps) {
  return (
    <img
      src={src}
      alt={decorative ? "" : alt}
      aria-hidden={decorative || undefined}
      width={size}
      height={height}
      draggable={false}
      className={cx(styles.sprite, pixelated && styles.pixelated, className)}
    />
  );
}

export default Sprite;
