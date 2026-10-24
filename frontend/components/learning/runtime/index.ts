/**
 * Runtime das aulas/laboratórios. Motores importam SÓ tipos daqui:
 *   import type { LessonEngineProps, LessonEngineMeta } from "@/components/learning/runtime";
 */
export type {
  Say,
  LessonEngineProps,
  LessonEngineMeta,
  LabEngineProps,
  LabEngineMeta,
  LabFeedback,
  LabFeedbackTone,
  PortalSlot,
  EngineMeta,
  EngineModule,
  LessonEngineModule,
  LabEngineModule,
  EngineLoader,
  NextPlanetLink,
} from "./types";
export { isLessonModule, isLabModule } from "./types";
export { LessonRuntime, type LessonRuntimeProps } from "./LessonRuntime";
export { LabRuntime, type LabRuntimeProps } from "./LabRuntime";
export { useEngineModule, type EngineModuleState, type EngineStatus } from "./useEngineModule";
export { loadPlanetContext, type PlanetContext } from "./planetContext";
