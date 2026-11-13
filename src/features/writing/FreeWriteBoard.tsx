import { Check, Eraser, PlayCircle, RotateCcw, Undo2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { StrokeData } from '../../data/types';
import { cx } from '../../lib/cx';
import { toPathData, type Point } from './engine/geometry';
import { scoreFreeWrite, type FreeWriteResult, type StrokeStatus } from './engine/freeWrite';
import { referenceStrokes } from './engine/refStrokes';
import { GridGuides, VIEWBOX } from './CharSvg';
import { WritingPad } from './WritingPad';
import styles from './writing.module.css';

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
}

/** เขียนทั้งตัวเองโดยไม่มีเส้นนำ แล้วกด "ตรวจ" เพื่อดูคะแนนทีละขีด */
export function FreeWriteBoard({ data, leniency, label, onResult, onShowOrder }: FreeWriteBoardProps) {
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
              <path key={`m${s.index}`} d={data.strokes[s.index]} className={styles.missing} />
            ))}
          <g className={styles.userInk}>
            {result.normalized.map((pts, i) => (
              <path
                key={i}
                d={toPathData(pts)}
                className={styles[`res-${result.strokes[i]?.status ?? 'extra'}`]}
              />
            ))}
          </g>
        </svg>

        <div className="card stack">
          <div className={styles.score}>
            <span className={styles.scoreValue}>{result.score}</span>
            <span className="muted">/ 100</span>
            <span className={styles.stars} aria-label={`${result.stars} ดาว`}>
              {[1, 2, 3].map((n) => (
                <span key={n} className={n > result.stars ? styles.starOff : undefined}>
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
          <button type="button" className="btn btn-primary" onClick={reset}>
            <RotateCcw size={18} aria-hidden /> เขียนอีกครั้ง
          </button>
          {onShowOrder && (
            <button type="button" className="btn" onClick={onShowOrder}>
              <PlayCircle size={18} aria-hidden /> ดูลำดับขีด
            </button>
          )}
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

      <div className={cx('notice', styles.status)} role="status">
        {strokes.length === 0
          ? 'เขียนทั้งตัวจากความจำ แล้วกด "ตรวจ"'
          : `เขียนไปแล้ว ${strokes.length} ขีด`}
      </div>

      <div className={styles.controls}>
        <button
          type="button"
          className="btn"
          onClick={() => setStrokes((s) => s.slice(0, -1))}
          disabled={strokes.length === 0}
        >
          <Undo2 size={18} aria-hidden /> ย้อนขีด
        </button>
        <button type="button" className="btn" onClick={reset} disabled={strokes.length === 0}>
          <Eraser size={18} aria-hidden /> ล้าง
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={check}
          disabled={strokes.length === 0}
        >
          <Check size={18} aria-hidden /> ตรวจ
        </button>
      </div>
    </div>
  );
}
