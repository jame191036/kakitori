import { TrainFront } from 'lucide-react';
import type { CSSProperties } from 'react';
import { groupLabel } from '../../data/scripts';
import { stationName, stationReading, type Station, type StationState } from '../../features/progress/stations';
import { cx } from '../../lib/cx';
import styles from './RouteMap.module.css';

interface RouteMapProps {
  stations: readonly Station[];
  states: readonly StationState[];
}

const STATE_LABEL: Record<StationState, string> = {
  done: 'ผ่านแล้ว',
  current: 'อยู่ที่นี่',
  todo: 'ยังไม่ถึง',
};

/**
 * แผนที่สถานีของสาย (路線図): จอกว้างเป็นแนวนอน · มือถือเป็นแนวตั้ง
 * เส้นสีสายลากจากสถานีแรกถึงสถานีปัจจุบัน — ใช้ภายในกล่องที่มี className "tone"
 */
export function RouteMap({ stations, states }: RouteMapProps) {
  const current = states.indexOf('current');
  // เส้นที่ผ่านแล้ว: ถึงสถานีปัจจุบัน หรือถึงสถานีสุดท้ายที่ผ่าน (ถ้าไม่มีสถานีปัจจุบันในสายนี้)
  const reached = current >= 0 ? current : states.lastIndexOf('done');
  const style = { '--n': stations.length, '--reached': Math.max(0, reached) } as CSSProperties;

  return (
    <ol className={styles.route} style={style} aria-label="แผนที่สถานี">
      {stations.map((st, i) => {
        const state = states[i]!;
        return (
          <li
            key={st.code}
            className={styles[state]}
            aria-current={state === 'current' ? 'step' : undefined}
            aria-label={`${st.code} ${groupLabel(st.group)} — ${STATE_LABEL[state]}`}
          >
            {state === 'current' && (
              <span className={styles.here} aria-hidden>
                <TrainFront size={14} strokeWidth={2.2} />
                อยู่ที่นี่
              </span>
            )}
            <span className={styles.dot} aria-hidden />
            <span className={cx('kana', styles.kana)} aria-hidden>
              {stationName(st.group)}
            </span>
            <span className={styles.code} aria-hidden>
              {st.code} · {stationReading(st.group)}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
