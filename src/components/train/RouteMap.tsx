import { TrainFront } from 'lucide-react';
import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { Link } from 'react-router';
import type { RouteStop, StationState } from '../../features/progress/stations';
import { cx } from '../../lib/cx';
import styles from './RouteMap.module.css';

interface RouteMapProps {
  stops: readonly RouteStop[];
  states: readonly StationState[];
  /**
   * true = แนวนอนเสมอ (จอแคบเลื่อนซ้าย-ขวาได้ และเลื่อนให้เห็นสถานีปัจจุบันเอง)
   * false = จอกว้างแนวนอน · มือถือเรียงแนวตั้ง
   */
  scroll?: boolean;
  /** ความกว้างขั้นต่ำต่อสถานีในแบบเลื่อนได้ (px) — ชื่อสถานียาว (คำศัพท์) ใช้ค่ามากขึ้น */
  minStop?: number;
}

const STATE_LABEL: Record<StationState, string> = {
  done: 'ผ่านแล้ว',
  current: 'อยู่ที่นี่',
  todo: 'ยังไม่ถึง',
};

/**
 * แผนที่สถานีของสาย (路線図) — เส้นสีสายลากจากสถานีแรกถึงสถานีปัจจุบัน
 * ใช้ภายในกล่องที่มี className "tone" (สีสาย) · สถานีที่มี href กดเพื่อไปฝึกได้
 */
export function RouteMap({ stops, states, scroll = false, minStop = 64 }: RouteMapProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const current = states.indexOf('current');
  // เส้นที่ผ่านแล้ว: ถึงสถานีปัจจุบัน หรือถึงสถานีสุดท้ายที่ผ่าน (ถ้าไม่มีสถานีปัจจุบันในสายนี้)
  const reached = current >= 0 ? current : states.lastIndexOf('done');
  const style = {
    '--n': stops.length,
    '--reached': Math.max(0, reached),
    '--min': `${minStop}px`,
  } as CSSProperties;

  // แบบเลื่อนได้: เลื่อนให้สถานีปัจจุบันอยู่กลางแถบ (เลื่อนเฉพาะแถบนี้ ไม่ให้ทั้งหน้าเลื่อนตาม)
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || wrap.scrollWidth <= wrap.clientWidth) return;
    const cur = wrap.querySelector<HTMLElement>('[data-current]');
    if (cur) wrap.scrollLeft = cur.offsetLeft - wrap.clientWidth / 2 + cur.offsetWidth / 2;
  }, [current, stops.length]);

  return (
    <div ref={wrapRef} className={scroll ? styles.scrollWrap : undefined}>
      <ol className={cx(styles.route, scroll ? styles.scroll : styles.auto)} style={style} aria-label="แผนที่สถานี">
        {stops.map((st, i) => {
          const state = states[i]!;
          const label = `${st.label} — ${STATE_LABEL[state]}`;
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
                {st.name}
              </span>
              <span className={styles.code} aria-hidden>
                {st.code} · {st.reading}
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
              {st.href ? (
                <Link to={st.href} className={cx(styles.st, styles.link)} aria-label={`${label} (กดเพื่อฝึก)`}>
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
    </div>
  );
}
