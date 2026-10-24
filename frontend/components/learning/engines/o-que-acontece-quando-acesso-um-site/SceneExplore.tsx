"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ELEMENTS, SPRITES } from "@/config/assets";
import { useBonziSpeaking } from "@/hooks/useBonziSpeaking";
import {
  ActionButton,
  Callout,
  FlowChain,
  OrderCards,
  Place,
  Tag,
  useSeededRandom,
  useTimers,
  type ElementKey,
  type FlowItem,
  type KitTone,
  type OrderItem,
  type OrderResult,
} from "@/components/learning/kit";
import { cx } from "@/components/ui/cx";
import {
  BANNER,
  EXPLORE_LINES,
  GUIDE,
  ORDER_IDS,
  ORDER_STEPS,
  PARTS,
  READY_PAUSE_MS,
  RESPONSE_AT,
  speechMs,
  type Part,
  type PartId,
  type SceneProps,
} from "./model";
import { Banner, BrowserIcon, Client, InternetNode, Live, MiniPage, ResponseNode, ServerNode, Wires, type Look } from "./World";
import styles from "./OQueAconteceQuandoAcessoUmSite.module.css";

/*
 * Cena 6 — Microinteração, em duas partes na mesma cena (o .md: "O aluno toca em cada elemento... Depois, o aluno
 * organiza três etapas fora de ordem"): (a) tocar nas 4 partes para descobrir a função de cada uma; (b) ordenar
 * Pedido, Resposta e Página. Só o acerto da ordem libera "Próxima cena".
 */
export function SceneExplore(props: SceneProps) {
  const [stage, setStage] = useState<"explore" | "order">("explore");
  /** o foco estava numa das partes (teclado): ao trocar de parte, ele vai para o primeiro cartão */
  const [focusFirst, setFocusFirst] = useState(false);

  const toOrder = (hadFocus: boolean) => {
    setFocusFirst(hadFocus);
    setStage("order");
  };

  return stage === "explore" ? (
    <ExploreParts key="explore" {...props} onExplored={toOrder} />
  ) : (
    <OrderSteps key="order" {...props} focusFirst={focusFirst} />
  );
}

const PART_ICON: Record<Exclude<PartId, "browser">, ElementKey> = {
  internet: "internet",
  server: "server",
  response: "boxGold",
};

function PartIcon({ id }: { id: PartId }) {
  if (id === "browser") return <BrowserIcon size={4} />;
  return <img src={ELEMENTS[PART_ICON[id]]} alt="" draggable={false} className={styles.explainIcon} />;
}

/** "Navegador: permite..." com o nome em destaque (o texto continua o literal do .md). */
function PartText({ text }: { text: string }) {
  const cut = text.indexOf(":") + 1;
  return (
    <span>
      <strong className={styles.explainName}>{text.slice(0, cut)}</strong>
      {text.slice(cut)}
    </span>
  );
}

type ExploreProps = SceneProps & { onExplored: (hadFocus: boolean) => void };

function ExploreParts({ say, setHint, reducedMotion, onExplored }: ExploreProps) {
  const layerRef = useRef<HTMLDivElement>(null);
  /* a ordenação só começa quando o aluno toca em "Continuar" (e o botão só aparece depois que o Bonzi termina) */
  const speaking = useBonziSpeaking();
  const [selected, setSelected] = useState<PartId | null>(null);
  const [found, setFound] = useState<PartId[]>([]);
  /** cópia síncrona de `found`: dois toques no mesmo quadro não se perdem */
  const foundRef = useRef<PartId[]>([]);
  const complete = found.length === PARTS.length;
  const active = PARTS.find((part) => part.id === selected) ?? null;

  useEffect(() => {
    say(EXPLORE_LINES.intro, "help");
  }, [say]);

  const tap = (part: Part) => {
    const prev = foundRef.current;
    const next = prev.includes(part.id) ? prev : [...prev, part.id];
    const left = PARTS.length - next.length;
    foundRef.current = next;
    setSelected(part.id);
    setFound(next);
    say(part.text, left === 0 ? "happy" : "speaking");
    setHint(left > 0 ? GUIDE.left(left) : GUIDE.explored);
  };

  const goOn = () => {
    const layer = layerRef.current;
    const focused = document.activeElement;
    onExplored(Boolean(layer && focused && layer.contains(focused)));
  };

  /* a parte tocada agora brilha; as já descobertas ganham a marca de ok */
  const lookOf = (id: PartId): Look => ({
    highlighted: selected === id,
    correct: found.includes(id),
    pulse: !found.includes(id),
  });
  const partOf = (id: PartId) => PARTS.find((part) => part.id === id) as Part;
  const tapOf = (id: PartId) => () => tap(partOf(id));

  return (
    <div ref={layerRef} className={styles.layer}>
      {active ? (
        <Place key={active.id} x={50} y={3} anchor="top" z={6}>
          <Callout tone="info" size="md" maxWidth={76}>
            <span className={styles.explain}>
              <PartIcon id={active.id} />
              <PartText text={active.text} />
            </span>
          </Callout>
        </Place>
      ) : (
        <Banner text={BANNER.explore} tone="warning" icon="magnifier" reducedMotion={reducedMotion} />
      )}

      <Wires />
      {/* ordem do DOM = ordem visual (esquerda para a direita), para o Tab seguir a cena */}
      <Client layout="side" page={<MiniPage />} look={lookOf("browser")} onTap={tapOf("browser")} pressed={selected === "browser"} />
      <InternetNode look={lookOf("internet")} onTap={tapOf("internet")} pressed={selected === "internet"} />
      <ResponseNode at={RESPONSE_AT} look={lookOf("response")} onTap={tapOf("response")} pressed={selected === "response"} />
      <ServerNode look={lookOf("server")} onTap={tapOf("server")} pressed={selected === "server"} />

      {/* à esquerda, sob o navegador: centralizado, no celular cobria a Resposta */}
      <Place x={4} y={91} anchor="left" z={3}>
        <span key={found.length} className={cx(styles.holder, found.length > 0 && !reducedMotion && styles.pop)}>
          <Tag size="sm" tone={complete ? "success" : "info"} icon={complete ? "ok" : "magnifier"}>
            {BANNER.found(found.length, PARTS.length)}
          </Tag>
        </span>
      </Place>

      {/* avançar fica embaixo, à direita */}
      <Place x={97} y={91} anchor="right" hidden={!complete || speaking} z={7}>
        <div className={styles.replayFit}>
          <ActionButton label="Continuar" sprite={SPRITES.ui.next} onClick={goOn} disabled={!complete || speaking} attention={complete && !speaking} focusOnAttention size={20} />
        </div>
      </Place>

      <Live text={active ? `${active.text} ${found.length} de ${PARTS.length} partes descobertas.` : ""} />
    </div>
  );
}

const ORDER_FLOW: FlowItem[] = ORDER_STEPS.map((step) => ({ id: step.id, label: step.label, element: step.element }));
const RETRY_MS = 1400;

type OrderState = "idle" | "wrong" | "right";

type BannerSpec = { text: string; tone: KitTone; icon: ElementKey };

const ORDER_BANNER: Record<OrderState, BannerSpec> = {
  idle: { text: BANNER.order, tone: "info", icon: "box" },
  wrong: { text: BANNER.orderWrong, tone: "danger", icon: "error" },
  right: { text: BANNER.orderRight, tone: "success", icon: "ok" },
};

function OrderSteps({ say, setCanAdvance, setHint, reducedMotion, focusFirst }: SceneProps & { focusFirst: boolean }) {
  const timers = useTimers({ reducedMotion });
  const rand = useSeededRandom(0, { salt: "aula-3-1-etapas" });
  /* ordem inicial sorteada por visita e nunca já na ordem certa */
  const items = useMemo<OrderItem[]>(
    () => rand.shuffle(ORDER_STEPS.map(({ id, label, element }) => ({ id, label, element })), "order", true),
    [rand],
  );
  const [state, setState] = useState<OrderState>("idle");
  const [tries, setTries] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  /** volta da faixa "Tente outra ordem": cancelada a cada novo resultado (um 2º erro rápido não a corta) */
  const cancelRetry = useRef<(() => void) | null>(null);
  const banner = ORDER_BANNER[state];

  useEffect(() => {
    say(EXPLORE_LINES.order, "thinking");
    setHint(GUIDE.order);
  }, [say, setHint]);

  useEffect(() => {
    if (focusFirst) wrapRef.current?.querySelector<HTMLElement>("button")?.focus({ preventScroll: true });
  }, [focusFirst]);

  const onResult = (result: OrderResult) => {
    cancelRetry.current?.();
    cancelRetry.current = null;
    if (result.correct) {
      setState("right");
      say(EXPLORE_LINES.orderRight, "happy");
      setHint(GUIDE.orderRight);
      /* como nas cenas passivas: o foco só vai para "Próxima cena" quando o Bonzi termina a fala do acerto */
      timers.after(Math.max(READY_PAUSE_MS, speechMs(EXPLORE_LINES.orderRight)), () => setCanAdvance(true), { hold: true });
      return;
    }
    /* o kit marca só a 1ª posição errada, sem mostrar qual cartão vai nela */
    setState("wrong");
    setTries((t) => t + 1);
    say(EXPLORE_LINES.orderWrong, "warning");
    setHint(GUIDE.orderWrong);
    cancelRetry.current = timers.after(RETRY_MS, () => setState((s) => (s === "wrong" ? "idle" : s)), { hold: true });
  };

  const live = state === "right" ? "Ordem certa: pedido, resposta e página." : "Agora coloque as 3 etapas na ordem certa.";

  return (
    <>
      <Banner key={state === "wrong" ? `wrong-${tries}` : state} text={banner.text} tone={banner.tone} icon={banner.icon} reducedMotion={reducedMotion} />

      <Place x={50} y={19} anchor="top" width={94}>
        <div className={styles.order}>
          <div ref={wrapRef} className={cx(!reducedMotion && styles.pop)}>
            <OrderCards
              items={items}
              correctOrder={ORDER_IDS}
              onResult={onResult}
              checkLabel="Verificar"
              size={5}
              retryMs={RETRY_MS}
              ariaLabel="Etapas para colocar em ordem"
            />
          </div>
        </div>
      </Place>

      {state === "right" && (
        <Place x={50} y={62} width={90}>
          <div className={styles.chainFit}>
            <div className={cx(!reducedMotion && styles.pop)}>
              <FlowChain items={ORDER_FLOW} size={4.5} ariaLabel="Pedido, Resposta, Página" />
            </div>
          </div>
        </Place>
      )}

      <Live text={live} />
    </>
  );
}
