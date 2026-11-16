import { Lightbulb, RotateCcw } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { StrokeData } from '../../data/types';
import { cx } from '../../lib/cx';
import { toPathData, type Point } from './engine/geometry';
import { referenceStrokes } from './engine/refStrokes';
import {
  createSession,
  describeWrong,
  isComplete,
  submitStroke,
  type SessionConfig,
} from './engine/strokeSession';
import { StrokeNumbers } from './CharSvg';
import { WritingPad } from './WritingPad';
import styles from './writing.module.css';

export interface CheckResult {
  mistakes: number;
  hintsUsed: number;
}

interface StrokeCheckBoardProps {
  data: StrokeData;
  /** แสดงตัวอักษรจางให้เขียนทับ */
  guide: boolean;
  leniency: number;
  showNumbers?: boolean;
  hintAfter?: number;
  label: string;
  onComplete?: (result: CheckResult) => void;
  /** ซ่อนปุ่ม "เขียนใหม่" (เช่นในข้อสอบ) */
  hideRestart?: boolean;
  disabled?: boolean;
}

type Tone = 'neutral' | 'good' | 'bad';

/**
 * กระดานเขียนแบบตรวจทีละขีด
 * - ขีดที่ถูกจะ "จัดให้สวย" ตามต้นแบบ
 * - ขีดที่ผิดจะกะพริบสีแดงแล้วหายไป พร้อมบอกสาเหตุ
 * - ผิดซ้ำหลายครั้งจะแสดงคำใบ้ของขีดนั้นอัตโนมัติ
 * ใช้ key จากภายนอกเพื่อเริ่มใหม่เมื่อเปลี่ยนตัวอักษร
 */
export function StrokeCheckBoard({
  data,
  guide,
  leniency,
  showNumbers = true,
  hintAfter = 3,
  label,
  onComplete,
  hideRestart = false,
  disabled = false,
}: StrokeCheckBoardProps) {
  const refs = useMemo(() => referenceStrokes(data), [data]);
  const total = refs.length;
  const config: SessionConfig = useMemo(
    () => ({
      leniency: guide ? leniency : leniency * 1.4,
      compensateOffset: !guide,
      hintAfter,
    }),
    [guide, leniency, hintAfter],
  );

  const initialMessage = guide
    ? 'ลากตามเส้นจาง เริ่มจากจุดสีแดง'
    : `เขียนขีดที่ 1 จาก ${total} ขีด`;

  const [session, setSession] = useState(() => createSession(total));
  const [flash, setFlash] = useState<{ points: Point[]; n: number } | null>(null);
  /** ลายมือของขีดที่เพิ่งถูก — จางหายบนเส้นต้นแบบ */
  const [settle, setSettle] = useState<{ points: Point[]; n: number } | null>(null);
  const [hint, setHint] = useState<{ index: number; n: number } | null>(null);
  const [manualHints, setManualHints] = useState(0);
  const [message, setMessage] = useState<{ tone: Tone; text: string }>({
    tone: 'neutral',
    text: initialMessage,
  });

  const complete = isComplete(session);
  const { x: ox, y: oy } = session.offset;
  const shift = `translate(${-ox} ${-oy})`;
  const next = refs[session.done];

  const handleStroke = (points: Point[]) => {
    if (complete || disabled) return;
    const { state, feedback } = submitStroke(session, refs, points, config);
    setSession(state);

    if (feedback.kind === 'correct') {
      setFlash(null);
      setHint(null);
      setSettle((s) => ({ points, n: (s?.n ?? 0) + 1 }));
      if (isComplete(state)) {
        const hintsUsed = state.hintsUsed + manualHints;
        setMessage({
          tone: 'good',
          text:
            state.mistakes === 0
              ? 'เยี่ยมมาก! เขียนถูกทุกขีด 🎉'
              : `เขียนครบแล้ว (ผิด ${state.mistakes} ครั้ง)`,
        });
        onComplete?.({ mistakes: state.mistakes, hintsUsed });
      } else {
        setMessage({ tone: 'good', text: `ถูกต้อง! ต่อไปขีดที่ ${state.done + 1}` });
      }
      return;
    }

    setFlash((f) => ({ points, n: (f?.n ?? 0) + 1 }));
    setMessage({ tone: 'bad', text: describeWrong(feedback.reason, feedback.matchedIndex) });
    if (feedback.showHint) setHint((h) => ({ index: feedback.index, n: (h?.n ?? 0) + 1 }));
  };

  const showHint = () => {
    setManualHints((n) => n + 1);
    setHint((h) => ({ index: session.done, n: (h?.n ?? 0) + 1 }));
    setMessage({ tone: 'neutral', text: `ดูเส้นสีแดง แล้วเขียนขีดที่ ${session.done + 1} ตาม` });
  };

  const restart = () => {
    setSession(createSession(total));
    setFlash(null);
    setSettle(null);
    setHint(null);
    setManualHints(0);
    setMessage({ tone: 'neutral', text: initialMessage });
  };

  return (
    <div className={styles.board}>
      <WritingPad onStroke={handleStroke} disabled={disabled || complete} label={label}>
        {guide && (
          <g className={styles.ghost}>
            {data.strokes.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </g>
        )}
        {guide && showNumbers && <StrokeNumbers data={data} />}

        <g transform={shift}>
          {/* ขีดที่ผ่านแล้ว: ขีดใหม่แวบเป็นสีเขียว / เขียนครบแล้วไล่สีเขียวทีละขีดตามลำดับ */}
          <g className={cx(styles.ink, styles.inkMatch, complete && styles.celebrate)}>
            {data.strokes.slice(0, session.done).map((d, i) => (
              <path
                key={i}
                d={d}
                className={complete ? undefined : styles.accept}
                style={complete ? { animationDelay: `${i * 70}ms` } : undefined}
              />
            ))}
          </g>
          {hint && !complete && (
            <path
              key={`hint-${hint.n}`}
              d={data.strokes[hint.index]}
              pathLength={1}
              className={styles.hint}
            />
          )}
        </g>

        {guide && next && !complete && (
          // key: เริ่มกะพริบใหม่ทุกครั้งที่ขึ้นขีดถัดไป
          <circle
            key={session.done}
            className={styles.startDot}
            cx={next[0]!.x}
            cy={next[0]!.y}
            r={2.6}
          />
        )}

        {settle && (
          <path key={`settle-${settle.n}`} d={toPathData(settle.points)} className={styles.settleOut} />
        )}

        {flash && (
          <path key={`flash-${flash.n}`} d={toPathData(flash.points)} className={styles.flashBad} />
        )}
      </WritingPad>

      <div
        className={cx(
          'notice',
          styles.status,
          message.tone === 'good' && 'notice-good',
          message.tone === 'bad' && 'notice-bad',
        )}
        role="status"
        aria-live="polite"
      >
        {message.text}
      </div>

      <div className={styles.controls}>
        {!complete && (
          <button type="button" className="btn" onClick={showHint} disabled={disabled}>
            <Lightbulb size={18} aria-hidden /> ใบ้ขีดนี้
          </button>
        )}
        {!hideRestart && (
          <button
            type="button"
            className={cx('btn', complete && 'btn-primary')}
            onClick={restart}
          >
            <RotateCcw size={18} aria-hidden /> เขียนใหม่
          </button>
        )}
        <span className="small muted" aria-live="off">
          ขีดที่ {Math.min(session.done + 1, total)} / {total}
        </span>
      </div>
    </div>
  );
}
