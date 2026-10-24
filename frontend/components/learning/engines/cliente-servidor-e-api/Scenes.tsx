"use client";

import { useEffect } from "react";
import { ELEMENTS } from "@/config/assets";
import { FlowChain, Place, Tag, useSequence, type FlowItem } from "@/components/learning/kit";
import { cx } from "@/components/ui/cx";
import { Banner, Live } from "../_api/parts";
import { phases, speechMs } from "../_api/timing";
import { ApiWorld, SHOWN_STEP, WORLD, type ApiWorldProps, type RoleId } from "../_api/World";
import { CITY, EXTRA_LINES, LINES, SUMMARY, TEMP, type SceneProps } from "./model";
import styles from "./ClienteServidorEApi.module.css";

/** O app de clima pedindo a temperatura (as mesmas peças em todas as cenas). */
export function World(props: Omit<ApiWorldProps, "appValue" | "requestLabel" | "responseLabel"> & { named?: boolean }) {
  const { named = false, ...rest } = props;
  return (
    <ApiWorld
      appCaption={CITY}
      appValue={`${CITY} — ${TEMP}`}
      appEmpty="? °C"
      serviceBadge="weather"
      requestLabel={named ? "REQUISIÇÃO" : "TEMPERATURA?"}
      requestAlt="Requisição: pedido da temperatura de Osasco"
      responseLabel={named ? "RESPOSTA" : TEMP}
      responseAlt={`Resposta: ${TEMP}`}
      panelRows={[CITY, "Temperatura"]}
      {...rest}
    />
  );
}

/* Cena 1 — Quem inicia? O app de clima, destacado como CLIENTE, começa o pedido. Fases: 0 destaque · 1 o pedido sai. */
const CLIENT_STEPS = phases([1300, 1600], LINES.client);

export function SceneClient({ say, setCanAdvance, reducedMotion }: SceneProps) {
  const { step } = useSequence(CLIENT_STEPS, { reducedMotion, onDone: () => setCanAdvance(true) });

  useEffect(() => {
    say(LINES.client);
  }, [say]);

  return (
    <>
      <Banner text="Quem inicia?" tone="warning" icon="question" reducedMotion={reducedMotion} />
      <World step={step >= 1 ? 0 : -1} roles={["client"]} focus="client" reducedMotion={reducedMotion} />
      <Live text="O app de clima é o cliente: ele inicia o pedido." />
    </>
  );
}

/* Cena 2 — A entrada definida: o pedido passa pela API. Fases: 0 sai do app · 1 na API · 2 as regras. */
const API_STEPS = phases([900, 1300, 1600], LINES.api);

export function SceneApiRole({ say, setCanAdvance, reducedMotion }: SceneProps) {
  const { step } = useSequence(API_STEPS, { reducedMotion, onDone: () => setCanAdvance(true) });

  useEffect(() => {
    say(LINES.api);
  }, [say]);

  return (
    <>
      <Banner text="A entrada definida" icon="plug" reducedMotion={reducedMotion} />
      <World step={Math.min(step, 1)} roles={["client", "api"]} focus="api" reducedMotion={reducedMotion} />
      {/* texto criado a partir da fala */}
      <Place x={WORLD.api.x} y={72} anchor="top" hidden={step < 2} z={4}>
        <Tag size="sm" tone="info" icon="plug">
          Regras e caminhos para pedir
        </Tag>
      </Place>
      <Live text="O pedido passa pela API, que define as regras e os caminhos para pedir." />
    </>
  );
}

/* Cena 3 — Quem processa? O pedido chega ao SERVIDOR, que consulta os dados. Fases: 0 API · 1 servidor · 2–3 consulta. */
const SERVER_STEPS = phases([800, 1200, 1000, 1400], LINES.server);

export function SceneServer({ say, setCanAdvance, reducedMotion }: SceneProps) {
  const { step } = useSequence(SERVER_STEPS, { reducedMotion, onDone: () => setCanAdvance(true) });

  useEffect(() => {
    say(LINES.server);
  }, [say]);

  return (
    <>
      <Banner text="Quem processa?" tone="warning" icon="question" reducedMotion={reducedMotion} />
      <World step={step + 1} roles={["client", "api", "server"]} focus="server" reducedMotion={reducedMotion} />
      <Live text="O pedido chegou ao servidor, que consulta os dados." />
    </>
  );
}

/* Cena 4 — Ida e volta: REQUISIÇÃO vai, RESPOSTA volta; depois o caminho completo do .md. */
const TRIP: FlowItem[] = [
  { id: "c1", label: "Cliente", element: "cellphone" },
  { id: "req", label: "Requisição pela API", element: "mail" },
  { id: "srv", label: "Servidor", element: "server" },
  { id: "res", label: "Resposta", element: "boxGold" },
  { id: "c2", label: "Cliente", element: "cellphone" },
];
const TRIP_STEPS = [800, 1100, 1100, 800, 800, 900, 1100, 1100].map((hold) => ({ hold })).concat([{ hold: Math.max(2500, speechMs(LINES.messages) - 7700) }]);

export function SceneRoundTrip({ say, setCanAdvance, reducedMotion }: SceneProps) {
  const { step } = useSequence(TRIP_STEPS, { reducedMotion, onDone: () => setCanAdvance(true) });
  const shown = step >= SHOWN_STEP;

  useEffect(() => {
    say(LINES.messages);
  }, [say]);

  return (
    <>
      <Banner key={step >= 5 ? "back" : "go"} text={step >= 5 ? "A resposta volta" : "A requisição vai"} tone={step >= 5 ? "warning" : "info"} icon={step >= 5 ? "boxGold" : "mail"} reducedMotion={reducedMotion} />
      <World step={step} named reducedMotion={reducedMotion} />
      <Place x={50} y={86} width={96} hidden={!shown} z={6}>
        <div className={styles.tripFit}>
          <FlowChain items={TRIP} size={4.5} ariaLabel="Cliente, requisição pela API, servidor, resposta, cliente" />
        </div>
      </Place>
      <Live text={shown ? "Cliente, requisição pela API, servidor, resposta, cliente." : step >= 5 ? "A resposta volta ao cliente." : "A requisição vai até o servidor."} />
    </>
  );
}

/*
 * Cena 5 — Conferindo os papéis: a animação fica pausada (requisição parada na API) e cada peça é destacada; no fim,
 * o aviso de que a API costuma morar no servidor.
 */
const ROLE_ORDER: RoleId[] = ["client", "api", "server"];
const ROLE_TEXT: Record<RoleId, string> = { client: "Cliente: inicia o pedido", api: "API: regras e caminhos", server: "Servidor: processa o pedido" };
const ROLES_STEPS = phases([1600, 1600, 1600, 2000], EXTRA_LINES.roles);

export function SceneRoles({ say, setCanAdvance, reducedMotion }: SceneProps) {
  const { step } = useSequence(ROLES_STEPS, { reducedMotion, onDone: () => setCanAdvance(true) });
  const focus = step < ROLE_ORDER.length ? ROLE_ORDER[step] : null;

  useEffect(() => {
    say(EXTRA_LINES.roles, "thinking");
  }, [say]);

  return (
    <>
      <Banner text="Animação pausada: os papéis" tone="warning" icon="magnifier" reducedMotion={reducedMotion} />
      <World step={1} roles={ROLE_ORDER} focus={focus} reducedMotion={reducedMotion} />
      <Place x={50} y={80} anchor="top" z={6}>
        <div key={focus ?? "note"} className={styles.note}>
          {focus ? ROLE_TEXT[focus] : "Num sistema real, a API costuma ficar no serviço, no servidor"}
        </div>
      </Place>
      <Live text={focus ? ROLE_TEXT[focus] : "Num sistema real, a API costuma ser disponibilizada pelo serviço, no servidor."} />
    </>
  );
}

/* Fechamento — resumo visual do .md: Cliente = pede | API = define como pedir | Servidor = processa | Requisição = pedido | Resposta = retorno. */
const SUMMARY_STEPS = phases([...SUMMARY.map(() => 900), 1200], EXTRA_LINES.closing);

export function SceneSummary({ say, setCanAdvance, reducedMotion }: SceneProps) {
  const { step } = useSequence(SUMMARY_STEPS, { reducedMotion, onDone: () => setCanAdvance(true) });

  useEffect(() => {
    say(EXTRA_LINES.closing, "happy");
  }, [say]);

  return (
    <>
      <Banner text="Resumo da comunicação" tone="success" icon="ok" reducedMotion={reducedMotion} />
      <Place x={50} y={56} width={92}>
        <ul className={styles.summary} aria-label="Resumo">
          {SUMMARY.map((item, index) => (
            <li key={item.term} className={cx(styles.summaryItem, index > step && styles.summaryHidden)}>
              <img src={ELEMENTS[item.element]} alt="" draggable={false} />
              <strong>{item.term}</strong>
              <span>{item.meaning}</span>
            </li>
          ))}
        </ul>
      </Place>
      <Live text={SUMMARY.slice(0, step + 1).map((item) => `${item.term}: ${item.meaning}.`).join(" ")} />
    </>
  );
}
