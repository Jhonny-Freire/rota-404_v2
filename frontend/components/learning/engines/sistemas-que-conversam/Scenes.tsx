"use client";

import { useEffect } from "react";
import { ELEMENTS, SPRITES } from "@/config/assets";
import { ActionButton, FlowChain, Place, Tag, useSequence, type FlowItem } from "@/components/learning/kit";
import { Banner, Code, Live, Node, Wire } from "../_api/parts";
import { phases, speechMs } from "../_api/timing";
import { LINES, RESOURCES, USES, type SceneProps } from "./model";
import { WORLD } from "../_api/World";
import { SHOWN_STEP, WeatherWorld } from "./World";
import styles from "./SistemasQueConversam.module.css";

/* Cena 1 — Dois sistemas, duas funções: o app de clima sem os dados; o serviço meteorológico do outro lado. */
const PROBLEM_STEPS = phases([1200, 1400], LINES.problem);

export function SceneProblem({ say, setCanAdvance, reducedMotion }: SceneProps) {
  useSequence(PROBLEM_STEPS, { reducedMotion, onDone: () => setCanAdvance(true) });

  useEffect(() => {
    say(LINES.problem, "thinking");
  }, [say]);

  return (
    <>
      <Banner text="Como eles se comunicam?" tone="warning" icon="question" reducedMotion={reducedMotion} />
      <WeatherWorld step={-1} withApi={false} reducedMotion={reducedMotion} />
      <Live text="O app de clima não tem os dados da temperatura. O serviço meteorológico tem." />
    </>
  );
}

/* Cena 2 — A API entra na comunicação: Aplicativo → API → Serviço meteorológico. Fases: 0 API surge · 1 ligações · 2 regras. */
const API_STEPS = phases([900, 1400, 1800], LINES.api);

export function SceneApi({ say, setCanAdvance, reducedMotion }: SceneProps) {
  const { step } = useSequence(API_STEPS, { reducedMotion, onDone: () => setCanAdvance(true) });

  useEffect(() => {
    say(LINES.api);
  }, [say]);

  return (
    <>
      <Banner text="A API entra na comunicação" icon="plug" reducedMotion={reducedMotion} />
      <WeatherWorld step={-1} apiHighlighted reducedMotion={reducedMotion} />
      {/* texto criado a partir da fala: o que a API indica */}
      <Place x={WORLD.api.x} y={73} anchor="top" hidden={step < 2} z={4}>
        <div className={styles.rules}>
          <Tag size="sm" tone="info" icon="mail">
            Como fazer o pedido
          </Tag>
          <Tag size="sm" tone="warning" icon="boxGold">
            Como receber o resultado
          </Tag>
        </div>
      </Place>
      <Live text="Aplicativo, API, serviço meteorológico. A API indica como fazer o pedido e como receber o resultado." />
    </>
  );
}

/* Cena 3 — Pedido e resultado: o pedido vai, o serviço consulta, a resposta volta e o app mostra "Osasco — 24 °C". */
const RESULT_STEPS = [
  { hold: 900 },
  { hold: 1100 },
  { hold: 1000 },
  { hold: 900 },
  { hold: 900 },
  { hold: 900 },
  { hold: 1100 },
  { hold: 1100 },
  { hold: speechMs(LINES.result) + 600 },
];

export function SceneResult({ say, setCanAdvance, reducedMotion }: SceneProps) {
  const { step } = useSequence(RESULT_STEPS, {
    reducedMotion,
    onStep: (s) => {
      if (s === SHOWN_STEP) say(LINES.result, "happy");
    },
    onDone: () => setCanAdvance(true),
  });

  const banner = step >= SHOWN_STEP ? "A resposta chegou!" : step >= 5 ? "O serviço responde" : step >= 3 ? "O serviço consulta os dados" : "O app pede a temperatura";

  return (
    <>
      <Banner key={banner} text={banner} tone={step >= SHOWN_STEP ? "success" : "info"} icon={step >= SHOWN_STEP ? "ok" : step >= 5 ? "boxGold" : "mail"} reducedMotion={reducedMotion} />
      <WeatherWorld step={step} reducedMotion={reducedMotion} />
      <Live text={step >= SHOWN_STEP ? "O app mostra: Osasco, 24 graus." : step >= 5 ? "O serviço enviou a resposta pela API." : "O app pediu a temperatura de Osasco pela API."} />
    </>
  );
}

/* Cena 4 — Outros usos: mapa, loja e jogo, cada um falando com um serviço pela API (um de cada vez, depois todos). */
const ROW_Y = [31, 54, 77];
const USES_STEPS = phases([1600, 1600, 1600, 1000], LINES.uses);

export function SceneUses({ say, setCanAdvance, reducedMotion }: SceneProps) {
  const { step } = useSequence(USES_STEPS, { reducedMotion, onDone: () => setCanAdvance(true) });

  useEffect(() => {
    say(LINES.uses);
  }, [say]);

  return (
    <>
      <Banner text="Outros usos de APIs" icon="plug" reducedMotion={reducedMotion} />
      {USES.map((use, index) => {
        const y = ROW_Y[index];
        const active = step === index;
        const seen = step >= index;
        return (
          <div key={use.id} role="group" aria-label={`${use.app} usa a API para falar com: ${use.service}`}>
            <Wire from={{ x: 21, y }} to={{ x: 46, y }} state={active ? "active" : seen ? "idle" : "off"} />
            <Wire from={{ x: 54, y }} to={{ x: 77, y }} state={active ? "active" : seen ? "idle" : "off"} />
            <Node at={{ x: 15, y }} element={use.appIcon} size={5.2} label={use.app} alt={use.app} look={{ highlighted: active, dimmed: !seen }} />
            <Node at={{ x: 50, y }} element="plug" size={4.4} aspect={9 / 16} label="API" alt="API" look={{ highlighted: active, dimmed: !seen }} />
            <Node at={{ x: 84, y }} element="server" size={5} badge={use.badge} label={use.service} alt={use.service} look={{ highlighted: active, dimmed: !seen }} />
          </div>
        );
      })}
      <Live text={step < USES.length ? `${USES[step].app} conversa com ${USES[step].service} pela API.` : "Cada aplicativo usa um serviço pela API."} />
    </>
  );
}

/* Cena 5 — O que significa REST? A API e três recursos: /users, /products e /orders (só para conhecer). */
const REST_AT = { x: 50, y: 34 };
const RESOURCE_X = [20, 50, 80];
const RESOURCE_Y = 72;
const REST_STEPS = phases([1200, 1500, 1500, 1500, 1500], LINES.rest);

export function SceneRest({ say, setCanAdvance, reducedMotion }: SceneProps) {
  const { step } = useSequence(REST_STEPS, { reducedMotion, onDone: () => setCanAdvance(true) });

  useEffect(() => {
    say(LINES.rest);
  }, [say]);

  return (
    <>
      <Banner text="REST: APIs organizadas em recursos" icon="plug" reducedMotion={reducedMotion} />
      {RESOURCES.map((resource, index) => (
        <Wire key={resource.path} from={{ x: REST_AT.x, y: REST_AT.y + 6 }} to={{ x: RESOURCE_X[index], y: RESOURCE_Y - 7 }} state={step === index + 1 ? "active" : step > index ? "idle" : "off"} />
      ))}
      <Node at={REST_AT} element="plug" size={8} aspect={9 / 16} label="API REST" alt="API REST" look={{ highlighted: step === 0 }} z={4} />
      {RESOURCES.map((resource, index) => (
        <Place key={resource.path} x={RESOURCE_X[index]} y={RESOURCE_Y} hidden={step < index + 1} z={4}>
          <div className={styles.resource}>
            <img src={ELEMENTS[resource.element]} alt="" draggable={false} />
            <Code>{resource.path}</Code>
            <span>{resource.name}</span>
          </div>
        </Place>
      ))}
      <Live text="A API REST organiza os recursos: usuários em /users, produtos em /products e pedidos em /orders." />
    </>
  );
}

/* Fechamento — Aplicativo → API → Serviço: o pedido vai e a resposta volta pela API; "Ver de novo" repete. */
const CHAIN: FlowItem[] = [
  { id: "app", label: "Aplicativo", element: "cellphone" },
  { id: "api", label: "API", element: "plug" },
  { id: "service", label: "Serviço", element: "server" },
];
/* destaque: app (pedido) → API → serviço → API → app (resposta) */
const PATH = [0, 1, 2, 1, 0];
const CLOSING_STEPS = phases([900, 900, 900, 900, 900, 1200], LINES.closing);

export function SceneClosing({ say, setCanAdvance, reducedMotion }: SceneProps) {
  const { step, done, restart } = useSequence(CLOSING_STEPS, { reducedMotion, onDone: () => setCanAdvance(true) });
  const current = step < PATH.length ? PATH[step] : undefined;
  const coming = step >= 3 && step < PATH.length;

  useEffect(() => {
    say(LINES.closing, "happy");
  }, [say]);

  return (
    <>
      <Banner text="Aplicativo, API e serviço" icon="plug" reducedMotion={reducedMotion} />
      <Place x={50} y={42} width={92}>
        <div className={styles.chainFit}>
          <FlowChain items={CHAIN} current={current} size={11} ariaLabel="Aplicativo, API, Serviço" />
        </div>
      </Place>
      <Place x={50} y={62} anchor="top" hidden={current === undefined} z={4}>
        <Tag size="md" tone={coming ? "warning" : "info"} icon={coming ? "boxGold" : "mail"}>
          {coming ? "A resposta volta pela API" : "O pedido segue pela API"}
        </Tag>
      </Place>
      <Place x={50} y={62} anchor="top" hidden={!done} z={5}>
        <div className={styles.replayFit}>
          <ActionButton label="Ver de novo" sprite={SPRITES.ui.play} variant="default" onClick={restart} disabled={!done} size={20} />
        </div>
      </Place>
      <Live text={done ? "A API define como o pedido é feito e como o sistema recebe a resposta." : ""} />
    </>
  );
}
