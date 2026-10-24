import { systemSprite } from "@/config/assets";
import { ProgressBar } from "@/components/progress/ProgressBar";
import type { PlanetarySystem, ProgressState } from "@/types/domain";
import { MapNode } from "./MapNode";

export type SystemNodeProps = {
  system: PlanetarySystem;
  index: number;
  state: ProgressState;
  href?: string;
  progress?: number;
  size?: number;
};

export function SystemNode({ system, index, state, href, progress, size = 150 }: SystemNodeProps) {
  const number = String(system.order_index || index + 1).padStart(2, "0");

  return (
    <MapNode
      kind="system"
      sprite={systemSprite(system.slug, index)}
      name={system.name}
      label={`Sistema ${number}`}
      state={state}
      size={size}
      href={href}
      eyebrow={`Sistema ${number}`}
      orbit
      delay={index * -0.9}
      footer={progress !== undefined ? <ProgressBar value={progress} label="Progresso" segments={6} /> : undefined}
    />
  );
}

export default SystemNode;
