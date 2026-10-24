"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import { RankingBoard } from "@/components/gamification/RankingBoard";
import { AppShell } from "@/components/layout/AppShell";
import { StatusView } from "@/components/layout/StatusView";
import { Sprite } from "@/components/ui/Sprite";
import { cx } from "@/components/ui/cx";
import { DEFAULT_GALAXY_SPRITE, PLANET_SPRITES, SPRITES, galaxySprite, systemSprite } from "@/config/assets";
import { ROUTES } from "@/config/routes";
import { useAsync } from "@/hooks/useAsync";
import { getErrorMessage } from "@/services/apiClient";
import { getGalaxies, getSystems } from "@/services/catalogService";
import { getGalaxyRanking, getSystemRanking } from "@/services/gamificationService";
import styles from "./page.module.css";

type Scope = "galaxy" | "system";

const TABS: { id: Scope; label: string; sprite: string }[] = [
  { id: "galaxy", label: "Por galáxia", sprite: DEFAULT_GALAXY_SPRITE },
  { id: "system", label: "Por sistema", sprite: PLANET_SPRITES.dns },
];

const EMPTY_MESSAGE = "O ranking aparecerá quando as primeiras missões forem concluídas.";

export default function RankingPage() {
  const ids = useId();
  const [tab, setTab] = useState<Scope>("galaxy");
  const [galaxySlug, setGalaxySlug] = useState("");
  const [systemSlug, setSystemSlug] = useState("");
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const catalog = useAsync(() => Promise.all([getGalaxies(), getSystems()]), [], { cacheKey: "galaxies+systems" });
  const galaxies = catalog.data?.[0] ?? [];
  const systems = catalog.data?.[1] ?? [];
  const groups = galaxies
    .map((galaxy) => ({ galaxy, systems: systems.filter((s) => s.galaxy_id === galaxy.id) }))
    .filter((group) => group.systems.length > 0);
  const orderedSystems = groups.flatMap((group) => group.systems);
  const selectedGalaxy = galaxies.find((g) => g.slug === galaxySlug) ?? galaxies[0];
  const selectedSystem = orderedSystems.find((s) => s.slug === systemSlug) ?? orderedSystems[0];

  const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const targets: Record<string, number> = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: TABS.length - 1 };
    if (!(event.key in targets)) return;
    event.preventDefault();
    const next = (targets[event.key] + TABS.length) % TABS.length;
    setTab(TABS[next].id);
    tabRefs.current[next]?.focus();
  };

  const renderPanel = (scope: Scope) => {
    if (catalog.loading) return <StatusView kind="loading" title="Buscando o mapa" />;
    if (catalog.error !== undefined) {
      return <StatusView kind="error" message={getErrorMessage(catalog.error)} onRetry={catalog.reload} />;
    }

    if (scope === "galaxy") {
      return (
        <div className={styles.layout}>
          <fieldset className={styles.picker}>
            <legend className={styles.legend}>Escolha a galáxia</legend>
            <div className={styles.options}>
              {galaxies.map((galaxy) => (
                <label key={galaxy.id} className={cx(styles.option, galaxy.slug === selectedGalaxy?.slug && styles.selected)}>
                  <input
                    type="radio"
                    name={`${ids}-galaxy`}
                    value={galaxy.slug}
                    checked={galaxy.slug === selectedGalaxy?.slug}
                    onChange={() => setGalaxySlug(galaxy.slug)}
                    className={styles.radio}
                  />
                  <span className={styles.card}>
                    <Sprite src={galaxySprite(galaxy.slug)} alt="" decorative size={56} className={styles.cardSprite} />
                    <span className={styles.cardName}>{galaxy.name}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className={styles.result}>
            {selectedGalaxy ? (
              <RankingResult scope="galaxy" slug={selectedGalaxy.slug} title={selectedGalaxy.name} />
            ) : (
              <StatusView kind="empty" message="Nenhuma galáxia cadastrada." />
            )}
          </div>
        </div>
      );
    }

    return (
      <div className={styles.layout}>
        <fieldset className={styles.picker}>
          <legend className={styles.legend}>Escolha o sistema</legend>
          {groups.map(({ galaxy, systems: groupSystems }) => (
            <div key={galaxy.id} className={styles.group} role="group" aria-labelledby={`${ids}-group-${galaxy.id}`}>
              <p id={`${ids}-group-${galaxy.id}`} className={styles.groupLabel}>
                <Sprite src={galaxySprite(galaxy.slug)} alt="" decorative size={24} />
                {galaxy.name}
              </p>
              <div className={styles.options}>
                {groupSystems.map((system, i) => (
                  <label key={system.id} className={cx(styles.option, system.slug === selectedSystem?.slug && styles.selected)}>
                    <input
                      type="radio"
                      name={`${ids}-system`}
                      value={system.slug}
                      checked={system.slug === selectedSystem?.slug}
                      onChange={() => setSystemSlug(system.slug)}
                      className={styles.radio}
                    />
                    <span className={styles.card}>
                      <Sprite src={systemSprite(system.slug, i)} alt="" decorative size={44} className={styles.cardSprite} />
                      <span className={styles.cardName}>{system.name}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </fieldset>
        <div className={styles.result}>
          {selectedSystem ? (
            <RankingResult scope="system" slug={selectedSystem.slug} title={selectedSystem.name} />
          ) : (
            <StatusView kind="empty" message="Nenhum sistema cadastrado." />
          )}
        </div>
      </div>
    );
  };

  return (
    <AppShell
      breadcrumbs={[{ label: "Início", href: ROUTES.home }, { label: "Ranking" }]}
      bonzi={{ state: "idle", message: "Escolha uma galáxia ou um sistema para ver quem lidera." }}
    >
      <header className={styles.header}>
        <Sprite src={SPRITES.ui.ranking} alt="" decorative size={64} className={styles.trophy} />
        <h1 className={styles.title}>Ranking</h1>
      </header>

      <div role="tablist" aria-label="Tipo de ranking" className={styles.tabs}>
        {TABS.map((t, i) => {
          const selected = tab === t.id;
          return (
            <button
              key={t.id}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`${ids}-tab-${t.id}`}
              aria-controls={`${ids}-panel-${t.id}`}
              aria-selected={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => setTab(t.id)}
              onKeyDown={(e) => onTabKeyDown(e, i)}
              className={cx(styles.tab, selected && styles.tabActive)}
            >
              <Sprite src={t.sprite} alt="" decorative size={36} className={styles.tabSprite} />
              {t.label}
            </button>
          );
        })}
      </div>

      {TABS.map((t) => (
        <div
          key={t.id}
          role="tabpanel"
          id={`${ids}-panel-${t.id}`}
          aria-labelledby={`${ids}-tab-${t.id}`}
          hidden={tab !== t.id}
          className={styles.panel}
        >
          {tab === t.id && renderPanel(t.id)}
        </div>
      ))}
    </AppShell>
  );
}

function RankingResult({ scope, slug, title }: { scope: Scope; slug: string; title: string }) {
  const ranking = useAsync(() => (scope === "galaxy" ? getGalaxyRanking(slug) : getSystemRanking(slug)), [scope, slug]);

  if (ranking.loading) return <StatusView kind="loading" title="Buscando ranking" />;
  if (ranking.notFound) return <StatusView kind="not-found" title="Ranking não encontrado" />;
  if (ranking.error !== undefined && !ranking.notImplemented) {
    return <StatusView kind="error" message={getErrorMessage(ranking.error)} onRetry={ranking.reload} />;
  }

  return <RankingBoard title={title} entries={ranking.data?.entries ?? []} emptyMessage={EMPTY_MESSAGE} />;
}
