"use client";

import { useEffect, useMemo, useState } from "react";
import { ELEMENTS } from "@/config/assets";
import { Place, Tag, useSeededRandom, useSequence } from "@/components/learning/kit";
import { cx } from "@/components/ui/cx";
import { MatchBoard } from "../_api/MatchBoard";
import { AppCard, Banner, Live, Node, Traveler, Wire } from "../_api/parts";
import { phases, speechMs } from "../_api/timing";
import { ASKS, DIAGRAM_PIECES, DIAGRAM_ZONES, EXTRA_LINES, FLOWS, LINES, OPERATIONS, REQUESTS, SERVICES, type SceneProps } from "./model";
import styles from "./ApiEmUmAplicativo.module.css";

const SERVICE_Y = [30, 53, 76];

/* Cena 1 — Várias funções, vários serviços: o app de viagem com mapa, previsão e pagamento. */
const MANY_STEPS = phases([1200, 1400, 1400], LINES.many);

export function SceneMany({ say, setCanAdvance, reducedMotion }: SceneProps) {
  const { step } = useSequence(MANY_STEPS, { reducedMotion, onDone: () => setCanAdvance(true) });

  useEffect(() => {
    say(LINES.many);
  }, [say]);

  return (
    <>
      <Banner text="Um app, vários serviços" icon="cellphone" reducedMotion={reducedMotion} />
      {FLOWS.map((flow, i) => (
        <Wire key={flow.id} from={{ x: 36, y: 53 }} to={{ x: 78, y: SERVICE_Y[i] }} state={step >= 1 ? "idle" : "off"} />
      ))}
      <AppCard x={4} y={53} anchor="left" width={32} name="App de viagem" icon="cellphone">
        <div className={styles.features}>
          {FLOWS.map((flow) => (
            <span key={flow.id} className={styles.feature}>
              <img src={ELEMENTS[flow.clientIcon]} alt="" draggable={false} />
              {flow.client}
            </span>
          ))}
        </div>
      </AppCard>
      {FLOWS.map((flow, i) => (
        <Place key={flow.id} x={84} y={SERVICE_Y[i]} hidden={step < 1} z={3}>
          <span className={styles.service}>
            <img src={ELEMENTS.server} alt="" draggable={false} />
            <img src={ELEMENTS[flow.badge]} alt="" draggable={false} className={styles.serviceBadge} />
            <span>{flow.service}</span>
          </span>
        </Place>
      ))}
      <Live text="O app de viagem tem mapa, previsão do tempo e pagamento, cada um com um serviço diferente." />
    </>
  );
}

/* Cena 2 — Separando as comunicações: mapa, clima e compra, um de cada vez (cliente, API, serviço destacados). */
const ROW_STEPS = 5;
const SPLIT_STEPS = [...Array.from({ length: FLOWS.length * ROW_STEPS }, () => ({ hold: 850 })), { hold: Math.max(1200, speechMs(EXTRA_LINES.split) - FLOWS.length * ROW_STEPS * 850) }];
const STOP_X = [16, 47, 80];

export function SceneSplit({ say, setCanAdvance, reducedMotion }: SceneProps) {
  const { step } = useSequence(SPLIT_STEPS, { reducedMotion, onDone: () => setCanAdvance(true) });
  const row = Math.min(Math.floor(step / ROW_STEPS), FLOWS.length - 1);
  const sub = step % ROW_STEPS;
  const done = step >= FLOWS.length * ROW_STEPS;

  useEffect(() => {
    say(EXTRA_LINES.split);
  }, [say]);

  return (
    <>
      <Banner key={done ? "done" : row} text={done ? "Três pedidos, três serviços" : `Pedido ${row + 1} de 3: ${FLOWS[row].client}`} tone={done ? "success" : "info"} icon={done ? "ok" : FLOWS[row].clientIcon} reducedMotion={reducedMotion} />
      {FLOWS.map((flow, i) => {
        const y = SERVICE_Y[i];
        const active = !done && i === row;
        const seen = done || i <= row;
        const at = sub <= 2 ? STOP_X[sub] : STOP_X[4 - sub];
        return (
          <div key={flow.id} role="group" aria-label={`${flow.client} usa a ${flow.api} para falar com o ${flow.service}`}>
            <Wire from={{ x: 21, y }} to={{ x: 42.5, y }} state={active ? "active" : seen ? "idle" : "off"} back={active && sub > 2} />
            <Wire from={{ x: 51.5, y }} to={{ x: 75, y }} state={active ? "active" : seen ? "idle" : "off"} back={active && sub > 2} />
            <Node at={{ x: 14, y }} element={flow.clientIcon} size={4.6} label={flow.client} alt={`${flow.client} (cliente)`} look={{ highlighted: active, dimmed: !seen }} />
            <Node at={{ x: 47, y }} element="plug" size={4.2} aspect={9 / 16} label={flow.api} alt={flow.api} look={{ highlighted: active, dimmed: !seen }} />
            <Node at={{ x: 84, y }} element="server" size={4.6} badge={flow.badge} label={flow.service} alt={flow.service} look={{ highlighted: active, dimmed: !seen }} />
            {active && <Traveler key={`${flow.id}-${sub > 2 ? "r" : "q"}`} at={{ x: at, y }} tone={sub > 2 ? "response" : "request"} label={sub > 2 ? flow.response : flow.request} reducedMotion={reducedMotion} lift={5} />}
          </div>
        );
      })}
      {!done && (
        <Place x={50} y={92} z={4}>
          <div className={styles.roles}>
            <Tag size="sm" tone="info">
              cliente: {FLOWS[row].client}
            </Tag>
            <Tag size="sm" tone="warning">
              API: {FLOWS[row].api}
            </Tag>
            <Tag size="sm" tone="success">
              serviço: {FLOWS[row].service}
            </Tag>
          </div>
        </Place>
      )}
      <Live text={done ? "Mapa, clima e compra: cada pedido usa a sua API e o seu serviço." : `${FLOWS[row].client} pede pela ${FLOWS[row].api} ao ${FLOWS[row].service}.`} />
    </>
  );
}

/* Cena 3 — Uma API, diferentes clientes: dois apps usam a mesma API meteorológica. */
const SHARED_STEPS = phases([900, 1100, 1100, 1100, 1100, 1400], LINES.shared);
const APPS = [
  { name: "App de viagem", icon: "cellphone" as const, y: 32 },
  { name: "App de esportes", icon: "tablet" as const, y: 74 },
];

export function SceneShared({ say, setCanAdvance, reducedMotion }: SceneProps) {
  const { step } = useSequence(SHARED_STEPS, { reducedMotion, onDone: () => setCanAdvance(true) });
  /* 1–2: o app de viagem pede; 3–4: o app de esportes pede */
  const who = step >= 3 ? 1 : 0;
  const traveling = step >= 1 && step <= 4;
  const at = (step === 1 || step === 3) ? { x: 30, y: APPS[who].y + (52 - APPS[who].y) * 0.55 } : { x: 48, y: 52 };

  useEffect(() => {
    say(LINES.shared);
  }, [say]);

  return (
    <>
      <Banner text="Uma API, vários clientes" icon="plug" reducedMotion={reducedMotion} />
      {APPS.map((app, i) => (
        <Wire key={app.name} from={{ x: 18, y: app.y }} to={{ x: 44, y: 52 }} state={traveling && who === i ? "active" : "idle"} />
      ))}
      <Wire from={{ x: 52, y: 52 }} to={{ x: 79, y: 52 }} state={traveling ? "active" : "idle"} />
      {APPS.map((app, i) => (
        <Node key={app.name} at={{ x: 12, y: app.y }} element={app.icon} size={5} label={app.name} alt={app.name} look={{ highlighted: traveling && who === i }} />
      ))}
      <Node at={{ x: 48, y: 52 }} element="plug" size={6} aspect={9 / 16} label="API meteorológica" alt="API meteorológica" look={{ highlighted: true }} />
      <Node at={{ x: 85, y: 52 }} element="server" size={7} badge="weather" label="Serviço meteorológico" alt="Serviço meteorológico" />
      {traveling && <Traveler key={who} at={at} tone="request" label="PREVISÃO?" reducedMotion={reducedMotion} lift={5} />}
      <Live text="O app de viagem e o app de esportes usam a mesma API meteorológica." />
    </>
  );
}

/* Cena 4 — Limites da API: uma consulta oferecida e outra que o serviço não oferece. */
const LIMIT_STEPS = phases([1200, 1600, 1800, 1600, 1800], LINES.limits);

export function SceneLimits({ say, setCanAdvance, reducedMotion }: SceneProps) {
  const { step } = useSequence(LIMIT_STEPS, { reducedMotion, onDone: () => setCanAdvance(true) });

  useEffect(() => {
    say(LINES.limits);
  }, [say]);

  return (
    <>
      <Banner text="A API tem limites" tone="warning" icon="gateClosed" reducedMotion={reducedMotion} />
      <Place x={96} y={22} anchor="top-right" width={34}>
        <div className={styles.menu}>
          <span className={styles.menuHead}>
            <img src={ELEMENTS.plug} alt="" draggable={false} />
            Operações oferecidas
          </span>
          {OPERATIONS.map((op) => (
            <span key={op} className={styles.menuItem}>
              {op}
            </span>
          ))}
        </div>
      </Place>
      {ASKS.map((ask, i) => {
        const shownAt = i === 0 ? 1 : 3;
        const resultAt = shownAt + 1;
        return (
          <Place key={ask.text} x={4} y={i === 0 ? 26 : 56} anchor="top-left" width={56} hidden={step < shownAt} z={4}>
            <div className={cx(styles.ask, step >= resultAt && (ask.offered ? styles.askOk : styles.askNo))}>
              <span className={styles.askText}>
                <img src={ELEMENTS.mail} alt="" draggable={false} />
                {ask.text}
              </span>
              {step >= resultAt && (
                <span className={styles.askResult}>
                  <img src={ask.offered ? ELEMENTS.ok : ELEMENTS.error} alt="" draggable={false} />
                  {ask.result}
                </span>
              )}
            </div>
          </Place>
        );
      })}
      <Live text={step >= 4 ? "A segunda consulta não é oferecida pela API." : step >= 2 ? "A previsão de hoje é oferecida: 24 graus e sol." : ""} />
    </>
  );
}

/* Microinteração (.md): (a) solicitação → serviço mais adequado; (b) cliente, API e serviço no diagrama. */
export function SceneQuiz({ say, setHint, setCanAdvance, reducedMotion }: SceneProps) {
  const [part, setPart] = useState<"services" | "diagram">("services");
  const rand = useSeededRandom(0, { salt: "g2-aula-4-1" });
  const requests = useMemo(() => rand.shuffle(REQUESTS, "pedidos", true), [rand]);
  const pieces = useMemo(() => rand.shuffle(DIAGRAM_PIECES, "diagrama", true), [rand]);

  useEffect(() => {
    say(part === "services" ? EXTRA_LINES.match : EXTRA_LINES.diagram, "thinking");
  }, [part, say]);

  return part === "services" ? (
    <MatchBoard
      key="services"
      zones={SERVICES}
      pieces={requests}
      say={say}
      setHint={setHint}
      reducedMotion={reducedMotion}
      rightLine={EXTRA_LINES.matchRight}
      doneLine={EXTRA_LINES.matchDone}
      onDone={() => setPart("diagram")}
      countText={(placed, total) => `Solicitações: ${placed} de ${total}`}
      doneText="Serviços certos!"
    />
  ) : (
    <MatchBoard
      key="diagram"
      zones={DIAGRAM_ZONES}
      pieces={pieces}
      say={say}
      setHint={setHint}
      reducedMotion={reducedMotion}
      rightLine={EXTRA_LINES.diagramRight}
      doneLine={EXTRA_LINES.diagramDone}
      onDone={() => setCanAdvance(true)}
      countText={(placed, total) => `Diagrama: ${placed} de ${total}`}
      doneText="Diagrama completo!"
    />
  );
}

/* Fechamento — o app no centro, ligado a serviços especializados. */
const CLOSING_STEPS = phases([1000, 1000, 1000, 1400], LINES.closing);

export function SceneClosing({ say, setCanAdvance, reducedMotion }: SceneProps) {
  const { step } = useSequence(CLOSING_STEPS, { reducedMotion, onDone: () => setCanAdvance(true) });

  useEffect(() => {
    say(LINES.closing, "happy");
  }, [say]);

  return (
    <>
      <Banner text="APIs conectam aplicações a serviços" tone="success" icon="ok" reducedMotion={reducedMotion} />
      {FLOWS.map((flow, i) => (
        <Wire key={flow.id} from={{ x: 22, y: 53 }} to={{ x: 78, y: SERVICE_Y[i] }} state={step === i ? "active" : step > i ? "idle" : "off"} />
      ))}
      <Node at={{ x: 14, y: 53 }} element="cellphone" size={6} label="App de viagem" alt="App de viagem" look={{ highlighted: true }} />
      {FLOWS.map((flow, i) => (
        <Node key={flow.id} at={{ x: 50, y: 33 + (SERVICE_Y[i] - 33) * 0.62 + 6 }} element="plug" size={3.6} aspect={9 / 16} alt={flow.api} look={{ dimmed: step < i }} />
      ))}
      {FLOWS.map((flow, i) => (
        <Node key={flow.id} at={{ x: 85, y: SERVICE_Y[i] }} element="server" size={5} badge={flow.badge} label={flow.service} alt={flow.service} look={{ highlighted: step === i, dimmed: step < i }} />
      ))}
      <Live text="O app de viagem usa serviços especializados pelas APIs, sem reconstruir tudo." />
    </>
  );
}
