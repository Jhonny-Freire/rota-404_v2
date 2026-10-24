import { AVATARS, AVATAR_NATIVE_SIZE, avatarSprite } from "@/config/assets";
import { Sprite } from "@/components/ui/Sprite";
import { cx } from "@/components/ui/cx";
import styles from "./Avatar.module.css";

export type AvatarProps = {
  slug: string;
  size?: number;
  label?: string;
  framed?: boolean;
  className?: string;
};

// Arte nativa (~32 px): exibe sempre em escala inteira para os pixels ficarem iguais.
function pixelArtSize(size: number, framed: boolean, native: number): number {
  const room = framed ? size * 0.84 : size;
  const max = framed ? size : size * 1.1;
  let scale = Math.max(1, Math.round(room / native));
  while (scale > 1 && scale * native > max) scale -= 1;
  return scale * native;
}

export function Avatar({ slug, size = 64, label, framed = false, className }: AvatarProps) {
  const option = AVATARS.find((a) => a.slug === slug);
  const name = label ?? option?.name ?? "Avatar";
  const art = pixelArtSize(size, framed, option?.native ?? AVATAR_NATIVE_SIZE);

  return (
    <span className={cx(styles.avatar, framed && styles.framed, className)} style={{ width: size, height: size }}>
      <Sprite src={avatarSprite(slug)} alt={name} size={art} height={art} className={styles.sprite} />
    </span>
  );
}

export default Avatar;
