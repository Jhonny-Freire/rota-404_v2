/**
 * Kit de cena do Rota 404 — primitivas para os motores de aula/laboratório.
 *
 * Unidade do kit (`size`, `width`, `thickness`…): 1 = 1% da largura do <SceneCanvas> (fora dele, 1 = 8px).
 * Coordenadas (`x`, `y`, `from`, `to`, `path`): % do SceneCanvas (0–100).
 * Sprites: `element` = chave de ELEMENTS (config/assets) ou `src` = caminho vindo de config/assets.
 * Lógica temporizada: useSequence/useTimers (setTimeout, limpos no unmount; reducedMotion encurta animações).
 * Aleatoriedade: useSeededRandom(attempt) — nunca Math.random no render.
 */

export { SceneCanvas, type SceneCanvasProps } from "./SceneCanvas";
export { Place, type PlaceProps, type PlaceAnchor } from "./Place";
export { SceneSprite, type SceneSpriteProps } from "./SceneSprite";
export { Link, SceneLink, type LinkProps, type LinkState } from "./Link";
export { Packet, type PacketProps } from "./Packet";
export { FlowChain, type FlowChainProps, type FlowItem } from "./FlowChain";
export { Tag, type TagProps } from "./Tag";
export { ChoiceGrid, type ChoiceGridProps, type Choice, type ChoiceResult } from "./ChoiceGrid";
export { OrderCards, type OrderCardsProps, type OrderItem, type OrderResult } from "./OrderCards";
export {
  DragBoard,
  DragProvider,
  DragPiece,
  DropZone,
  POOL_ZONE,
  type DragBoardProps,
  type DragBoardItem,
  type DragBoardZone,
  type DragProviderProps,
  type DragPieceProps,
  type DropZoneProps,
  type DragMoveHandler,
} from "./DragBoard";
export { Callout, Balloon, type CalloutProps, type BalloonProps } from "./Callout";
export { StageBanner, type StageBannerProps } from "./StageBanner";
export { BrowserFrame, type BrowserFrameProps } from "./BrowserFrame";
export {
  PagePreview,
  Block,
  BLOCK_TAGS,
  BLOCK_LABELS,
  type PagePreviewProps,
  type BlockProps,
  type BlockKind,
  type BlockState,
} from "./PagePreview";
export { ActionButton, type ActionButtonProps } from "./ActionButton";
export { AnswerInput, type AnswerInputProps } from "./AnswerInput";
export {
  useSequence,
  useTimers,
  stepDuration,
  REDUCED_MOTION_MS,
  type SequenceStep,
  type SequenceOptions,
  type SequenceControls,
  type Timers,
  type TimerOptions,
} from "./useSequence";
export { useSeededRandom, createSeededRandom, type SeededRandom, type SeededRandomOptions } from "./useSeededRandom";
export { point, midpoint, lerpPoint, sceneDistance, sceneAngle, pathLength, resolveSprite } from "./util";
export { DEFAULT_RATIO, type ScenePoint, type KitTone, type MarkStatus, type ElementKey } from "./types";
