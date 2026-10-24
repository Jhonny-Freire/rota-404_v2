"use client";

import { useEffect } from "react";
import { BLOCK_LABELS, BLOCK_TAGS, Place, Tag, useSequence } from "@/components/learning/kit";
import { LINES, PAGE_ORDER, SITE, STRUCTURE_LINE, TAG_MEANING, TRAY_ORDER, phases, speechMs, type PageKind, type SceneProps } from "./model";
import { Live, PageWindow, Tray, type PieceState, type SlotState } from "./parts";

/** página à esquerda e bandeja à direita (cenas 2 a 4) */
const SPLIT_X = 27;
const SPLIT_WIDTH = 42;

const ALL_EMPTY: Record<PageKind, SlotState> = { title: "empty", text: "empty", image: "empty", button: "empty" };
const ALL_SHOWN: Record<PageKind, PieceState> = { title: "shown", text: "shown", image: "shown", button: "shown" };

/* Cena 1 — Página pronta: título, texto, imagem e botão. */

const PAGE_STEPS = phases([1200, 1600], speechMs(LINES.page));

export function ScenePage({ say, setCanAdvance, reducedMotion }: SceneProps) {
  useSequence(PAGE_STEPS, { reducedMotion, onDone: () => setCanAdvance(true) });

  useEffect(() => {
    say(LINES.page);
  }, [say]);

  return (
    <>
      <PageWindow site={SITE} order={PAGE_ORDER} />
      <Live text={`Página ${SITE.url}: título, texto, imagem e botão.`} />
    </>
  );
}

/*
 * Cena 2 — Separação: os blocos saem da página um a um (na ordem da página) e caem na bandeja fora de ordem; no
 * fim, a fala LITERAL do .md. Fases: 0 página inteira · 1 a 4 sai um bloco · 5 fala da estrutura.
 */
const SPLIT_STEPS = [...phases([900, 750, 750, 750, 750], speechMs(LINES.split)), { hold: speechMs(STRUCTURE_LINE) + 600 }];

export function SceneSplit({ say, setCanAdvance, reducedMotion }: SceneProps) {
  const { step } = useSequence(SPLIT_STEPS, {
    reducedMotion,
    onStep: (s) => {
      if (s === 5) say(STRUCTURE_LINE, "happy");
    },
    onDone: () => setCanAdvance(true),
  });
  const out = PAGE_ORDER.slice(0, Math.min(4, step));
  const latest = out[out.length - 1];
  const slots: Partial<Record<PageKind, SlotState>> = {};
  const pieces: Partial<Record<PageKind, PieceState>> = {};
  for (const kind of out) {
    slots[kind] = "empty";
    pieces[kind] = kind === latest && step <= 4 ? "in" : "shown";
  }

  useEffect(() => {
    say(LINES.split);
  }, [say]);

  return (
    <>
      <PageWindow site={SITE} order={PAGE_ORDER} slots={slots} x={SPLIT_X} width={SPLIT_WIDTH} split />
      <Tray site={SITE} order={TRAY_ORDER} pieces={pieces} />
      <Live text={step >= 5 ? "A página se separou em 4 blocos: título, texto, imagem e botão." : ""} />
    </>
  );
}

/*
 * Cena 3 — HTML visual: cada bloco da bandeja recebe a etiqueta HTML (<h1>, <p>, <img>, <button>), uma por vez.
 * Visual, sem uma página inteira de código. Fases: 0 bandeja · 1 a 4 uma etiqueta · 5 leitura.
 */
const TAG_STEPS = phases([900, 1200, 1200, 1200, 1200], speechMs(LINES.tags));

export function SceneTags({ say, setCanAdvance, reducedMotion }: SceneProps) {
  const { step } = useSequence(TAG_STEPS, { reducedMotion, onDone: () => setCanAdvance(true) });
  const tagged = PAGE_ORDER.slice(0, Math.min(4, step));
  const current = step >= 1 && step <= 4 ? PAGE_ORDER[step - 1] : null;

  useEffect(() => {
    say(LINES.tags);
  }, [say]);

  return (
    <>
      <PageWindow site={SITE} order={PAGE_ORDER} slots={ALL_EMPTY} x={SPLIT_X} width={SPLIT_WIDTH} split />
      <Tray site={SITE} order={TRAY_ORDER} pieces={ALL_SHOWN} tagged={tagged} current={current} />
      {current && (
        <Place key={current} x={75} y={90} z={5}>
          <Tag tone="warning" size="md">
            {`${BLOCK_TAGS[current]} é ${TAG_MEANING[current]}`}
          </Tag>
        </Place>
      )}
      <Live text={current ? `Etiqueta ${BLOCK_TAGS[current]}: ${TAG_MEANING[current]}.` : step >= 5 ? "Cada bloco tem a sua etiqueta HTML." : ""} />
    </>
  );
}

/*
 * Cena 4 — Montagem: os blocos voltam para a página na ordem correta (título, texto, imagem, botão), com as
 * etiquetas. Fases: 0 bandeja · 1 a 4 um bloco volta · 5 leitura.
 */
const BUILD_STEPS = phases([1000, 950, 950, 950, 950], speechMs(LINES.build));

export function SceneBuild({ say, setCanAdvance, reducedMotion }: SceneProps) {
  const { step } = useSequence(BUILD_STEPS, { reducedMotion, onDone: () => setCanAdvance(true) });
  const placed = PAGE_ORDER.slice(0, Math.min(4, step));
  const latest = placed[placed.length - 1];
  const slots: Record<PageKind, SlotState> = { ...ALL_EMPTY };
  const pieces: Record<PageKind, PieceState> = { ...ALL_SHOWN };
  for (const kind of placed) {
    slots[kind] = kind === latest && step <= 4 ? "in" : "full";
    pieces[kind] = "placed";
  }

  useEffect(() => {
    say(LINES.build);
  }, [say]);

  return (
    <>
      <PageWindow site={SITE} order={PAGE_ORDER} slots={slots} tagged={placed} x={SPLIT_X} width={SPLIT_WIDTH} split />
      <Tray site={SITE} order={TRAY_ORDER} pieces={pieces} tagged={PAGE_ORDER} />
      <Live text={step >= 5 ? "A página está montada de novo: título, texto, imagem e botão." : latest ? `${BLOCK_LABELS[latest]} voltou para a página.` : ""} />
    </>
  );
}
