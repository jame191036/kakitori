import { useMemo, useState } from 'react';
import type { StrokeData } from '../../data/types';
import { cx } from '../../lib/cx';
import { strokeLengths } from './engine/refStrokes';
import { VIEWBOX } from './CharSvg';
import styles from './StrokeDraw.module.css';

interface StrokeDrawProps {
  data: StrokeData;
  label: string;
  /** แสดงตัวจางด้านหลังระหว่างเขียน */
  ghost?: boolean;
  /** หน่วงก่อนเริ่มเขียนครั้งแรก (ms) */
  delay?: number;
  className?: string;
}

/**
 * ตัวอักษรที่ค่อยๆ เขียนตัวเองทีละขีดตามลำดับจริง (ไม่มีเส้นตาราง/ปุ่ม) — ใช้ประดับป้ายสถานีและการ์ด
 * แตะเพื่อเขียนใหม่ · สีหมึกตาม --ink (เปลี่ยนตามธีม) · ผู้ที่ตั้งลดการเคลื่อนไหวจะเห็นตัวเต็มทันที
 */
export function StrokeDraw({ data, label, ghost = false, delay = 0, className }: StrokeDrawProps) {
  const [run, setRun] = useState(0);
  const timeline = useMemo(() => {
    const out: { delay: number; duration: number }[] = [];
    for (const len of strokeLengths(data)) {
      const prev = out[out.length - 1];
      out.push({
        delay: prev ? prev.delay + prev.duration + 180 : run === 0 ? delay : 0,
        duration: 280 + len * 8,
      });
    }
    return out;
  }, [data, delay, run]);

  return (
    <svg
      viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
      className={cx(styles.svg, className)}
      role="img"
      aria-label={label}
      onClick={() => setRun((r) => r + 1)}
    >
      {ghost && (
        <g className={styles.ghost}>
          {data.strokes.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
      )}
      <g key={run} className={styles.ink}>
        {data.strokes.map((d, i) => (
          <path
            key={i}
            d={d}
            pathLength={1}
            className={styles.draw}
            style={{
              animationDelay: `${timeline[i]!.delay}ms`,
              animationDuration: `${timeline[i]!.duration}ms`,
            }}
          />
        ))}
      </g>
    </svg>
  );
}
