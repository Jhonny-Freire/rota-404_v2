"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";
import { BACKGROUNDS, ELEMENTS } from "@/config/assets";
import { Balloon, BrowserFrame, Link, Place, SceneSprite, StageBanner, type ElementKey, type KitTone, type LinkState, type ScenePoint } from "@/components/learning/kit";
import { cx } from "@/components/ui/cx";
import { HACKER_AT, INFO_MAX, MOVE_MS, SERVER_AT, SITE, WIRE } from "./model";
import styles from "./HttpEHttps.module.css";

const NO_POINTER: CSSProperties = { pointerEvents: "none" };

export function Starfield() {
  return <div className={styles.starfield} style={{ backgroundImage: `url(${BACKGROUNDS.starfieldFar})` }} aria-hidden="true" />;
}

export function Live({ text }: { text: string }) {
  return (
    <p className="sr-only" role="status" aria-live="polite">
      {text}
    </p>
  );
}

export function Banner({ text, tone = "info", icon, reducedMotion }: { text: string; tone?: KitTone; icon?: ElementKey; reducedMotion: boolean }) {
  return <StageBanner text={text} tone={tone} icon={icon} reducedMotion={reducedMotion} y={8} live={false} />;
}

export type Protocol = "none" | "http" | "https";

export function urlOf(protocol: Protocol): string {
  return protocol === "none" ? SITE : `${protocol}://${SITE}`;
}

/** Navegador com o site (à esquerda nas cenas 1 a 3). */
export function Window({ protocol, highlight = false, children, x = 3, y = 17, width = 38 }: { protocol: Protocol; highlight?: boolean; children?: ReactNode; x?: number; y?: number; width?: number }) {
  return (
    <Place x={x} y={y} anchor="top-left" width={width} z={3}>
      <div className={styles.windowFit}>
        <BrowserFrame url={urlOf(protocol)} secure={protocol === "https"} highlight={highlight ? "protocol" : "none"} tabTitle="Clube" className={styles.browser}>
          {children}
        </BrowserFrame>
      </div>
    </Place>
  );
}

/** Formulário simples da cena 1: o aluno digita uma informação fictícia e envia. */
export function SendForm({ onSend, sentValue }: { onSend?: (value: string) => void; sentValue?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  if (sentValue !== undefined || !onSend) {
    return (
      <div className={styles.form}>
        <span className={styles.formLabel}>Apelido</span>
        <span className={styles.formValue}>{sentValue}</span>
        <span className={styles.formSent}>
          <img src={ELEMENTS.ok} alt="" draggable={false} />
          Enviado
        </span>
      </div>
    );
  }
  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault();
        const value = inputRef.current?.value.trim() ?? "";
        if (value) onSend(value);
        else inputRef.current?.focus();
      }}
    >
      <label className={styles.formLabel} htmlFor="aula-4-2-apelido">
        Apelido (inventado)
      </label>
      <input
        id="aula-4-2-apelido"
        ref={inputRef}
        className={styles.input}
        maxLength={INFO_MAX}
        placeholder="Ex.: Cometa"
        autoComplete="off"
        spellCheck={false}
      />
      <button type="submit" className={styles.send}>
        Enviar
      </button>
    </form>
  );
}

/** A mensagem: aberta (dá para ler o conteúdo) ou protegida (pacote fechado com cadeado). */
export function Message({ locked, text, at, highlight = false, reducedMotion, pop = false }: { locked: boolean; text: string; at: ScenePoint; highlight?: boolean; reducedMotion: boolean; pop?: boolean }) {
  return (
    <Place x={at.x} y={at.y} z={6} moveMs={reducedMotion ? 0 : MOVE_MS} style={NO_POINTER}>
      <span className={cx(styles.message, highlight && styles.messageLit, pop && styles.pop)} role="img" aria-label={locked ? "Mensagem protegida, fechada com cadeado" : `Mensagem aberta: Apelido ${text}`}>
        {locked ? (
          <span className={styles.locked}>
            <img src={ELEMENTS.box} alt="" draggable={false} className={styles.box} />
            <img src={ELEMENTS.lockClosed} alt="" draggable={false} className={styles.lockBadge} />
          </span>
        ) : (
          <span className={styles.letter}>
            <img src={ELEMENTS.mail} alt="" draggable={false} />
            <span>Apelido: {text}</span>
          </span>
        )}
      </span>
    </Place>
  );
}

/** Hacker no caminho. `sees`: o que ele consegue ver ao interceptar (o conteúdo ou nada). */
export function Hacker({ sees, text, highlighted = false }: { sees: "nothing" | "content" | "locked"; text: string; highlighted?: boolean }) {
  return (
    <>
      <Place x={HACKER_AT.x} y={HACKER_AT.y} z={4}>
        <SceneSprite element="hacker" size={8} label="Hacker" alt="Hacker interceptando a mensagem" highlighted={highlighted} />
      </Place>
      {sees !== "nothing" && (
        <Place x={HACKER_AT.x + 7} y={HACKER_AT.y - 2} anchor="left" z={7}>
          <div className={styles.balloonFit}><div className={styles.pop}>
            <Balloon tail="left" tone={sees === "content" ? "danger" : "success"} size="sm" maxWidth={24}>
              {sees === "content" ? (
                <span className={styles.seen}>Apelido: {text}</span>
              ) : (
                <span className={styles.seen}>
                  <img src={ELEMENTS.lockClosed} alt="" draggable={false} className={styles.inlineLock} />
                  Não dá para ler!
                </span>
              )}
            </Balloon>
          </div></div>
        </Place>
      )}
    </>
  );
}

export function Server({ received = false, highlighted = false }: { received?: boolean; highlighted?: boolean }) {
  return (
    <Place x={SERVER_AT.x} y={SERVER_AT.y - 8} anchor="top" z={3}>
      <SceneSprite element="server" size={9} label="Servidor" alt="Servidor do site" highlighted={highlighted} correct={received} />
    </Place>
  );
}

export function Wire({ state = "idle" }: { state?: LinkState }) {
  return <Link {...WIRE} state={state} thickness={0.7} dots={2} speedMs={900} />;
}
