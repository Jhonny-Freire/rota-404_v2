"use client";

import { useEffect } from "react";
import {
  Balloon,
  Block,
  BrowserFrame,
  Link,
  Packet,
  PagePreview,
  Place,
  SceneSprite,
  Tag,
  useSequence,
  type ScenePoint,
  type SequenceStep,
} from "@/components/learning/kit";
import { cx } from "@/components/ui/cx";
import { DOMAIN, IP, LINES, PAGE, ROW_MOVE_MS, labeled, type SceneProps } from "./concepts";
import { Arrow, Banner, CardRow, Live, type CardLook } from "./parts";
import styles from "./IpDominioESite.module.css";

/*
 * Cena 1: os cartões caem um a um (animação) e, com os três na mesa, o Bonzi pergunta. A pergunta é curta;
 * a pausa final dá tempo de olhar os três cartões antes de liberar "Próxima cena".
 */
const CARDS_STEPS: SequenceStep[] = [350, 450, 450, 600, { hold: 1600 }];
/** passo em que os três cartões já estão na mesa: aparece a faixa e o Bonzi pergunta */
const CARDS_ASK = 4;

/** Cena 1 — os três cartões caem na cena; Bonzi pergunta qual é qual. */
export function SceneCards({ say, setCanAdvance, reducedMotion }: SceneProps) {
  const { step } = useSequence(CARDS_STEPS, {
    reducedMotion,
    onStep: (current) => {
      if (current === CARDS_ASK) say(LINES.cards, "thinking");
    },
    onDone: () => setCanAdvance(true),
  });
  const asking = step >= CARDS_ASK;

  const look = (order: number): CardLook | null => (step > order ? { enter: true, ask: asking && !reducedMotion } : null);

  return (
    <>
      {asking && <Banner text={LINES.cards} tone="warning" icon="question" reducedMotion={reducedMotion} />}

      <CardRow layout="center" looks={{ ip: look(0), domain: look(1), page: look(2) }} />

      <Live text={step >= 3 ? `Três cartões: ${IP}, ${DOMAIN} e ${PAGE}.` : ""} />
    </>
  );
}

const PC_AT: ScenePoint = { x: 22, y: 68 };
const SERVER_AT: ScenePoint = { x: 78, y: 68 };
const WIRE_FROM: ScenePoint = { x: 29.5, y: 68 };
const WIRE_TO: ScenePoint = { x: 73, y: 68 };
/** unidades do kit por pixel nativo: computador (19 px) e servidor (12 px) na mesma escala de pixel */
const WORLD_PX = 0.65;
/** o pacote leva a etiqueta em cima: sobe o caminho para a carta ficar sobre o fio */
const MAIL_LIFT = 3;
const MAIL_MS = 1800;

/**
 * Cena 2: olhar o cartão em destaque (hold) → a fileira sobe (animação) → o mundo aparece (hold) → a mensagem
 * viaja (animação) → pausa final. Holds: 600 + 400 + 1600 = 2600 ms para a fala (35 caracteres).
 */
const IP_STEPS: SequenceStep[] = [{ hold: 600 }, ROW_MOVE_MS, { hold: 400 }, MAIL_MS, { hold: 1600 }];

/** Cena 2 — destaca o número; uma mensagem com o IP viaja até o servidor que tem esse IP. */
export function SceneIp({ say, setCanAdvance, reducedMotion }: SceneProps) {
  const { step } = useSequence(IP_STEPS, {
    reducedMotion,
    onDone: () => setCanAdvance(true),
  });
  const top = step >= 1;
  const world = step >= 2;
  const sending = step >= 3;
  const arrived = step >= 4;

  useEffect(() => {
    say(LINES.ip);
  }, [say]);

  return (
    <>
      <CardRow
        layout={top ? "top" : "center"}
        looks={{ ip: { focus: true, revealed: top }, domain: { dimmed: true }, page: { dimmed: true } }}
      />

      {world && (
        <>
          <Link from={WIRE_FROM} to={WIRE_TO} state={sending ? "active" : "idle"} className={styles.fadeIn} />
          <Place {...labeled(PC_AT)}>
            <span className={styles.enter}>
              <SceneSprite element="setup" size={19 * WORLD_PX} label="Computador" />
            </span>
          </Place>
          <Place {...labeled(SERVER_AT)}>
            <span className={styles.enter}>
              <SceneSprite element="server" size={12 * WORLD_PX} label="Servidor" alt={`Servidor ${IP}`} highlighted={arrived}>
                <Tag size="sm" tone="info" icon="pin">
                  {IP}
                </Tag>
              </SceneSprite>
            </span>
          </Place>
        </>
      )}

      {sending && (
        <Packet
          path={[
            { x: WIRE_FROM.x, y: WIRE_FROM.y - MAIL_LIFT },
            { x: WIRE_TO.x - 2, y: WIRE_TO.y - MAIL_LIFT },
          ]}
          element="mail"
          size={5}
          durationMs={MAIL_MS}
          loop={!reducedMotion}
          loopPauseMs={900}
          label={
            <Tag size="sm" tone="info">
              {IP}
            </Tag>
          }
          alt={`Mensagem para ${IP}`}
        />
      )}

      <Live text={arrived ? `A mensagem para ${IP} chegou ao servidor.` : top ? `${IP} é o IP.` : ""} />
    </>
  );
}

const PERSON_AT: ScenePoint = { x: 14, y: 79 };

/**
 * Cena 3: o cartão se revela (animação) → a pessoa pensa no nome (hold) → o nome aparece (hold) → a seta leva
 * ao IP (animação) → pausa final. Holds: 700 + 900 + 1800 = 3400 ms para a fala (52 caracteres).
 */
const DOMAIN_STEPS: SequenceStep[] = [500, { hold: 700 }, { hold: 900 }, 600, { hold: 1800 }];

/** Cena 3 — destaca exemplo.com: um nome fácil de lembrar que serve como o IP. */
export function SceneDomain({ say, setCanAdvance, reducedMotion }: SceneProps) {
  const { step } = useSequence(DOMAIN_STEPS, {
    reducedMotion,
    onDone: () => setCanAdvance(true),
  });
  const revealed = step >= 1;
  const thinking = step >= 2;
  const named = step >= 3;
  const mapped = step >= 4;

  useEffect(() => {
    say(LINES.domain);
  }, [say]);

  return (
    <>
      <CardRow
        layout="top"
        looks={{ ip: { revealed: true, dimmed: true }, domain: { focus: true, revealed }, page: { dimmed: true } }}
      />

      <Place x={PERSON_AT.x} y={PERSON_AT.y} hidden={!thinking}>
        <span className={cx(styles.holder, thinking && styles.enter)}>
          <SceneSprite element="person" size={10} alt="Pessoa" />
        </span>
      </Place>
      <Place x={18} y={64} anchor="bottom-left" hidden={!thinking}>
        <span className={cx(styles.holder, thinking && styles.enter)}>
          <Balloon thought tail="bottom-left">
            <span className={styles.balloonText}>{DOMAIN}</span>
          </Balloon>
        </span>
      </Place>

      <Place x={72} y={66}>
        <div className={styles.stack}>
          <span className={named ? styles.enter : styles.ghost}>
            <Tag size="lg" tone="warning" icon="internet">
              {DOMAIN}
            </Tag>
          </span>
          <span className={mapped ? styles.enter : styles.ghost}>
            <Arrow down size={4.5} />
          </span>
          <span className={mapped ? styles.enter : styles.ghost}>
            <Tag size="lg" tone="info" icon="pin">
              {IP}
            </Tag>
          </span>
        </div>
      </Place>

      <Live text={mapped ? `${DOMAIN} é o domínio. Ele serve como o IP ${IP}.` : revealed ? `${DOMAIN} é o domínio.` : ""} />
    </>
  );
}

/**
 * Cena 4: o cartão se revela (animação) → a tela aparece (hold) → carregando (animação) → título, imagem e
 * texto surgem (animação) → pausa final. Holds: 500 + 1700 = 2200 ms para a fala (33 caracteres).
 */
const PAGE_STEPS: SequenceStep[] = [500, { hold: 500 }, 900, 350, 350, { hold: 1700 }];

/** Cena 4 — mostra a página na tela. */
export function ScenePage({ say, setCanAdvance, reducedMotion }: SceneProps) {
  const { step } = useSequence(PAGE_STEPS, {
    reducedMotion,
    onDone: () => setCanAdvance(true),
  });
  const revealed = step >= 1;
  const screen = step >= 2;
  const loading = step === 2;
  const shown = (at: number) => (step >= at ? styles.blockIn : styles.ghost);

  useEffect(() => {
    say(LINES.page);
  }, [say]);

  return (
    <>
      <CardRow
        layout="top"
        looks={{ ip: { revealed: true, dimmed: true }, domain: { revealed: true, dimmed: true }, page: { focus: true, revealed } }}
      />

      <Place x={50} y={36} anchor="top" width={52} hidden={!screen}>
        <div className={cx(styles.screen, screen && styles.enter)}>
          <div className={styles.screenFit}>
            <BrowserFrame url={DOMAIN} tabTitle={PAGE} loading={loading} minHeight={12}>
              <PagePreview label={`Página na tela: ${PAGE}`} dense>
                <div className={styles.pageRow}>
                  <Block kind="image" className={shown(4)} ariaLabel="Imagem" />
                  <div className={styles.pageCol}>
                    <Block kind="title" text={PAGE} className={shown(3)} />
                    <Block kind="text" className={shown(5)} ariaLabel="Texto" />
                  </div>
                </div>
              </PagePreview>
            </BrowserFrame>
          </div>
        </div>
      </Place>

      <Live text={step >= 3 ? `A ${PAGE.toLowerCase()} aparece na tela.` : revealed ? `${PAGE} é a página.` : ""} />
    </>
  );
}
