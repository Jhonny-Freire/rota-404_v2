"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useState, type CSSProperties } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { FitToHeight } from "@/components/layout/FitToHeight";
import { PixelPanel } from "@/components/ui/PixelPanel";
import { Sprite } from "@/components/ui/Sprite";
import { SpriteButton } from "@/components/ui/SpriteButton";
import { SpriteToggle } from "@/components/ui/SpriteToggle";
import { SPRITES } from "@/config/assets";
import { ROUTES } from "@/config/routes";
import { useAchievements } from "@/hooks/useAchievements";
import { useAsync } from "@/hooks/useAsync";
import { useExplorer } from "@/hooks/useExplorer";
import { useProgress } from "@/hooks/useProgress";
import { useSession } from "@/hooks/useSession";
import { useSettings } from "@/hooks/useSettings";
import { isNarrationSupported } from "@/services/narrationService";
import { getAgeRanges, getGalaxies } from "@/services/catalogService";
import styles from "./page.module.css";

export default function SettingsPage() {
  const { settings, updateSettings, resetSettings } = useSettings();
  const router = useRouter();
  const { explorer, reset } = useExplorer();
  const { status, user, logout } = useSession();
  const { resetProgress } = useProgress();
  const { resetAchievements } = useAchievements();
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [cleared, setCleared] = useState(false);
  const volumeId = useId();
  const catalog = useAsync(() => Promise.all([getAgeRanges(), getGalaxies()]), [], { cacheKey: "age-ranges+galaxies" });

  useEffect(() => {
    setVoiceSupported(isNarrationSupported());
  }, []);

  let universeLabel = "Não escolhido";
  if (explorer.ageRangeSlug) {
    if (catalog.loading) universeLabel = "Carregando...";
    else {
      const [ranges = [], galaxies = []] = catalog.data ?? [];
      const range = ranges.find((r) => r.slug === explorer.ageRangeSlug);
      universeLabel =
        galaxies
          .filter((g) => g.age_range_id === range?.id)
          .map((g) => g.name)
          .join(", ") || "Indisponível";
    }
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
    resetAchievements();
    setConfirming(false);
    setCleared(true);
  };

  const leave = async () => {
    await logout();
    router.replace(ROUTES.login);
  };

  return (
    <AppShell
      fit
      breadcrumbs={[{ label: "Início", href: ROUTES.home }, { label: "Configurações" }]}
      bonzi={{ state: "idle", message: "Ajuste som, narração e animações do seu jeito." }}
    >
      <header className={styles.header}>
        <Sprite src={SPRITES.ui.settings} alt="" decorative size={56} className={styles.gear} />
        <h1 className={styles.title}>Configurações</h1>
      </header>

      <FitToHeight align="top">
        <div className={styles.grid}>
          <PixelPanel title="Preferências">
            <div className={styles.stack}>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Universo (escolhido pelo nível de conhecimento)</span>
                <strong className={styles.value}>{universeLabel}</strong>
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
                description="Abre qualquer sistema e planeta sem concluir o anterior."
              />
            </div>
          </PixelPanel>

          <PixelPanel title="Conta">
            <div className={styles.stack}>
              <p className={styles.note}>
                {status === "signed-in" && user
                  ? `Conectado como ${user.nickname}. O progresso fica salvo na conta.`
                  : "Jogando sem conta: o progresso fica só neste aparelho."}
              </p>
              <div className={styles.actions}>
                <SpriteButton
                  sprite={status === "signed-in" ? SPRITES.ui.close : SPRITES.ui.profile}
                  label={status === "signed-in" ? "Sair da conta" : "Entrar ou criar conta"}
                  onClick={() => void leave()}
                  size={24}
                />
              </div>
              {confirming && (
                <p className={styles.warning}>
                  Isso apaga os ajustes e a cópia do progresso e das conquistas guardada neste aparelho. O que está na conta continua salvo.
                </p>
              )}
              <div className={styles.actions}>
                <SpriteButton
                  sprite={confirming ? SPRITES.status.error : SPRITES.ui.close}
                  label={confirming ? "Confirmar e apagar" : "Apagar dados deste aparelho"}
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
      </FitToHeight>
    </AppShell>
  );
}
