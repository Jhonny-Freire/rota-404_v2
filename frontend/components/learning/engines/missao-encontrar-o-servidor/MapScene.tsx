"use client";

import { Fragment, memo, type CSSProperties, type KeyboardEvent, type MouseEvent, type ReactNode, type Ref } from "react";
import { ELEMENTS, SPRITES } from "@/config/assets";
import { cx } from "@/components/ui/cx";
import {
  Block,
  BrowserFrame,
  Link,
  Packet,
  PagePreview,
  Place,
  SceneCanvas,
  SceneSprite,
  StageBanner,
  lerpPoint,
  sceneAngle,
  useSequence,
  type LinkState,
} from "@/components/learning/kit";
import {
  DEST_Y,
  INTERNET_ID,
  JUNCTION_PHASES,
  LAST_LAYER,
  REQUEST_SIZE,
  RESPONSE_SIZE,
  START_ID,
  TIMING,
  center,
  spriteSize,
  travelMs,
  type BannerSpec,
  type Destino,
  type MapNode,
  type Mission,
  type Phase,
  type Trip,
} from "./model";
import styles from "./MissaoEncontrarOServidor.module.css";

export type MapSceneProps = {
  mission: Mission;
  phase: Phase;
  /** pontos seguros já alcançados (o último é onde a requisição está) */
  route: string[];
  /** caminhos sem saída já testados */
  tried: string[];
  trip: Trip;
  received: boolean;
  /** Bonzi mostra a direção do próximo passo */
  help: boolean;
  /** vez da criança escolher: pulsa as etapas possíveis (só a da seta, quando o Bonzi ajuda) */
  invite: boolean;
  /** instrução do momento no alto do palco */
  banner: BannerSpec;
  /** muda a cada lembrete: a faixa "salta" de novo mesmo quando o texto se repete */
  bannerKey: string;
  reducedMotion: boolean;
  /** raiz do mapa (o foco do teclado procura as etapas livres aqui) */
  rootRef?: Ref<HTMLDivElement>;
  onReceive: () => void;
  onChoose: (id: string) => void;
  /** chegada da viagem `tripId` da requisição */
  onArrive: (tripId: number) => void;
  onResponse: () => void;
  /** toque no palco fora de uma peça que pode ser escolhida */
  onBackground: () => void;
  onKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void;
  onPointerDown?: () => void;
};

function describe(node: MapNode): string {
  return node.ip ? `${node.name}, IP ${node.ip}` : node.name;
}

/**
 * Todos os caminhos possíveis entre as camadas ainda à frente (cinza, apagados): é o "labirinto". Os sem saída também
 * seguem adiante no desenho, senão o mapa entregaria a resposta. Memo: só muda quando a requisição avança de camada.
 */
const GhostMesh = memo(function GhostMesh({ layers, from }: { layers: MapNode[][]; from: number }) {
  const lines: ReactNode[] = [];
  for (let layer = from; layer < LAST_LAYER; layer++) {
    for (const a of layers[layer]) {
      for (const b of layers[layer + 1]) {
        lines.push(<Link key={`g-${a.id}-${b.id}`} from={center(a)} to={center(b)} state="off" thickness={0.5} className={styles.ghost} />);
      }
    }
  }
  return <>{lines}</>;
});

function PageReveal({ destino, reducedMotion }: { destino: Destino; reducedMotion: boolean }) {
  const { done } = useSequence([TIMING.pageLoading], { reducedMotion });
  return (
    <>
      <div className={styles.scrim} aria-hidden="true" />
      <Place x={52} y={60} z={6} width={46}>
        <div className={styles.pageWrap}>
          <BrowserFrame url={destino.domain} tabTitle={destino.title} loading={!done}>
            {done ? (
              <PagePreview label={`Página de ${destino.domain}`} dense className={styles.pageBody}>
                <Block kind="title" text={destino.title} />
                <div className={styles.pageRow}>
                  <Block kind="image" imageElement={destino.image} ariaLabel="Imagem da página" />
                  <Block kind="text" ariaLabel="Texto da página" className={styles.pageText} />
                </div>
              </PagePreview>
            ) : (
              <div className={styles.pageBlank} aria-label="Carregando a página" role="status" />
            )}
          </BrowserFrame>
        </div>
      </Place>
    </>
  );
}

export function MapScene({
  mission,
  phase,
  route,
  tried,
  trip,
  received,
  help,
  invite,
  banner,
  bannerKey,
  reducedMotion,
  rootRef,
  onReceive,
  onChoose,
  onArrive,
  onResponse,
  onBackground,
  onKeyDown,
  onPointerDown,
}: MapSceneProps) {
  const { layers, byId, destino, ip } = mission;
  const current = byId[route[route.length - 1]] ?? mission.start;
  const atJunction = received && JUNCTION_PHASES.includes(phase);
  const finished = phase === "responding" || phase === "page";
  const nextLayer = atJunction ? (layers[current.layer + 1] ?? []) : [];
  const hintNode = help ? nextLayer.find((node) => node.correct && !tried.includes(node.id)) : undefined;
  const ipShown = route.includes(INTERNET_ID);

  // o caminho certo fica iluminado (ciano, parado); os pontos só correm quando a resposta volta por ele
  const links: ReactNode[] = [];
  for (let i = 1; i < route.length; i++) {
    const a = byId[route[i - 1]];
    const b = byId[route[i]];
    const flowing = phase === "responding";
    links.push(
      <Link
        key={`w-${a.id}-${b.id}`}
        from={center(a)}
        to={center(b)}
        state={flowing ? "active" : "idle"}
        reverse
        thickness={1}
        speedMs={900}
        dots={2}
        className={cx(!flowing && styles.walked)}
      />,
    );
  }
  for (const node of nextLayer) {
    let state: LinkState = "idle";
    if (tried.includes(node.id)) state = "broken";
    else if (phase === "going" && trip.kind === "go" && trip.target === node.id) state = "active";
    // só "marcham" as linhas que a criança pode escolher agora (só a da seta, quando o Bonzi ajuda)
    const marching = invite && state === "idle" && (!hintNode || hintNode.id === node.id);
    links.push(
      <Link
        key={`f-${current.id}-${node.id}`}
        from={center(current)}
        to={center(node)}
        state={state}
        thickness={0.8}
        breakMark={false}
        className={cx(marching && styles.choosable)}
      />,
    );
  }

  const responsePath = [...route].reverse().map((id) => center(byId[id]));

  let arrow: ReactNode = null;
  if (hintNode && phase === "choose") {
    const from = center(current);
    const to = center(hintNode);
    const mid = lerpPoint(from, to, 0.5);
    arrow = (
      <Place x={mid.x} y={mid.y} z={4}>
        <span className={styles.hintArrow} style={{ "--a": `${sceneAngle(from, to)}rad` } as CSSProperties} aria-hidden="true">
          <img src={SPRITES.ui.next} alt="" draggable={false} />
        </span>
      </Place>
    );
  }

  // toque fora das peças tocáveis (fundo, peças distantes, caminho já feito): lembra o que fazer agora
  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target instanceof Element && event.target.closest("button")) return;
    onBackground();
  };

  // o clique no fundo só traz um lembrete: tudo o que age no mapa é botão (teclado incluído)
  return (
    <div ref={rootRef} className={styles.root} onClick={handleClick} onKeyDown={onKeyDown} onPointerDown={onPointerDown}>
      <SceneCanvas label="Mapa de caminhos até o servidor" className={cx(styles.scene, reducedMotion && styles.reduced)}>
        {/* a instrução do momento; o Bonzi fala a mesma ideia (o balão dele já é anunciado) */}
        <StageBanner
          key={bannerKey}
          text={banner.text}
          tone={banner.tone}
          icon={banner.icon}
          reducedMotion={reducedMotion}
          live={false}
        />

        {/* o domínio no topo, logo abaixo da faixa; acima da camada escura quando a página aparece */}
        <Place x={50} y={DEST_Y} z={7} className={styles.destPlace}>
          <div className={cx(styles.dest, received && styles.destReady)}>
            <img src={ELEMENTS.pin} alt="" draggable={false} className={styles.destPin} />
            <span className={styles.destLabel}>Destino</span>
            {received ? (
              <span className={styles.destDomain}>{destino.domain}</span>
            ) : (
              <>
                <img src={ELEMENTS.question} alt="" draggable={false} className={styles.destUnknown} />
                <span className="sr-only">ainda não recebido</span>
              </>
            )}
            {ipShown && (
              <>
                <img src={SPRITES.ui.next} alt="" draggable={false} className={styles.destArrow} />
                <span className={styles.destIp}>
                  <span className={styles.destIpLabel}>IP</span> {ip}
                </span>
              </>
            )}
          </div>
        </Place>

        <GhostMesh layers={layers} from={received ? current.layer + 1 : 0} />
        {links}

        {layers.flat().map((node) => {
          const inRoute = route.includes(node.id);
          const isCurrent = node.id === current.id;
          const isTried = tried.includes(node.id);
          const isCandidate = nextLayer.includes(node);
          const isHint = hintNode?.id === node.id;
          const element = isTried && node.layer === LAST_LAYER ? "serverError" : node.element;
          const far = !inRoute && !isTried && !isCandidate;
          const lit = finished && (isCurrent || (phase === "page" && node.id === START_ID));
          const receiver = !received && node.id === START_ID;

          let alt = describe(node);
          if (receiver) alt = `${alt}: receber destino`;
          else if (isTried) alt = `${alt}: sem saída`;
          else if (isCandidate) alt = `Ir para ${alt}${isHint ? " (dica do Bonzi: siga por aqui)" : ""}`;
          else if (isCurrent && !finished) alt = `${alt}: a requisição está aqui`;
          else if (inRoute) alt = `${alt}: caminho certo`;

          let halo: string | null = null;
          if (isCurrent && !finished) halo = styles.haloCurrent;
          else if (inRoute) halo = styles.haloWalked;
          else if (isHint) halo = styles.haloHint;
          else if (isCandidate && !isTried) halo = styles.haloCandidate;

          return (
            <Fragment key={node.id}>
              {halo && (
                <Place x={node.x} y={node.y} z={0}>
                  <span className={cx(styles.halo, halo)} aria-hidden="true" />
                </Place>
              )}
              <Place x={node.x} y={node.y}>
                {/* data-choice: o foco do teclado vai para a primeira etapa livre quando a escolhida vira ponto seguro */}
                <span className={styles.nodeWrap} data-choice={isCandidate ? (isTried ? "tried" : "open") : undefined}>
                  <SceneSprite
                    element={element}
                    size={spriteSize(element)}
                    label={node.ip ?? node.name}
                    alt={alt}
                    selected={isCurrent && !finished}
                    correct={inRoute && (!isCurrent || finished)}
                    wrong={isTried}
                    mark={isTried && node.layer !== LAST_LAYER}
                    highlighted={isHint || lit}
                    pulse={((invite && isCandidate && !isTried && (!hintNode || isHint)) || receiver) && !reducedMotion}
                    onClick={receiver ? onReceive : isCandidate ? () => onChoose(node.id) : undefined}
                    className={cx(far && styles.far)}
                  />
                </span>
              </Place>
            </Fragment>
          );
        })}

        {arrow}

        {received && !finished && (
          <Packet
            key={trip.id}
            path={trip.path}
            element="box"
            size={REQUEST_SIZE}
            durationMs={trip.durationMs}
            blocked={trip.blocked}
            onArrive={() => onArrive(trip.id)}
            alt="Requisição"
            z={4}
            className={cx(trip.kind === "rest" && styles.requestPop)}
          />
        )}

        {phase === "responding" && (
          <Packet
            key="resposta"
            path={responsePath}
            element="webpage"
            size={RESPONSE_SIZE}
            durationMs={Math.max(1800, travelMs(responsePath, TIMING.responsePerUnit))}
            hideOnArrive
            onArrive={onResponse}
            alt="Resposta do servidor"
            z={4}
          />
        )}

        {phase === "page" && <PageReveal destino={destino} reducedMotion={reducedMotion} />}
      </SceneCanvas>
    </div>
  );
}

export default MapScene;
