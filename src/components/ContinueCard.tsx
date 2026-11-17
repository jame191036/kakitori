import { useMemo } from 'react';
import { Link } from 'react-router';
import { REVIEW_ROOT } from '../app/paths';
import { groupLabel } from '../data/scripts';
import type { ScriptPack } from '../data/types';
import { buildPath, charState, nextStep, rowNeeds, stepHref } from '../features/progress/learningPath';
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
        <p className={styles.eyebrow}>
          <span className="kana">終点</span> · ผ่านครบทุกสถานีแล้ว
        </p>
        <p>เยี่ยมมาก ฝึกทบทวนต่อเรื่อยๆ เพื่อไม่ให้ลืม</p>
        <div>
          <Link to={REVIEW_ROOT} className="btn btn-primary">
            ไปหน้าทบทวน
          </Link>
        </div>
      </section>
    );
  }

  const progress = data.scripts[step.pack.id];
  const { status } = step;
  const needs = rowNeeds(step.group.kind);
  const isStart = step.index === 1 && status.kind === 'write' && status.remaining === step.chars.length;
  const STATE_TITLE = {
    done: 'ผ่านแล้ว',
    written: 'เขียนแล้ว ยังไม่เคยตอบถูก',
    todo: needs.write ? 'ยังไม่ได้เขียน' : 'ยังไม่เคยตอบถูก',
  } as const;

  return (
    <section className={cx('card', styles.card)} aria-labelledby="continue-title">
      <div className={styles.head}>
        <div>
          <p className={styles.eyebrow}>
            <span className="kana">{isStart ? '始発' : '次は'}</span> · {isStart ? 'เริ่มเรียน' : 'สถานีต่อไป'}
          </p>
          <h2 id="continue-title" className={styles.title}>
            {step.pack.name}{' '}
            {step.group.kind === 'small' ? (
              groupLabel(step.group)
            ) : (
              <>
                แถว <span className="kana">{step.group.head}</span>
              </>
            )}
          </h2>
          <p className="small muted">
            ระดับ {step.level} · ขั้นที่ {step.index} จาก {step.total} · ผ่านแล้ว {step.doneCount} แถว
          </p>
        </div>
        <div className={styles.row} aria-label="สถานะตัวอักษรในแถวนี้">
          {step.chars.map((c) => {
            const state = charState(progress?.[c.id], needs);
            return (
              <span
                key={c.id}
                className={cx('kana', styles.char, styles[state], c.parts && styles.wide)}
                title={STATE_TITLE[state]}
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
            ? needs.correct
              ? `ขั้นแรก: ฝึกเขียนให้ครบทุกตัวในแถว (เหลือ ${status.remaining} ตัว)`
              : `ฝึกเขียนตัวเล็กให้ครบทุกตัว (เหลือ ${status.remaining} ตัว)`
            : needs.write
              ? `เขียนครบแล้ว! ต่อไปทำแบบทดสอบแถวนี้ให้ตอบถูกครบทุกตัว (เหลือ ${status.remaining} ตัว)`
              : `ตัวควบฝึกอ่านและฟัง: ทำแบบทดสอบแถวนี้ให้ตอบถูกครบทุกตัว (เหลือ ${status.remaining} ตัว)`}
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
