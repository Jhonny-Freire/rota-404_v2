"use client";

import type { ReactNode } from "react";
import { cx } from "@/components/ui/cx";
import {
  Callout,
  Link,
  Packet,
  Place,
  SceneCanvas,
  SceneSprite,
  StageBanner,
  Tag,
  lerpPoint,
  type LinkState,
  type ScenePoint,
} from "@/components/learning/kit";
import {
  FAILURE,
  FAULT_TAG,
  FULL_PATH,
  FULL_SEGMENTS,
  PART_NAME,
  POS,
  SEGMENTS,
  SLOT,
  STOP_CALLOUT,
  TIMING,
  TOOL_SPRITE,
  VU,
  ZONE,
  baseLinkState,
  cablePos,
  routerPos,
  segmentEnds,
  spriteAspect,
  spriteSize,
  travelMs,
  type BannerSpec,
  type FaultId,
  type NetFlags,
  type PartId,
  type SegmentId,
  type SpriteId,
} from "./model";
import styles from "./MissaoRecuperarAConexao.module.css";

export type TestRun = { run: number; ok: boolean; status: "running" | "failed" | "passed" };
export type Inspection = { part: PartId; run: number };
export type Acting = { tool: FaultId; correct: boolean };
export type PartMarks = Partial<Record<PartId, "correct" | "wrong">>;
/** Tudo o que pode ser tocado no palco: as 4 peças, o cabo (da internet), a impressora e o site. */
export type TapTarget = PartId | "cable" | "printer" | "site";

export type NetworkSceneProps = {
  fault: FaultId;
  flags: NetFlags;
  test: TestRun | null;
  inspecting: Inspection | null;
  marks: PartMarks;
  acting: Acting | null;
  /** instrução do momento no alto do palco */
  banner: BannerSpec;
  /** muda a cada instrução nova: a faixa "salta" de novo mesmo quando o texto se repete */
  bannerKey: number;
  /** etapa de investigação: as peças ainda não verificadas dizem "toque para investigar" */
  investigating: boolean;
  /** pulsa os componentes ainda não investigados */
  hintPulse: boolean;
  reducedMotion: boolean;
  onTap: (target: TapTarget) => void;
  onArrive: () => void;
};

const MINI_MS = 850;

/** todas as linhas com a mesma espessura (unidades do kit) */
const LINE = 0.8;

type NodeProps = {
  at: ScenePoint;
  /** sprite da peça: define a altura usada para centralizar */
  sprite: SpriteId;
  moveMs?: number;
  children: ReactNode;
};

/**
 * Peça do palco ancorada no topo do sprite: o centro do sprite fica exatamente em `at` (as linhas chegam no meio dele)
 * e a legenda e o selo de resultado crescem para baixo sem empurrar o sprite.
 */
function Node({ at, sprite, moveMs = 0, children }: NodeProps) {
  const top = at.y - (spriteSize(sprite) * spriteAspect(sprite)) / 2 / VU;
  return (
    <Place x={at.x} y={top} anchor="top" moveMs={moveMs}>
      <div className={styles.node}>{children}</div>
    </Place>
  );
}

export function NetworkScene({
  fault,
  flags,
  test,
  inspecting,
  marks,
  acting,
  banner,
  bannerKey,
  investigating,
  hintPulse,
  reducedMotion,
  onTap,
  onArrive,
}: NetworkSceneProps) {
  const failure = FAILURE[fault];
  const passed = test?.status === "passed";
  const stopped = test?.status === "failed";
  const router = routerPos(flags);
  const cable = cablePos(flags);
  const look = inspecting?.part ?? null;
  // ação certa: a peça brilha enquanto é consertada; ação errada: só uma tremida de "nada mudou"
  const fixing = acting?.correct ? TOOL_SPRITE[acting.tool] : null;
  const shaking = acting && !acting.correct ? TOOL_SPRITE[acting.tool] : null;
  // o deslize só existe durante o conserto: fora dele, mudar o tamanho do palco não pode fazer a peça "voar" pela cena
  const moveMs = (part: "router" | "cable") => (fixing === part && !reducedMotion ? TIMING.move : 0);
  const printerLinked = !flags.aimWifi;

  const linkState = (id: SegmentId): LinkState | null => {
    let state = baseLinkState(id, flags);
    if (test) {
      if (test.ok) {
        if (FULL_SEGMENTS.includes(id)) state = "active";
      } else if (test.status === "running" && failure.traversed.includes(id)) {
        state = "active";
      } else if (stopped && id === failure.failing) {
        state = "broken";
      }
    }
    return state;
  };

  const markOf = (part: PartId) => (passed ? "correct" : marks[part]);

  /** texto do resultado para nomes acessíveis */
  const statusOf = (part: PartId): string | null => {
    const mark = markOf(part);
    if (mark === "wrong") return FAULT_TAG[fault].toLowerCase();
    if (mark === "correct") return "funcionando";
    return investigating ? "toque para investigar" : null;
  };

  const partProps = (part: PartId) => {
    const mark = markOf(part);
    const status = statusOf(part);
    return {
      alt: status ? `${PART_NAME[part]}: ${status}` : PART_NAME[part],
      label: PART_NAME[part],
      onClick: () => onTap(part),
      highlighted: look === part || fixing === part,
      correct: mark === "correct",
      wrong: mark === "wrong",
      pulse: hintPulse && !mark,
    };
  };

  /**
   * Só a peça com problema ganha um selo vermelho curto embaixo do nome; a peça que funciona fica só com o anel verde
   * e o ✓ do kit. O resultado já está no nome acessível da peça, por isso o selo fica escondido dos leitores de tela.
   */
  const badge = (part: PartId): ReactNode =>
    markOf(part) === "wrong" ? (
      <span className={cx(styles.chip, styles.chipDanger, styles.pop)} aria-hidden="true">
        {FAULT_TAG[fault]}
      </span>
    ) : null;

  const miniPackets = (path: ScenePoint[], element: "box" | "photo" = "box") =>
    [0, 1].map((n) => (
      <Packet
        key={`mini-${inspecting?.run ?? 0}-${n}`}
        path={path}
        element={element}
        size={3}
        durationMs={MINI_MS}
        delayMs={n * 480}
        hideOnArrive
        z={3}
      />
    ));

  let inspectFlow: ReactNode = null;
  if (look === "pc") {
    inspectFlow = miniPackets([POS.pc, flags.aimWifi ? POS.wifi : POS.printer]);
  } else if (look === "router" && flags.routerIn) {
    inspectFlow = miniPackets([lerpPoint(POS.wifi, router, 0.45), router, lerpPoint(router, cable, 0.6)]);
  } else if (look === "internet" && flags.plugged) {
    inspectFlow = miniPackets([POS.internet, POS.site], "photo");
  }

  // ondas só quando o Wi-Fi funciona de verdade (investigação ou conserto certo)
  const showWaves = flags.wifiOn && (look === "wifi" || fixing === "wifi");
  const testPath = test ? (test.ok ? FULL_PATH : failure.path) : null;
  const callout = STOP_CALLOUT[fault];

  const internetStatus = statusOf("internet");
  const cableAlt = `Cabo da internet${internetStatus ? `: ${internetStatus}` : ""}`;
  const pcStatus = statusOf("pc");
  const printerAlt = printerLinked
    ? `Impressora, ligada ao computador${pcStatus ? ` (computador: ${pcStatus})` : ""}`
    : "Impressora";

  return (
    <SceneCanvas
      label="Rede simulada: computador, Wi-Fi, roteador, cabo, internet e site"
      backdrop="floor"
      className={cx(styles.scene, reducedMotion && styles.reduced)}
    >
      {/* a instrução do momento; o Bonzi fala a mesma ideia (o balão dele já é anunciado) */}
      <StageBanner
        key={bannerKey}
        text={banner.text}
        tone={banner.tone}
        icon={banner.icon}
        reducedMotion={reducedMotion}
        live={false}
      />

      <div
        className={styles.zone}
        style={{ left: `${ZONE.left}%`, top: `${ZONE.top}%`, width: `${ZONE.width}%`, height: `${ZONE.height}%` }}
        aria-hidden="true"
      />
      <Place x={ZONE.left + 1} y={ZONE.top} anchor="left">
        <Tag tone="info" size="md" icon="house">
          Rede de casa
        </Tag>
      </Place>

      {SEGMENTS.map((id) => {
        const state = linkState(id);
        if (!state) return null;
        const [from, to] = segmentEnds(id, flags);
        // o "Parou aqui!" já marca o ponto da falha: sem o X no meio da linha
        return <Link key={id} from={from} to={to} state={state} thickness={LINE} speedMs={1100} breakMark={false} />;
      })}

      {/* roteador fora de casa: o lugar dele na fileira fica vazio ("falta alguma coisa aqui") */}
      <Place x={POS.router.x} y={POS.router.y} z={1} hidden={flags.routerIn}>
        <span
          className={styles.slot}
          style={{
            width: `calc(${SLOT.width} * var(--kit-u, 1cqw))`,
            height: `calc(${SLOT.height} * var(--kit-u, 1cqw))`,
          }}
          aria-hidden="true"
        />
      </Place>

      {showWaves && (
        <Place x={POS.wifi.x} y={POS.wifi.y} z={1}>
          <span className={styles.waves} aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </Place>
      )}

      <Node at={POS.pc} sprite="pc">
        <SceneSprite element="pc" size={spriteSize("pc")} {...partProps("pc")} className={cx(shaking === "pc" && styles.nudge)} />
        {badge("pc")}
      </Node>

      <Node at={POS.printer} sprite="printer">
        <SceneSprite
          element="printer"
          size={spriteSize("printer")}
          label="Impressora"
          alt={printerAlt}
          onClick={() => onTap("printer")}
          highlighted={printerLinked && look === "pc"}
          mark={false}
        />
      </Node>

      <Node at={POS.wifi} sprite="wifi">
        <SceneSprite
          element="wifi"
          size={spriteSize("wifi")}
          {...partProps("wifi")}
          className={cx(!flags.wifiOn && styles.off, shaking === "wifi" && styles.nudge)}
        />
        {badge("wifi")}
      </Node>

      <Node at={router} sprite="router" moveMs={moveMs("router")}>
        <SceneSprite
          element="router"
          size={spriteSize("router")}
          {...partProps("router")}
          className={cx(shaking === "router" && styles.nudge)}
        />
        {badge("router")}
      </Node>

      <Node at={cable} sprite="cable" moveMs={moveMs("cable")}>
        <SceneSprite
          element="cable"
          size={spriteSize("cable")}
          label="Cabo"
          alt={cableAlt}
          onClick={() => onTap("cable")}
          highlighted={look === "internet" || fixing === "cable"}
          wrong={markOf("internet") === "wrong"}
          mark={false}
          className={cx(shaking === "cable" && styles.nudge)}
        />
      </Node>

      <Node at={POS.internet} sprite="internet">
        <SceneSprite element="internet" size={spriteSize("internet")} {...partProps("internet")} />
        {badge("internet")}
      </Node>

      {/* o objetivo: um único selo pequeno diz se a conexão chega até o site */}
      <Node at={POS.site} sprite="webpage">
        <SceneSprite
          element="webpage"
          size={spriteSize("webpage")}
          label="Site"
          alt={`Site que o computador quer abrir: ${passed ? "conectado" : "sem conexão"}`}
          onClick={() => onTap("site")}
          correct={passed}
          highlighted={passed}
        />
        {passed ? (
          <span key="on" className={cx(styles.chip, styles.chipOk, styles.pop)} aria-hidden="true">
            Conectado
          </span>
        ) : (
          <span key="off" className={cx(styles.chip, styles.chipDanger)} aria-hidden="true">
            Sem conexão
          </span>
        )}
      </Node>

      {inspectFlow}

      {test && testPath && (
        <Packet
          key={`test-${test.run}`}
          path={testPath}
          size={4}
          durationMs={travelMs(testPath)}
          blocked={!test.ok}
          hideOnArrive={test.ok}
          onArrive={onArrive}
          alt="Pacote de dados"
        />
      )}

      {/* fica no ponto da falha até uma ação ser aplicada (e volta se o novo teste falhar) */}
      {test?.status === "failed" && (
        <Place key={`stop-${test.run}`} x={callout.at.x} y={callout.at.y} anchor={callout.anchor} z={5}>
          <Callout tone="danger" tail={callout.tail} size="md" className={styles.stop}>
            {callout.text}
          </Callout>
        </Place>
      )}
    </SceneCanvas>
  );
}

export default NetworkScene;
