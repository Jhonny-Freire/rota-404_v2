"use client";

import { SPRITES } from "@/config/assets";
import { Avatar } from "@/components/avatar/Avatar";
import { StatusView } from "@/components/layout/StatusView";
import { Sprite } from "@/components/ui/Sprite";
import { cx } from "@/components/ui/cx";
import type { RankingEntry } from "@/types/domain";
import { ScoreCounter } from "./ScoreCounter";
import styles from "./RankingBoard.module.css";

export type RankingBoardProps = {
  entries: RankingEntry[];
  title?: string;
  emptyMessage?: string;
  /** quem está vendo (destacado; se estiver fora da lista, aparece no fim) */
  me?: RankingEntry | null;
};

/** quantidade de conquistas da pessoa (medalha + número) */
function Achievements({ count }: { count: number }) {
  return (
    <span className={styles.achievements} title={`${count} ${count === 1 ? "conquista" : "conquistas"}`}>
      <Sprite src={SPRITES.ui.achievements} alt="" decorative size={24} />
      <span aria-hidden="true">{count}</span>
      <span className="sr-only">{count === 1 ? "conquista" : "conquistas"}</span>
    </span>
  );
}

const MEDALS = [SPRITES.rewards.medalGold, SPRITES.rewards.medalSilver, SPRITES.rewards.medalBronze];

export function RankingBoard({ entries, title, emptyMessage, me }: RankingBoardProps) {
  const sorted = [...entries].sort((a, b) => a.position - b.position);
  const podium = sorted.slice(0, 3);
  const rest = sorted.slice(3);
  const mine = (entry: RankingEntry) => (me && entry.user_id === me.user_id ? styles.mine : undefined);
  const outside = me && !sorted.some((entry) => entry.user_id === me.user_id) ? me : null;

  return (
    <section className={styles.board} aria-label={title ?? "Ranking"}>
      {title && <h2 className={styles.title}>{title}</h2>}

      {sorted.length === 0 ? (
        <StatusView kind="coming-soon" title="Ranking vazio" message={emptyMessage ?? "Ainda não há exploradores neste ranking."} />
      ) : (
        <>
          <ol className={styles.podium}>
            {podium.map((entry, i) => {
              return (
                <li key={entry.user_id} className={cx(styles.step, styles[`place${i + 1}`], mine(entry))}>
                  <Sprite src={MEDALS[i]} alt={`${i + 1}º lugar`} size={i === 0 ? 72 : 48} className={styles.medal} />
                  <Avatar slug={entry.avatar_slug ?? ""} size={i === 0 ? 96 : 64} framed label="" />
                  <span className={styles.podiumName}>{entry.display_name}</span>
                  <span className={styles.stats}>
                    <ScoreCounter points={entry.points} size="sm" />
                    <Achievements count={entry.achievements ?? 0} />
                  </span>
                  <span className={styles.pedestal} aria-hidden="true">
                    {entry.position}
                  </span>
                </li>
              );
            })}
          </ol>

          {rest.length > 0 && (
            <ol className={styles.list} start={4}>
              {rest.map((entry) => (
                <li key={entry.user_id} className={cx(styles.row, mine(entry))}>
                  <span className={styles.position}>{entry.position}º</span>
                  <Avatar slug={entry.avatar_slug ?? ""} size={40} label="" />
                  <span className={styles.rowName}>{entry.display_name}</span>
                  <Achievements count={entry.achievements ?? 0} />
                  <ScoreCounter points={entry.points} size="sm" />
                </li>
              ))}
            </ol>
          )}

          {me && (
            <p className={styles.me} role="status">
              {outside ? "Sua posição: " : "Você está em "}
              <strong>{me.position}º lugar</strong> com {me.points} pontos e {me.achievements ?? 0}{" "}
              {(me.achievements ?? 0) === 1 ? "conquista" : "conquistas"}.
            </p>
          )}
        </>
      )}
    </section>
  );
}

export default RankingBoard;
