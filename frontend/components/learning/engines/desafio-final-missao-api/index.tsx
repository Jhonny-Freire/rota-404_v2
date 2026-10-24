"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BonziState } from "@/types/domain";
import { ELEMENTS, SPRITES } from "@/config/assets";
import type { LabEngineMeta, LabEngineProps } from "@/components/learning/runtime";
import { ActionButton, ChoiceGrid, DragPiece, DragProvider, DropZone, Place, SceneCanvas, useSeededRandom, useTimers, type ChoiceResult, type DragMoveHandler } from "@/components/learning/kit";
import { cx } from "@/components/ui/cx";
import { METHODS, MethodTag, RequestLine, StatusBadge, type HttpMethod } from "../_api/http";
import { JsonView, jsonLines, type Tok } from "../_api/Json";
import { Banner, Live, Node, Starfield, Traveler, Wire } from "../_api/parts";
import { REPEAT_LINE_MS } from "../_api/timing";
import { BANNER, EXPLANATIONS, METHOD_WHY, RESOURCES, RESOURCE_WHY, STEP, TEXT, TIMING, buildMission, type BannerSpec, type Phase } from "./model";
import styles from "./DesafioFinalMissaoApi.module.css";

/** As 5 etapas do .md (Planeta 4.4). */
export const meta: LabEngineMeta = {
  kind: "lab",
  steps: ["Escolher a requisição", "Interpretar o erro", "Corrigir e reenviar", "Ler a resposta JSON", "Apresentar os dados"],
};

const SALT = "g2-lab-4-4";
const LINE_Y = 66;
const STOPS = [{ x: 14, y: LINE_Y }, { x: 27, y: LINE_Y }, { x: 39, y: LINE_Y }];
type Field = "nome" | "preco";

/** Laboratório 4.4 (Galáxia 2) — Desafio final: missão API (faixa14-completa.md, Assunto 4, Planeta 4.4) */
export default function DesafioFinalMissaoApi({ attempt, say, feedback, setStep, mistake, finish, reducedMotion, Stage, Interaction }: LabEngineProps) {
  const rand = useSeededRandom(attempt, { salt: SALT });
  const mission = useMemo(() => buildMission(rand, attempt), [rand, attempt]);
  const choices = useMemo(() => rand.shuffle(EXPLANATIONS.map(({ id, label }) => ({ id, label })), "explicacoes"), [rand]);
  const timers = useTimers({ reducedMotion });
  const { product } = mission;

  const [phase, setPhaseState] = useState<Phase>("choose");
  const [method, setMethod] = useState<HttpMethod | null>(null);
  const [resource, setResource] = useState<string | null>(null);
  const [id, setId] = useState(mission.wrongId);
  const [travel, setTravel] = useState(-1);
  const [response, setResponse] = useState<{ code: number; text: string } | null>(null);
  const [found, setFound] = useState<Field[]>([]);
  const [placed, setPlaced] = useState<Field[]>([]);
  const [wrongZone, setWrongZone] = useState<Field | null>(null);
  const [marks, setMarks] = useState<Record<string, "ok" | "wrong">>({});
  const [banner, setBanner] = useState<{ spec: BannerSpec; key: number }>({ spec: BANNER.choose, key: 0 });
  const phaseRef = useRef<Phase>("choose");
  const lineRef = useRef<{ text: string; at: number } | null>(null);

  const setPhase = useCallback((next: Phase) => {
    phaseRef.current = next;
    setPhaseState(next);
  }, []);

  const show = useCallback((spec: BannerSpec) => setBanner((prev) => ({ spec, key: prev.key + 1 })), []);

  const guide = useCallback(
    (spec: BannerSpec, line: string, state?: BonziState) => {
      show(spec);
      const last = lineRef.current;
      if (last && last.text === line && performance.now() - last.at < REPEAT_LINE_MS) return;
      lineRef.current = { text: line, at: performance.now() };
      say(line, state);
    },
    [show, say],
  );

  useEffect(() => {
    setStep(STEP.choose);
    guide(BANNER.choose, TEXT.intro, "thinking");
    feedback({ tone: "hint", message: TEXT.chooseFb });
  }, [setStep, guide, feedback]);

  /** anima cliente → API/servidor → resposta; `then` recebe o fim */
  const send = (then: () => void) => {
    setPhase("sending");
    setResponse(null);
    show(BANNER.sending);
    [0, 1, 2, 1, 0].forEach((stop, i) => timers.after(i * TIMING.travel, () => setTravel(i < 3 ? stop : 10 + stop), { hold: true }));
    timers.after(5 * TIMING.travel, () => {
      setTravel(-1);
      then();
    }, { hold: true });
  };

  /** Etapa 1: método e endpoint. Erro: explica a intenção/o recurso e conta erro. */
  const sendFirst = () => {
    if (phaseRef.current !== "choose" || !method || !resource) return;
    if (method !== "GET" || resource !== "/products/") {
      mistake();
      const why = method !== "GET" ? METHOD_WHY[method] : RESOURCE_WHY[resource];
      guide(BANNER.wrong, TEXT.chooseWrong(why), "warning");
      feedback({ tone: "error", message: why });
      return;
    }
    send(() => {
      setResponse({ code: 404, text: "Not Found" });
      setPhase("interpret");
      setStep(STEP.interpret);
      guide(BANNER.notFound, TEXT.notFound, "thinking");
      feedback({ tone: "hint", message: TEXT.interpretFb });
    });
  };

  /** Etapa 2: o que o 404 quer dizer. */
  const onInterpret = (result: ChoiceResult) => {
    if (phaseRef.current !== "interpret") return;
    const picked = EXPLANATIONS.find((e) => e.id === (result.correct ? "nao-encontrado" : result.wrong[0]));
    if (!result.correct) {
      mistake();
      guide(BANNER.wrong, TEXT.chooseWrong(picked?.why ?? ""), "warning");
      feedback({ tone: "error", message: picked?.why ?? "" });
      return;
    }
    setPhase("fix");
    setStep(STEP.fix);
    guide(BANNER.fix, `${picked!.why} ${TEXT.fix}`, "happy");
    feedback({ tone: "hint", message: TEXT.fixFb(product.id) });
  };

  /** Etapa 3: corrigir o ID e reenviar. */
  const sendFixed = () => {
    if (phaseRef.current !== "fix") return;
    if (id !== product.id) {
      mistake();
      guide(BANNER.wrong, TEXT.fixWrong(product.id), "warning");
      feedback({ tone: "error", message: TEXT.fixWrong(product.id) });
      return;
    }
    send(() => {
      setResponse({ code: 200, text: "OK" });
      setPhase("read");
      setStep(STEP.read);
      guide(BANNER.ok, TEXT.ok, "happy");
      feedback({ tone: "hint", message: TEXT.readFb });
    });
  };

  /** Etapa 4: identificar nome e preco no JSON. */
  const onTap = (tok: Tok) => {
    if (phaseRef.current !== "read" || !tok.path) return;
    if (tok.path !== "nome" && tok.path !== "preco") {
      const key = tok.path;
      setMarks((m) => ({ ...m, [key]: "wrong" }));
      timers.after(1000, () => setMarks((m) => Object.fromEntries(Object.entries(m).filter(([k, v]) => !(k === key && v === "wrong")))), { hold: true });
      mistake();
      guide(BANNER.wrong, TEXT.readWrong, "warning");
      feedback({ tone: "error", message: TEXT.readWrong });
      return;
    }
    const field = tok.path as Field;
    setMarks((m) => ({ ...m, [field]: "ok" }));
    const next = found.includes(field) ? found : [...found, field];
    setFound(next);
    if (next.length === 2) {
      setPhase("present");
      setStep(STEP.present);
      guide(BANNER.present, `${TEXT.readRight} ${TEXT.present}`, "happy");
      feedback({ tone: "hint", message: TEXT.presentFb });
    } else {
      say(TEXT.readRight, "happy");
    }
  };

  /** Etapa 5: arrastar Teclado → Nome e 120 → Preço. */
  const onMove: DragMoveHandler = (itemId, zoneId) => {
    if (phaseRef.current !== "present") return false;
    const field = itemId.replace("valor-", "") as Field;
    const zone = zoneId.replace("campo-", "") as Field;
    if (field !== zone) {
      mistake();
      setWrongZone(zone);
      timers.after(1100, () => setWrongZone((z) => (z === zone ? null : z)), { hold: true });
      guide(BANNER.wrong, TEXT.presentWrong, "warning");
      feedback({ tone: "error", message: TEXT.presentWrong });
      return false;
    }
    const next = [...placed, field];
    setPlaced(next);
    if (next.length === 2) {
      setPhase("done");
      setStep(meta.steps.length);
      guide(BANNER.done, TEXT.done, "happy");
      feedback({ tone: "success", message: TEXT.doneFb });
      timers.after(TIMING.finish, finish, { hold: true });
    } else {
      show(BANNER.present);
    }
    return true;
  };

  const ok = response?.code === 200;
  const json = useMemo(() => jsonLines(ok ? { id: product.id, nome: product.nome, preco: product.preco } : { erro: "Produto não encontrado" }), [ok, product]);
  const path = `${resource ?? "/?/"}${id}`;
  const showCard = phase === "present" || phase === "done";
  const values: Record<Field, string> = { nome: product.nome, preco: String(product.preco) };

  return (
    <DragProvider onMove={onMove} disabled={phase !== "present"}>
      <Stage>
        <SceneCanvas className={styles.canvas} label={`Missão: encontre o nome e o preço do produto ${product.id}`}>
          <Starfield />
          <Banner key={banner.key} text={banner.spec.text} tone={banner.spec.tone} icon={banner.spec.icon} reducedMotion={reducedMotion} />
          <Place x={3} y={18} anchor="top-left" width={45}>
            <div className={styles.mission}>
              <span className={styles.missionHead}>
                <img src={ELEMENTS.receipt} alt="" draggable={false} />
                Missão API
              </span>
              <strong>Encontre o nome e o preço do produto {product.id} e mostre-os no cartão do produto.</strong>
            </div>
          </Place>
          <Place x={3} y={44} anchor="top-left" width={45} z={4}>
            <div className={styles.request}>
              {method ? <RequestLine method={method} path={path} status={response ? (ok ? "ok" : "wrong") : null} /> : <span className={styles.placeholder}>Escolha o método e o endpoint</span>}
            </div>
          </Place>
          <Wire from={{ x: 18, y: LINE_Y }} to={{ x: 35, y: LINE_Y }} state={travel >= 0 ? "active" : "idle"} back={travel >= 10} />
          <Node at={{ x: 12, y: LINE_Y }} element="cellphone" size={4.4} label="Cliente" alt="Cliente" look={{ highlighted: travel === 10 }} />
          <Node at={{ x: 41, y: LINE_Y }} element="server" size={5} badge="plug" label="API / servidor" alt="API e servidor" look={{ highlighted: travel === 2 }} />
          {travel >= 0 && travel < 3 && <Traveler key="req" at={STOPS[travel]} tone="request" label="GET" reducedMotion={reducedMotion} lift={6} />}
          {travel >= 10 && <Traveler key="res" at={STOPS[travel - 10]} tone={id === product.id ? "response" : "error"} label={id === product.id ? "200" : "404"} reducedMotion={reducedMotion} lift={6} />}
          {response && (
            <Place key={response.code} x={97} y={18} anchor="top-right" width={49} z={4}>
              <div className={styles.response}>
                <StatusBadge code={response.code} text={response.text} />
                <JsonView lines={json} label="Resposta JSON" tappable={phase === "read" ? ["string", "number"] : []} onTap={onTap} marks={marks} title="RESPOSTA" />
              </div>
            </Place>
          )}
          {showCard && (
            <Place x={97} y={64} anchor="top-right" width={49} z={5}>
              <div className={cx(styles.card, phase === "done" && styles.cardDone)} role="group" aria-label="Cartão do produto">
                <span className={styles.cardHead}>
                  <img src={ELEMENTS.store} alt="" draggable={false} />
                  Cartão do produto
                </span>
                {(["nome", "preco"] as Field[]).map((field) => (
                  <div key={field} className={styles.cardRow}>
                    <span>{field === "nome" ? "Nome" : "Preço"}</span>
                    <DropZone id={`campo-${field}`} label={`Campo ${field === "nome" ? "Nome" : "Preço"}`} hideLabel layout="stack" status={placed.includes(field) ? "correct" : wrongZone === field ? "wrong" : null} className={styles.slot} emptyHint={<span className={styles.hint}>solte aqui</span>}>
                      {placed.includes(field) && <DragPiece id={`valor-${field}`} label={field === "preco" ? `R$ ${values[field]}` : values[field]} disabled className={styles.value} />}
                    </DropZone>
                  </div>
                ))}
              </div>
            </Place>
          )}
          <Live text={response ? `Resposta ${response.code} ${response.text}.` : ""} />
        </SceneCanvas>
      </Stage>
      <Interaction>
        <div className={styles.panel}>
          {phase === "choose" && (
            <>
              <fieldset className={styles.group}>
                <legend>Método</legend>
                {METHODS.map((m) => (
                  <button key={m} type="button" className={cx(styles.opt, method === m && styles.optOn)} aria-pressed={method === m} onClick={() => setMethod(m)}>
                    <MethodTag method={m} size="sm" />
                  </button>
                ))}
              </fieldset>
              <fieldset className={styles.group}>
                <legend>Endpoint (o ID {mission.wrongId} já veio digitado)</legend>
                {RESOURCES.map((r) => (
                  <button key={r} type="button" className={cx(styles.opt, styles.mono, resource === r && styles.optOn)} aria-pressed={resource === r} onClick={() => setResource(r)}>
                    {r}
                    {mission.wrongId}
                  </button>
                ))}
              </fieldset>
              <ActionButton label="ENVIAR" sprite={SPRITES.ui.play} onClick={sendFirst} disabled={!method || !resource} attention={Boolean(method && resource)} size={22} />
            </>
          )}
          {phase === "sending" && <p className={styles.lead}>Enviando a requisição...</p>}
          {phase === "interpret" && (
            <>
              <p className={styles.lead}>O que o 404 quer dizer?</p>
              <ChoiceGrid choices={choices} correct={["nao-encontrado"]} onResult={onInterpret} columns={1} retryMs={1300} ariaLabel="O que o 404 quer dizer?" />
            </>
          )}
          {phase === "fix" && (
            <>
              <fieldset className={styles.group}>
                <legend>ID do produto</legend>
                {mission.ids.map((n) => (
                  <button key={n} type="button" className={cx(styles.opt, styles.mono, id === n && styles.optOn)} aria-pressed={id === n} onClick={() => setId(n)}>
                    {n}
                  </button>
                ))}
              </fieldset>
              <ActionButton label="ENVIAR" sprite={SPRITES.ui.play} onClick={sendFixed} attention={id === product.id} size={22} />
            </>
          )}
          {phase === "read" && <p className={styles.lead}>Toque no nome e no preço, no JSON da resposta ({found.length} de 2).</p>}
          {(phase === "present" || phase === "done") && (
            <>
              <p className={styles.lead}>Leve cada valor para o cartão:</p>
              <div className={styles.pool}>
                {(["nome", "preco"] as Field[])
                  .filter((f) => !placed.includes(f))
                  .map((f) => (
                    <span key={f} className={cx(!reducedMotion && styles.cue)}>
                      <DragPiece id={`valor-${f}`} label={values[f]} className={styles.value} />
                    </span>
                  ))}
              </div>
            </>
          )}
        </div>
      </Interaction>
    </DragProvider>
  );
}
