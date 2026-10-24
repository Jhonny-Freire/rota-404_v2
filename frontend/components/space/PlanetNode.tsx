import { SPRITES, planetSprite } from "@/config/assets";
import { Sprite } from "@/components/ui/Sprite";
import type { PlanetType, ProgressState } from "@/types/domain";
import { MapNode } from "./MapNode";
import styles from "./PlanetNode.module.css";

export type PlanetNodeProps = {
  name: string;
  type: PlanetType;
  state: ProgressState;
  href?: string;
  /** slug do planeta (arte em PLANET_SPRITES) */
  slug?: string | null;
  preview?: boolean;
  index?: number;
  size?: number;
  onLockedClick?: () => void;
  highlight?: boolean;
};

export const PLANET_TYPE_LABELS: Record<PlanetType, string> = {
  lesson: "Aula",
  lab: "Laboratório",
};

export function PlanetNode({
  name,
  type,
  state,
  href,
  slug,
  preview = false,
  index = 0,
  size = 128,
  onLockedClick,
  highlight = false,
}: PlanetNodeProps) {
  return (
    <MapNode
      kind="planet"
      sprite={planetSprite(slug, type)}
      name={name}
      label={PLANET_TYPE_LABELS[type]}
      state={state}
      size={size}
      href={href}
      onLockedClick={onLockedClick}
      preview={preview}
      highlight={highlight}
      delay={index * -0.7}
      eyebrow={
        <span className={`${styles.tag} ${styles[type]}`}>
          <Sprite src={type === "lesson" ? SPRITES.space.tagLesson : SPRITES.space.tagLab} alt="" decorative size={16} />
          {PLANET_TYPE_LABELS[type]}
        </span>
      }
    />
  );
}

export default PlanetNode;
