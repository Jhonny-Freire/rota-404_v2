"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { ELEMENTS, SPRITES } from "@/config/assets";
import type { BonziState } from "@/types/domain";
import type { LabEngineMeta, LabEngineProps, LabFeedbackTone } from "@/components/learning/runtime";
import {
  ActionButton,
  Callout,
  DragPiece,
  DragProvider,
  DropZone,
  POOL_ZONE,
  Packet,
  Place,
  SceneCanvas,
  SceneLink,
  SceneSprite,
  StageBanner,
  lerpPoint,
  sceneDistance,
  useSeededRandom,
  useTimers,
  type DragMoveHandler,
  type ElementKey,
  type KitTone,
  type LinkState,
  type ScenePoint,
} from "@/components/learning/kit";
import { cx } from "@/components/ui/cx";
import {
  AREA_ZONE,
  CONCEPT_HINTS,
  NODES,
  RING_CENTER,
  SLOTS,
  VARIANTS,
  edgeEnds,
  edgeKey,
  evaluate,
  fillOrder,
  isNodeId,
  isSlotId,
  isWireless,
  mainBlock,
  slotPoint,
  slotsFor,
  type EdgeKey,
  type Fault,
  type NodeId,
  type SlotId,
  type Verdict,
} from "./network";
import { LinkList, SuccessRoutes } from "./NetworkPanel";
import styles from "./ConectandoUmaRede.module.css";

export const meta: LabEngineMeta = {
  kind: "lab",
  steps: ["Arrastar", "Ligar", "Testar", "Funcionou!"],
};

type Phase = "idle" | "testing" | "failed" | "success";
type Placement = Partial<Record<NodeId, SlotId>>;
type PointerDrag = { id: NodeId; pointerId: number; x: number; y: number; moved: boolean };
/** um toque em Testar: o resultado já calculado e o id que reinicia os pacotes */
type Trial = { id: number; verdict: Verdict };
type BannerState = { text: string; tone: KitTone; icon: ElementKey };

const HOP_MS = 850;
const STAGGER_MS = 650;
/** o pacote aparece no aparelho e espera um pouco antes de sair ("Testando...") */
const TEST_LEAD_MS = 450;
/** folga entre a chegada do pacote e o resultado do teste */
const RESULT_PAD_MS = 150;
const FINISH_HOLD_MS = 2600;
const DRAG_THRESHOLD = 10;
const CLICK_GUARD_MS = 600;
const POINTER_MEMORY_MS = 1500;
/** quanto o pacote entra na ligação errada antes de parar (unidades do kit) */
const WRONG_LINK_STEP = 6;
/** distância mínima entre dois X de ligação no palco (unidades do kit) */
const REMOVE_SPACING = 6;
/** a mesma fala do Bonzi pedida de novo dentro deste tempo não recomeça (só a faixa salta de novo) */
const REPEAT_LINE_MS = 4000;

/** largura das peças na área (unidades do kit) */
const NODE_SIZE = 7.5;
/** altura/largura de cada sprite: caixas aproximadas das peças para posicionar o balão de erro */
const SPRITE_RATIO: Record<NodeId, number> = { pc: 1.25, phone: 1.56, wifi: 0.67, router: 0.69, internet: 1 };
/** % da altura do palco por unidade do kit (palco 16:9) */
const VU = 16 / 9;

/** Bonzi: uma frase por momento (a mesma ideia da faixa do palco) */
const BONZI = {
  place: "Monte o caminho até a internet.",
  linkStart: "Agora ligue as peças. Toque em uma e depois em outra.",
  linkMore: "Ligue as peças que faltam.",
  joined: "Tudo ligado! Toque em Testar.",
  retry: "Mudou a rede? Toque em Testar de novo.",
  nudge: "Ainda tem peça solta. Ligue todas antes de testar.",
  testing: "Lá vai o pacote!",
  fault: "Olhe aqui. O caminho parou.",
  success: "Conexão funcionando!",
};

/** painel "O que fazer": completa a faixa do palco (como fazer, o que aconteceu) */
const TIPS = {
  place: "Arraste cada peça até um espaço vazio. Ou toque na peça e depois no espaço.",
  placeTap: "Comece pela esquerda: arraste uma peça até um espaço vazio.",
  linkStart: "Toque em uma peça e depois em outra para ligar as duas. Ou arraste de uma peça até a outra.",
  linkMore: "As peças que pulsam ainda estão soltas. Para apagar uma ligação, toque no X dela.",
  linkTap: "Toque em uma peça para começar uma ligação.",
  pick: "Agora toque em outra peça para ligar as duas. Tocar de novo na mesma peça cancela.",
  ready: "Tudo ligado? Toque em Testar para mandar um pacote até a internet.",
  retry: "Toque em Testar para ver se o pacote chega à internet agora.",
  nudge: "Ainda tem peça solta. Ligue as peças que pulsam e toque em Testar de novo.",
  testing: "Testando a rede: veja aonde o pacote vai.",
  faultNode: "O pacote parou na peça marcada: falta uma ligação aqui. Mude a rede e teste de novo.",
  faultEdge: "O pacote parou na ligação marcada: ela não leva à internet. Toque no X vermelho para apagá-la.",
  success: "Conexão funcionando! Veja o pacote chegar à internet.",
  successMany: "Conexão funcionando! Veja os pacotes chegarem à internet.",
};

/** balão no ponto onde o caminho parou: diz o tipo de problema, não a resposta */
const CALLOUT_TEXT: Record<Fault["kind"], string> = {
  node: "Falta uma ligação aqui",
  edge: "Essa ligação não leva à internet",
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const isPoint = (point: ScenePoint | null): point is ScenePoint => point !== null;

/** "A", "A e B", "A, B e C" */
function nameList(ids: NodeId[]): string {
  const names = ids.map((id) => NODES[id].label);
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} e ${names[names.length - 1]}`;
}

function missionText(devices: NodeId[]): string {
  return devices.length === 1
    ? `Ligue o ${NODES[devices[0]].label} até a Internet`
    : `Ligue os ${devices.length} aparelhos à Internet`;
}

/* ---------- posição do balão de erro (x em % da largura, y em % da altura do palco) ---------- */

type Box = { x0: number; x1: number; y0: number; y1: number };
type CalloutSpot = {
  x: number;
  y: number;
  anchor: "bottom" | "top" | "left" | "right";
  tail: "down" | "up" | "right" | "left";
};

/** faixa de instrução no alto (até 2 linhas num palco pequeno) */
const BANNER_BOX: Box = { x0: 8, x1: 92, y0: 0, y1: 17 };

function boxAround(point: ScenePoint, w: number, h: number): Box {
  return { x0: point.x - w / 2, x1: point.x + w / 2, y0: point.y - h / 2, y1: point.y + h / 2 };
}

/** sprite + legenda da peça (legenda larga de "Computador" num palco pequeno) */
function nodeBox(id: NodeId, point: ScenePoint): Box {
  return boxAround(point, 12, (NODE_SIZE * SPRITE_RATIO[id] + 3.4) * VU);
}

function overlap(a: Box, b: Box): number {
  return Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0)) * Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0));
}

/**
 * Lado do alvo onde o balão (w × h) cobre menos peças, não bate na faixa e não sai do palco.
 * `targets`: pontos para onde o rabicho pode apontar (o primeiro tem preferência no empate).
 * Acima/abaixo também tenta um pouco mais longe (custo pequeno) para escapar das legendas vizinhas.
 */
function calloutSpot(targets: Box[], w: number, h: number, avoid: Box[]): CalloutSpot | null {
  const stage: Box = { x0: 0, x1: 100, y0: 0, y1: 100 };
  const gapX = 2.5;
  let best: CalloutSpot | null = null;
  let bestScore = Infinity;
  for (const target of targets) {
    const midX = clamp((target.x0 + target.x1) / 2, w / 2 + 1, 99 - w / 2);
    const midY = clamp((target.y0 + target.y1) / 2, h / 2 + 1, 99 - h / 2);
    const options: [CalloutSpot, Box, number][] = [];
    for (const [gapY, cost] of [
      [3.5, 0],
      [8, 15],
    ]) {
      options.push(
        [
          { x: midX, y: target.y0 - gapY, anchor: "bottom", tail: "down" },
          { x0: midX - w / 2, x1: midX + w / 2, y0: target.y0 - gapY - h, y1: target.y0 - gapY },
          cost,
        ],
        [
          { x: midX, y: target.y1 + gapY, anchor: "top", tail: "up" },
          { x0: midX - w / 2, x1: midX + w / 2, y0: target.y1 + gapY, y1: target.y1 + gapY + h },
          cost,
        ],
      );
      if (cost > 0) continue;
      options.push(
        [
          { x: target.x0 - gapX, y: midY, anchor: "right", tail: "right" },
          { x0: target.x0 - gapX - w, x1: target.x0 - gapX, y0: midY - h / 2, y1: midY + h / 2 },
          0,
        ],
        [
          { x: target.x1 + gapX, y: midY, anchor: "left", tail: "left" },
          { x0: target.x1 + gapX, x1: target.x1 + gapX + w, y0: midY - h / 2, y1: midY + h / 2 },
          0,
        ],
      );
    }
    for (const [spot, box, cost] of options) {
      const outside = (box.x1 - box.x0) * (box.y1 - box.y0) - overlap(box, stage);
      const score = cost + outside * 10 + avoid.reduce((sum, other) => sum + overlap(box, other), 0);
      if (score < bestScore - 0.01) {
        best = spot;
        bestScore = score;
      }
    }
  }
  return best;
}

/* ---------- linha amarela da ligação pela metade ---------- */

type PreviewHandle = { move: (point: ScenePoint) => void };

type PreviewWireProps = {
  /** peça escolhida */
  origin: ScenePoint;
  /** peça sob o ponteiro ou com foco do teclado: a linha encosta nela */
  target: ScenePoint | null;
  /** ponto inicial do ponteiro (ligação começada arrastando); sem ele a linha aponta para o meio da rede */
  seed: ScenePoint | null;
};

/**
 * O ponto do ponteiro mora aqui, não no laboratório: seguir o dedo ou o mouse re-renderiza só esta linha
 * (e a bolinha da ponta), nunca o palco e o painel inteiros. Remontada a cada peça escolhida (key).
 */
const PreviewWire = forwardRef<PreviewHandle, PreviewWireProps>(function PreviewWire({ origin, target, seed }, ref) {
  const [pointer, setPointer] = useState<ScenePoint | null>(seed);
  useImperativeHandle(
    ref,
    () => ({
      move: (point) => setPointer((prev) => (prev && prev.x === point.x && prev.y === point.y ? prev : point)),
    }),
    [],
  );
  const end = target ?? pointer ?? lerpPoint(origin, RING_CENTER, 0.45);
  return (
    <>
      <SceneLink from={origin} to={end} thickness={0.8} className={styles.preview} />
      {!target && (
        <Place x={end.x} y={end.y} z={1} className={styles.passive}>
          <span className={styles.previewEnd} />
        </Place>
      )}
    </>
  );
});

/** Laboratório 1.3 — Conectando uma rede: arrastar as peças, ligar, testar e achar o primeiro ponto errado. */
export default function ConectandoUmaRede({
  attempt,
  say,
  feedback,
  setStep,
  mistake,
  finish,
  reducedMotion,
  Stage,
  Interaction,
}: LabEngineProps) {
  const sessionRand = useSeededRandom(0, { salt: "conectando-uma-rede" });
  const rand = useSeededRandom(attempt);
  const variant = useMemo(
    () => VARIANTS[(sessionRand.int(0, VARIANTS.length - 1, "variant") + attempt) % VARIANTS.length],
    [sessionRand, attempt],
  );
  const palette = useMemo(() => rand.shuffle(variant.pieces, "palette", true), [rand, variant]);
  const slots = useMemo(() => slotsFor(variant.pieces.length), [variant]);
  const order = useMemo(() => fillOrder(slots), [slots]);
  const timers = useTimers({ reducedMotion });

  const [phase, setPhase] = useState<Phase>("idle");
  const [placement, setPlacement] = useState<Placement>({});
  const [edges, setEdges] = useState<EdgeKey[]>([]);
  const [trial, setTrial] = useState<Trial | null>(null);
  /** pista de conceito quando o caminho para de novo no mesmo ponto */
  const [conceptHint, setConceptHint] = useState<string | null>(null);
  const [routes, setRoutes] = useState<NodeId[][]>([]);
  const [reached, setReached] = useState<number[]>([]);
  const [arrived, setArrived] = useState(false);
  const [pending, setPending] = useState<NodeId | null>(null);
  const [target, setTarget] = useState<NodeId | null>(null);
  /** onde a linha amarela começa a seguir o ponteiro (ligação começada arrastando); o resto fica no PreviewWire */
  const [previewSeed, setPreviewSeed] = useState<ScenePoint | null>(null);
  /** toques em Testar com peça solta (0 = nenhum); volta a 0 com qualquer mudança na rede */
  const [nudge, setNudge] = useState(0);
  /** já houve um teste reprovado: "Mudou? Toque em Testar de novo" */
  const [retrying, setRetrying] = useState(false);
  /** toque no fundo sem efeito: dica curta enquanto a instrução do momento (`base`) não muda */
  const [tapTip, setTapTip] = useState<{ base: string; text: string } | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const surfaceRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<PointerDrag | null>(null);
  const clickGuardRef = useRef(0);
  const lastPointerRef = useRef<{ point: ScenePoint; at: number } | null>(null);
  const focusNodeRef = useRef<NodeId | null>(null);
  const trialIdRef = useRef(0);
  /** testes reprovados por ponto de parada (a pista de conceito vem na repetição) */
  const failsRef = useRef(new Map<NodeId, number>());
  /** último momento narrado pelo Bonzi */
  const spokenRef = useRef<string | null>(null);
  const linkSpokenRef = useRef(false);
  /** última fala pedida ao Bonzi e quando (toques repetidos em Testar não recomeçam a mesma fala) */
  const lineRef = useRef<{ text: string; at: number } | null>(null);
  const previewRef = useRef<PreviewHandle>(null);
  /** retângulo do palco medido uma vez por gesto (esquecido ao rolar ou redimensionar a janela) */
  const rectRef = useRef<DOMRect | null>(null);
  /** pointermove agrupados: o último ponto espera o próximo quadro (1 medida e 1 elementFromPoint por quadro) */
  const frameRef = useRef(0);
  const moveRef = useRef<{ x: number; y: number; origin: NodeId } | null>(null);

  /** descarta o ponto que esperava o próximo quadro (a ligação pela metade acabou ou mudou de peça) */
  const cancelFrame = () => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = 0;
    moveRef.current = null;
  };

  const total = variant.pieces.length;
  const placedCount = variant.pieces.filter((id) => placement[id]).length;
  const allPlaced = placedCount === total;
  const busy = phase === "testing" || phase === "success";
  const block = useMemo(() => mainBlock(variant.pieces, edges), [variant, edges]);
  const joined = block.size === total;
  /** peças fora do bloco principal (na ordem da bandeja, sem revelar a ordem do caminho) */
  const loose = allPlaced && edges.length > 0 ? palette.filter((id) => !block.has(id)) : [];
  const fault: Fault | null = phase === "failed" && trial && !trial.verdict.ok ? trial.verdict.fault : null;
  const canTest = allPlaced && phase === "idle" && edges.length > 0;
  /** o próximo toque é o Testar: tudo num bloco só e nenhuma ligação pela metade */
  const testCalling = canTest && pending === null && joined;
  /*
   * Testar recebe o foco (e o tablet rola até ele) uma vez a cada vez que a rede fica pronta: montada, toda ligada
   * e sem teste em andamento ou reprovado. Escolher e cancelar uma peça, ou acrescentar ligações a uma rede já
   * pronta, apaga e acende o anel do Testar, mas não puxa o foco de novo para o painel.
   */
  const networkReady = allPlaced && phase === "idle" && joined;
  const [readySeen, setReadySeen] = useState(false);
  const [focusTest, setFocusTest] = useState(false);
  if (networkReady !== readySeen) {
    setReadySeen(networkReady);
    setFocusTest(networkReady);
  }
  const stepIndex = !allPlaced ? 0 : phase === "success" ? 3 : phase === "testing" || phase === "failed" ? 2 : 1;
  /** a próxima peça da bandeja pulsa ("arraste esta") */
  const nextPiece = palette.find((id) => !placement[id]) ?? null;

  /**
   * Só o próximo passo pulsa: no começo os aparelhos da missão, depois as peças ainda soltas.
   * Com uma peça escolhida nada pulsa (seria uma dica de par, às vezes errada): a linha amarela guia.
   */
  const pulsing = new Set<NodeId>(
    allPlaced && phase === "idle" && pending === null ? (edges.length === 0 ? variant.devices : loose) : [],
  );

  const occupant = useMemo(() => {
    const map = new Map<SlotId, NodeId>();
    (Object.keys(placement) as NodeId[]).forEach((id) => {
      const slot = placement[id];
      if (slot) map.set(slot, id);
    });
    return map;
  }, [placement]);

  const pos = (id: NodeId): ScenePoint | null => {
    const slot = placement[id];
    return slot ? slotPoint(slot) : null;
  };

  /* ---------- faixa do palco, Bonzi e painel: uma instrução por momento ---------- */

  let banner: BannerState;
  if (!allPlaced) banner = { text: `Arraste as peças: ${placedCount} de ${total}`, tone: "info", icon: "pin" };
  else if (phase === "success") banner = { text: "Conexão funcionando!", tone: "success", icon: "ok" };
  else if (phase === "testing") banner = { text: "Testando...", tone: "info", icon: "box" };
  else if (pending) banner = { text: "Agora toque em outra peça", tone: "warning", icon: "cable" };
  else if (fault) banner = { text: "O caminho parou aqui", tone: "danger", icon: "error" };
  else if (nudge > 0) banner = { text: `Falta ligar: ${nameList(loose)}`, tone: "warning", icon: "cable" };
  else if (edges.length === 0) banner = { text: missionText(variant.devices), tone: "info", icon: "internet" };
  else if (joined)
    banner = { text: retrying ? "Mudou? Toque em Testar de novo" : "Tudo ligado! Toque em Testar", tone: "info", icon: "box" };
  else banner = { text: `Peças ligadas: ${block.size} de ${total}`, tone: "info", icon: "cable" };

  let tip: { tone: LabFeedbackTone; message: string };
  if (!allPlaced) tip = { tone: "hint", message: TIPS.place };
  else if (phase === "testing") tip = { tone: "info", message: TIPS.testing };
  else if (phase === "success") tip = { tone: "success", message: routes.length > 1 ? TIPS.successMany : TIPS.success };
  else if (pending) tip = { tone: "hint", message: TIPS.pick };
  else if (fault)
    tip = {
      tone: "error",
      message: `${fault.kind === "edge" ? TIPS.faultEdge : TIPS.faultNode}${conceptHint ? ` Dica: ${conceptHint}` : ""}`,
    };
  else if (nudge > 0) tip = { tone: "hint", message: TIPS.nudge };
  else if (edges.length === 0) tip = { tone: "hint", message: TIPS.linkStart };
  else if (joined) tip = { tone: "hint", message: retrying ? TIPS.retry : TIPS.ready };
  else tip = { tone: "hint", message: TIPS.linkMore };
  const tipTone: LabFeedbackTone = tapTip && tapTip.base === tip.message ? "hint" : tip.tone;
  const tipMessage = tapTip && tapTip.base === tip.message ? tapTip.text : tip.message;

  /** momento narrado: muda só quando a criança passa para outra parte da tarefa */
  const moment = !allPlaced
    ? "place"
    : phase !== "idle"
      ? phase
      : nudge > 0
        ? `nudge-${nudge}`
        : joined
          ? retrying
            ? "retry"
            : "joined"
          : "link";

  useEffect(() => {
    if (spokenRef.current === moment) return;
    spokenRef.current = moment;
    const speak = (text: string, state?: BonziState) => {
      lineRef.current = { text, at: performance.now() };
      say(text, state);
    };
    if (moment === "place") speak(BONZI.place);
    else if (moment === "link") {
      speak(linkSpokenRef.current ? BONZI.linkMore : BONZI.linkStart);
      linkSpokenRef.current = true;
    } else if (moment === "joined") speak(BONZI.joined);
    else if (moment === "retry") speak(BONZI.retry);
    else if (moment === "testing") speak(BONZI.testing);
    else if (moment === "failed") speak(conceptHint ? `${BONZI.fault} ${conceptHint}` : BONZI.fault, "warning");
    else if (moment === "success") speak(BONZI.success, "happy");
    else {
      /* Testar de novo com peça solta: a faixa salta de novo (key), mas a mesma fala recém-pedida não recomeça */
      const last = lineRef.current;
      if (last && last.text === BONZI.nudge && performance.now() - last.at < REPEAT_LINE_MS) return;
      speak(BONZI.nudge);
    }
  }, [moment, conceptHint, say]);

  useEffect(() => {
    feedback({ tone: tipTone, message: tipMessage });
  }, [feedback, tipTone, tipMessage]);

  /* o foco já foi para o Testar nesta vez que a rede ficou pronta (o SpriteButton, filho, roda o efeito antes) */
  useEffect(() => {
    if (focusTest && testCalling) setFocusTest(false);
  }, [focusTest, testCalling]);

  /* retângulo do palco: rolar ou redimensionar a janela invalida a medida; o quadro pendente não sobrevive ao motor */
  useEffect(() => {
    const forget = () => {
      rectRef.current = null;
    };
    window.addEventListener("resize", forget);
    window.addEventListener("scroll", forget, { capture: true, passive: true });
    return () => {
      window.removeEventListener("resize", forget);
      window.removeEventListener("scroll", forget, { capture: true });
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      frameRef.current = 0;
    };
  }, []);

  useEffect(() => {
    setStep(stepIndex);
  }, [stepIndex, setStep]);

  useEffect(() => {
    if (!pending) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      dragRef.current = null;
      cancelFrame();
      setPending(null);
      setTarget(null);
      setAnnouncement("Ligação cancelada.");
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [pending]);

  /*
   * A última peça colocada sai da bandeja (ou o X da ligação apagada some do palco):
   * o foco do teclado vai para a peça na área em vez de cair no começo da página.
   */
  useEffect(() => {
    const id = focusNodeRef.current;
    if (!allPlaced || !id) return;
    focusNodeRef.current = null;
    const active = document.activeElement;
    if (active && active !== document.body) return;
    surfaceRef.current?.querySelector<HTMLButtonElement>(`[data-net-node="${id}"] button`)?.focus({ preventScroll: true });
  }, [allPlaced, edges]);

  const clearPending = () => {
    cancelFrame();
    setPending(null);
    setTarget(null);
  };

  const cancelPending = () => {
    if (pending) setAnnouncement("Ligação cancelada.");
    clearPending();
  };

  /** qualquer mudança na rede apaga o resultado do último teste e o aviso de peça solta */
  const touch = () => {
    setNudge(0);
    setTapTip(null);
    if (phase !== "failed") return;
    setPhase("idle");
    setTrial(null);
    setConceptHint(null);
    setRetrying(true);
  };

  const progressNote = (next: EdgeKey[]) => {
    const size = mainBlock(variant.pieces, next).size;
    return size === total ? "Tudo ligado! Toque em Testar." : `Peças ligadas: ${size} de ${total}.`;
  };

  /** `seed`: onde está o ponteiro quando a ligação começa arrastando (no toque a linha aponta para o meio da rede) */
  const startPending = (id: NodeId, seed: ScenePoint | null = null) => {
    cancelFrame();
    rectRef.current = null;
    setPending(id);
    setPreviewSeed(seed);
    setTarget(null);
    setTapTip(null);
    setAnnouncement(`${NODES[id].label} escolhido. Agora escolha a peça para ligar.`);
  };

  const removeEdge = (key: EdgeKey): boolean => {
    if (busy || !edges.includes(key)) return false;
    const [a, b] = edgeEnds(key);
    const next = edges.filter((k) => k !== key);
    setEdges(next);
    setAnnouncement(`Ligação entre ${NODES[a].label} e ${NODES[b].label} removida. ${progressNote(next)}`);
    touch();
    return true;
  };

  const toggleEdge = (a: NodeId, b: NodeId) => {
    clearPending();
    if (a === b || busy) return;
    const key = edgeKey(a, b);
    if (edges.includes(key)) {
      removeEdge(key);
      return;
    }
    const next = [...edges, key];
    setEdges(next);
    setAnnouncement(`${NODES[a].label} ligado a ${NODES[b].label}. ${progressNote(next)}`);
    touch();
  };

  /** espaço livre mais perto de `near` (ou o primeiro da ordem de preenchimento) */
  const freeSlot = (near: ScenePoint | null): SlotId | null => {
    const free = order.filter((slot) => !occupant.has(slot));
    if (free.length === 0) return null;
    if (!near) return free[0];
    return free.reduce((best, slot) => (sceneDistance(slotPoint(slot), near) < sceneDistance(slotPoint(best), near) ? slot : best));
  };

  /** só da bandeja para a área: a peça fica onde foi colocada (a posição não importa para o caminho) */
  const handleMove: DragMoveHandler = (itemId, zoneId) => {
    if (allPlaced || busy || !isNodeId(itemId) || !variant.pieces.includes(itemId) || placement[itemId]) return false;
    if (zoneId === POOL_ZONE) return;
    const id = itemId;
    let slot: SlotId | null = null;
    if (isSlotId(zoneId) && slots.includes(zoneId)) {
      slot = zoneId;
    } else if (zoneId === AREA_ZONE) {
      const last = lastPointerRef.current;
      slot = freeSlot(last && performance.now() - last.at < POINTER_MEMORY_MS ? last.point : null);
    }
    /* espaço ocupado: vai para o livre mais perto */
    if (slot && occupant.has(slot)) slot = freeSlot(slotPoint(slot));
    if (!slot) return false;
    const next: Placement = { ...placement, [id]: slot };
    setPlacement(next);
    setTapTip(null);
    if (variant.pieces.every((piece) => next[piece])) {
      focusNodeRef.current = id;
      setAnnouncement(`Todas as peças estão na área. ${missionText(variant.devices)}: toque em uma peça e depois em outra.`);
    }
  };

  /* ---------- teste: o pacote percorre os cabos até a internet ou até o primeiro problema ---------- */

  /** saída escalonada de cada aparelho + um trecho (HOP_MS) por ligação */
  const routesTravel = (list: NodeId[][]) =>
    Math.max(0, ...list.map((route, index) => index * STAGGER_MS + (route.length - 1) * HOP_MS));

  /** até a peça do problema; na ligação errada, um pedaço dela */
  const faultTravel = (stop: Fault) => HOP_MS * (stop.path.length - 1 + (stop.kind === "edge" ? 0.5 : 0));

  const faultPoints = (stop: Fault): ScenePoint[] => {
    const points = stop.path.map(pos).filter(isPoint);
    if (stop.kind === "edge") {
      const [a, b] = edgeEnds(stop.edge);
      const from = pos(stop.at);
      const to = pos(a === stop.at ? b : a);
      if (from && to) points.push(lerpPoint(from, to, Math.min(0.4, WRONG_LINK_STEP / Math.max(1, sceneDistance(from, to)))));
    }
    return points;
  };

  const fail = (stop: Fault) => {
    mistake();
    const count = (failsRef.current.get(stop.at) ?? 0) + 1;
    failsRef.current.set(stop.at, count);
    setConceptHint(count >= 2 ? (CONCEPT_HINTS[stop.at] ?? null) : null);
    setPhase("failed");
    if (stop.kind === "edge") {
      const [a, b] = edgeEnds(stop.edge);
      setAnnouncement(`Ponto destacado: ligação entre ${NODES[a].label} e ${NODES[b].label}. ${CALLOUT_TEXT.edge}.`);
    } else {
      setAnnouncement(`Ponto destacado: ${NODES[stop.at].label}. ${CALLOUT_TEXT.node}.`);
    }
  };

  const succeed = (list: NodeId[][]) => {
    setRoutes(list);
    setReached(list.map(() => 0));
    setPhase("success");
    setAnnouncement("Conexão funcionando!");
    timers.after(routesTravel(list), () => {
      setArrived(true);
      timers.after(FINISH_HOLD_MS, finish, { hold: true });
    });
  };

  const runTest = () => {
    if (!canTest) return;
    clearPending();
    /* rede incompleta: sem penalidade, as peças soltas pulsam e a faixa diz quais faltam */
    if (!joined) {
      setNudge((count) => count + 1);
      setAnnouncement(`Falta ligar: ${nameList(loose)}.`);
      return;
    }
    const verdict = evaluate(variant.devices, edges);
    trialIdRef.current += 1;
    setTrial({ id: trialIdRef.current, verdict });
    setPhase("testing");
    setAnnouncement("Testando a rede.");
    const travel = verdict.ok ? routesTravel(verdict.routes) : faultTravel(verdict.fault);
    timers.after(TEST_LEAD_MS + travel + RESULT_PAD_MS, () => {
      if (verdict.ok) succeed(verdict.routes);
      else fail(verdict.fault);
    });
  };

  const markReached = (route: number, index: number) => {
    setReached((prev) => prev.map((value, i) => (i === route ? Math.max(value, index) : value)));
  };

  /* ---------- ligar: tocar em duas peças ou arrastar de uma até a outra ---------- */

  const onNodeClick = (id: NodeId) => {
    if (performance.now() < clickGuardRef.current || !allPlaced || busy) return;
    if (pending === null) startPending(id);
    else if (pending === id) cancelPending();
    else toggleEdge(pending, id);
  };

  /** medido no começo do gesto e reaproveitado (nada de getBoundingClientRect a cada pointermove) */
  const surfaceRect = (): DOMRect | null => {
    if (!rectRef.current) {
      const rect = surfaceRef.current?.getBoundingClientRect();
      /* palco ainda sem tamanho: não guarda, mede de novo no próximo evento */
      rectRef.current = rect && rect.width > 0 && rect.height > 0 ? rect : null;
    }
    return rectRef.current;
  };

  const toScene = (clientX: number, clientY: number): ScenePoint | null => {
    const rect = surfaceRect();
    if (!rect) return null;
    return {
      x: clamp(((clientX - rect.left) / rect.width) * 100, 0, 100),
      y: clamp(((clientY - rect.top) / rect.height) * 100, 0, 100),
    };
  };

  /** peça sob o ponteiro (os X das ligações não contam como peça) */
  const nodeAt = (clientX: number, clientY: number): NodeId | null => {
    const hit = document.elementFromPoint(clientX, clientY)?.closest<HTMLElement>("[data-net-node]")?.dataset.netNode;
    return isNodeId(hit) ? hit : null;
  };

  const onNodePointerDown = (id: NodeId, event: ReactPointerEvent<HTMLDivElement>) => {
    if (!allPlaced || busy || (event.pointerType === "mouse" && event.button !== 0)) return;
    dragRef.current = { id, pointerId: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
  };

  /** no toque não há pointermove antes do toque: a peça tocada na área cai perto do dedo */
  const onSurfacePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    /* começo de um gesto: mede o palco de novo (a página pode ter mudado desde o último) */
    rectRef.current = null;
    const point = toScene(event.clientX, event.clientY);
    if (point) lastPointerRef.current = { point, at: performance.now() };
  };

  /**
   * A linha amarela e a peça sob o ponteiro, no máximo 1 vez por quadro, com o último ponto recebido.
   * Só o PreviewWire re-renderiza; o laboratório só muda quando a peça sob o ponteiro (target) muda.
   */
  const schedulePreview = (x: number, y: number, origin: NodeId) => {
    moveRef.current = { x, y, origin };
    if (frameRef.current) return;
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = 0;
      const move = moveRef.current;
      moveRef.current = null;
      if (!move) return;
      const point = toScene(move.x, move.y);
      if (!point) return;
      previewRef.current?.move(point);
      const over = nodeAt(move.x, move.y);
      setTarget(over && over !== move.origin ? over : null);
    });
  };

  const onSurfacePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    let drag = dragRef.current && dragRef.current.pointerId === event.pointerId ? dragRef.current : null;
    /* rede montada, sem ligação pela metade e sem arraste: só passar o mouse não mede nada */
    if (allPlaced && !pending && !drag) return;
    const point = toScene(event.clientX, event.clientY);
    if (point) lastPointerRef.current = { point, at: performance.now() };
    if (drag && !drag.moved && event.buttons === 0) {
      dragRef.current = null;
      drag = null;
    }
    if (drag && !drag.moved && Math.hypot(event.clientX - drag.x, event.clientY - drag.y) >= DRAG_THRESHOLD) {
      drag.moved = true;
      try {
        surfaceRef.current?.setPointerCapture(event.pointerId);
      } catch {
        /* ponteiro já liberado: segue pelo bubbling */
      }
      if (pending !== drag.id) startPending(drag.id, point);
    }
    const origin = drag?.moved ? drag.id : pending;
    if (!origin || !point) return;
    schedulePreview(event.clientX, event.clientY, origin);
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>, cancelled: boolean) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    if (!drag.moved) return;
    clickGuardRef.current = performance.now() + CLICK_GUARD_MS;
    const over = cancelled ? null : nodeAt(event.clientX, event.clientY);
    if (over && over !== drag.id) toggleEdge(drag.id, over);
    else cancelPending();
  };

  /** toque fora das peças: cancela a ligação pela metade ou responde com uma dica curta (nada de toque mudo) */
  const onSurfaceClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (performance.now() < clickGuardRef.current) return;
    const el = event.target instanceof Element ? event.target : null;
    if (pending) {
      if (!el?.closest("[data-net-node]")) cancelPending();
      return;
    }
    if (!el || el.closest("button") || !el.closest("[data-kit-zone]")) return;
    if (!allPlaced) setTapTip({ base: tip.message, text: TIPS.placeTap });
    /* com tudo ligado a vez é do Testar (a faixa diz isso): a dica de começar uma ligação a contradiria */
    else if (phase === "idle" && !joined) setTapTip({ base: tip.message, text: TIPS.linkTap });
  };

  const linkState = (key: EdgeKey): LinkState => {
    if (phase === "success") return "active";
    if (fault?.kind === "edge" && fault.edge === key) return "broken";
    return "idle";
  };

  /* ---------- X no meio de cada ligação (afastados quando dois meios coincidem) ---------- */

  const removeSpots: { key: EdgeKey; point: ScenePoint }[] = [];
  for (const key of edges) {
    const [a, b] = edgeEnds(key);
    const pa = pos(a);
    const pb = pos(b);
    if (!pa || !pb) continue;
    const free = (point: ScenePoint) => removeSpots.every((spot) => sceneDistance(spot.point, point) >= REMOVE_SPACING);
    const t = [0.5, 0.35, 0.65, 0.25, 0.75].find((value) => free(lerpPoint(pa, pb, value))) ?? 0.5;
    removeSpots.push({ key, point: lerpPoint(pa, pb, t) });
  }
  const showRemovers = allPlaced && (phase === "idle" || phase === "failed");

  const origin = pending ? pos(pending) : null;
  const targetPoint = target ? pos(target) : null;

  /*
   * Balão do erro, do lado que não cobre peças nem a faixa: aponta para a peça onde o caminho parou ou,
   * na ligação errada, para onde o pacote parou (ou o meio da ligação, onde fica o X vermelho).
   */
  let faultCallout: (CalloutSpot & { text: string; maxWidth: number }) | null = null;
  if (fault) {
    const avoid: Box[] = [BANNER_BOX, ...removeSpots.map((spot) => boxAround(spot.point, 5, 9))];
    variant.pieces.forEach((id) => {
      const point = pos(id);
      if (point && !(fault.kind === "node" && fault.at === id)) avoid.push(nodeBox(id, point));
    });
    const targets: Box[] = [];
    if (fault.kind === "node") {
      const at = pos(fault.at);
      if (at) targets.push(nodeBox(fault.at, at));
    } else {
      const points = faultPoints(fault);
      const stop = points[points.length - 1];
      const mark = removeSpots.find((spot) => spot.key === fault.edge)?.point;
      if (stop) targets.push(boxAround(stop, 5, 8));
      if (mark) targets.push(boxAround(mark, 5, 9));
    }
    /* caixas aproximadas do balão (palco pequeno): 1 linha na peça; 2 linhas, mais estreito, na ligação */
    const spot = fault.kind === "node" ? calloutSpot(targets, 28, 11, avoid) : calloutSpot(targets, 27, 16, avoid);
    if (spot) faultCallout = { ...spot, text: CALLOUT_TEXT[fault.kind], maxWidth: fault.kind === "node" ? 34 : 24 };
  }

  const renderNode = (id: NodeId) => {
    const node = NODES[id];
    const isPending = pending === id;
    const isFault = fault?.kind === "node" && fault.at === id;
    let alt = isFault ? `${node.label}: o caminho parou aqui` : loose.includes(id) ? `${node.label} (solta)` : node.label;
    if (pending && !isPending) {
      const other = NODES[pending].label;
      alt = edges.includes(edgeKey(pending, id)) ? `Remover ligação entre ${other} e ${node.label}` : `Ligar ${other} a ${node.label}`;
    }
    return (
      <div
        className={styles.node}
        data-net-node={id}
        onPointerDown={(event) => onNodePointerDown(id, event)}
        onFocus={() => {
          if (pending && pending !== id) setTarget(id);
        }}
      >
        <SceneSprite
          element={node.element}
          label={node.label}
          alt={alt}
          size={NODE_SIZE}
          selected={isPending}
          wrong={isFault}
          pulse={pulsing.has(id)}
          highlighted={target === id || (arrived && id === "internet")}
          pressed={allPlaced ? isPending : undefined}
          disabled={busy}
          onClick={allPlaced ? () => onNodeClick(id) : undefined}
          className={id === "internet" ? styles.internet : undefined}
        />
      </div>
    );
  };

  return (
    <>
      <Stage>
        <SceneCanvas label="Montagem da rede">
          <div
            ref={surfaceRef}
            className={cx(styles.net, allPlaced ? styles.connecting : styles.placing, pending && styles.linking)}
            onPointerDown={onSurfacePointerDown}
            onPointerMove={onSurfacePointerMove}
            onPointerUp={(event) => endDrag(event, false)}
            onPointerCancel={(event) => endDrag(event, true)}
            onClick={onSurfaceClick}
          >
            <StageBanner
              key={nudge > 0 ? `nudge-${nudge}` : "banner"}
              text={banner.text}
              tone={banner.tone}
              icon={banner.icon}
              reducedMotion={reducedMotion}
              live={false}
            />

            <DragProvider onMove={handleMove} disabled={allPlaced || busy}>
              {!allPlaced && (
                <div className={styles.poolBox}>
                  <DropZone
                    id={POOL_ZONE}
                    label="Peças"
                    className={cx(styles.fill, styles.poolZone)}
                    style={{ "--cells": palette.length } as CSSProperties}
                  >
                    {palette.map((id) => (
                      <div key={id} className={styles.trayCell}>
                        {placement[id] ? (
                          <span className={styles.trayGap} aria-hidden="true" />
                        ) : (
                          <DragPiece
                            id={id}
                            label={NODES[id].label}
                            element={NODES[id].element}
                            size={5}
                            className={cx(styles.trayPiece, id === nextPiece && styles.trayNext)}
                          />
                        )}
                      </div>
                    ))}
                  </DropZone>
                </div>
              )}
              <div className={styles.areaBox}>
                <DropZone id={AREA_ZONE} label="Monte a rede" layout="free" className={cx(styles.fill, styles.areaZone)} />
              </div>
              {SLOTS.filter((slot) => slots.includes(slot.id)).map((slot) => {
                const id = occupant.get(slot.id);
                return (
                  <div
                    key={slot.id}
                    className={cx(styles.slot, id && styles.slotFilled)}
                    style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
                  >
                    <DropZone
                      id={slot.id}
                      label={slot.name}
                      hideLabel
                      emptyHint="Solte aqui"
                      className={cx(styles.fill, styles.slotZone)}
                    >
                      {id && renderNode(id)}
                    </DropZone>
                  </div>
                );
              })}
            </DragProvider>

            {edges.map((key) => {
              const [a, b] = edgeEnds(key);
              const from = pos(a);
              const to = pos(b);
              if (!from || !to) return null;
              const state = linkState(key);
              const wireless = isWireless(key);
              return (
                <SceneLink
                  key={key}
                  from={from}
                  to={to}
                  state={state}
                  thickness={wireless ? 1 : 1.2}
                  dots={4}
                  speedMs={1200}
                  breakMark={false}
                  className={cx(wireless && state === "idle" && styles.wireless)}
                />
              );
            })}

            {pending && origin && (
              <PreviewWire key={pending} ref={previewRef} origin={origin} target={targetPoint} seed={previewSeed} />
            )}

            {/* teste aprovado: os pacotes vão de cada aparelho até a internet */}
            {phase === "testing" &&
              trial?.verdict.ok &&
              trial.verdict.routes.map((route, index) => (
                <Packet
                  key={`teste-${trial.id}-${index}`}
                  path={route.map(pos).filter(isPoint)}
                  element="box"
                  size={4.5}
                  durationMs={HOP_MS * Math.max(1, route.length - 1)}
                  delayMs={reducedMotion ? 0 : TEST_LEAD_MS + index * STAGGER_MS}
                  alt={index === 0 ? "Pacote de dados a caminho da internet" : undefined}
                />
              ))}

            {/* teste reprovado: o pacote para no primeiro problema e treme (fica lá até a rede mudar) */}
            {(phase === "testing" || phase === "failed") && trial && !trial.verdict.ok && (
              <Packet
                key={`falha-${trial.id}`}
                path={faultPoints(trial.verdict.fault)}
                element="box"
                size={4}
                durationMs={faultTravel(trial.verdict.fault)}
                delayMs={reducedMotion ? 0 : TEST_LEAD_MS}
                blocked
              />
            )}

            {phase === "success" &&
              routes.map((route, index) => {
                const path = route.map(pos).filter(isPoint);
                return (
                  <Packet
                    key={`ok-${route.join("-")}`}
                    path={path}
                    element="box"
                    size={4.5}
                    durationMs={HOP_MS * Math.max(1, path.length - 1)}
                    delayMs={reducedMotion ? 0 : index * STAGGER_MS}
                    loop={!reducedMotion}
                    loopPauseMs={500}
                    onReach={(hop) => markReached(index, hop)}
                    alt={index === 0 ? "Pacote de dados chegando à internet" : undefined}
                  />
                );
              })}

            {showRemovers &&
              removeSpots.map(({ key, point }) => {
                const [a, b] = edgeEnds(key);
                const isFaultEdge = fault?.kind === "edge" && fault.edge === key;
                return (
                  <Place key={`x-${key}`} x={point.x} y={point.y} z={4}>
                    <button
                      type="button"
                      className={cx(styles.linkX, isFaultEdge && styles.linkXFault)}
                      onClick={(event) => {
                        event.stopPropagation();
                        clearPending();
                        if (removeEdge(key)) focusNodeRef.current = a;
                      }}
                      aria-label={`Remover ligação entre ${NODES[a].label} e ${NODES[b].label}${isFaultEdge ? " (ponto destacado)" : ""}`}
                      title={`Remover ligação entre ${NODES[a].label} e ${NODES[b].label}`}
                    >
                      <span className={styles.linkXFace}>
                        <img src={isFaultEdge ? ELEMENTS.error : SPRITES.ui.close} alt="" draggable={false} />
                      </span>
                    </button>
                  </Place>
                );
              })}

            {faultCallout && (
              <Place x={faultCallout.x} y={faultCallout.y} anchor={faultCallout.anchor} z={5} className={styles.passive}>
                <Callout tone="danger" tail={faultCallout.tail} maxWidth={faultCallout.maxWidth}>
                  {faultCallout.text}
                </Callout>
              </Place>
            )}

            <p className="sr-only" aria-live="polite">
              {announcement}
            </p>
          </div>
        </SceneCanvas>
      </Stage>

      <Interaction>
        {phase === "success" ? (
          <SuccessRoutes routes={routes} reached={reached} />
        ) : (
          <>
            <div className={styles.actions}>
              <ActionButton
                label="Testar"
                onClick={runTest}
                disabled={!canTest}
                attention={testCalling}
                focusOnAttention={focusTest}
              />
            </div>
            {allPlaced && (
              <LinkList edges={edges} faultEdge={fault?.kind === "edge" ? fault.edge : null} onRemove={removeEdge} disabled={busy} />
            )}
          </>
        )}
      </Interaction>
    </>
  );
}
