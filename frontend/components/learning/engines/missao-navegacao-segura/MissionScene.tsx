"use client";

import { ELEMENTS } from "@/config/assets";
import { Place, SceneCanvas, StageBanner } from "@/components/learning/kit";
import { cx } from "@/components/ui/cx";
import { SCENARIOS, type BannerSpec, type Option, type Outcome, type Phase, type Scenario } from "./model";
import styles from "./MissaoNavegacaoSegura.module.css";

export type Summary = { applied: string[]; review: { title: string; choices: string[]; tip: string }[] };

export type MissionSceneProps = {
  phase: Phase;
  scenario: Scenario;
  index: number;
  options: Option[];
  /** opções já tentadas (erradas) ou exploradas depois do acerto */
  tried: string[];
  /** resultado mostrado agora (a última escolha) */
  shown: Option | null;
  summary: Summary;
  banner: BannerSpec;
  bannerKey: number;
  reducedMotion: boolean;
  onChoose: (id: string) => void;
};

function Art({ art, good, keyName }: { art: Outcome["art"] | Scenario["art"]; good?: boolean; keyName: string }) {
  return (
    <span key={keyName} className={cx(styles.art, good === true && styles.artGood, good === false && styles.artBad)}>
      {art.map((element, i) => (
        <img key={`${element}-${i}`} src={ELEMENTS[element]} alt="" draggable={false} className={cx(styles.artImg, styles.pop, i === 1 && styles.artSecond)} />
      ))}
    </span>
  );
}

/** Palco do lab4-4.md: a situação (e o que acontece) à esquerda; as escolhas à direita; no fim, o resumo. */
export function MissionScene({ phase, scenario, index, options, tried, shown, summary, banner, bannerKey, reducedMotion, onChoose }: MissionSceneProps) {
  return (
    <SceneCanvas className={styles.canvas} label={phase === "summary" ? "Resumo da missão" : `Situação ${index + 1} de ${SCENARIOS.length}: ${scenario.title}`}>
      <StageBanner key={bannerKey} text={banner.text} tone={banner.tone} icon={banner.icon} reducedMotion={reducedMotion} y={9} />
      {phase === "summary" ? (
        <SummaryPanel summary={summary} />
      ) : (
        <>
          <Place x={3} y={19} anchor="top-left" width={44} z={3}>
            <div className={styles.fit}>
              <section className={cx(styles.card, shown && (shown.outcome.good ? styles.cardGood : styles.cardBad))} aria-live="polite">
                <span className={styles.cardStep}>
                  Situação {index + 1} de {SCENARIOS.length} · {scenario.title}
                </span>
                {shown ? (
                  <>
                    <Art art={shown.outcome.art} good={shown.outcome.good} keyName={shown.id} />
                    <p className={styles.outcome}>
                      <img src={shown.outcome.good ? ELEMENTS.ok : ELEMENTS.error} alt={shown.outcome.good ? "Seguro:" : "Cuidado:"} draggable={false} />
                      {shown.outcome.text}
                    </p>
                  </>
                ) : (
                  <>
                    <Art art={scenario.art} keyName="situation" />
                    <p className={styles.situation}>{scenario.situation}</p>
                  </>
                )}
                <p className={styles.question}>{scenario.question}</p>
              </section>
            </div>
          </Place>
          <Place x={50} y={19} anchor="top-left" width={47} z={3}>
            <div className={styles.fit}>
              <ul className={styles.options} aria-label={scenario.question}>
                {options.map((option) => {
                  const done = tried.includes(option.id);
                  const right = phase === "solved" && option.correct;
                  return (
                    <li key={option.id}>
                      <button
                        type="button"
                        className={cx(
                          styles.option,
                          right && styles.optionRight,
                          done && !option.correct && styles.optionWrong,
                          shown?.id === option.id && styles.optionShown,
                        )}
                        onClick={() => onChoose(option.id)}
                        aria-pressed={shown?.id === option.id}
                        aria-disabled={(phase === "play" && done) || right || undefined}
                      >
                        <span>{option.text}</span>
                        {(right || (done && !option.correct)) && (
                          <img src={right ? ELEMENTS.ok : ELEMENTS.error} alt={right ? "escolha segura" : "escolha arriscada"} draggable={false} />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </Place>
        </>
      )}
    </SceneCanvas>
  );
}

function SummaryPanel({ summary }: { summary: Summary }) {
  return (
    <Place x={50} y={19} anchor="top" width={92} z={3}>
      <div className={cx(styles.fit, styles.summaryFit)}>
        <section className={styles.summary} aria-label="Resumo das decisões">
          <div>
            <h3 className={styles.sumTitle}>Práticas de segurança aplicadas</h3>
            <ul className={styles.sumList}>
              {summary.applied.length ? (
                summary.applied.map((item) => (
                  <li key={item}>
                    <img src={ELEMENTS.ok} alt="" draggable={false} />
                    {item}
                  </li>
                ))
              ) : (
                <li>Nas próximas vezes, tente acertar de primeira!</li>
              )}
            </ul>
          </div>
          <div>
            <h3 className={styles.sumTitle}>Decisões para rever</h3>
            <ul className={styles.sumList}>
              {summary.review.length ? (
                summary.review.map((item) => (
                  <li key={item.title}>
                    <img src={ELEMENTS.error} alt="" draggable={false} />
                    <span>
                      {item.title}<span className={styles.choices}>: <s>{item.choices.join("; ")}</s></span> <em>Dica: {item.tip}</em>
                    </span>
                  </li>
                ))
              ) : (
                <li>
                  <img src={ELEMENTS.ok} alt="" draggable={false} />
                  Nenhuma! Todas as escolhas foram seguras.
                </li>
              )}
            </ul>
          </div>
        </section>
      </div>
    </Place>
  );
}
