import { useMemo } from 'react';
import { Link } from 'react-router';
import type { ScriptPack } from '../data/types';
import { buildPath, nextStep, stepHref } from '../features/progress/learningPath';
import { progressStore } from '../features/progress/progressStore';
import { useStore } from '../lib/persistentStore';
import { cx } from '../lib/cx';
import styles from './ContinueCard.module.css';

interface ContinueCardProps {
  /** ชุดตัวอักษรที่อยู่ในเส้นทาง (ตามลำดับ) */
  packs: readonly ScriptPack[];
}

/** การ์ด "เรียนต่อ": บอกว่าตอนนี้อยู่แถวไหน ต้องทำอะไรต่อ และพาไปทำทันที */
export function ContinueCard({ packs }: ContinueCardProps) {
  const data = useStore(progressStore);
  const path = useMemo(() => buildPath(packs), [packs]);
  const step = nextStep(path, data);

  if (!step) {
    return (
      <section className={cx('card', styles.card)}>
        <p className={styles.eyebrow}>ผ่านครบทุกแถวแล้ว</p>
        <p>เยี่ยมมาก ฝึกทบทวนต่อเรื่อยๆ เพื่อไม่ให้ลืม</p>
        <div>
          <Link to={`/${packs[0]!.id}/review`} className="btn btn-primary">
            ไปหน้าทบทวน
          </Link>
        </div>
      </section>
    );
  }

  const progress = data.scripts[step.pack.id];
  const { status } = step;
  const isStart = step.index === 1 && status.kind === 'write' && status.remaining === step.chars.length;

  return (
    <section className={cx('card', styles.card)} aria-labelledby="continue-title">
      <div className={styles.head}>
        <div>
          <p className={styles.eyebrow}>{isStart ? 'เริ่มเรียน' : 'เรียนต่อ'}</p>
          <h2 id="continue-title" className={styles.title}>
            {step.pack.name} แถว <span className="kana">{step.group.head}</span>
          </h2>
          <p className="small muted">
            ขั้นที่ {step.index} จาก {step.total} · ผ่านแล้ว {step.doneCount} แถว
          </p>
        </div>
        <div className={styles.row} aria-label="สถานะตัวอักษรในแถวนี้">
          {step.chars.map((c) => {
            const s = progress?.[c.id];
            const state = s?.practiced && s.correct ? 'done' : s?.practiced ? 'written' : 'todo';
            return (
              <span
                key={c.id}
                className={cx('kana', styles.char, styles[state])}
                title={state === 'done' ? 'ผ่านแล้ว' : state === 'written' ? 'เขียนแล้ว ยังไม่เคยตอบถูก' : 'ยังไม่ได้เขียน'}
              >
                {c.char}
              </span>
            );
          })}
        </div>
      </div>

      <div className={styles.bar} aria-hidden>
        <span style={{ width: `${(step.doneCount / step.total) * 100}%` }} />
      </div>

      <div className={styles.foot}>
        <p className="small">
          {status.kind === 'write'
            ? `ขั้นแรก: ฝึกเขียนให้ครบทุกตัวในแถว (เหลือ ${status.remaining} ตัว)`
            : `เขียนครบแล้ว! ต่อไปทำแบบทดสอบแถวนี้ให้ตอบถูกครบทุกตัว (เหลือ ${status.remaining} ตัว)`}
        </p>
        <Link to={stepHref(step)} className="btn btn-primary">
          {status.kind === 'write' ? (
            <>
              ฝึกเขียน <span className="kana">{status.next.char}</span>
            </>
          ) : (
            <>
              ทดสอบแถว <span className="kana">{step.group.head}</span>
            </>
          )}
        </Link>
      </div>
    </section>
  );
}
