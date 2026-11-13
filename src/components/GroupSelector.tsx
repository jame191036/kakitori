import { GROUP_KIND_LABEL } from '../data/scripts';
import type { GroupKind, ScriptPack } from '../data/types';
import styles from './GroupSelector.module.css';

interface GroupSelectorProps {
  pack: ScriptPack;
  value: readonly string[];
  onChange: (groups: string[]) => void;
  legend?: string;
}

/** เลือกแถวตัวอักษร (แบบชิป) พร้อมปุ่มเลือก/ล้างทั้งประเภท */
export function GroupSelector({ pack, value, onChange, legend = 'เลือกแถวตัวอักษร' }: GroupSelectorProps) {
  const selected = new Set(value);
  const kinds = [...new Set(pack.groups.map((g) => g.kind))] as GroupKind[];
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
      {kinds.map((kind) => {
        const groups = pack.groups.filter((g) => g.kind === kind);
        const allOn = groups.every((g) => selected.has(g.id));
        return (
          <div key={kind} className={styles.kind}>
            <div className={styles.kindHeader}>
              <span className="small muted">{GROUP_KIND_LABEL[kind]}</span>
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
                  <span className="small muted">{g.romaji}</span>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </fieldset>
  );
}
