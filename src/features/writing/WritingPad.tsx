import { useRef, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { cx } from '../../lib/cx';
import { dist, toPathData, type Point } from './engine/geometry';
import { GridGuides, VIEWBOX } from './CharSvg';
import styles from './writing.module.css';

interface WritingPadProps {
  /** เรียกเมื่อผู้ใช้ยกนิ้ว/ปากกา/เมาส์ (จบ 1 ขีด) — พิกัดเป็นหน่วย 0–109 */
  onStroke: (points: Point[]) => void;
  disabled?: boolean;
  /** เนื้อหา SVG ที่วาดใต้หมึกที่กำลังเขียน (เส้นจาง ขีดที่ผ่านแล้ว คำใบ้ ฯลฯ) */
  children?: ReactNode;
  label: string;
}

const MIN_STEP = 0.35;

/**
 * กระดานเขียน: รับเส้นจากนิ้ว ปากกา หรือเมาส์ (Pointer Events)
 * หมึกระหว่างเขียนอัปเดตตรงๆ ที่ DOM เพื่อความลื่น ไม่ re-render ทุกการขยับ
 */
export function WritingPad({ onStroke, disabled = false, children, label }: WritingPadProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const liveRef = useRef<SVGPathElement>(null);
  const active = useRef<{ id: number; points: Point[] } | null>(null);

  const toLocal = (e: { clientX: number; clientY: number }): Point => {
    const rect = svgRef.current!.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * VIEWBOX,
      y: ((e.clientY - rect.top) / rect.height) * VIEWBOX,
    };
  };

  /** วาดหมึกที่กำลังเขียน — `ahead` = จุดที่เบราว์เซอร์คาดว่านิ้ว/ปากกาจะไปถึง (วาดชั่วคราว ไม่เก็บ) */
  const paint = (ahead: Point[] = []) => {
    const stroke = active.current;
    liveRef.current?.setAttribute('d', stroke ? toPathData([...stroke.points, ...ahead]) : '');
  };

  const onPointerDown = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (disabled || active.current) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    active.current = { id: e.pointerId, points: [toLocal(e)] };
    paint();
  };

  const onPointerMove = (e: ReactPointerEvent<SVGSVGElement>) => {
    const stroke = active.current;
    if (!stroke || stroke.id !== e.pointerId) return;
    const coalesced = e.nativeEvent.getCoalescedEvents?.() ?? [];
    for (const ev of coalesced.length ? coalesced : [e.nativeEvent]) {
      const p = toLocal(ev);
      if (dist(p, stroke.points[stroke.points.length - 1]!) >= MIN_STEP) stroke.points.push(p);
    }
    // ลดความหน่วงที่ตารับรู้: วาดล่วงหน้าไปถึงตำแหน่งที่คาดไว้ (Chrome/Edge) แต่ใช้ตรวจเฉพาะจุดจริง
    const predicted = e.nativeEvent.getPredictedEvents?.() ?? [];
    paint(predicted.slice(0, 2).map(toLocal));
  };

  const finish = (e: ReactPointerEvent<SVGSVGElement>, cancelled: boolean) => {
    const stroke = active.current;
    if (!stroke || stroke.id !== e.pointerId) return;
    active.current = null;
    paint(); // ล้างหมึกชั่วคราว (รวมจุดที่คาดไว้) — เส้นที่ใช้ตรวจคือจุดจริงเท่านั้น
    if (!cancelled) onStroke(stroke.points);
  };

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
      className={cx(styles.svg, styles.surface, styles.pad, disabled && styles.padDisabled)}
      role="img"
      aria-label={label}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={(e) => finish(e, false)}
      onPointerCancel={(e) => finish(e, true)}
      onContextMenu={(e) => e.preventDefault()}
    >
      <GridGuides />
      {children}
      <path ref={liveRef} className={styles.live} />
    </svg>
  );
}
