"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { SPRITES } from "@/config/assets";
import { PROGRESS_LABELS } from "@/lib/progress";
import { ProgressStateBadge } from "@/components/progress/ProgressStateBadge";
import { Sprite } from "@/components/ui/Sprite";
import { cx } from "@/components/ui/cx";
import type { ProgressState } from "@/types/domain";
import styles from "./MapNode.module.css";

export type MapNodeProps = {
  kind: "galaxy" | "system" | "planet";
  sprite: string;
  name: string;
  label?: string;
  state: ProgressState;
  size: number;
  href?: string;
  onLockedClick?: () => void;
  eyebrow?: ReactNode;
  footer?: ReactNode;
  preview?: boolean;
  orbit?: boolean;
  delay?: number;
};

export function MapNode({
  kind,
  sprite,
  name,
  label,
  state,
  size,
  href,
  onLockedClick,
  eyebrow,
  footer,
  preview = false,
  orbit = false,
  delay = 0,
}: MapNodeProps) {
  const locked = state === "locked";
  const className = cx(
    styles.node,
    styles[kind],
    locked && styles.locked,
    preview && styles.preview,
    (href && !locked) || (locked && onLockedClick) ? styles.interactive : undefined,
  );
  const ariaLabel = [label, name, PROGRESS_LABELS[state], preview ? "prévia" : null].filter(Boolean).join(", ");
  const style = { "--node-size": `${size}px`, "--node-delay": `${delay}s` } as CSSProperties;

  const content = (
    <>
      <span className={styles.art} data-map-anchor="">
        {orbit && <span className={styles.orbit} aria-hidden="true" />}
        <span className={styles.glow} aria-hidden="true" />
        <span className={styles.spriteWrap}>
          <Sprite src={sprite} alt="" decorative className={styles.sprite} />
        </span>
        {locked && <Sprite src={SPRITES.status.locked} alt="" decorative className={styles.lock} />}
        {preview && <span className={styles.previewTag}>Prévia</span>}
      </span>
      <span className={styles.caption}>
        {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
        <span className={styles.name}>{name}</span>
        <ProgressStateBadge state={state} size={16} />
      </span>
      {footer && <span className={styles.footer}>{footer}</span>}
    </>
  );

  if (locked && onLockedClick) {
    return (
      <button type="button" className={className} style={style} onClick={onLockedClick} aria-label={ariaLabel}>
        {content}
      </button>
    );
  }

  if (href && !locked) {
    return (
      <Link href={href} className={className} style={style} aria-label={ariaLabel}>
        {content}
      </Link>
    );
  }

  return (
    <div className={className} style={style}>
      {content}
    </div>
  );
}

export default MapNode;
