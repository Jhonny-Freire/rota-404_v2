"use client";

import type { ReactNode } from "react";
import { ELEMENTS } from "@/config/assets";
import type { ElementKey } from "@/components/learning/kit";
import { cx } from "@/components/ui/cx";
import styles from "./ApiKit.module.css";

/* Peças de HTTP da Galáxia 2: método, endereço em partes, linha de requisição, catálogo fictício e resumo. */

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";
export const METHODS: HttpMethod[] = ["GET", "POST", "PUT", "DELETE"];

const METHOD_CLASS: Record<HttpMethod, string> = {
  GET: styles.mGet,
  POST: styles.mPost,
  PUT: styles.mPut,
  DELETE: styles.mDelete,
};

/** Etiqueta do método em fonte monoespaçada, com a cor de cada intenção. */
export function MethodTag({ method, size = "md", dim = false }: { method: HttpMethod; size?: "sm" | "md" | "lg"; dim?: boolean }) {
  return <span className={cx(styles.method, METHOD_CLASS[method], styles[`method_${size}`], dim && styles.methodDim)}>{method}</span>;
}

export type UrlPart = { key: string; text: string };

/**
 * Barra de endereço com a URL dividida em partes (protocolo, domínio, caminho...). `highlight` acende uma parte;
 * as outras ficam apagadas enquanto houver destaque.
 */
export function UrlBar({ parts, highlight = null, method, label = "Endereço" }: { parts: UrlPart[]; highlight?: string | null; method?: HttpMethod; label?: string }) {
  return (
    <div className={styles.urlBar} role="group" aria-label={`${label}: ${method ? `${method} ` : ""}${parts.map((p) => p.text).join("")}`}>
      {method && <MethodTag method={method} />}
      <span className={styles.urlText} aria-hidden="true">
        {parts.map((part) => (
          <span key={part.key} className={cx(styles.urlPart, highlight && (highlight === part.key ? styles.urlLit : styles.urlDim))}>
            {part.text}
          </span>
        ))}
      </span>
    </div>
  );
}

/** Uma linha de requisição: MÉTODO + caminho (ex.: GET /users/42). */
export function RequestLine({ method, path, status, className }: { method: HttpMethod; path: ReactNode; status?: "ok" | "wrong" | null; className?: string }) {
  return (
    <span className={cx(styles.requestLine, status === "ok" && styles.lineOk, status === "wrong" && styles.lineWrong, className)}>
      <MethodTag method={method} />
      <span className={styles.linePath}>{path}</span>
    </span>
  );
}

/** Código de status com o texto (200 OK, 404 Not Found...). Cor: 2xx verde, 4xx amarelo, 5xx vermelho. */
export function StatusBadge({ code, text, size = "md" }: { code: number; text: string; size?: "md" | "lg" }) {
  const tone = code < 300 ? styles.s2xx : code < 500 ? styles.s4xx : styles.s5xx;
  return (
    <span className={cx(styles.status, tone, size === "lg" && styles.statusLg)}>
      <strong>{code}</strong> {text}
    </span>
  );
}

export type CatalogRow = { id: number; name: string; price: number };
export type RowState = "lit" | "new" | "changed" | "removed" | "dim";

/** Catálogo fictício de produtos (Aula 2.2 e labs 2.3/2.4): uma tabela simples com o estado de cada linha. */
export function Catalog({ rows, states = {}, changedField, title = "Catálogo de produtos" }: { rows: CatalogRow[]; states?: Record<number, RowState>; changedField?: "name" | "price"; title?: string }) {
  return (
    <div className={styles.catalog} role="table" aria-label={title}>
      <div className={styles.catalogHead} role="row">
        <img src={ELEMENTS.box} alt="" draggable={false} />
        <span role="columnheader">{title}</span>
      </div>
      <div className={cx(styles.catalogRow, styles.catalogCols)} role="row">
        <span role="columnheader">id</span>
        <span role="columnheader">nome</span>
        <span role="columnheader">preço</span>
      </div>
      {rows.map((row) => {
        const state = states[row.id];
        return (
          <div
            key={row.id}
            role="row"
            className={cx(
              styles.catalogRow,
              state === "lit" && styles.rowLit,
              state === "new" && styles.rowNew,
              state === "changed" && styles.rowChanged,
              state === "removed" && styles.rowRemoved,
              state === "dim" && styles.rowDim,
            )}
          >
            <span role="cell">{row.id}</span>
            <span role="cell" className={cx(state === "changed" && changedField === "name" && styles.cellChanged)}>
              {row.name}
            </span>
            <span role="cell" className={cx(state === "changed" && changedField === "price" && styles.cellChanged)}>
              R$ {row.price}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export type SummaryItem = { term: ReactNode; meaning: string; element?: ElementKey; label: string };

/** Fechamento: resumo em cartões (ex.: URL = endereço completo | Endpoint = ... ). `upTo` = cartões já visíveis. */
export function SummaryCards({ items, upTo }: { items: SummaryItem[]; upTo: number }) {
  return (
    <ul className={styles.summary} style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }} aria-label="Resumo">
      {items.map((item, index) => (
        <li key={item.label} className={cx(styles.summaryItem, index > upTo && styles.summaryHidden)} aria-hidden={index > upTo}>
          {item.element && <img src={ELEMENTS[item.element]} alt="" draggable={false} />}
          <strong>{item.term}</strong>
          <span>{item.meaning}</span>
        </li>
      ))}
    </ul>
  );
}
