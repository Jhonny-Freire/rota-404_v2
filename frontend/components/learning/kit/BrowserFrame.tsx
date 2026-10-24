import type { CSSProperties, ReactNode } from "react";
import { ELEMENTS } from "@/config/assets";
import { cx } from "./util";
import styles from "./BrowserFrame.module.css";

export type BrowserFrameProps = {
  /** texto da barra de endereço (livre: "jogos.com", "https://exemplo.com") */
  url: string;
  /** conteúdo da página (ex.: <PagePreview>, formulário em CSS) */
  children?: ReactNode;
  /** mostra o cadeado (ELEMENTS.lockClosed) antes do endereço */
  secure?: boolean;
  /** destaca o endereço inteiro ou só o protocolo ("http://" / "https://") */
  highlight?: "none" | "url" | "protocol";
  /** barra de carregamento animada */
  loading?: boolean;
  /** título da aba */
  tabTitle?: string;
  /** botão na barra de endereço (ex.: "Acessar") */
  actionLabel?: string;
  onAction?: () => void;
  actionDisabled?: boolean;
  /** destaca o botão de ação (pulsa) */
  actionPulse?: boolean;
  /** altura mínima da área da página em unidades do kit */
  minHeight?: number;
  className?: string;
  style?: CSSProperties;
};

function splitProtocol(url: string): [string, string] {
  const match = /^([a-z]+:\/\/)(.*)$/i.exec(url);
  return match ? [match[1], match[2]] : ["", url];
}

/** Moldura de navegador em CSS: aba, barra de endereço (texto livre) e área da página. */
export function BrowserFrame({
  url,
  children,
  secure = false,
  highlight = "none",
  loading = false,
  tabTitle,
  actionLabel,
  onAction,
  actionDisabled = false,
  actionPulse = false,
  minHeight,
  className,
  style,
}: BrowserFrameProps) {
  const [protocol, rest] = splitProtocol(url);
  return (
    <div className={cx(styles.browser, className)} style={style}>
      <div className={styles.top} aria-hidden="true">
        <span className={styles.dots}>
          <span />
          <span />
          <span />
        </span>
        {tabTitle && <span className={styles.tab}>{tabTitle}</span>}
      </div>
      <div className={styles.bar}>
        <div className={cx(styles.address, highlight === "url" && styles.addressHighlight)} aria-label={`Endereço: ${url}`} role="note">
          {secure && <img src={ELEMENTS.lockClosed} alt="" draggable={false} className={styles.lock} />}
          <span className={styles.url}>
            {protocol && <span className={cx(highlight === "protocol" && styles.protocolHighlight)}>{protocol}</span>}
            {rest}
          </span>
        </div>
        {actionLabel && (
          <button
            type="button"
            className={cx(styles.action, actionPulse && styles.pulse)}
            onClick={onAction}
            disabled={actionDisabled || !onAction}
          >
            {actionLabel}
          </button>
        )}
      </div>
      {loading && <div className={styles.loading} aria-label="Carregando" role="progressbar" />}
      <div className={styles.page} style={minHeight ? { minHeight: `calc(${minHeight} * var(--kit-u, 8px))` } : undefined}>
        {children}
      </div>
    </div>
  );
}

export default BrowserFrame;
