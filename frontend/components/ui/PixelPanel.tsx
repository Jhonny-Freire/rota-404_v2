import { useId, type ReactNode } from "react";
import { cx } from "./cx";
import styles from "./PixelPanel.module.css";

export type PixelPanelProps = {
  children?: ReactNode;
  title?: string;
  className?: string;
  as?: "section" | "div" | "aside";
  tone?: "default" | "highlight" | "muted";
};

export function PixelPanel({ children, title, className, as: Tag = "section", tone = "default" }: PixelPanelProps) {
  const titleId = useId();

  return (
    <Tag
      className={cx(
        styles.panel,
        tone === "highlight" && styles.highlight,
        tone === "muted" && styles.muted,
        className,
      )}
      aria-labelledby={title && Tag !== "div" ? titleId : undefined}
    >
      {title && (
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
      )}
      {children}
    </Tag>
  );
}

export default PixelPanel;
