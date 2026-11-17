import type { Level } from '../data/scripts';
import { cx } from '../lib/cx';
import styles from './LevelTabs.module.css';

interface LevelTabsProps {
  levels: readonly Level[];
  value: Level['id'];
  onChange: (id: Level['id']) => void;
  /** จำนวนตัวในแต่ละระดับ (แสดงต่อท้ายชื่อแท็บ) */
  counts?: Partial<Record<Level['id'], number>>;
  /** ที่แคบ (แถบข้าง/ส่วนพับในหน้าฝึก): ใช้ชื่อสั้น */
  compact?: boolean;
  label?: string;
}

/** แท็บเลือกระดับ (ระดับ 1 ตัวพื้นฐาน / ระดับ 2 ตัวเล็กและตัวควบ) — ใช้แท็บขีดเส้นใต้แบบเดียวกับทั้งเว็บ */
export function LevelTabs({ levels, value, onChange, counts, compact = false, label = 'ระดับ' }: LevelTabsProps) {
  return (
    <div className={cx('segmented', styles.tabs)} role="tablist" aria-label={label}>
      {levels.map((l) => (
        <button
          key={l.id}
          type="button"
          role="tab"
          aria-selected={value === l.id}
          onClick={() => onChange(l.id)}
        >
          <span className={styles.level}>ระดับ {l.id}</span>
          <span>{compact ? l.short : l.name}</span>
          {counts?.[l.id] !== undefined && <span className={styles.count}>{counts[l.id]}</span>}
        </button>
      ))}
    </div>
  );
}
