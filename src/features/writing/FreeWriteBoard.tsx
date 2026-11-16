import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import type { StrokeData } from '../../data/types';
import { cx } from '../../lib/cx';
import { boundingBox, toPathData, type Point } from './engine/geometry';
import { scoreFreeWrite, type FreeWriteResult, type StrokeStatus } from './engine/freeWrite';
import { referenceStrokes } from './engine/refStrokes';
import { GridGuides, VIEWBOX } from './CharSvg';
import { WritingPad } from './WritingPad';
import styles from './writing.module.css';

/**
 * transform ที่พาลายมือที่ปรับขนาดแล้ว กลับไปอยู่ตำแหน่ง/ขนาดที่ผู้ใช้เขียนจริง
 * (ใช้เป็นจุดเริ่มของแอนิเมชัน แล้วเลื่อนเข้าหาต้นแบบ) — การปรับขนาดเป็นสัดส่วนเดียวกันทั้งตัว
 */
function morphFrom(
  original: readonly Point[][],
  normalized: readonly Point[][],
): { transform: string; k: number } | undefined {
  const ob = boundingBox(original.flat());
  const nb = boundingBox(normalized.flat());
  const ns = Math.max(nb.width, nb.height);
  if (ns < 1) return undefined;
  const k = Math.max(ob.width, ob.height) / ns;
  return { transform: `translate(${ob.cx - nb.cx * k}px, ${ob.cy - nb.cy * k}px) scale(${k})`, k };
}

/** ความหนาเส้นลายมือ (ตรงกับ .userInk ใน writing.module.css) */
const INK_WIDTH = 4.5;

const STATUS_LABEL: Record<StrokeStatus, string> = {
  good: 'ดีมาก',
  ok: 'ผ่าน',
  direction: 'ทิศทางผิด',
  order: 'ลำดับขีดผิด',
  shape: 'รูปร่าง/ตำแหน่งยังไม่ตรง',
  missing: 'ขาดขีดนี้',
  extra: 'ขีดเกินมา',
};

function scoreMessage(r: FreeWriteResult): string {
  if (r.userCount !== r.refCount) {
    return `ตัวนี้มี ${r.refCount} ขีด แต่เขียนไป ${r.userCount} ขีด`;
  }
  if (r.stars === 3) return 'สวยมาก! ลายมือใกล้เคียงต้นแบบ';
  if (r.stars === 2) return 'ดีแล้ว ลองดูขีดที่ยังไม่ผ่านอีกนิด';
  if (r.stars === 1) return 'พอใช้ ลองดูลำดับขีดแล้วเขียนอีกครั้ง';
  return 'ยังไม่ตรง ลองกลับไปดูลำดับขีดก่อนนะ';
}

interface FreeWriteBoardProps {
  data: StrokeData;
  leniency: number;
  label: string;
  onResult?: (result: FreeWriteResult) => void;
  onShowOrder?: () => void;
  /** ปุ่มไปต่อหลังตรวจ เช่น "ตัวถัดไป" (หน้าฝึกเขียนส่งมา) */
  completeActions?: ReactNode;
}

/** เขียนทั้งตัวเองโดยไม่มีเส้นนำ แล้วกด "ตรวจ" เพื่อดูคะแนนทีละขีด */
export function FreeWriteBoard({
  data,
  leniency,
  label,
  onResult,
  onShowOrder,
  completeActions,
}: FreeWriteBoardProps) {
  const refs = useMemo(() => referenceStrokes(data), [data]);
  const [strokes, setStrokes] = useState<Point[][]>([]);
  const [result, setResult] = useState<FreeWriteResult | null>(null);

  const check = () => {
    const r = scoreFreeWrite(strokes, refs, leniency);
    setResult(r);
    onResult?.(r);
  };

  const reset = () => {
    setStrokes([]);
    setResult(null);
  };

  if (result) {
    const from = morphFrom(strokes, result.normalized);
    return (
      <div className={styles.board}>
        <svg
          viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
          className={cx(styles.svg, styles.surface)}
          role="img"
          aria-label="ลายมือของคุณเทียบกับต้นแบบ"
        >
          <GridGuides />
          <g className={cx(styles.ghost, styles.ghostThin)}>
            {data.strokes.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </g>
          {result.strokes
            .filter((s) => s.status === 'missing')
            .map((s) => (
              <path
                key={`m${s.index}`}
                d={data.strokes[s.index]}
                className={cx(styles.missing, styles.missingIn)}
              />
            ))}
          <g
            className={cx(styles.userInk, styles.reveal, from && styles.morph)}
            style={
              from
                ? // --sw0: ความหนาตอนเริ่ม ชดเชยการย่อ/ขยาย ให้เส้นหนาเท่าตอนที่เพิ่งเขียน
                  ({ '--from': from.transform, '--sw0': INK_WIDTH / from.k } as CSSProperties)
                : undefined
            }
          >
            {result.normalized.map((pts, i) => (
              <path
                key={i}
                d={toPathData(pts)}
                className={styles[`res-${result.strokes[i]?.status ?? 'extra'}`]}
                style={{ '--i': i } as CSSProperties}
              />
            ))}
          </g>
        </svg>

        <div className={cx('card', 'stack', styles.resultCard)}>
          <div className={styles.score}>
            <span className={styles.scoreValue}>{result.score}</span>
            <span className="muted">/ 100</span>
            <span className={styles.stars} aria-label={`${result.stars} ดาว`}>
              {[1, 2, 3].map((n) => (
                <span
                  key={n}
                  className={cx(styles.star, n > result.stars && styles.starOff)}
                  style={{ '--n': n - 1 } as CSSProperties}
                >
                  ★
                </span>
              ))}
            </span>
          </div>
          <p className="small" style={{ textAlign: 'center' }}>
            {scoreMessage(result)}
          </p>
          <ul className={styles.resultList}>
            {result.strokes.map((s) => (
              <li key={s.index}>
                <span className={cx(styles.dot, styles[`dot-${s.status}`])} aria-hidden />
                <span>ขีดที่ {s.index + 1}</span>
                <span className="muted small" style={{ marginLeft: 'auto' }}>
                  {STATUS_LABEL[s.status]}
                </span>
              </li>
            ))}
          </ul>
          <p className="small muted">
            เส้นสีจางคือต้นแบบ ระบบปรับขนาดลายมือให้เท่าต้นแบบก่อนตรวจ
          </p>
        </div>

        <div className={styles.controls}>
          <button type="button" className={cx('btn btn-sm', !completeActions && 'btn-primary')} onClick={reset}>
            เขียนอีกครั้ง
          </button>
          {onShowOrder && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={onShowOrder}>
              ดูลำดับขีด
            </button>
          )}
          {completeActions && <span className={styles.nextActions}>{completeActions}</span>}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.board}>
      <WritingPad onStroke={(pts) => setStrokes((s) => [...s, pts])} label={label}>
        <g className={styles.userInk}>
          {strokes.map((pts, i) => (
            <path key={i} d={toPathData(pts)} />
          ))}
        </g>
      </WritingPad>

      <div className={styles.statusLine}>
        <span className={styles.statusText} role="status">
          {strokes.length === 0
            ? 'เขียนทั้งตัวจากความจำ แล้วกด "ตรวจ"'
            : `เขียนไปแล้ว ${strokes.length} ขีด`}
        </span>
      </div>

      <div className={styles.controls}>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => setStrokes((s) => s.slice(0, -1))}
          disabled={strokes.length === 0}
        >
          ย้อนขีด
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={reset} disabled={strokes.length === 0}>
          ล้าง
        </button>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={check}
          disabled={strokes.length === 0}
        >
          ตรวจ
        </button>
      </div>
    </div>
  );
}
