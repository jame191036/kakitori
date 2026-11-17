import { useState, type CSSProperties } from 'react';
import { Link } from 'react-router';
import {
  findChar,
  groupKindDescription,
  groupKindLabel,
  levelOf,
  levelOfKind,
  levelsOf,
  type Level,
} from '../data/scripts';
import type { CharEntry, CharGroup, GroupKind, ScriptPack } from '../data/types';
import { masteryLevel, MASTERY_LABEL, type ScriptProgress } from '../features/progress/progressLogic';
import { cx } from '../lib/cx';
import { LevelTabs } from './LevelTabs';
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

/** คอลัมน์ของแต่ละประเภท: ตำแหน่ง col ที่ใช้ + ป้ายหัวคอลัมน์ (null = ไม่มีหัวตาราง) */
interface KindLayout {
  cols: readonly number[];
  labels: readonly string[] | null;
}

const VOWELS: KindLayout = { cols: [0, 1, 2, 3, 4], labels: ['a', 'i', 'u', 'e', 'o'] };

function layoutOf(kind: GroupKind, chars: readonly CharEntry[]): KindLayout {
  // ตัวควบ: 3 คอลัมน์ ya yu yo (เก็บไว้ที่ col 0 / 2 / 4)
  if (kind === 'yoon') return { cols: [0, 2, 4], labels: ['ya', 'yu', 'yo'] };
  // ตัวเล็ก: แถวเดียว ใช้เท่าที่มี ไม่มีหัวตาราง (ไม่ได้เรียงตามสระ)
  if (kind === 'small') return { cols: [...new Set(chars.map((c) => c.col))].sort((a, b) => a - b), labels: null };
  return VOWELS;
}

/** พยัญชนะของแถว จากโรมาจิของแถว: 'ka' → 'k', 'kya' → 'ky', 'a' → '–' · แถว ん ไม่มี (ใส่ n จะซ้ำกับแถว な) */
function consonantOf(group: CharGroup): string {
  if (!group.romaji.endsWith('a')) return '';
  return group.romaji.slice(0, -1) || '–';
}

/**
 * ตารางตัวอักษรเรียงตามแถว (โกจูอง) — ช่องว่างตรงตำแหน่งที่ไม่มีตัวอักษร เช่น แถว や
 * แบ่งเป็นระดับด้วยแท็บ (ระดับ 1 ตัวพื้นฐาน / ระดับ 2 ตัวเล็กและตัวควบ)
 * ที่แคบเรียงหมวดต่อกันลงมา · ที่กว้างจัดหมวดลง 2 คอลัมน์ให้สูงพอๆ กัน
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
  const levels = levelsOf(pack);
  const active = findChar(pack, activeId);
  // แท็บที่ผู้ใช้กดเลือกเอง จำไว้คู่กับตัวที่เลือกอยู่ — เปลี่ยนตัว (เช่นกดลูกศร) แล้วกลับไปเปิดระดับของตัวนั้น
  const [picked, setPicked] = useState<{ level: Level['id']; for?: string } | null>(null);
  const level = picked && picked.for === activeId ? picked.level : active ? levelOf(pack, active) : 1;
  const kinds = ([...new Set(pack.groups.map((g) => g.kind))] as GroupKind[]).filter(
    (k) => levelOfKind(k) === level,
  );
  const counts = Object.fromEntries(
    levels.map((l) => [l.id, pack.chars.filter((c) => levelOf(pack, c) === l.id).length]),
  );

  const renderSection = (kind: GroupKind) => {
    const groups = pack.groups.filter((g) => g.kind === kind);
    const kindChars = pack.chars.filter((c) => groups.some((g) => g.id === c.group));
    const layout = layoutOf(kind, kindChars);
    const showAxes = axes && !!layout.labels;
    // ความกว้างตามจำนวนคอลัมน์ ช่องจึงขนาดเท่ากันทุกหมวด (ตัวควบ 3 คอลัมน์ = 3/5 ของตารางปกติ)
    const gridStyle = { '--n': layout.cols.length } as CSSProperties;

    return (
      <section key={kind} className={styles.section}>
        {headings && <h3 className={styles.heading}>{groupKindLabel(kind, pack)}</h3>}
        {headings && !compact && <p className={styles.description}>{groupKindDescription(kind, pack)}</p>}
        <div className={cx(styles.grid, showAxes && styles.withAxes)} style={gridStyle}>
          {/* หัวตาราง (ป้ายกำกับเท่านั้น โปรแกรมอ่านหน้าจออ่านคำอ่านจาก title ของแต่ละช่องอยู่แล้ว) */}
          {showAxes && (
            <>
              <span className={styles.corner} aria-hidden />
              {layout.labels!.map((v) => (
                <span key={v} className={styles.axisCol} aria-hidden>
                  {v}
                </span>
              ))}
            </>
          )}
          {groups.map((g, row) => {
            const cells = layout.cols.map((col) => pack.chars.find((c) => c.group === g.id && c.col === col));
            // เส้นกรอบบน/ซ้ายอยู่ที่ช่องแถวแรก/คอลัมน์แรก (ไม่ล้อมป้ายหัวตาราง)
            const edge = (i: number) => cx(row === 0 && styles.top, i === 0 && styles.left);
            return [
              showAxes && (
                <span key={`${g.id}-axis`} className={styles.axisRow} aria-hidden>
                  {consonantOf(g)}
                </span>
              ),
              ...cells.map((entry, i) =>
                entry ? (
                  <Link
                    key={`${g.id}-${i}`}
                    to={hrefFor(entry)}
                    className={cx(
                      styles.cell,
                      edge(i),
                      entry.parts && styles.compound,
                      entry.id === activeId && styles.active,
                    )}
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
                  <span key={`${g.id}-${i}`} className={cx(styles.empty, edge(i))} aria-hidden />
                ),
              ),
            ];
          })}
        </div>
      </section>
    );
  };

  return (
    <div className={cx(styles.wrap, compact && styles.compact)}>
      {levels.length > 1 && (
        <div className={styles.levelTabs}>
          <LevelTabs
            levels={levels}
            value={level}
            onChange={(id) => setPicked({ level: id, for: activeId })}
            counts={compact ? undefined : counts}
            compact={compact}
            label="ระดับในตาราง"
          />
        </div>
      )}
      <div className={styles.cols}>{kinds.map(renderSection)}</div>
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
