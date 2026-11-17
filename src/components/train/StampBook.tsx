import { groupLabel } from '../../data/scripts';
import { stationName, type Station, type StationState } from '../../features/progress/stations';
import { cx } from '../../lib/cx';
import styles from './StampBook.module.css';

interface StampBookProps {
  stations: readonly Station[];
  states: readonly StationState[];
}

/** สมุดตราสถานี (駅スタンプ): ผ่านสถานีไหนได้ตราของสถานีนั้น — สีหมึกสลับกันแบบตราสถานีจริง */
export function StampBook({ stations, states }: StampBookProps) {
  return (
    <ol className={styles.stamps}>
      {stations.map((st, i) => {
        const got = states[i] === 'done';
        return (
          <li
            key={st.code}
            className={cx(got ? styles.got : styles.empty, got && i % 2 === 1 && styles.alt)}
            style={got ? { rotate: `${((i * 37) % 17) - 8}deg` } : undefined}
            aria-label={`${st.code} ${groupLabel(st.group)} — ${got ? 'ได้ตราแล้ว' : 'ยังไม่ได้'}`}
          >
            <span className={cx('kana', styles.kana)} aria-hidden>
              {stationName(st.group)}
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
