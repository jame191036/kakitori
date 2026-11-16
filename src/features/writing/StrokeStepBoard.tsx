import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
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
import type { CheckResult } from './StrokeCheckBoard';
import { WritingPad } from './WritingPad';
import w from './writing.module.css';
import s from './StrokeStepBoard.module.css';

/** ทิศของขีด จากจุดเริ่มไปจุดจบ (ถูกต้องแม้เป็นเส้นโค้ง เพราะบอกแค่ต้น-ปลาย) */
function directionOf(pts: readonly Point[]): { arrow: string; label: string } {
  const a = pts[0]!;
  const b = pts[pts.length - 1]!;
  const deg = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
  const octant = Math.round(deg / 45);
  const table: Record<number, { arrow: string; label: string }> = {
    0: { arrow: '→', label: 'จากซ้ายไปขวา' },
    1: { arrow: '↘', label: 'จากบนซ้ายลงไปล่างขวา' },
    2: { arrow: '↓', label: 'จากบนลงล่าง' },
    3: { arrow: '↙', label: 'จากบนขวาลงไปล่างซ้าย' },
    4: { arrow: '←', label: 'จากขวาไปซ้าย' },
    [-4]: { arrow: '←', label: 'จากขวาไปซ้าย' },
    [-3]: { arrow: '↖', label: 'จากล่างขวาขึ้นไปบนซ้าย' },
    [-2]: { arrow: '↑', label: 'จากล่างขึ้นบน' },
    [-1]: { arrow: '↗', label: 'จากล่างซ้ายขึ้นไปบนขวา' },
  };
  return table[octant] ?? table[0]!;
}

type StepState = 'done' | 'now' | 'todo';

interface StepListProps {
  data: StrokeData;
  refs: readonly (readonly Point[])[];
  /** ไม่ส่ง = รายการเฉยๆ (โหมดดูลำดับขีด) */
  states?: readonly StepState[];
  misses?: readonly number[];
  /** ซ่อนรูปขีดที่ยังไม่ได้เขียน (โหมดไม่มีเส้นนำ — เขียนจากความจำ) */
  hideUpcoming?: boolean;
  /** ข้อความผิดของขีดปัจจุบัน */
  message?: { text: string; n: number } | null;
}

/** รายการลำดับขีด: ภาพย่อ + ทิศ + สถานะ + เหตุที่ผิด (ใช้ทั้งตอนดูลำดับขีดและตอนเขียน) */
export function StrokeStepList({ data, refs, states, misses, hideUpcoming = false, message }: StepListProps) {
  return (
    <ol className={s.steps}>
      {refs.map((pts, i) => {
        const state = states?.[i] ?? 'todo';
        const hidden = hideUpcoming && state !== 'done';
        const dir = directionOf(pts);
        return (
          <li
            key={i}
            className={cx(s.step, states && s[state])}
            aria-current={state === 'now' ? 'step' : undefined}
          >
            <svg viewBox="0 0 109 109" className={s.thumb} aria-hidden>
              {hidden ? (
                <text x={54.5} y={54.5} className={s.thumbNum}>
                  {i + 1}
                </text>
              ) : (
                <>
                  {data.strokes.map((d, j) => (
                    <path key={j} d={d} className={j === i ? s.thumbOn : s.thumbOff} />
                  ))}
                  <circle cx={pts[0]!.x} cy={pts[0]!.y} r={6.5} className={s.thumbStart} />
                </>
              )}
            </svg>
            <span className={s.stepText}>
              <span className={s.stepTitle}>
                ขีดที่ {i + 1}
                {state === 'done' && (
                  <span className={s.check} aria-label="ผ่านแล้ว">
                    ✓
                  </span>
                )}
              </span>
              {!hidden && (
                <span className={s.stepDir}>
                  <span aria-hidden>{dir.arrow}</span> {dir.label}
                </span>
              )}
              {state === 'now' && message && (
                <span key={message.n} className={s.stepMsg}>
                  {message.text}
                </span>
              )}
              {state === 'done' && (misses?.[i] ?? 0) > 0 && (
                <span className={s.stepMeta}>ผิด {misses![i]} ครั้ง</span>
              )}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

interface StrokeStepBoardProps {
  data: StrokeData;
  /** มีเส้นนำ (เขียนทับ) / ไม่มี (ตรวจทีละขีดจากความจำ) */
  guide: boolean;
  leniency: number;
  showNumbers?: boolean;
  hintAfter?: number;
  label: string;
  onComplete?: (result: CheckResult) => void;
  /** ปุ่มไปต่อในสรุป เช่น "ตัวถัดไป" / "ทดสอบแถว" */
  completeActions?: ReactNode;
}

type Tone = 'neutral' | 'good' | 'bad';

/**
 * กระดานฝึกแบบ "สตูดิโอ": กระดานเขียน + แผงลำดับขีด
 * - แผงบอกทุกขีด: รูปย่อ ทิศทาง สถานะ และเหตุที่ผิดอยู่ในแถวของขีดนั้น
 * - เขียนครบ: สรุปความแม่นยำเป็น % (ถูกตั้งแต่ครั้งแรกกี่ขีด) + ตราประทับเมื่อไม่ผิดเลย
 * ใช้ key จากภายนอกเพื่อเริ่มใหม่เมื่อเปลี่ยนตัวอักษร
 */
export function StrokeStepBoard({
  data,
  guide,
  leniency,
  showNumbers = true,
  hintAfter = 3,
  label,
  onComplete,
  completeActions,
}: StrokeStepBoardProps) {
  const refs = useMemo(() => referenceStrokes(data), [data]);
  const total = refs.length;
  const config: SessionConfig = useMemo(
    () => ({ leniency: guide ? leniency : leniency * 1.4, compensateOffset: !guide, hintAfter }),
    [guide, leniency, hintAfter],
  );
  const initialMessage = guide ? 'ลากตามเส้นจาง เริ่มที่วงกลมเลข 1' : `เขียนขีดที่ 1 จาก ${total} ขีด`;

  const [session, setSession] = useState(() => createSession(total));
  const [misses, setMisses] = useState<number[]>(() => refs.map(() => 0));
  const [flash, setFlash] = useState<{ points: Point[]; n: number } | null>(null);
  const [settle, setSettle] = useState<{ points: Point[]; n: number } | null>(null);
  const [hint, setHint] = useState<{ index: number; n: number } | null>(null);
  const [manualHints, setManualHints] = useState(0);
  const [message, setMessage] = useState<{ tone: Tone; text: string; n: number }>({
    tone: 'neutral',
    text: initialMessage,
    n: 0,
  });

  const complete = isComplete(session);
  const perfect = complete && session.mistakes === 0 && session.hintsUsed + manualHints === 0;
  const firstTry = misses.filter((m) => m === 0).length;
  const accuracy = Math.round((firstTry / total) * 100);
  const shift = `translate(${-session.offset.x} ${-session.offset.y})`;
  const current = refs[session.done];

  // เขียนครบ: เลื่อนสรุปเข้าจอ (มือถือ สรุปอยู่ใต้กระดาน) — ถ้าเห็นอยู่แล้วจะไม่เลื่อน
  const summaryRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!complete) return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    summaryRef.current?.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
  }, [complete]);

  const handleStroke = (points: Point[]) => {
    if (complete) return;
    const { state, feedback } = submitStroke(session, refs, points, config);
    setSession(state);
    const n = message.n + 1;

    if (feedback.kind === 'correct') {
      setFlash(null);
      setHint(null);
      setSettle((p) => ({ points, n: (p?.n ?? 0) + 1 }));
      if (isComplete(state)) {
        setMessage({
          tone: 'good',
          text: state.mistakes === 0 ? 'เขียนถูกทุกขีด' : `เขียนครบแล้ว (ผิด ${state.mistakes} ครั้ง)`,
          n,
        });
        onComplete?.({ mistakes: state.mistakes, hintsUsed: state.hintsUsed + manualHints });
      } else {
        setMessage({ tone: 'good', text: `ถูกต้อง — ต่อไปขีดที่ ${state.done + 1}`, n });
      }
      return;
    }

    setMisses((m) => m.map((v, i) => (i === feedback.index ? v + 1 : v)));
    setFlash((p) => ({ points, n: (p?.n ?? 0) + 1 }));
    setMessage({ tone: 'bad', text: describeWrong(feedback.reason, feedback.matchedIndex), n });
    if (feedback.showHint) setHint((h) => ({ index: feedback.index, n: (h?.n ?? 0) + 1 }));
  };

  const showHint = () => {
    setManualHints((v) => v + 1);
    setHint((h) => ({ index: session.done, n: (h?.n ?? 0) + 1 }));
    setMessage((m) => ({ tone: 'neutral', text: `ดูเส้นสีแดง แล้วเขียนขีดที่ ${session.done + 1} ตาม`, n: m.n + 1 }));
  };

  const restart = () => {
    setSession(createSession(total));
    setMisses(refs.map(() => 0));
    setFlash(null);
    setSettle(null);
    setHint(null);
    setManualHints(0);
    setMessage((m) => ({ tone: 'neutral', text: initialMessage, n: m.n + 1 }));
  };

  const states: StepState[] = refs.map((_, i) =>
    i < session.done ? 'done' : i === session.done && !complete ? 'now' : 'todo',
  );
  // ไม่มีเส้นนำ: ซ่อนรูปขีดที่ยังไม่เขียน จนกว่าจะขอคำใบ้/ผิดถึงเกณฑ์
  const hideUpcoming = !guide && !hint;

  return (
    <div className={s.wrap}>
      <section className={s.canvasCol} aria-label="พื้นที่เขียน">
        <WritingPad onStroke={handleStroke} disabled={complete} label={label}>
          {guide && (
            <g className={w.ghost}>
              {data.strokes.map((d, i) => (
                <path key={i} d={d} />
              ))}
            </g>
          )}
          {guide && showNumbers && <StrokeNumbers data={data} />}

          <g transform={shift}>
            <g className={cx(w.ink, w.inkMatch, complete && w.celebrate)}>
              {data.strokes.slice(0, session.done).map((d, i) => (
                <path
                  key={i}
                  d={d}
                  className={complete ? undefined : w.accept}
                  style={complete ? { animationDelay: `${i * 70}ms` } : undefined}
                />
              ))}
            </g>
            {hint && !complete && (
              <path key={`hint-${hint.n}`} d={data.strokes[hint.index]} pathLength={1} className={w.hint} />
            )}
          </g>

          {/* จุดเริ่ม: วงกลมชาดมีเลขขีด เข้ามาเบาๆ ทุกครั้งที่ขึ้นขีดใหม่ */}
          {guide && current && !complete && (
            <g key={session.done} className={s.startMark} aria-hidden>
              <circle cx={current[0]!.x} cy={current[0]!.y} r={4.2} />
              <text x={current[0]!.x} y={current[0]!.y}>
                {session.done + 1}
              </text>
            </g>
          )}

          {perfect && (
            <g className={w.stamp} transform="translate(91 19) rotate(-12)" lang="ja" aria-hidden>
              <g className={w.stampInner}>
                <circle r={15} className={w.ringOuter} />
                <circle r={12.6} className={w.ringInner} />
                <text y={-6}>よく</text>
                <text y={0.2}>でき</text>
                <text y={6.4}>ました</text>
              </g>
            </g>
          )}

          {settle && <path key={`settle-${settle.n}`} d={toPathData(settle.points)} className={w.settleOut} />}
          {flash && <path key={`flash-${flash.n}`} d={toPathData(flash.points)} className={w.flashBad} />}
        </WritingPad>

        {/* ความคืบหน้าแบ่งช่องตามจำนวนขีด */}
        <div className={s.progress} aria-label={`เขียนแล้ว ${session.done} จาก ${total} ขีด`}>
          {refs.map((_, i) => (
            <span key={i} className={cx(states[i] === 'done' && s.segDone, states[i] === 'now' && s.segNow)} />
          ))}
        </div>

        <div className={s.foot}>
          <span className={s.counter}>
            ขีด {Math.min(session.done + 1, total)}
            <span className="muted"> / {total}</span>
          </span>
          {/* มือถือ: ข้อความอยู่ใต้กระดาน (จอกว้างอยู่ในแถวของขีดในแผงขวา) */}
          <span
            className={cx(s.footMsg, message.tone === 'good' && s.toneGood, message.tone === 'bad' && s.toneBad)}
            role="status"
            aria-live="polite"
          >
            {message.text}
          </span>
          <span className={s.footBtns}>
            {!complete && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={showHint}>
                ใบ้
              </button>
            )}
            <button type="button" className="btn btn-ghost btn-sm" onClick={restart}>
              เริ่มใหม่
            </button>
          </span>
        </div>
      </section>

      <aside className={s.panel} aria-label="ลำดับขีด">
        {complete && (
          <div className={s.summary} ref={summaryRef}>
            <p className={s.panelLabel}>สรุป</p>
            <p className={s.bigStat}>
              {accuracy}
              <span>%</span>
            </p>
            <p className="small muted">
              ถูกตั้งแต่ครั้งแรก {firstTry} จาก {total} ขีด
              {session.mistakes > 0 && ` · ผิดรวม ${session.mistakes} ครั้ง`}
            </p>
            <div className={s.summaryBtns}>
              {completeActions}
              <button type="button" className={cx('btn btn-sm', !completeActions && 'btn-primary')} onClick={restart}>
                เขียนอีกครั้ง
              </button>
            </div>
          </div>
        )}
        <p className={s.panelLabel}>ลำดับขีด</p>
        <StrokeStepList
          data={data}
          refs={refs}
          states={states}
          misses={misses}
          hideUpcoming={hideUpcoming}
          message={message.tone === 'bad' ? message : null}
        />
      </aside>
    </div>
  );
}
