"use client";

import type { CSSProperties, ReactNode } from "react";
import { BACKGROUNDS, ELEMENTS } from "@/config/assets";
import {
  BrowserFrame,
  Link,
  Place,
  SceneSprite,
  StageBanner,
  Tag,
  type ElementKey,
  type KitTone,
  type LinkState,
  type ScenePoint,
} from "@/components/learning/kit";
import { cx } from "@/components/ui/cx";
import {
  CLIENT,
  FILES,
  FILES_AT,
  INTERNET_AT,
  INTERNET_SIZE,
  MOVE_MS,
  SERVER_AT,
  SERVER_NAME,
  SERVER_SIZE,
  SITE,
  SITE_TITLE,
  TRAVELERS,
  WIRES,
  type ClientLayout,
  type TravelerKind,
} from "./model";
import styles from "./OQueAconteceQuandoAcessoUmSite.module.css";

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

export type BannerProps = {
  text: string;
  tone?: KitTone;
  icon?: ElementKey;
  reducedMotion: boolean;
  y?: number;
};

/** Faixa curta no alto do palco (o que fazer agora). live={false}: a cena já anuncia pelo <Live> e pelo Bonzi. */
export function Banner({ text, tone = "info", icon, reducedMotion, y = 8 }: BannerProps) {
  return <StageBanner text={text} tone={tone} icon={icon} reducedMotion={reducedMotion} y={y} live={false} />;
}

/** Estados visuais de uma parte do mundo. */
export type Look = {
  highlighted?: boolean;
  dimmed?: boolean;
  selected?: boolean;
  correct?: boolean;
  /** pulsa: é o próximo toque */
  pulse?: boolean;
  /** entra com um "pop" */
  pop?: boolean;
  /** "salto" de chegada (troque o valor para repetir) */
  bump?: boolean;
};

/** Ícone de navegador em CSS (mesma cara do BrowserFrame): usado nas cadeias e na explicação da cena 6. */
export function BrowserIcon({ size = 6 }: { size?: number }) {
  return (
    <span className={styles.browserIcon} style={{ "--s": size } as CSSProperties} aria-hidden="true">
      <span className={styles.browserIconBar}>
        <i />
        <i />
        <i />
      </span>
      <span className={styles.browserIconPage} />
    </span>
  );
}

/** Página ainda carregando: linhas cinza piscando (uma animação só, no conjunto). */
export function LoadingPage({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <span className={cx(styles.skeleton, !reducedMotion && styles.blink)} aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}

/** O site jogos.com em miniatura (navegador lateral): imagem, título, texto e botão. */
export function MiniPage() {
  return (
    <span className={styles.mini} role="img" aria-label="Site jogos.com na tela: título, imagem, texto e botão">
      <img src={ELEMENTS.photo} alt="" draggable={false} className={styles.miniPic} />
      <span className={styles.miniCol}>
        <span className={styles.miniTitle}>{SITE_TITLE}</span>
        <span className={styles.miniLine} />
        <span className={styles.miniButton}>Jogar</span>
      </span>
    </span>
  );
}

export type ClientProps = {
  layout: ClientLayout;
  /** conteúdo da área da página do navegador */
  page?: ReactNode;
  loading?: boolean;
  look?: Look;
  /** botão da barra de endereço (cena 1) */
  action?: { label: string; onClick?: () => void; disabled?: boolean; pulse?: boolean };
  /** torna o navegador tocável (cena 6) */
  onTap?: () => void;
  pressed?: boolean;
  /** página alta (cena 5): no celular a janela encolhe mais */
  tall?: boolean;
};

/**
 * Navegador aberto no computador do aluno: a janela (BrowserFrame) "sai" da tela do computador por um rabicho,
 * como a tela ampliada da aula 1.2. Tudo num Place ancorado no topo, em fluxo, para não abrir buracos entre a
 * janela e o computador em larguras diferentes.
 */
export function Client({ layout, page, loading = false, look = {}, action, onTap, pressed, tall = false }: ClientProps) {
  const at = CLIENT[layout];
  const side = layout === "side";
  return (
    <Place x={at.x} y={at.y} anchor="top" width={at.width} z={3} className={side ? undefined : styles.focusPlace}>
      <div className={cx(styles.client, side ? styles.clientSide : styles.clientFocus, tall && styles.clientTall, look.dimmed && styles.dim)}>
        <div className={styles.clientTop}>
          {side && <span className={cx(styles.name, look.pulse && styles.cue)}>Navegador</span>}
          <div
            className={cx(
              styles.frameWrap,
              look.highlighted && styles.ringLit,
              look.selected && styles.ringSelected,
              look.correct && !look.selected && !look.highlighted && styles.ringDone,
            )}
          >
            <BrowserFrame
              url={SITE}
              tabTitle={side ? undefined : SITE}
              loading={loading}
              actionLabel={action?.label}
              onAction={action?.onClick}
              actionDisabled={action?.disabled}
              actionPulse={action?.pulse}
              minHeight={side ? 8 : 14}
              className={styles.browser}
            >
              {page}
            </BrowserFrame>
            {look.correct && <img src={ELEMENTS.ok} alt="" draggable={false} className={styles.doneMark} />}
          </div>
          {onTap && (
            <button type="button" className={styles.tapArea} onClick={onTap} aria-pressed={pressed} aria-label="Navegador" />
          )}
        </div>
        <span className={styles.tail} aria-hidden="true" />
        <SceneSprite
          element="setup"
          size={side ? 6 : 8}
          label={side ? undefined : "Computador"}
          alt="Computador"
          className={styles.computer}
        />
      </div>
    </Place>
  );
}

type NodeProps = {
  at: ScenePoint;
  element: ElementKey;
  size: number;
  /** altura/largura do sprite nativo */
  aspect?: number;
  label?: string;
  alt: string;
  look?: Look;
  onTap?: () => void;
  pressed?: boolean;
};

/** Parte do mundo (internet, servidor, resposta): o Place fica no topo do sprite, então a legenda não o desloca. */
function Node({ at, element, size, aspect = 1, label, alt, look = {}, onTap, pressed }: NodeProps) {
  const top = at.y - (size * aspect * 16) / 9 / 2;
  return (
    <Place x={at.x} y={top} anchor="top">
      <span key={look.bump ? "bump" : "rest"} className={cx(styles.holder, look.pop && styles.pop, look.bump && styles.bump)}>
        <SceneSprite
          element={element}
          size={size}
          label={label}
          alt={alt}
          highlighted={look.highlighted}
          dimmed={look.dimmed}
          selected={look.selected}
          correct={look.correct}
          pulse={look.pulse}
          onClick={onTap}
          pressed={onTap ? Boolean(pressed) : undefined}
        />
      </span>
    </Place>
  );
}

export function InternetNode({ look, onTap, pressed }: { look?: Look; onTap?: () => void; pressed?: boolean }) {
  return (
    <Node at={INTERNET_AT} element="internet" size={INTERNET_SIZE} label="Internet" alt="Internet" look={look} onTap={onTap} pressed={pressed} />
  );
}

/** Servidor: "outro computador" que guarda o site. `named` mostra a placa SERVIDOR. */
export function ServerNode({
  look,
  named = true,
  onTap,
  pressed,
}: {
  look?: Look;
  named?: boolean;
  onTap?: () => void;
  pressed?: boolean;
}) {
  return (
    <Node
      at={SERVER_AT}
      element="server"
      size={SERVER_SIZE}
      label={named ? SERVER_NAME : undefined}
      alt={named ? "Servidor" : "Outro computador"}
      look={look}
      onTap={onTap}
      pressed={pressed}
    />
  );
}

/** Resposta parada no fio (só na cena 6, para ser tocada). */
export function ResponseNode({ at, look, onTap, pressed }: { at: ScenePoint; look?: Look; onTap?: () => void; pressed?: boolean }) {
  return <Node at={at} element="boxGold" size={6} label="Resposta" alt="Resposta" look={look} onTap={onTap} pressed={pressed} />;
}

export type WiresProps = {
  /** fio navegador–internet */
  a?: LinkState;
  /** fio internet–servidor */
  b?: LinkState;
  /** pontos correndo do servidor para o navegador (resposta) */
  back?: boolean;
  dimmed?: boolean;
};

export function Wires({ a = "idle", b = "idle", back = false, dimmed = false }: WiresProps) {
  const className = dimmed ? styles.dimLink : undefined;
  return (
    <>
      <Link {...WIRES.a} state={a} reverse={back} thickness={0.7} dots={2} speedMs={900} className={className} />
      <Link {...WIRES.b} state={b} reverse={back} thickness={0.7} dots={2} speedMs={900} className={className} />
    </>
  );
}

export type TravelerProps = {
  kind: TravelerKind;
  at: ScenePoint;
  reducedMotion: boolean;
  /** entra com "pop" ao aparecer */
  pop?: boolean;
  /** marca de recebido (ok) */
  received?: boolean;
};

/**
 * Pedido (carta) ou resposta (caixa dourada) com a etiqueta em cima. Mude só `at`: o Place desliza até a nova
 * parada (transform), no ritmo das fases da cena; com movimento reduzido ele salta.
 */
export function Traveler({ kind, at, reducedMotion, pop = true, received = false }: TravelerProps) {
  const traveler = TRAVELERS[kind];
  return (
    /* z acima do painel de arquivos (5): no celular a etiqueta encostava nele */
    <Place x={at.x} y={at.y} z={6} moveMs={reducedMotion ? 0 : MOVE_MS} style={NO_POINTER}>
      <span className={cx(styles.holder, styles.traveler, pop && styles.pop)}>
        <SceneSprite element={traveler.element} size={4.6} alt={traveler.label} correct={received}>
          <Tag size="sm" tone={kind === "request" ? "info" : "warning"}>
            {traveler.label}
          </Tag>
        </SceneSprite>
      </span>
    </Place>
  );
}

export type FilesPanelProps = {
  /** quantos arquivos já apareceram (0 a 3) */
  shown: number;
  /** os arquivos entram na resposta (somem em direção ao servidor) */
  packed?: boolean;
  hidden?: boolean;
  /** entra com "pop" (false: já estava na cena anterior) */
  enter?: boolean;
  /** menor (fechamento): cabe entre a cadeia do topo e a etiqueta do pedido */
  small?: boolean;
};

/** Painel acima do servidor: os arquivos e informações do site que ele guarda. */
export function FilesPanel({ shown, packed = false, hidden = false, enter = true, small = false }: FilesPanelProps) {
  const visible = enter ? styles.fileIn : undefined;
  return (
    <Place x={FILES_AT.x} y={FILES_AT.y} anchor="bottom" width={FILES_AT.width} hidden={hidden} z={5}>
      <div className={cx(styles.filesFit, small && styles.filesSmall)}>
        <div className={cx(styles.files, enter && styles.pop)} role="group" aria-label={`Arquivos do site ${SITE} guardados no servidor`}>
          <span className={styles.filesTitle}>Arquivos de {SITE}</span>
          <ul className={styles.fileList}>
            {FILES.map((file, index) => (
              <li
                key={file.id}
                className={cx(styles.file, packed ? styles.filePacked : index < shown ? visible : styles.ghost)}
                aria-hidden={index < shown && !packed ? undefined : true}
              >
                {file.element ? (
                  <img src={ELEMENTS[file.element]} alt="" draggable={false} className={styles.fileImg} />
                ) : (
                  <span className={styles.doc} aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </span>
                )}
                <span className={styles.fileName}>{file.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Place>
  );
}
