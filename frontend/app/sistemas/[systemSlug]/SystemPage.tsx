"use client";

import { useParams } from "next/navigation";
import { useState, type CSSProperties, type ReactNode } from "react";
import type { BonziBuddyProps } from "@/components/bonzi/BonziBuddy";
import { formatPoints } from "@/components/gamification/ScoreCounter";
import { AppShell } from "@/components/layout/AppShell";
import { StatusView } from "@/components/layout/StatusView";
import { PlanetNode } from "@/components/space/PlanetNode";
import { Rocket } from "@/components/space/Rocket";
import { Sprite } from "@/components/ui/Sprite";
import { SpriteButton } from "@/components/ui/SpriteButton";
import { cx } from "@/components/ui/cx";
import { SPRITES, planetSprite, systemSprite } from "@/config/assets";
import { ROUTES } from "@/config/routes";
import { useAsync } from "@/hooks/useAsync";
import { useProgress } from "@/hooks/useProgress";
import { buildPlanetSlots, type PlanetSlot } from "@/lib/planetSlots";
import { PROGRESS_LABELS } from "@/lib/progress";
import { getErrorMessage } from "@/services/apiClient";
import { getSystem, getSystems } from "@/services/catalogService";
import type { PlanetarySystem, ProgressState } from "@/types/domain";
import styles from "./page.module.css";

// Estado de cada planeta na "coleção" do HUD (classe CSS por estado)
const SLOT_CLASS: Record<ProgressState, string | undefined> = {
  locked: styles.slotLocked,
  available: styles.slotAvailable,
  in_progress: styles.slotInProgress,
  completed: styles.slotCompleted,
};

/** Selo no canto do planeta: a forma (✓, cadeado, ampulheta) mostra o estado, não só a cor. */
function SlotBadge({ state }: { state: ProgressState }) {
  if (state === "completed") {
    return <Sprite src={SPRITES.status.completed} alt="" decorative size={22} className={styles.slotBadge} />;
  }
  if (state === "locked") {
    // cadeado 15×21: um pixel da arte por pixel da tela
    return <Sprite src={SPRITES.status.locked} alt="" decorative size={15} height={21} className={styles.slotBadge} />;
  }
  if (state === "in_progress") {
    return <Sprite src={SPRITES.status.inProgress} alt="" decorative size={16} className={styles.slotBadge} />;
  }
  return null;
}

type SystemHudProps = {
  slots: PlanetSlot[];
  total: number;
  hydrated: boolean;
  points: number;
  doneCount: number;
  complete: boolean;
};

/** HUD do sistema: estrela com os pontos + coleção dos planetas (coloridos quando concluídos). */
function SystemHud({ slots, total, hydrated, points, doneCount, complete }: SystemHudProps) {
  const pointsText = hydrated ? formatPoints(points) : null;

  return (
    <section className={cx(styles.hud, complete && styles.hudComplete)} aria-label="Seu progresso neste sistema">
      <div className={cx(styles.points, pointsText === null && styles.pointsEmpty)}>
        <Sprite src={SPRITES.rewards.star} alt="" decorative size={32} className={styles.pointsStar} />
        <span className={styles.statText}>
          <span className={cx(styles.statValue, styles.pointsValue)}>
            {pointsText ?? (
              <>
                <span aria-hidden="true">--</span>
                <span className="sr-only">Sem pontuação</span>
              </>
            )}
          </span>
          <span className={styles.statLabel}>Pontos</span>
        </span>
      </div>

      <span className={styles.divider} aria-hidden="true" />

      <ul className={styles.shelf} aria-label="Planetas do sistema">
        {slots.map((slot) => {
          // antes de ler o progresso salvo, todos ficam neutros (sem selo e sem estado)
          const state = hydrated ? slot.state : null;
          const status = state ? PROGRESS_LABELS[state].toLowerCase() : null;
          const description = status ? `${slot.name} (${status})` : slot.name;
          return (
            <li key={slot.id} className={cx(styles.slot, state && SLOT_CLASS[state])} title={description}>
              <Sprite src={planetSprite(slot.spriteKey, slot.type)} alt="" decorative className={styles.slotSprite} />
              {state && <SlotBadge state={state} />}
              <span className="sr-only">{description}</span>
            </li>
          );
        })}
      </ul>

      <p className={cx(styles.statText, styles.count)}>
        <span className={cx(styles.statValue, styles.countValue)} aria-hidden="true">
          {hydrated ? doneCount : "--"}
          <span className={styles.countTotal}>/{total}</span>
        </span>
        <span className={styles.statLabel} aria-hidden="true">
          Concluídos
        </span>
        <span className="sr-only">
          {hydrated ? `${doneCount} de ${total} planetas concluídos` : `Planetas concluídos: carregando`}
        </span>
      </p>

      {complete && (
        <p className={styles.ribbon}>
          <Sprite src={SPRITES.rewards.star} alt="" decorative size={16} />
          Sistema completo!
        </p>
      )}
    </section>
  );
}

const ORBIT_RX = 36;
const ORBIT_RY = 32;
const ORBIT_STYLE = { "--orbit-rx": `${ORBIT_RX}%`, "--orbit-ry": `${ORBIT_RY}%` } as CSSProperties;

function orbitPosition(index: number, count: number) {
  const angle = ((360 * index) / count - 135) * (Math.PI / 180);
  return { left: `${50 + ORBIT_RX * Math.cos(angle)}%`, top: `${50 + ORBIT_RY * Math.sin(angle)}%` };
}

/**
 * Sistema + vizinhos na galáxia, em paralelo: a lista completa de sistemas (pequena, a mesma para todas as
 * páginas de sistema e já em cache depois da primeira) é filtrada pela galáxia do sistema.
 */
async function loadSystem(slug: string) {
  const [system, all] = await Promise.all([
    getSystem(slug),
    getSystems().catch((): PlanetarySystem[] => []),
  ]);
  const siblings = all.filter((s) => s.galaxy_id === system.galaxy_id);
  return { system, siblings: siblings.sort((a, b) => a.order_index - b.order_index) };
}

export default function SystemPage() {
  const { systemSlug } = useParams<{ systemSlug: string }>();
  const { data, loading, error, notFound, notImplemented, reload } = useAsync(() => loadSystem(systemSlug), [systemSlug], {
    cacheKey: `system-page:${systemSlug}`,
  });
  const progress = useProgress();
  const [lockedHint, setLockedHint] = useState(0);
  const system = data?.system;

  const breadcrumbs = [
    { label: "Início", href: ROUTES.home },
    { label: "Galáxias", href: ROUTES.galaxies },
    ...(system ? [{ label: system.galaxy.name, href: ROUTES.galaxy(system.galaxy.slug) }] : []),
    { label: system?.name ?? (notFound ? "Não encontrado" : "Sistema") },
  ];

  let bonzi: BonziBuddyProps | null = null;
  let content: ReactNode;

  if (loading) {
    content = <StatusView kind="loading" />;
  } else if (notFound) {
    bonzi = { state: "warning", message: "Hmm, esse sistema não está no mapa." };
    content = (
      <StatusView
        kind="not-found"
        title="Sistema não encontrado"
        message="Este sistema planetário não existe no mapa do Rota 404."
        action={{ label: "Voltar ao mapa", href: ROUTES.galaxies }}
      />
    );
  } else if (notImplemented) {
    content = <StatusView kind="coming-soon" />;
  } else if (error || !data || !system) {
    bonzi = { state: "warning", message: "Perdi o contato com a base. Vamos tentar de novo?" };
    content = <StatusView kind="error" message={getErrorMessage(error)} onRetry={reload} />;
  } else {
    const { siblings } = data;
    const position = siblings.findIndex((s) => s.id === system.id);
    const index = position >= 0 ? position : Math.max(0, system.order_index - 1);
    const prev = position > 0 ? siblings[position - 1] : undefined;
    const next = position >= 0 ? siblings[position + 1] : undefined;
    const slots = buildPlanetSlots(system, progress.hydrated ? progress.planetState : undefined);
    const allPreview = slots.every((slot) => slot.preview);
    const number = String(system.order_index || index + 1).padStart(2, "0");
    const planetIds = system.planets.map((planet) => planet.id);
    const labIds = system.planets.filter((planet) => planet.type === "lab").map((planet) => planet.id);
    const systemPoints = progress.totalPoints(labIds);
    const ratio = progress.completionRatio(planetIds);
    const doneCount = progress.hydrated ? progress.completedCount(planetIds) : 0;
    const complete = planetIds.length > 0 && ratio >= 1;

    if (lockedHint > 0) bonzi = { state: "warning", message: "Conclua o planeta anterior para liberar este.", messageKey: lockedHint };
    else if (allPreview) bonzi = { state: "help", message: "Os planetas deste sistema ainda estão em construção." };
    else if (complete && next) bonzi = { state: "happy", message: "Sistema completo! Que tal o próximo?" };
    // último sistema da galáxia: não há "próximo" para sugerir
    else if (complete) bonzi = { state: "happy", message: "Sistema completo! Volte à galáxia para escolher outro sistema." };
    else bonzi = { state: "speaking", message: "Escolha um planeta para pousar!" };

    content = (
      <>
        <header className={styles.header}>
          <div className={styles.intro}>
            <span className={styles.tag}>Sistema {number}</span>
            <h1 className={styles.title}>{system.name}</h1>
            {system.description && <p className={styles.description}>{system.description}</p>}
          </div>

          {!allPreview && planetIds.length > 0 && (
            <SystemHud
              slots={slots}
              total={planetIds.length}
              hydrated={progress.hydrated}
              points={systemPoints}
              doneCount={doneCount}
              complete={complete}
            />
          )}
        </header>

        <section className={styles.orbit} style={ORBIT_STYLE} aria-label={`Planetas do sistema ${system.name}`}>
          <span className={styles.outerRing} aria-hidden="true" />
          <div className={styles.core}>
            <span className={styles.innerRing} aria-hidden="true">
              <span className={styles.rocketSlot}>
                <Rocket size={34} angle={90} />
              </span>
            </span>
            <Sprite src={systemSprite(system.slug, index)} alt="" decorative className={styles.coreSprite} />
          </div>

          <ul className={styles.planets}>
            {slots.map((slot, i) => (
              <li key={slot.id} className={styles.planet} style={orbitPosition(i, slots.length)}>
                <PlanetNode
                  name={slot.name}
                  type={slot.type}
                  state={slot.state}
                  href={slot.href}
                  spriteKey={slot.spriteKey}
                  preview={slot.preview}
                  index={i}
                  size={120}
                  onLockedClick={() => setLockedHint((n) => n + 1)}
                />
              </li>
            ))}
          </ul>
        </section>

        <nav className={styles.travel} aria-label="Navegação entre sistemas">
          <SpriteButton
            sprite={SPRITES.ui.back}
            label="Sistema anterior"
            href={prev ? ROUTES.system(prev.slug) : undefined}
            disabled={!prev}
            size={24}
          />
          <SpriteButton sprite={SPRITES.ui.map} label="Voltar à galáxia" href={ROUTES.galaxy(system.galaxy.slug)} size={24} />
          <SpriteButton
            sprite={SPRITES.ui.next}
            label="Próximo sistema"
            href={next ? ROUTES.system(next.slug) : undefined}
            disabled={!next}
            variant={complete && next ? "primary" : "default"}
            attention={complete && Boolean(next)}
            size={24}
            className={styles.nextButton}
          />
        </nav>
      </>
    );
  }

  return (
    <AppShell breadcrumbs={breadcrumbs} bonzi={bonzi}>
      {content}
    </AppShell>
  );
}
