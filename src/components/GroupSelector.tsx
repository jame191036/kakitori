import { useState } from 'react';
import { groupKindLabel, LEVELS, levelOfKind, type Level } from '../data/scripts';
import type { GroupKind, ScriptPack } from '../data/types';
import { LevelTabs } from './LevelTabs';
import styles from './GroupSelector.module.css';

interface GroupSelectorProps {
  pack: ScriptPack;
  value: readonly string[];
  onChange: (groups: string[]) => void;
  legend?: string;
  /** แสดงเฉพาะประเภทเหล่านี้ (เช่น แบบทดสอบไม่มีตัวเล็ก, ใบฝึกเขียนไม่มีตัวควบ) */
  kinds?: readonly GroupKind[];
}

/** เลือกแถวตัวอักษร (แบบชิป) พร้อมปุ่มเลือก/ล้างทั้งประเภท */
export function GroupSelector({
  pack,
  value,
  onChange,
  legend = 'เลือกแถวตัวอักษร',
  kinds: only,
}: GroupSelectorProps) {
  const selected = new Set(value);
  const allKinds = ([...new Set(pack.groups.map((g) => g.kind))] as GroupKind[]).filter(
    (k) => !only || only.includes(k),
  );
  const levels = LEVELS.filter((l) => allKinds.some((k) => l.kinds.includes(k)));
  // เปิดแท็บระดับของแถวแรกที่เลือกไว้ (ไม่มี = ระดับ 1)
  const firstSelected = pack.groups.find((g) => selected.has(g.id));
  const [level, setLevel] = useState<Level['id']>(() =>
    firstSelected && levels.some((l) => l.id === levelOfKind(firstSelected.kind))
      ? levelOfKind(firstSelected.kind)
      : (levels[0]?.id ?? 1),
  );
  const kinds = allKinds.filter((k) => levels.length < 2 || levelOfKind(k) === level);
  // จำนวนแถวที่เลือกไว้ในแต่ละระดับ — เห็นว่ามีแถวที่เลือกไว้ในแท็บอื่นด้วย
  const selectedIn = Object.fromEntries(
    levels.map((l) => [
      l.id,
      pack.groups.filter((g) => selected.has(g.id) && allKinds.includes(g.kind) && levelOfKind(g.kind) === l.id)
        .length,
    ]),
  );
  const ordered = (set: Set<string>) => pack.groups.map((g) => g.id).filter((id) => set.has(id));

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(ordered(next));
  };

  const setKind = (kind: GroupKind, on: boolean) => {
    const next = new Set(selected);
    pack.groups.filter((g) => g.kind === kind).forEach((g) => (on ? next.add(g.id) : next.delete(g.id)));
    onChange(ordered(next));
  };

  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>{legend}</legend>
      {levels.length > 1 && (
        <div className={styles.levels}>
          <LevelTabs levels={levels} value={level} onChange={setLevel} counts={selectedIn} label="ระดับ" />
          <p className="small muted">ตัวเลขท้ายแท็บ = จำนวนแถวที่เลือกไว้ในระดับนั้น</p>
        </div>
      )}
      {kinds.map((kind) => {
        const groups = pack.groups.filter((g) => g.kind === kind);
        const allOn = groups.every((g) => selected.has(g.id));
        return (
          <div key={kind} className={styles.kind}>
            <div className={styles.kindHeader}>
              <span className="small muted">{groupKindLabel(kind, pack)}</span>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setKind(kind, !allOn)}>
                {allOn ? 'ไม่เลือกทั้งหมด' : 'เลือกทั้งหมด'}
              </button>
            </div>
            <div className={styles.chips}>
              {groups.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  className="chip"
                  aria-pressed={selected.has(g.id)}
                  onClick={() => toggle(g.id)}
                >
                  <span className="kana" style={{ fontSize: '1.15rem' }}>
                    {g.head}
                  </span>
                  {g.romaji && <span className="small muted">{g.romaji}</span>}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </fieldset>
  );
}
