import { ChevronLeft, ChevronRight, ListOrdered, Pause, Play, RotateCcw } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { StrokeData } from '../../data/types';
import { cx } from '../../lib/cx';
import { ANIMATION_SPEEDS, updateSettings } from '../settings/settings';
import { strokeLengths } from './engine/refStrokes';
import { GridGuides, StrokeNumbers, VIEWBOX } from './CharSvg';
import styles from './writing.module.css';

interface StrokeAnimatorProps {
  data: StrokeData;
  speed: number;
  showNumbers: boolean;
  label: string;
  /** แสดงปุ่มปรับความเร็ว */
  speedControl?: boolean;
  /** false = ไม่มีปุ่มควบคุม (แตะที่ภาพเพื่อเล่นซ้ำ) */
  controls?: boolean;
}

/**
 * แอนิเมชันลำดับขีด — เล่นต่อเนื่อง หรือกดดูทีละขีด
 * ใช้ key={char} จากภายนอกเพื่อเริ่มใหม่เมื่อเปลี่ยนตัวอักษร
 */
export function StrokeAnimator({
  data,
  speed,
  showNumbers,
  label,
  speedControl = true,
  controls = true,
}: StrokeAnimatorProps) {
  const total = data.strokes.length;
  // เวลาเริ่ม/ความยาวของแต่ละขีด: ขีดยาวใช้เวลานานกว่า และเว้นช่วงสั้นๆ ระหว่างขีด
  const timeline = useMemo(() => {
    const out: { delay: number; duration: number }[] = [];
    for (const len of strokeLengths(data)) {
      const prev = out[out.length - 1];
      out.push({
        delay: prev ? prev.delay + prev.duration + 250 / speed : 0,
        duration: (300 + len * 9) / speed,
      });
    }
    return out;
  }, [data, speed]);

  const [mode, setMode] = useState<'play' | 'step'>('play');
  const [runKey, setRunKey] = useState(0);
  const [paused, setPaused] = useState(false);
  const [finished, setFinished] = useState(false);
  const [step, setStep] = useState(1);

  const replay = () => {
    setMode('play');
    setPaused(false);
    setFinished(false);
    setRunKey((k) => k + 1);
  };

  const startStep = () => {
    setMode('step');
    setStep(1);
  };

  return (
    <div className={styles.board}>
      <svg
        viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
        className={cx(styles.svg, styles.surface, paused && styles.paused)}
        role="img"
        aria-label={label}
        onClick={controls ? undefined : replay}
        style={controls ? undefined : { cursor: 'pointer' }}
      >
        <GridGuides />
        <g className={styles.ghost}>
          {data.strokes.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>

        {mode === 'play' ? (
          <g key={runKey}>
            <g className={styles.ink}>
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
                  onAnimationEnd={i === total - 1 ? () => setFinished(true) : undefined}
                />
              ))}
            </g>
            {showNumbers && (
              <g>
                {data.numbers.map(([x, y], i) => (
                  <text
                    key={i}
                    x={x}
                    y={y}
                    className={cx(styles.num, styles.fadeIn)}
                    style={{ animationDelay: `${timeline[i]!.delay}ms` }}
                  >
                    {i + 1}
                  </text>
                ))}
              </g>
            )}
          </g>
        ) : (
          <g>
            <g className={styles.ink}>
              {data.strokes.slice(0, step - 1).map((d, i) => (
                <path key={i} d={d} />
              ))}
              <path
                key={`step-${step}`}
                d={data.strokes[step - 1]}
                pathLength={1}
                className={cx(styles.draw, styles.current)}
                style={{ animationDuration: `${timeline[step - 1]!.duration}ms` }}
              />
            </g>
            {showNumbers && <StrokeNumbers data={data} upTo={step} current={step - 1} />}
          </g>
        )}
      </svg>

      {!controls ? null : mode === 'play' ? (
        <div className={styles.controls}>
          {finished ? (
            <button type="button" className="btn btn-primary" onClick={replay}>
              <RotateCcw size={18} aria-hidden /> เล่นซ้ำ
            </button>
          ) : (
            <button type="button" className="btn" onClick={() => setPaused((p) => !p)}>
              {paused ? <Play size={18} aria-hidden /> : <Pause size={18} aria-hidden />}
              {paused ? 'เล่นต่อ' : 'หยุด'}
            </button>
          )}
          <button type="button" className="btn" onClick={startStep}>
            <ListOrdered size={18} aria-hidden /> ดูทีละขีด
          </button>
        </div>
      ) : (
        <div className={styles.controls}>
          <button
            type="button"
            className="btn btn-icon"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step <= 1}
            aria-label="ขีดก่อนหน้า"
          >
            <ChevronLeft size={20} aria-hidden />
          </button>
          <span className={styles.stepLabel} aria-live="polite">
            ขีดที่ {step} / {total}
          </span>
          <button
            type="button"
            className="btn btn-icon"
            onClick={() => setStep((s) => Math.min(total, s + 1))}
            disabled={step >= total}
            aria-label="ขีดถัดไป"
          >
            <ChevronRight size={20} aria-hidden />
          </button>
          <button type="button" className="btn" onClick={replay}>
            <Play size={18} aria-hidden /> เล่นทั้งหมด
          </button>
        </div>
      )}

      {controls && speedControl && (
        <div className={styles.controls}>
          <span className="small muted">ความเร็ว</span>
          <div className="segmented" role="group" aria-label="ความเร็วแอนิเมชัน">
            {ANIMATION_SPEEDS.map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={s === speed}
                onClick={() => {
                  updateSettings({ animationSpeed: s });
                  if (mode === 'play') replay();
                }}
              >
                {s}×
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
