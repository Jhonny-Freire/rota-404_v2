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
};

const MEDALS = [SPRITES.rewards.medalGold, SPRITES.rewards.medalSilver, SPRITES.rewards.medalBronze];

export function RankingBoard({ entries, title, emptyMessage }: RankingBoardProps) {
  const sorted = [...entries].sort((a, b) => a.position - b.position);
  const podium = sorted.slice(0, 3);
  const rest = sorted.slice(3);

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
                <li key={entry.user_id} className={cx(styles.step, styles[`place${i + 1}`])}>
                  <Sprite src={MEDALS[i]} alt={`${i + 1}º lugar`} size={i === 0 ? 72 : 48} className={styles.medal} />
                  <Avatar slug={entry.avatar_slug ?? ""} size={i === 0 ? 96 : 64} framed label="" />
                  <span className={styles.podiumName}>{entry.display_name}</span>
                  <ScoreCounter points={entry.points} size="sm" />
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
                <li key={entry.user_id} className={styles.row}>
                  <span className={styles.position}>{entry.position}º</span>
                  <Avatar slug={entry.avatar_slug ?? ""} size={40} label="" />
                  <span className={styles.rowName}>{entry.display_name}</span>
                  <ScoreCounter points={entry.points} size="sm" />
                </li>
              ))}
            </ol>
          )}
        </>
      )}
    </section>
  );
}

export default RankingBoard;
