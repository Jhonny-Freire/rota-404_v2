"use client";

import { useEffect, useId, useState, type CSSProperties } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PixelPanel } from "@/components/ui/PixelPanel";
import { Sprite } from "@/components/ui/Sprite";
import { SpriteButton } from "@/components/ui/SpriteButton";
import { SpriteToggle } from "@/components/ui/SpriteToggle";
import { SPRITES } from "@/config/assets";
import { ROUTES } from "@/config/routes";
import { useAsync } from "@/hooks/useAsync";
import { useExplorer } from "@/hooks/useExplorer";
import { useProgress } from "@/hooks/useProgress";
import { useSettings } from "@/hooks/useSettings";
import { isNarrationSupported } from "@/services/narrationService";
import { getAgeRanges } from "@/services/catalogService";
import styles from "./page.module.css";

export default function SettingsPage() {
  const { settings, updateSettings, resetSettings } = useSettings();
  const { explorer, setName, reset, hydrated } = useExplorer();
  const { resetProgress } = useProgress();
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [cleared, setCleared] = useState(false);
  const nameId = useId();
  const volumeId = useId();
  const ageRanges = useAsync(() => getAgeRanges(), [], { cacheKey: "age-ranges" });

  useEffect(() => {
    setVoiceSupported(isNarrationSupported());
  }, []);

  let ageRangeLabel = "Não escolhida";
  if (explorer.ageRangeSlug) {
    if (ageRanges.loading) ageRangeLabel = "Carregando...";
    else ageRangeLabel = ageRanges.data?.find((r) => r.slug === explorer.ageRangeSlug)?.name ?? "Indisponível";
  }

  const clearLocalData = () => {
    if (!confirming) {
      setConfirming(true);
      setCleared(false);
      return;
    }
    reset();
    resetSettings();
    resetProgress();
    setConfirming(false);
    setCleared(true);
  };

  return (
    <AppShell
      breadcrumbs={[{ label: "Início", href: ROUTES.home }, { label: "Configurações" }]}
      bonzi={{ state: "idle", message: "Ajuste som, narração e animações do seu jeito." }}
    >
      <header className={styles.header}>
        <Sprite src={SPRITES.ui.settings} alt="" decorative size={56} className={styles.gear} />
        <h1 className={styles.title}>Configurações</h1>
      </header>

      <div className={styles.grid}>
        <PixelPanel title="Preferências">
          <div className={styles.stack}>
            <div className={styles.field}>
              <label htmlFor={nameId} className={styles.fieldLabel}>
                Nome do explorador
              </label>
              <input
                id={nameId}
                type="text"
                className={styles.input}
                value={explorer.name}
                maxLength={24}
                placeholder="Explorador"
                autoComplete="off"
                spellCheck={false}
                disabled={!hydrated}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className={styles.row}>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Faixa etária</span>
                <strong className={styles.value}>{ageRangeLabel}</strong>
              </div>
              <SpriteButton
                sprite={SPRITES.ui.map}
                label={explorer.ageRangeSlug ? "Trocar faixa" : "Escolher faixa"}
                href={ROUTES.ageRanges}
                size={20}
              />
            </div>
          </div>
        </PixelPanel>

        <PixelPanel title="Áudio e narração">
          <div className={styles.stack}>
            <SpriteToggle
              checked={settings.narrationEnabled}
              onChange={(value) => updateSettings({ narrationEnabled: value })}
              label="Narração do Bonzi"
              description={voiceSupported ? "O Bonzi lê as falas em voz alta." : "Este navegador não tem voz disponível."}
            />
            <SpriteToggle
              checked={settings.soundEnabled}
              onChange={(value) => updateSettings({ soundEnabled: value })}
              label="Efeitos sonoros"
              spriteOn={SPRITES.ui.soundOn}
              spriteOff={SPRITES.ui.soundOff}
            />
            <div className={styles.volume}>
              <label htmlFor={volumeId} className={styles.volumeLabel}>
                Volume
              </label>
              <div className={styles.slider}>
                <Sprite src={SPRITES.ui.soundOff} alt="" decorative size={32} />
                <input
                  id={volumeId}
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={settings.volume}
                  onChange={(e) => updateSettings({ volume: Number(e.target.value) })}
                  className={styles.range}
                  style={{ "--fill": `${settings.volume}%` } as CSSProperties}
                />
                <Sprite src={SPRITES.ui.soundOn} alt="" decorative size={32} />
                <output htmlFor={volumeId} className={styles.volumeValue}>
                  {settings.volume}%
                </output>
              </div>
            </div>
          </div>
        </PixelPanel>

        <PixelPanel title="Interface">
          <div className={styles.stack}>
            <SpriteToggle
              checked={settings.showBonzi}
              onChange={(value) => updateSettings({ showBonzi: value })}
              label="Mostrar o Bonzi"
              description="O guia aparece durante a viagem."
            />
            <SpriteToggle
              checked={settings.reducedMotion}
              onChange={(value) => updateSettings({ reducedMotion: value })}
              label="Reduzir animações"
              description="Deixa o espaço mais calmo."
            />
            <SpriteToggle
              checked={settings.unlockAll}
              onChange={(value) => updateSettings({ unlockAll: value })}
              label="Liberar todos os planetas — modo apresentação"
              description="Abre qualquer planeta sem concluir o anterior."
            />
          </div>
        </PixelPanel>

        <PixelPanel title="Conta">
          <div className={styles.stack}>
            <p className={styles.note}>Login e sincronização chegarão em breve.</p>
            {confirming && <p className={styles.warning}>Isso apaga nome, personagem, ajustes e progresso deste dispositivo.</p>}
            <div className={styles.actions}>
              <SpriteButton
                sprite={confirming ? SPRITES.status.error : SPRITES.ui.close}
                label={confirming ? "Confirmar e apagar" : "Apagar dados locais"}
                onClick={clearLocalData}
                variant={confirming ? "primary" : "default"}
                size={24}
              />
              {confirming && (
                <SpriteButton sprite={SPRITES.ui.back} label="Cancelar" onClick={() => setConfirming(false)} size={24} />
              )}
            </div>
            <p role="status" className={styles.done}>
              {cleared ? "Dados locais apagados." : ""}
            </p>
          </div>
        </PixelPanel>
      </div>
    </AppShell>
  );
}
