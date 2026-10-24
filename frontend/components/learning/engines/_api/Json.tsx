"use client";

import type { ReactNode } from "react";
import { cx } from "@/components/ui/cx";
import styles from "./ApiKit.module.css";

/*
 * Visualizador de JSON da Galáxia 2: o texto aparece em linhas, com cores por tipo de token. Partes podem ser
 * tocáveis (Microinteração da 3.1, Caça ao dado, Desafio final), objetos e listas podem abrir e fechar, e linhas
 * podem ser destacadas. Para um exemplo INVÁLIDO (3.1), monte as linhas à mão com `Tok`.
 */

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

/** o que o aluno pode identificar num JSON */
export type JsonPart = "object" | "key" | "string" | "number" | "boolean" | "null" | "list";

export type Tok = {
  text: string;
  kind: "punct" | "key" | "string" | "number" | "boolean" | "null" | "toggle" | "missing" | "space";
  /** caminho do valor (ex.: "produto.preco", "produtos[1]") */
  path?: string;
  part?: JsonPart;
};

export type JsonLine = { indent: number; toks: Tok[]; path: string };

const childPath = (base: string, key: string | number) => (typeof key === "number" ? `${base}[${key}]` : base ? `${base}.${key}` : key);

function primitive(value: JsonValue, path: string): Tok {
  if (typeof value === "string") return { text: JSON.stringify(value), kind: "string", path, part: "string" };
  if (typeof value === "number") return { text: String(value), kind: "number", path, part: "number" };
  if (typeof value === "boolean") return { text: String(value), kind: "boolean", path, part: "boolean" };
  return { text: "null", kind: "null", path, part: "null" };
}

const isPrimitive = (v: JsonValue) => v === null || typeof v !== "object";

/**
 * Converte um valor em linhas. `expanded`: caminhos de objetos/listas abertos ("all" = tudo aberto). O objeto raiz
 * está sempre aberto. Listas só de valores simples ficam numa linha (ex.: "jogos": ["X", "Y"]).
 */
export function jsonLines(value: JsonValue, expanded: "all" | string[] = "all"): JsonLine[] {
  const lines: JsonLine[] = [];
  const open = (path: string) => path === "" || expanded === "all" || expanded.includes(path);

  const walk = (val: JsonValue, path: string, indent: number, prefix: Tok[], comma: boolean) => {
    const tail: Tok[] = comma ? [{ text: ",", kind: "punct" }] : [];
    if (isPrimitive(val)) {
      lines.push({ indent, path, toks: [...prefix, primitive(val, path), ...tail] });
      return;
    }
    const isList = Array.isArray(val);
    const entries: [string | number, JsonValue][] = isList ? (val as JsonValue[]).map((v, i) => [i, v]) : Object.entries(val as Record<string, JsonValue>);
    const [l, r] = isList ? ["[", "]"] : ["{", "}"];
    const part: JsonPart = isList ? "list" : "object";
    if (isList && entries.every(([, v]) => isPrimitive(v))) {
      const inner: Tok[] = [];
      entries.forEach(([i, v], n) => {
        inner.push(primitive(v, childPath(path, i)));
        if (n < entries.length - 1) inner.push({ text: ", ", kind: "punct" });
      });
      lines.push({ indent, path, toks: [...prefix, { text: l, kind: "punct", path, part }, ...inner, { text: r, kind: "punct", path, part }, ...tail] });
      return;
    }
    if (!open(path)) {
      const count = entries.length;
      const label = isList ? `[ ${count} ${count === 1 ? "item" : "itens"} ]` : `{ ${count} ${count === 1 ? "campo" : "campos"} }`;
      lines.push({ indent, path, toks: [...prefix, { text: label, kind: "toggle", path, part }, ...tail] });
      return;
    }
    lines.push({ indent, path, toks: [...prefix, { text: l, kind: "punct", path, part }] });
    entries.forEach(([key, v], n) => {
      const p = childPath(path, key);
      const keyToks: Tok[] = isList ? [] : [{ text: JSON.stringify(key), kind: "key", path: p, part: "key" }, { text: ": ", kind: "punct" }];
      walk(v, p, indent + 1, keyToks, n < entries.length - 1);
    });
    lines.push({ indent, path, toks: [{ text: r, kind: "punct", path, part }, ...tail] });
  };

  walk(value, "", 0, [], false);
  return lines;
}

const KIND_CLASS: Record<Tok["kind"], string> = {
  punct: styles.jPunct,
  key: styles.jKey,
  string: styles.jString,
  number: styles.jNumber,
  boolean: styles.jBoolean,
  null: styles.jNull,
  toggle: styles.jToggle,
  missing: styles.jMissing,
  space: "",
};

export type JsonViewProps = {
  lines: JsonLine[];
  /** linhas destacadas: o caminho da linha ou um caminho "pai" dela */
  highlight?: string[];
  /** marca de um valor/chave: certo, errado ou dica */
  marks?: Record<string, "ok" | "wrong" | "hint">;
  /** tokens tocáveis: quais partes */
  tappable?: JsonPart[];
  onTap?: (tok: Tok) => void;
  /** abrir/fechar objetos e listas recolhidos */
  onToggle?: (path: string) => void;
  /** acende os sinais de estrutura (aspas, dois-pontos, vírgulas, chaves e colchetes) */
  showPunct?: boolean;
  label: string;
  title?: ReactNode;
  className?: string;
};

export function JsonView({ lines, highlight = [], marks = {}, tappable = [], onTap, onToggle, showPunct = false, label, title, className }: JsonViewProps) {
  const lit = (path: string) => highlight.some((h) => h === path || (h !== "" && path.startsWith(`${h}.`)) || (h !== "" && path.startsWith(`${h}[`)));
  return (
    <div className={cx(styles.json, showPunct && styles.jsonPunct, className)} role="group" aria-label={label}>
      {title && <div className={styles.jsonTitle}>{title}</div>}
      <div className={styles.jsonBody}>
        {lines.map((line, index) => (
          <div key={`${line.path}-${index}`} className={cx(styles.jLine, lit(line.path) && styles.jLineLit)} style={{ paddingLeft: `${line.indent * 1.6}em` }}>
            {line.toks.map((tok, t) => {
              const mark = tok.path && (tok.kind === "key" ? marks[`key:${tok.path}`] : marks[tok.path]);
              const cls = cx(KIND_CLASS[tok.kind], mark === "ok" && styles.jOk, mark === "wrong" && styles.jWrong, mark === "hint" && styles.jHint);
              if (tok.kind === "toggle" && onToggle && tok.path !== undefined) {
                return (
                  <button key={t} type="button" className={cx(styles.jTap, cls)} onClick={() => onToggle(tok.path!)} aria-label={`Abrir ${tok.path || "objeto"}: ${tok.text}`}>
                    {tok.text}
                  </button>
                );
              }
              if (onTap && tok.part && tappable.includes(tok.part)) {
                return (
                  <button key={t} type="button" className={cx(styles.jTap, cls)} onClick={() => onTap(tok)} aria-label={`${tok.text}${tok.path ? ` (${tok.path})` : ""}`}>
                    {tok.text}
                  </button>
                );
              }
              return (
                <span key={t} className={cls}>
                  {tok.text}
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
