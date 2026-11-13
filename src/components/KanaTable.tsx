import { Link } from 'react-router';
import { GROUP_KIND_LABEL, groupKindDescription } from '../data/scripts';
import type { CharEntry, GroupKind, ScriptPack } from '../data/types';
import { masteryLevel, MASTERY_LABEL, type ScriptProgress } from '../features/progress/progressLogic';
import { cx } from '../lib/cx';
import styles from './KanaTable.module.css';

interface KanaTableProps {
  pack: ScriptPack;
  progress?: ScriptProgress;
  hrefFor: (entry: CharEntry) => string;
  activeId?: string;
  compact?: boolean;
  /** แสดงหัวข้อของแต่ละประเภท (ตัวพื้นฐาน / ตัวขุ่น …) */
  headings?: boolean;
}

/** ตารางตัวอักษรเรียงตามแถว (โกจูอง) — ช่องว่างตรงตำแหน่งที่ไม่มีตัวอักษร เช่น แถว や */
export function KanaTable({ pack, progress, hrefFor, activeId, compact = false, headings = true }: KanaTableProps) {
  const kinds = [...new Set(pack.groups.map((g) => g.kind))] as GroupKind[];
  return (
    <div className={cx(styles.wrap, compact && styles.compact)}>
      {kinds.map((kind) => (
        <section key={kind} className={styles.section}>
          {headings && <h3 className={styles.heading}>{GROUP_KIND_LABEL[kind]}</h3>}
          {headings && !compact && <p className={styles.description}>{groupKindDescription(kind, pack)}</p>}
          <div className={styles.grid}>
            {pack.groups
              .filter((g) => g.kind === kind)
              .map((g) => {
                const cells: (CharEntry | undefined)[] = Array(5).fill(undefined);
                pack.chars.filter((c) => c.group === g.id).forEach((c) => (cells[c.col] = c));
                return cells.map((entry, col) =>
                  entry ? (
                    <Link
                      key={`${g.id}-${col}`}
                      to={hrefFor(entry)}
                      className={cx(styles.cell, entry.id === activeId && styles.active)}
                      aria-current={entry.id === activeId ? 'true' : undefined}
                      title={`${entry.char} — ${entry.romaji} (${MASTERY_LABEL[masteryLevel(progress?.[entry.id])]})`}
                    >
                      <span className={cx('kana', styles.char)}>{entry.char}</span>
                      {!compact && <span className={styles.romaji}>{entry.romaji}</span>}
                      <span
                        className={cx(styles.bar, styles[`m${masteryLevel(progress?.[entry.id])}`])}
                        aria-hidden
                      />
                    </Link>
                  ) : (
                    <span key={`${g.id}-${col}`} className={styles.empty} aria-hidden />
                  ),
                );
              })}
          </div>
        </section>
      ))}
    </div>
  );
}

export function MasteryLegend() {
  return (
    <div className={styles.legend}>
      {MASTERY_LABEL.map((label, i) => (
        <span key={label} className={styles.legendItem}>
          <span className={cx(styles.swatch, styles[`m${i}`])} aria-hidden />
          {label}
        </span>
      ))}
    </div>
  );
}
