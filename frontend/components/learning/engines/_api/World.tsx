"use client";

import { Place, Tag, type ElementKey, type ScenePoint } from "@/components/learning/kit";
import { AppCard, AppValue, Node, Traveler, Wire, WorkPanel, type NodeLook } from "./parts";
import styles from "./ApiKit.module.css";

/*
 * O "mundo" da comunicação usado em várias aulas: aplicativo (cliente) à esquerda, API no meio, servidor/serviço à
 * direita. `step` anima um pedido completo:
 *   -1 parado · 0 pedido sai do app · 1 na API · 2 no servidor · 3–4 o servidor consulta · 5 resposta sai do servidor ·
 *   6 na API · 7 no app · 8 o app mostra o resultado.
 */

export const LINE_Y = 52;
export const WORLD = {
  app: { x: 3, y: 36, width: 25 },
  api: { x: 51, y: LINE_Y } as ScenePoint,
  service: { x: 85, y: LINE_Y } as ScenePoint,
  question: { x: 56, y: LINE_Y } as ScenePoint,
  stops: [
    { x: 33, y: LINE_Y },
    { x: 51, y: LINE_Y },
    { x: 77, y: LINE_Y },
  ] as ScenePoint[],
  wires: {
    a: { from: { x: 29, y: LINE_Y }, to: { x: 46.5, y: LINE_Y } },
    b: { from: { x: 55.5, y: LINE_Y }, to: { x: 80.5, y: LINE_Y } },
    gap: { from: { x: 29, y: LINE_Y }, to: { x: 80.5, y: LINE_Y } },
  },
};
export const SHOWN_STEP = 8;

export type RoleId = "client" | "api" | "server";
export const ROLE_NAMES: Record<RoleId, string> = { client: "CLIENTE", api: "API", server: "SERVIDOR" };

export type ApiWorldProps = {
  step: number;
  reducedMotion: boolean;
  /** sem API (a ligação fica apagada e um "?" no meio) */
  withApi?: boolean;
  appName?: string;
  appIcon?: ElementKey;
  /** texto acima do valor no app (ex.: a cidade) */
  appCaption?: string;
  /** valor que aparece no app no passo 8 */
  appValue: string;
  /** valor vazio antes da resposta */
  appEmpty?: string;
  appNote?: string;
  serviceLabel?: string;
  serviceBadge?: ElementKey;
  requestLabel: string;
  responseLabel: string;
  requestAlt?: string;
  responseAlt?: string;
  panelTitle?: string;
  panelRows?: string[];
  /** etiquetas de papel acima das peças (CLIENTE, API, SERVIDOR) */
  roles?: RoleId[];
  /** papel em destaque (anel e etiqueta amarela) */
  focus?: RoleId | null;
  looks?: Partial<Record<RoleId, NodeLook>>;
  /** sem os nomes "API" e do servidor (o aluno identifica as peças) */
  bare?: boolean;
  /** a resposta se perde no caminho de volta (do passo 6 em diante: ligação quebrada, nada chega ao app) */
  lost?: boolean;
  /** toques (Microinteração) */
  onTap?: (role: RoleId) => void;
  pressed?: RoleId | null;
};

export function ApiWorld({
  step,
  reducedMotion,
  withApi = true,
  appName = "App de clima",
  appIcon = "cellphone",
  appCaption,
  appValue,
  appEmpty = "?",
  appNote,
  serviceLabel = "Servidor",
  serviceBadge,
  requestLabel,
  responseLabel,
  requestAlt,
  responseAlt,
  panelTitle = "Consultando dados",
  panelRows = [],
  roles = [],
  focus = null,
  looks = {},
  onTap,
  pressed = null,
  bare = false,
  lost = false,
}: ApiWorldProps) {
  const broken = lost && step >= 6;
  const shown = step >= SHOWN_STEP && !lost;
  const request = step >= 0 && step <= 2 ? WORLD.stops[step] : null;
  const response = step >= 5 && step <= 7 && !broken ? WORLD.stops[7 - step] : null;
  const going = step === 1 || step === 2;
  const coming = step === 6 || step === 7;
  const look = (role: RoleId, base: NodeLook = {}): NodeLook => ({ ...base, ...looks[role], highlighted: focus === role || looks[role]?.highlighted || base.highlighted });

  return (
    <>
      {withApi ? (
        <>
          <Wire {...WORLD.wires.a} state={broken ? "broken" : step === 1 || step === 7 ? "active" : "idle"} back={coming} />
          <Wire {...WORLD.wires.b} state={!broken && (step === 2 || step === 6) ? "active" : "idle"} back={coming} />
        </>
      ) : (
        <Wire {...WORLD.wires.gap} state="off" />
      )}
      {roles.map((role) => (
        <Place key={role} x={role === "client" ? WORLD.app.x + WORLD.app.width / 2 : role === "api" ? WORLD.api.x : WORLD.service.x} y={role === "client" ? WORLD.app.y - 6 : role === "api" ? 40 : 27} z={5}>
          <span className={styles.rolePop}>
            <Tag size="sm" tone={focus === role ? "warning" : "info"} highlighted={focus === role}>
              {ROLE_NAMES[role]}
            </Tag>
          </span>
        </Place>
      ))}
      <AppCard
        x={WORLD.app.x}
        y={WORLD.app.y}
        width={WORLD.app.width}
        name={appName}
        icon={appIcon}
        highlighted={focus === "client" || Boolean(looks.client?.highlighted) || shown}
        done={Boolean(looks.client?.correct)}
        onTap={onTap ? () => onTap("client") : undefined}
        pressed={pressed === "client"}
        tapLabel={appName}
      >
        {appCaption && <span>{appCaption}</span>}
        {shown ? <AppValue tone="ok">{appValue}</AppValue> : <AppValue empty>{appEmpty}</AppValue>}
        {!shown && appNote && <span>{appNote}</span>}
      </AppCard>
      {withApi ? (
        <Node at={WORLD.api} element="plug" size={6.5} aspect={9 / 16} label={bare ? undefined : "API"} alt={bare ? "Peça do meio" : "API"} look={look("api")} onTap={onTap ? () => onTap("api") : undefined} pressed={pressed === "api"} />
      ) : (
        <Node at={WORLD.question} element="question" size={5} label="Como?" alt="Como os dois se comunicam?" look={{ pulse: !reducedMotion }} />
      )}
      <Node
        at={WORLD.service}
        element="server"
        size={8}
        badge={serviceBadge}
        label={bare ? undefined : serviceLabel}
        alt={bare ? "Computador da direita" : serviceLabel}
        look={look("server", { highlighted: step >= 2 && step <= 5 })}
        onTap={onTap ? () => onTap("server") : undefined}
        pressed={pressed === "server"}
      />
      {(step === 3 || step === 4) && panelRows.length > 0 && (
        <WorkPanel at={{ x: WORLD.service.x - 3, y: WORLD.service.y - 17 }} title={panelTitle} rows={panelRows} checked={step - 2} />
      )}
      {request && <Traveler key="request" at={request} tone="request" label={requestLabel} alt={requestAlt} reducedMotion={reducedMotion} />}
      {response && <Traveler key="response" at={response} tone="response" label={responseLabel} alt={responseAlt} reducedMotion={reducedMotion} />}
    </>
  );
}
