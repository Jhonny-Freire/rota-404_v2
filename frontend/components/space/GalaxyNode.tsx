import { galaxySprite } from "@/config/assets";
import { ProgressBar } from "@/components/progress/ProgressBar";
import type { Galaxy, ProgressState } from "@/types/domain";
import { MapNode } from "./MapNode";

export type GalaxyNodeProps = {
  galaxy: Galaxy;
  state: ProgressState;
  href?: string;
  progress?: number;
  onLockedClick?: () => void;
  size?: number;
  highlight?: boolean;
};

export function GalaxyNode({ galaxy, state, href, progress, onLockedClick, size = 220, highlight = false }: GalaxyNodeProps) {
  return (
    <MapNode
      kind="galaxy"
      sprite={galaxySprite(galaxy.slug)}
      name={galaxy.name}
      label="Galáxia"
      state={state}
      size={size}
      href={href}
      onLockedClick={onLockedClick}
      eyebrow="Galáxia"
      highlight={highlight}
      footer={progress !== undefined ? <ProgressBar value={progress} label="Progresso" segments={8} /> : undefined}
    />
  );
}

export default GalaxyNode;
