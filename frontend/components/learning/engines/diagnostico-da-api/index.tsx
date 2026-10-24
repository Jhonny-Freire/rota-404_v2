"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BonziState } from "@/types/domain";
import { ELEMENTS, SPRITES } from "@/config/assets";
import type { LabEngineMeta, LabEngineProps } from "@/components/learning/runtime";
import { ActionButton, ChoiceGrid, Place, SceneCanvas, Tag, useSeededRandom, useTimers, type ChoiceResult } from "@/components/learning/kit";
import { cx } from "@/components/ui/cx";
import { RequestLine, StatusBadge } from "../_api/http";
import { JsonView, jsonLines } from "../_api/Json";
import { Banner, Live, Starfield } from "../_api/parts";
import { REPEAT_LINE_MS } from "../_api/timing";
import { BANNER, TEXT, TIMING, buildCases, type BannerSpec, type Option } from "./model";
import styles from "./DiagnosticoDaApi.module.css";

/** Os 4 casos do .md (Planeta 4.3) são as etapas. */
export const meta: LabEngineMeta = {
  kind: "lab",
  steps: ["Recurso inexistente", "Pedido inválido", "Autenticação necessária", "Falha interna"],
};

type Stage = "cause" | "action" | "field" | "login" | "resolved" | "done";
const SALT = "g2-lab-4-3";

/** Laboratório 4.3 (Galáxia 2) — Diagnóstico da API (faixa14-completa.md, Assunto 4, Planeta 4.3) */
export default function DiagnosticoDaApi({ attempt, say, feedback, setStep, mistake, finish, reducedMotion, Stage: StageSlot, Interaction }: LabEngineProps) {
  const rand = useSeededRandom(attempt, { salt: SALT });
  const cases = useMemo(() => buildCases(rand), [rand]);
  const timers = useTimers({ reducedMotion });

  const [index, setIndex] = useState(0);
  const [stage, setStageState] = useState<Stage>("cause");
  const [openReq, setOpenReq] = useState(false);
  const [openRes, setOpenRes] = useState(false);
  const [filled, setFilled] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [after, setAfter] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [banner, setBanner] = useState<{ spec: BannerSpec; key: number }>({ spec: BANNER.examine, key: 0 });
  const stageRef = useRef<Stage>("cause");
  const lineRef = useRef<{ text: string; at: number } | null>(null);
  const item = cases[index];
  const causes = useMemo(() => rand.shuffle(item.causes, `causas-${index}`), [rand, item, index]);
  const actions = useMemo(() => (item.actions ? rand.shuffle(item.actions, `acoes-${index}`) : []), [rand, item, index]);

  const setStage = useCallback((next: Stage) => {
    stageRef.current = next;
    setStageState(next);
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
    setStep(0);
    guide(BANNER.examine, TEXT.intro, "thinking");
    feedback({ tone: "hint", message: TEXT.open });
  }, [setStep, guide, feedback]);

  /**
   * O caso está resolvido: explica o status. Revisão: a troca para o próximo caso era automática e rápida demais
   * para ler; agora a criança toca em "Próximo caso" (ou "Concluir" no último) quando terminar de ler.
   */
  const resolve = (text: string) => {
    setStage("resolved");
    setMessage({ text: `${text} ${item.explain}`, ok: true });
    guide(BANNER.fixed, `${text} ${item.explain}`, "happy");
    feedback({ tone: "success", message: item.explain });
  };

  const nextCase = () => {
    if (stageRef.current !== "resolved") return;
    if (index === cases.length - 1) {
      setStage("done");
      setStep(meta.steps.length);
      guide(BANNER.done, TEXT.done, "happy");
      feedback({ tone: "success", message: TEXT.doneFb });
      timers.after(TIMING.finish, finish, { hold: true });
      return;
    }
    const next = index + 1;
    setIndex(next);
    setStage("cause");
    setOpenReq(false);
    setOpenRes(false);
    setFilled(false);
    setLoggedIn(false);
    setAfter(false);
    setMessage(null);
    setStep(next);
    guide(BANNER.examine, TEXT.caseStart(next + 1, cases[next].title), "thinking");
    feedback({ tone: "hint", message: TEXT.open });
  };

  const wrong = (option: Option | undefined) => {
    mistake();
    const why = option?.why ?? "";
    setMessage({ text: why, ok: false });
    guide(BANNER.wrong, `Ainda não. ${why}`, "warning");
    feedback({ tone: "error", message: why });
  };

  /** "O que aconteceu?" */
  const onCause = (result: ChoiceResult) => {
    if (stageRef.current !== "cause") return;
    if (!result.correct) {
      wrong(item.causes.find((c) => c.id === result.wrong[0]));
      return;
    }
    const right = item.causes.find((c) => c.correct)!;
    setOpenRes(true);
    setMessage({ text: right.why, ok: true });
    if (item.fix === "field") {
      setStage("field");
      setOpenReq(true);
      guide(BANNER.right, `${TEXT.causeRight} ${TEXT.fieldAsk}`, "happy");
      feedback({ tone: "hint", message: TEXT.fieldAsk });
    } else if (item.fix === "login") {
      setStage("login");
      guide(BANNER.right, `${TEXT.causeRight} ${TEXT.loginAsk}`, "happy");
      feedback({ tone: "hint", message: TEXT.loginAsk });
    } else {
      setStage("action");
      guide(BANNER.action, `${TEXT.causeRight} ${TEXT.actionAsk}`, "happy");
      feedback({ tone: "hint", message: right.why });
    }
  };

  /** Próxima ação (casos 1 e 4). */
  const onAction = (result: ChoiceResult) => {
    if (stageRef.current !== "action") return;
    if (!result.correct) {
      wrong(item.actions?.find((a) => a.id === result.wrong[0]));
      return;
    }
    resolve(item.actions!.find((a) => a.correct)!.why);
  };

  /** Caso 2: tocar no campo vazio; preenchido, o pedido é enviado de novo. */
  const pickField = (empty: boolean) => {
    if (stageRef.current !== "field" || filled) return;
    if (!empty) {
      setMessage({ text: TEXT.fieldWrong, ok: false });
      say(TEXT.fieldWrong, "warning");
      return;
    }
    setFilled(true);
    setMessage({ text: TEXT.fieldFixed, ok: true });
    say(TEXT.fieldFixed);
    feedback({ tone: "hint", message: TEXT.fieldFixed });
  };

  const resend = () => {
    if (stageRef.current !== "field" || !filled) return;
    setAfter(true);
    timers.after(TIMING.resend, () => resolve(item.after!.message), { hold: true });
  };

  /** Caso 3: entrar na conta simulada e repetir o pedido. */
  const login = () => {
    if (stageRef.current !== "login") return;
    setLoggedIn(true);
    say("Pronto, você entrou na conta simulada. Agora repita o pedido.");
  };

  const repeat = () => {
    if (stageRef.current !== "login" || !loggedIn) return;
    setAfter(true);
    timers.after(TIMING.resend, () => resolve(item.after!.message), { hold: true });
  };

  const response = after && item.after ? item.after : item;
  const responseLines = useMemo(() => jsonLines(response.response), [response]);
  const body = item.body ? Object.entries(item.body).map(([key, value]) => ({ key, value: filled && !value ? (key === "email" ? "aluno@exemplo.test" : "Aluno") : value, empty: !value })) : [];

  return (
    <>
      <StageSlot>
        <SceneCanvas className={styles.canvas} label={`Caso ${index + 1} de ${cases.length}: ${item.title}`}>
          <Starfield />
          <Banner key={banner.key} text={banner.spec.text} tone={banner.spec.tone} icon={banner.spec.icon} reducedMotion={reducedMotion} />
          <Place key={`req-${index}`} x={3} y={19} anchor="top-left" width={45}>
            <section className={cx(styles.part, openReq && styles.partOpen)}>
              <button type="button" className={styles.partHead} onClick={() => setOpenReq((o) => !o)} aria-expanded={openReq}>
                <img src={ELEMENTS.mail} alt="" draggable={false} />
                REQUISIÇÃO
                <img src={openReq ? SPRITES.ui.close : SPRITES.ui.next} alt="" draggable={false} className={styles.partToggle} />
              </button>
              {openReq && (
                <div className={styles.partBody}>
                  <RequestLine method={item.method} path={item.path} />
                  {(item.note || loggedIn) && (
                    <Tag size="sm" tone={loggedIn ? "success" : "danger"}>
                      {loggedIn ? "conta simulada: entrou" : item.note}
                    </Tag>
                  )}
                  {body.length > 0 && (
                    <div className={styles.fields} role="group" aria-label="Dados enviados">
                      {body.map((f) => (
                        <button
                          key={f.key}
                          type="button"
                          className={cx(styles.field, f.empty && filled && styles.fieldFixed, f.empty && !filled && stage === "field" && styles.fieldEmpty)}
                          onClick={() => pickField(f.empty)}
                          disabled={stage !== "field" || filled}
                          aria-label={`Campo ${f.key}: ${f.value || "vazio"}`}
                        >
                          <span className={styles.fieldKey}>{f.key}:</span> {f.value || "(vazio)"}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </section>
          </Place>
          <Place key={`res-${index}`} x={97} y={19} anchor="top-right" width={45}>
            <section className={cx(styles.part, openRes && styles.partOpen)}>
              <button type="button" className={styles.partHead} onClick={() => setOpenRes((o) => !o)} aria-expanded={openRes}>
                <img src={ELEMENTS.boxGold} alt="" draggable={false} />
                RESPOSTA
                <img src={openRes ? SPRITES.ui.close : SPRITES.ui.next} alt="" draggable={false} className={styles.partToggle} />
              </button>
              {openRes && (
                <div className={styles.partBody}>
                  <StatusBadge code={response.code} text={response.text} />
                  <JsonView lines={responseLines} label="Corpo da resposta" />
                </div>
              )}
            </section>
          </Place>
          {message && (
            <Place key={message.text} x={50} y={80} anchor="top" width={90} z={5}>
              <p className={cx(styles.message, message.ok ? styles.messageOk : styles.messageWrong)}>{message.text}</p>
            </Place>
          )}
          <Live text={message?.text ?? ""} />
        </SceneCanvas>
      </StageSlot>
      <Interaction>
        <div className={styles.panel}>
          <p className={styles.lead}>
            Caso {index + 1} de {cases.length}: <strong>{item.title}</strong>
          </p>
          {stage === "cause" && (
            <>
              <p className={styles.question}>O que aconteceu?</p>
              <ChoiceGrid key={`causa-${index}`} choices={causes.map((c) => ({ id: c.id, label: c.label }))} correct={[item.causes.find((c) => c.correct)!.id]} onResult={onCause} columns={1} retryMs={1300} ariaLabel="O que aconteceu?" />
            </>
          )}
          {stage === "action" && (
            <>
              <p className={styles.question}>Qual é a próxima ação?</p>
              <ChoiceGrid key={`acao-${index}`} choices={actions.map((a) => ({ id: a.id, label: a.label }))} correct={[item.actions!.find((a) => a.correct)!.id]} onResult={onAction} columns={1} retryMs={1300} ariaLabel="Qual é a próxima ação?" />
            </>
          )}
          {stage === "field" && <ActionButton label="Enviar de novo" sprite={SPRITES.ui.play} onClick={resend} disabled={!filled || after} attention={filled && !after} focusOnAttention size={22} />}
          {stage === "login" && (
            <div className={styles.stack}>
              <ActionButton label="Entrar na conta simulada" element="key" variant={loggedIn ? "default" : "primary"} onClick={login} disabled={loggedIn} attention={!loggedIn} size={22} />
              <ActionButton label="Repetir o pedido" sprite={SPRITES.ui.play} onClick={repeat} disabled={!loggedIn || after} attention={loggedIn && !after} focusOnAttention size={22} />
            </div>
          )}
          {stage === "resolved" && (
            <div className={styles.stack}>
              <ActionButton label={index === cases.length - 1 ? "Concluir" : "Próximo caso"} sprite={SPRITES.ui.next} onClick={nextCase} attention focusOnAttention size={22} />
            </div>
          )}
        </div>
      </Interaction>
    </>
  );
}
