"use client";

import { Fragment, type CSSProperties, type KeyboardEventHandler, type PointerEventHandler, type Ref } from "react";
import { ELEMENTS, SPRITES, type ElementKey } from "@/config/assets";
import { Link, Packet, Place, SceneCanvas, SceneSprite, StageBanner, Tag, type LinkState } from "@/components/learning/kit";
import { cx } from "@/components/ui/cx";
import {
  ADDRESS_HEIGHT,
  ADDRESS_POINT,
  DOMAIN_HEIGHT,
  DOMAIN_POINT,
  LABEL_GAP,
  LINE,
  MAP_TITLE_X,
  MAP_ZONE,
  SERVERS,
  SERVER_SIZE,
  SITE_TITLE_X,
  SITE_ZONE,
  ZONE,
  halfHeight,
  pointerTip,
  widthFor,
  type BannerSpec,
  type Match,
  type Phase,
  type ServerId,
  type SiteDomain,
  type TestRun,
} from "./model";
import styles from "./EncontrandoODestino.module.css";

export type PillTone = "unknown" | "plain" | "compare" | "find" | "ok" | "wrong";

/** Selo do endereço IP (o do domínio embaixo do endereço; o de cada servidor em cima dele). */
export function AddressPill({ ip, tone }: { ip: string | null; tone: PillTone }) {
  return (
    <span className={cx(styles.pill, styles[`pill-${tone}`])} aria-hidden="true">
      <img src={ip ? ELEMENTS.pin : ELEMENTS.question} alt="" draggable={false} className={styles.pillIcon} />
      <span>{ip ?? "IP ?"}</span>
    </span>
  );
}

const ADDRESS_SPRITES: Record<"pin" | "magnifier", { element: ElementKey; w: number; h: number }> = {
  pin: { element: "pin", w: 11, h: 13 },
  magnifier: { element: "magnifier", w: 13, h: 13 },
};

const zoneStyle = (zone: { left: number; width: number }): CSSProperties => ({
  left: `${zone.left}%`,
  width: `${zone.width}%`,
  top: `${ZONE.top}%`,
  height: `${ZONE.bottom - ZONE.top}%`,
});

/** estilos fixos das áreas (fora do componente: o mesmo objeto a cada render) */
const SITE_ZONE_STYLE = zoneStyle(SITE_ZONE);
const MAP_ZONE_STYLE = zoneStyle(MAP_ZONE);

export type MapSceneProps = {
  match: Match;
  round: number;
  phase: Phase;
  test: TestRun | null;
  tried: ServerId[];
  /** instrução do momento no alto do palco */
  banner: BannerSpec;
  /** muda a cada instrução nova: a faixa "salta" de novo mesmo quando o texto se repete */
  bannerKey: number;
  reducedMotion: boolean;
  rootRef: Ref<HTMLDivElement>;
  onDomain: () => void;
  onServer: (id: ServerId) => void;
  onKeyDown: KeyboardEventHandler<HTMLDivElement>;
  onPointerDown: PointerEventHandler<HTMLDivElement>;
};

/** Palco: domínio e endereço à esquerda, mapa com os servidores à direita. */
export function MapScene({
  match,
  round,
  phase,
  test,
  tried,
  banner,
  bannerKey,
  reducedMotion,
  rootRef,
  onDomain,
  onServer,
  onKeyDown,
  onPointerDown,
}: MapSceneProps) {
  const total = match.rounds.length;
  const current = match.rounds[Math.min(round, total - 1)];
  const domain = current.domain;
  const waiting = phase === "arriving" || phase === "waiting";
  const revealed = !waiting && phase !== "lookup";
  const searching = phase === "choose" || phase === "testing";
  const linked = phase === "connected" || phase === "done";

  const hosted: Partial<Record<ServerId, SiteDomain>> = {};
  match.rounds.forEach((r, i) => {
    if (i < round || (i === round && linked)) hosted[r.server.id] = r.domain;
  });

  const target = test ? match.positions[test.server] : null;

  // nome → endereço: desligada até o toque; dados correndo enquanto procura, enquanto a conexão viaja e depois de
  // conectar; parada (ligada) enquanto a criança escolhe o servidor
  let firstLink: LinkState = "idle";
  if (waiting) firstLink = "off";
  else if (phase === "lookup" || phase === "testing" || linked) firstLink = "active";

  const addressArt = phase === "lookup" ? ADDRESS_SPRITES.magnifier : ADDRESS_SPRITES.pin;
  let addressTone: PillTone = "unknown";
  if (searching) addressTone = "find";
  else if (linked) addressTone = "ok";

  const domainLabel = waiting ? `Domínio ${domain.name}. Toque para ver o endereço.` : `Domínio ${domain.name}`;
  let addressLabel = "Endereço IP ainda desconhecido";
  if (phase === "lookup") addressLabel = "Procurando o endereço";
  else if (revealed) addressLabel = `Endereço IP ${current.server.ip}`;

  return (
    <div
      ref={rootRef}
      className={cx(styles.root, reducedMotion && styles.reduced)}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
    >
      <SceneCanvas label="Mapa dos servidores" className={styles.scene}>
        {/* a instrução do momento; o Bonzi fala a mesma ideia (o balão dele já é anunciado) */}
        <StageBanner
          key={bannerKey}
          text={banner.text}
          tone={banner.tone}
          icon={banner.icon}
          reducedMotion={reducedMotion}
          live={false}
        />

        <div className={cx(styles.zone, styles.siteZone)} style={SITE_ZONE_STYLE} aria-hidden="true" />
        <div className={cx(styles.zone, styles.mapZone)} style={MAP_ZONE_STYLE} aria-hidden="true" />

        <Place x={SITE_TITLE_X} y={ZONE.top} z={3}>
          <Tag tone="default" icon="webpage">
            Site {Math.min(round + 1, total)} de {total}
          </Tag>
        </Place>
        <Place x={MAP_TITLE_X} y={ZONE.top} z={3}>
          <span className={styles.mapTitle} aria-hidden="true">
            <Tag tone="info" icon="internet">
              Mapa
            </Tag>
          </span>
        </Place>

        <Link from={DOMAIN_POINT} to={ADDRESS_POINT} state={firstLink} thickness={LINE} />
        {test && target && (
          <Link
            key={`link-${test.run}`}
            from={ADDRESS_POINT}
            to={target}
            state={test.status === "failed" ? "broken" : "active"}
            thickness={LINE}
          />
        )}

        {/* seta-sprite apontando para o domínio enquanto ele espera o toque (desmontada depois: nada anima escondido) */}
        {phase === "waiting" && (
          <Place x={pointerTip(domain)} y={DOMAIN_POINT.y} anchor="right">
            <img src={SPRITES.ui.next} alt="" draggable={false} className={styles.pointer} />
          </Place>
        )}

        <Place key={`domain-${round}`} x={DOMAIN_POINT.x} y={DOMAIN_POINT.y}>
          <span data-focus="domain" className={styles.arrive}>
            <SceneSprite
              element={domain.element}
              size={widthFor(DOMAIN_HEIGHT, domain.w, domain.h)}
              alt={domainLabel}
              onClick={onDomain}
              pulse={!reducedMotion && waiting}
              selected={!waiting && !linked}
              correct={linked}
              mark={false}
            />
          </span>
        </Place>
        <Place
          key={`domain-name-${round}`}
          x={DOMAIN_POINT.x}
          y={DOMAIN_POINT.y + halfHeight(DOMAIN_HEIGHT) + LABEL_GAP}
          anchor="top"
        >
          <span
            className={cx(
              styles.arrive,
              styles.domainName,
              !waiting && !linked && styles.domainNameActive,
              linked && styles.domainNameOk,
            )}
            aria-hidden="true"
          >
            {domain.name}
          </span>
        </Place>

        <Place x={ADDRESS_POINT.x} y={ADDRESS_POINT.y}>
          <SceneSprite
            element={addressArt.element}
            size={widthFor(ADDRESS_HEIGHT, addressArt.w, addressArt.h)}
            alt={addressLabel}
            dimmed={waiting}
            highlighted={searching}
            className={phase === "lookup" ? styles.scan : undefined}
          />
        </Place>
        <Place x={ADDRESS_POINT.x} y={ADDRESS_POINT.y + halfHeight(ADDRESS_HEIGHT) + LABEL_GAP} anchor="top">
          <AddressPill ip={revealed ? current.server.ip : null} tone={addressTone} />
        </Place>

        {match.columns.map((id) => {
          const server = SERVERS[id];
          const p = match.positions[id];
          const isTarget = test?.server === id;
          const wrong = isTarget && test?.status === "failed";
          const correct = (isTarget && test?.status === "ok") || phase === "done";
          const selected = isTarget && test?.status === "travel";
          const wasTried = tried.includes(id);
          const dimmed = wasTried && !isTarget && !linked;
          const site = hosted[id];
          // só o próximo passo pulsa: os servidores ainda não testados enquanto se espera a escolha
          const pulse = !reducedMotion && phase === "choose" && !wasTried;
          let tone: PillTone = "plain";
          if (wrong) tone = "wrong";
          else if (correct) tone = "ok";
          else if (searching && !dimmed) tone = "compare";
          const name = `${server.name}, endereço ${server.ip}${site ? `, site ${site.name}` : ""}${dimmed ? ", já testado" : ""}`;
          return (
            <Fragment key={id}>
              <Place x={p.x} y={p.y - halfHeight(SERVER_SIZE) - LABEL_GAP} anchor="bottom">
                <AddressPill ip={server.ip} tone={tone} />
              </Place>
              <Place x={p.x} y={p.y}>
                <span data-server={id} className={styles.serverHit}>
                  <SceneSprite
                    element="server"
                    size={SERVER_SIZE}
                    alt={name}
                    className={styles.hit}
                    onClick={() => onServer(id)}
                    selected={selected}
                    correct={correct}
                    wrong={wrong}
                    dimmed={dimmed}
                    pulse={pulse}
                  />
                </span>
              </Place>
              <Place x={p.x} y={p.y + halfHeight(SERVER_SIZE) + LABEL_GAP} anchor="top">
                <span className={styles.serverInfo} aria-hidden="true">
                  <span className={styles.serverName}>{server.name}</span>
                  {site && (
                    <span key={site.id} className={styles.hosted}>
                      <img src={ELEMENTS[site.element]} alt="" draggable={false} />
                      {site.name}
                    </span>
                  )}
                </span>
              </Place>
            </Fragment>
          );
        })}

        {/* o pacote some ao conectar (as linhas acesas ficam); no servidor errado ele para, treme e fica até a linha sumir */}
        {test && test.status !== "ok" && (
          <Packet
            key={`packet-${test.run}`}
            path={test.path}
            durationMs={test.durationMs}
            blocked={!test.ok}
            size={4}
            alt="Pacote de dados"
          />
        )}
      </SceneCanvas>
    </div>
  );
}

export default MapScene;
