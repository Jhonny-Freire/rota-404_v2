import type { ElementKey } from "@/config/assets";
import { Place } from "./Place";
import { Tag } from "./Tag";
import type { KitTone } from "./types";
import { cssVars, cx } from "./util";
import styles from "./StageBanner.module.css";

export type StageBannerProps = {
  /** instrução curta do momento ("Arraste as peças: 2 de 4", "Toque em Testar") */
  text: string;
  /** cor: info (padrão), success, danger, warning, default, muted */
  tone?: KitTone;
  /** sprite antes do texto (chave de ELEMENTS) */
  icon?: ElementKey;
  reducedMotion: boolean;
  /** altura do centro da faixa em % do SceneCanvas. Padrão 9 */
  y?: number;
  /** largura máxima em unidades do kit; textos maiores quebram em duas linhas. Padrão 80 */
  maxWidth?: number;
  /** anuncia o texto para leitores de tela quando ele muda. Padrão true */
  live?: boolean;
};

/**
 * Faixa de instrução no alto do palco: o que fazer AGORA, onde a criança está olhando.
 * Reaparece com um "pop" quando o texto muda (estático com movimento reduzido).
 */
export function StageBanner({ text, tone = "info", icon, reducedMotion, y = 9, maxWidth = 80, live = true }: StageBannerProps) {
  // A região viva fica estável (montada uma vez); só a etiqueta remonta com o texto novo (o "pop"). Uma região
  // viva recém-inserida costuma ser ignorada pelos leitores de tela.
  return (
    <Place x={50} y={y} z={6}>
      <span
        className={styles.banner}
        style={cssVars({ "--mw": maxWidth })}
        role={live ? "status" : undefined}
        aria-live={live ? "polite" : undefined}
      >
        <Tag key={text} size="lg" tone={tone} icon={icon} className={cx(styles.tag, !reducedMotion && styles.pop)}>
          {text}
        </Tag>
      </span>
    </Place>
  );
}

export default StageBanner;
