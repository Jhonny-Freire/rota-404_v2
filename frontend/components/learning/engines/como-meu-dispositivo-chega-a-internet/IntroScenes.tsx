"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { ELEMENTS } from "@/config/assets";
import { cx } from "@/components/ui/cx";
import { BrowserFrame, Link, Packet, Place, SceneCanvas, SceneSprite, Tag, useSequence, useTimers } from "@/components/learning/kit";
import { READY_PAUSE_MS, type SceneProps } from "./parts";
import { Waves } from "./World";
import styles from "./ComoMeuDispositivoChegaAInternet.module.css";

/* Cena 1 — O problema: o celular tenta abrir uma página e aparece "Sem conexão". */

const S1_PHONE = { x: 13, y: 64 };
const S1_SITE = { x: 87, y: 64 };

export function SceneProblem({ say, setCanAdvance, reducedMotion }: SceneProps) {
  /* a pausa final dá tempo de ler "Sem conexão" e a pergunta do Bonzi antes de liberar "Próxima cena" */
  const { step } = useSequence([400, 1700, { hold: 1500 }], {
    reducedMotion,
    onStep: (s) => {
      if (s === 2) say("Por onde a informação passa?", "thinking");
    },
    onDone: () => setCanAdvance(true),
  });
  const trying = step >= 1;
  const failed = step >= 2;

  return (
    <SceneCanvas backdrop="floor" label="Cena 1: o celular tenta abrir uma página">
      <Link from={S1_PHONE} to={S1_SITE} state="off" />
      <Place x={S1_PHONE.x} y={S1_PHONE.y}>
        <span className={cx(styles.holder, styles.pop)}>
          <SceneSprite element="cellphone" size={10} label="Celular" highlighted={trying && !failed} />
        </span>
      </Place>
      <Place x={S1_SITE.x} y={S1_SITE.y}>
        <SceneSprite element="webpage" size={10} label="Site" dimmed />
      </Place>
      {failed && (
        <Place x={50} y={S1_PHONE.y}>
          <span className={cx(styles.holder, styles.pop)}>
            {/* sem pulse: não é para tocar (o pulso fica só no que o aluno toca) */}
            <SceneSprite element="question" size={6} alt="Por onde a informação passa?" />
          </span>
        </Place>
      )}
      {trying && !reducedMotion && (
        <Packet path={[{ x: 16, y: S1_PHONE.y }, { x: 43, y: S1_PHONE.y }]} durationMs={1400} size={4.5} blocked />
      )}
      {trying && (
        <Place x={50} y={30} width={44}>
          <div className={cx(styles.zoom, styles.pop)}>
            <BrowserFrame url="site.com" loading={!failed}>
              <div className={styles.screen} role="status" aria-live="polite">
                {failed ? (
                  <>
                    <img src={ELEMENTS.error} alt="" draggable={false} className={styles.offlineIcon} />
                    <Tag tone="danger" size="lg" className={styles.offlineTag}>
                      Sem conexão
                    </Tag>
                  </>
                ) : (
                  <span className={styles.skeleton} aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </span>
                )}
              </div>
            </BrowserFrame>
          </div>
        </Place>
      )}
    </SceneCanvas>
  );
}

/* Cena 2 — Wi-Fi: o aluno toca no símbolo e as ondas aparecem. */

const S2_WIFI = { x: 49, y: 38 };

export function SceneWifi({ say, setCanAdvance, setHint, reducedMotion }: SceneProps) {
  const timers = useTimers({ reducedMotion });
  const { step } = useSequence([500], { reducedMotion });
  const [taps, setTaps] = useState(0);
  const on = taps > 0;

  useEffect(() => {
    say("Toque no Wi-Fi.", "help");
  }, [say]);

  const tap = () => {
    setTaps((t) => t + 1);
    say("Wi-Fi conecta o aparelho à rede sem fio.");
    /* só o 1º toque agenda a liberação: tocar de novo repete as ondas sem adiar "Próxima cena" */
    if (on) return;
    setHint("Veja as ondas ligando o celular ao roteador.");
    timers.after(READY_PAUSE_MS, () => setCanAdvance(true), { hold: true });
  };

  return (
    <SceneCanvas backdrop="floor" label="Cena 2: o Wi-Fi entre o celular e o roteador">
      {on && <Waves key={taps} x={S2_WIFI.x} y={S2_WIFI.y} diameter={74} reducedMotion={reducedMotion} />}
      <Place x={16} y={54}>
        <SceneSprite element="cellphone" size={10} label="Celular" highlighted={on} />
      </Place>
      <Place x={83} y={56}>
        <SceneSprite element="router" size={14} label="Roteador" highlighted={on} />
      </Place>
      {step >= 1 && (
        <Place x={S2_WIFI.x} y={S2_WIFI.y}>
          <span className={cx(styles.holder, styles.pop)}>
            <SceneSprite
              element="wifi"
              size={12}
              label="Wi-Fi"
              alt="Wi-Fi"
              pulse={!on}
              highlighted={on}
              onClick={tap}
            />
          </span>
        </Place>
      )}
    </SceneCanvas>
  );
}

/* Cena 3 — O roteador recebe pequenos pacotes e os leva para o destino. */

const S3_PATH = [
  { x: 10, y: 50 },
  { x: 28, y: 39 },
  { x: 52, y: 54 },
  { x: 86, y: 54 },
];
const S3_DELAYS = [0, 800, 1600];

type FlashHandle = { bump: () => void };

/**
 * Roteador da cena 3 com o brilho de "pacote chegou". O contador do brilho mora aqui: cada chegada
 * (uma a cada ~0,9 s, três pacotes em loop) remonta só este sprite, não a cena inteira.
 */
const RouterFlash = forwardRef<FlashHandle, { highlighted: boolean }>(function RouterFlash({ highlighted }, ref) {
  const [flash, setFlash] = useState(0);
  useImperativeHandle(ref, () => ({ bump: () => setFlash((f) => f + 1) }), []);
  return (
    <span key={flash} className={cx(styles.holder, flash > 0 && styles.flash)}>
      <SceneSprite element="router" size={16} label="Roteador" highlighted={highlighted} />
    </span>
  );
});

export function SceneRouter({ say, setCanAdvance, reducedMotion }: SceneProps) {
  const flashRef = useRef<FlashHandle>(null);
  /* o fluxo é pausa de leitura (hold): com movimento reduzido também dá tempo de ouvir o Bonzi antes de liberar */
  const { step } = useSequence([600, { hold: 2800 }, { hold: 600 }], { reducedMotion, onDone: () => setCanAdvance(true) });
  const flowing = step >= 1;

  useEffect(() => {
    say("O roteador ajuda a levar os dados para o destino.");
  }, [say]);

  const onReach = useCallback((index: number) => {
    if (index === 2) flashRef.current?.bump();
  }, []);

  return (
    <SceneCanvas backdrop="floor" label="Cena 3: o roteador recebe pacotes e leva os dados para o destino">
      <Link from={{ x: 57, y: 54 }} to={{ x: 85, y: 54 }} state={flowing ? "active" : "idle"} />
      <Waves x={S3_PATH[1].x} y={S3_PATH[1].y} diameter={30} reducedMotion={reducedMotion} />
      <Place x={S3_PATH[0].x} y={S3_PATH[0].y}>
        <SceneSprite element="cellphone" size={8} label="Celular" />
      </Place>
      <Place x={S3_PATH[1].x} y={S3_PATH[1].y}>
        <SceneSprite element="wifi" size={9} label="Wi-Fi" />
      </Place>
      <Place x={S3_PATH[2].x} y={S3_PATH[2].y}>
        <RouterFlash ref={flashRef} highlighted={flowing} />
      </Place>
      <Place x={89} y={52}>
        <SceneSprite element="pin" size={6} label="Destino" dimmed={!flowing} />
      </Place>
      {flowing &&
        !reducedMotion &&
        S3_DELAYS.map((delay) => (
          <Packet
            key={delay}
            path={S3_PATH}
            delayMs={delay}
            durationMs={2400}
            size={3.5}
            loop
            loopPauseMs={250}
            hideOnArrive
            onReach={onReach}
          />
        ))}
      {flowing && reducedMotion && (
        <Place x={S3_PATH[2].x - 4} y={S3_PATH[2].y - 12}>
          <SceneSprite element="box" size={3.5} alt="Pacote no roteador" />
        </Place>
      )}
    </SceneCanvas>
  );
}
