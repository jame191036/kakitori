import { TrainFront } from 'lucide-react';
import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { Link } from 'react-router';
import { groupLabel } from '../../data/scripts';
import { stationName, stationReading, type Station, type StationState } from '../../features/progress/stations';
import { cx } from '../../lib/cx';
import styles from './RouteMap.module.css';

interface RouteMapProps {
  stations: readonly Station[];
  states: readonly StationState[];
  /**
   * true = แนวนอนเสมอ (จอแคบเลื่อนซ้าย-ขวาได้ และเลื่อนให้เห็นสถานีปัจจุบันเอง)
   * false = จอกว้างแนวนอน · มือถือเรียงแนวตั้ง
   */
  scroll?: boolean;
  /** ใส่เมื่ออยากให้กดสถานีแล้วไปฝึกแถวนั้น */
  hrefFor?: (station: Station) => string;
}

const STATE_LABEL: Record<StationState, string> = {
  done: 'ผ่านแล้ว',
  current: 'อยู่ที่นี่',
  todo: 'ยังไม่ถึง',
};

/**
 * แผนที่สถานีของสาย (路線図) — เส้นสีสายลากจากสถานีแรกถึงสถานีปัจจุบัน
 * ใช้ภายในกล่องที่มี className "tone" (สีสาย)
 */
export function RouteMap({ stations, states, scroll = false, hrefFor }: RouteMapProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const current = states.indexOf('current');
  // เส้นที่ผ่านแล้ว: ถึงสถานีปัจจุบัน หรือถึงสถานีสุดท้ายที่ผ่าน (ถ้าไม่มีสถานีปัจจุบันในสายนี้)
  const reached = current >= 0 ? current : states.lastIndexOf('done');
  const style = { '--n': stations.length, '--reached': Math.max(0, reached) } as CSSProperties;

  // แบบเลื่อนได้: เลื่อนให้สถานีปัจจุบันอยู่กลางแถบ (เลื่อนเฉพาะแถบนี้ ไม่ให้ทั้งหน้าเลื่อนตาม)
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || wrap.scrollWidth <= wrap.clientWidth) return;
    const cur = wrap.querySelector<HTMLElement>('[data-current]');
    if (cur) wrap.scrollLeft = cur.offsetLeft - wrap.clientWidth / 2 + cur.offsetWidth / 2;
  }, [current, stations.length]);

  const list = (
    <ol className={cx(styles.route, scroll ? styles.scroll : styles.auto)} style={style} aria-label="แผนที่สถานี">
      {stations.map((st, i) => {
        const state = states[i]!;
        const label = `${st.code} ${groupLabel(st.group)} — ${STATE_LABEL[state]}`;
        const body: ReactNode = (
          <>
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
          </>
        );
        return (
          <li
            key={st.code}
            className={styles[state]}
            aria-current={state === 'current' ? 'step' : undefined}
            data-current={state === 'current' ? '' : undefined}
          >
            {hrefFor ? (
              <Link to={hrefFor(st)} className={cx(styles.st, styles.link)} aria-label={`${label} (กดเพื่อฝึกแถวนี้)`}>
                {body}
              </Link>
            ) : (
              <span className={styles.st} aria-label={label} role="img">
                {body}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );

  return (
    <div ref={wrapRef} className={scroll ? styles.scrollWrap : undefined}>
      {list}
    </div>
  );
}
