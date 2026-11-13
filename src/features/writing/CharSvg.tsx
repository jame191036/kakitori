import type { ReactNode } from 'react';
import type { StrokeData } from '../../data/types';
import { cx } from '../../lib/cx';
import styles from './writing.module.css';

export const VIEWBOX = 109;

/** เส้นตารางนำ (กรอบ + เส้นประกากบาท) */
export function GridGuides({ border = false }: { border?: boolean }) {
  const m = VIEWBOX / 2;
  return (
    <g aria-hidden="true">
      {border && <rect className={styles.gridLine} x={0.5} y={0.5} width={108} height={108} rx={4} />}
      <line className={styles.gridLine} x1={m} y1={0} x2={m} y2={VIEWBOX} />
      <line className={styles.gridLine} x1={0} y1={m} x2={VIEWBOX} y2={m} />
    </g>
  );
}

export function StrokeNumbers({
  data,
  upTo = data.strokes.length,
  current,
}: {
  data: StrokeData;
  upTo?: number;
  current?: number;
}) {
  return (
    <g aria-hidden="true">
      {data.numbers.slice(0, upTo).map(([x, y], i) => (
        <text key={i} x={x} y={y} className={cx(styles.num, i === current && styles.numCurrent)}>
          {i + 1}
        </text>
      ))}
    </g>
  );
}

interface CharSvgProps {
  data: StrokeData;
  /** จำนวนขีดที่วาด (ค่าเริ่มต้น: ทุกขีด) */
  upTo?: number;
  /** ขีดที่เน้นสี */
  highlight?: number;
  /** วาดทุกขีดแบบจางไว้ด้านหลัง */
  ghost?: boolean;
  /** วาดเฉพาะแบบจาง (ใช้ในแบบฝึกเขียนทับ) */
  ghostOnly?: boolean;
  numbers?: boolean;
  grid?: boolean;
  className?: string;
  label?: string;
  children?: ReactNode;
}

/** แสดงตัวอักษรจากข้อมูลลำดับขีด (คมชัดทุกขนาด รวมถึงตอนพิมพ์) */
export function CharSvg({
  data,
  upTo = data.strokes.length,
  highlight,
  ghost = false,
  ghostOnly = false,
  numbers = false,
  grid = false,
  className,
  label,
  children,
}: CharSvgProps) {
  return (
    <svg
      viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
      className={cx(styles.svg, className)}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {grid && <GridGuides />}
      {(ghost || ghostOnly) && (
        <g className={styles.ghost}>
          {data.strokes.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
      )}
      {!ghostOnly && (
        <g className={styles.ink}>
          {data.strokes.slice(0, upTo).map((d, i) => (
            <path key={i} d={d} className={i === highlight ? styles.current : undefined} />
          ))}
        </g>
      )}
      {numbers && <StrokeNumbers data={data} upTo={ghostOnly ? undefined : upTo} current={highlight} />}
      {children}
    </svg>
  );
}
