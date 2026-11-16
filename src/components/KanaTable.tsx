import { Link } from 'react-router';
import { GROUP_KIND_LABEL, groupKindDescription } from '../data/scripts';
import type { CharEntry, CharGroup, GroupKind, ScriptPack } from '../data/types';
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
  /** หัวตาราง: สระ (a i u e o) ด้านบน + พยัญชนะของแถว (– k s t …) ด้านซ้าย (ค่าเริ่มต้น: แสดง) */
  axes?: boolean;
}

const VOWELS = ['a', 'i', 'u', 'e', 'o'] as const;

/** พยัญชนะของแถว จากโรมาจิของแถว: 'ka' → 'k', 'a' → '–' · แถว ん ไม่มี (ใส่ n จะซ้ำกับแถว な) */
function consonantOf(group: CharGroup): string {
  if (!group.romaji.endsWith('a')) return '';
  return group.romaji.slice(0, -1) || '–';
}

/**
 * ตารางตัวอักษรเรียงตามแถว (โกจูอง) — ช่องว่างตรงตำแหน่งที่ไม่มีตัวอักษร เช่น แถว や
 * แบ่งเป็น 2 คอลัมน์: ตัวพื้นฐาน | หมวดที่เหลือ (ตัวขุ่น ฯลฯ) — จอกว้างวางคู่กัน จอแคบเรียงต่อกันลงมา
 */
export function KanaTable({
  pack,
  progress,
  hrefFor,
  activeId,
  compact = false,
  headings = true,
  axes = true,
}: KanaTableProps) {
  const kinds = [...new Set(pack.groups.map((g) => g.kind))] as GroupKind[];
  const columns = [kinds.slice(0, 1), kinds.slice(1)].filter((col) => col.length > 0);

  const renderSection = (kind: GroupKind) => (
    <section key={kind} className={styles.section}>
      {headings && <h3 className={styles.heading}>{GROUP_KIND_LABEL[kind]}</h3>}
      {headings && !compact && <p className={styles.description}>{groupKindDescription(kind, pack)}</p>}
      <div className={cx(styles.grid, axes && styles.withAxes)}>
        {/* หัวตาราง (ป้ายกำกับเท่านั้น โปรแกรมอ่านหน้าจออ่านคำอ่านจาก title ของแต่ละช่องอยู่แล้ว) */}
        {axes && (
          <>
            <span className={styles.corner} aria-hidden />
            {VOWELS.map((v) => (
              <span key={v} className={styles.axisCol} aria-hidden>
                {v}
              </span>
            ))}
          </>
        )}
        {pack.groups
          .filter((g) => g.kind === kind)
          .map((g, row) => {
            const cells: (CharEntry | undefined)[] = Array(5).fill(undefined);
            pack.chars.filter((c) => c.group === g.id).forEach((c) => (cells[c.col] = c));
            // มีหัวตาราง: เส้นกรอบบน/ซ้ายย้ายมาอยู่ที่ช่องแถวแรก/คอลัมน์แรก (ไม่ล้อมป้ายหัวตาราง)
            const edge = (col: number) => axes && cx(row === 0 && styles.top, col === 0 && styles.left);
            return [
              axes && (
                <span key={`${g.id}-axis`} className={styles.axisRow} aria-hidden>
                  {consonantOf(g)}
                </span>
              ),
              ...cells.map((entry, col) =>
                entry ? (
                  <Link
                    key={`${g.id}-${col}`}
                    to={hrefFor(entry)}
                    className={cx(styles.cell, edge(col), entry.id === activeId && styles.active)}
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
                  <span key={`${g.id}-${col}`} className={cx(styles.empty, edge(col))} aria-hidden />
                ),
              ),
            ];
          })}
      </div>
    </section>
  );

  return (
    <div className={cx(styles.wrap, compact && styles.compact)}>
      <div className={styles.cols}>
        {columns.map((col) => (
          <div key={col[0]} className={styles.col}>
            {col.map(renderSection)}
          </div>
        ))}
      </div>
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
