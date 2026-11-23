import type { RouteStop, StationState } from '../../features/progress/stations';
import { cx } from '../../lib/cx';
import styles from './StampBook.module.css';

interface StampBookProps {
  stops: readonly RouteStop[];
  states: readonly StationState[];
}

/** สมุดตราสถานี (駅スタンプ): ผ่านสถานีไหนได้ตราของสถานีนั้น — สีหมึกสลับกันแบบตราสถานีจริง */
export function StampBook({ stops, states }: StampBookProps) {
  return (
    <ol className={styles.stamps}>
      {stops.map((st, i) => {
        const got = states[i] === 'done';
        const len = [...st.name].length;
        return (
          <li
            key={st.code}
            className={cx(got ? styles.got : styles.empty, got && i % 2 === 1 && styles.alt)}
            style={got ? { rotate: `${((i * 37) % 17) - 8}deg` } : undefined}
            aria-label={`${st.label} — ${got ? 'ได้ตราแล้ว' : 'ยังไม่ได้'}`}
          >
            <span className={cx('kana', styles.kana, len > 2 && styles.long, len > 5 && styles.longer)} aria-hidden>
              {/* ・ เป็นจุดตัดบรรทัดได้ (ชื่อยาวตัดตรงช่องว่างหรือ ・ ก่อน) */}
              {len > 5 ? st.name.replace(/・/g, '・​') : st.name}
            </span>
            <span className={styles.code} aria-hidden>
              {st.code}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
