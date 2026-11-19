import { ArrowLeft, ArrowRight, BookOpen, ListChecks, PenLine } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { cx } from '../../lib/cx';
import styles from './LessonPage.module.css';

/**
 * ส่วนประกอบของหน้าบทเรียนในสาย (ใช้ทั้งบทคำศัพท์และบทคันจิ):
 * หัวบท (เลขสถานี) · แถบขั้นตอน เรียน → ฝึก → ทดสอบ · กล่องเริ่ม · ผลสอบพร้อมตราสถานี · ปุ่มบทก่อน/ถัดไป
 */

export type LessonStep = 'learn' | 'practice' | 'test';

const STEPS: { id: LessonStep; label: string; icon: typeof BookOpen }[] = [
  { id: 'learn', label: 'เรียน', icon: BookOpen },
  { id: 'practice', label: 'ฝึก', icon: PenLine },
  { id: 'test', label: 'ทดสอบ', icon: ListChecks },
];

export function LessonHeader({
  letter,
  code,
  name,
  title,
  meta,
}: {
  letter: string;
  code: string;
  name: string;
  title: string;
  meta: ReactNode;
}) {
  return (
    <header className={styles.head}>
      <span className={styles.code} aria-hidden>
        <small>{letter}</small>
        {code.slice(letter.length)}
      </span>
      <div className={styles.headText}>
        <p className={cx('kana', styles.nameJa)} lang="ja">
          {name}
        </p>
        <h1 className={styles.h1}>{title}</h1>
        <p className={styles.muted}>{meta}</p>
      </div>
    </header>
  );
}

export function LessonSteps({ step, onStep }: { step: LessonStep; onStep: (s: LessonStep) => void }) {
  return (
    <nav className={styles.steps} aria-label="ขั้นตอนในบท">
      {STEPS.map(({ id, label, icon: Icon }, i) => (
        <button key={id} type="button" className={styles.step} aria-pressed={step === id} onClick={() => onStep(id)}>
          <span className={styles.stepNum} aria-hidden>
            {i + 1}
          </span>
          <Icon size={18} strokeWidth={1.8} aria-hidden />
          {label}
        </button>
      ))}
    </nav>
  );
}

export function LessonIntro({
  title,
  text,
  action,
  onStart,
}: {
  title: string;
  text: string;
  action: string;
  onStart: () => void;
}) {
  return (
    <section className={cx('card', styles.intro)}>
      <h2 className={styles.h2}>{title}</h2>
      <p className={styles.muted}>{text}</p>
      <button type="button" className="btn btn-primary" onClick={onStart}>
        {action} <ArrowRight size={18} strokeWidth={2} aria-hidden />
      </button>
    </section>
  );
}

export function PracticeDone({
  correct,
  total,
  unit,
  onTest,
  onAgain,
}: {
  correct: number;
  total: number;
  unit: string;
  onTest: () => void;
  onAgain: () => void;
}) {
  return (
    <section className={cx('card', styles.result)}>
      <p className={styles.resultBig}>ฝึกครบแล้ว!</p>
      <p className={styles.muted}>
        รอบแรกตอบถูก {correct} จาก {total} {unit}
      </p>
      <div className={styles.actions}>
        <button type="button" className="btn btn-primary" onClick={onTest}>
          ไปทดสอบ <ArrowRight size={18} strokeWidth={2} aria-hidden />
        </button>
        <button type="button" className="btn" onClick={onAgain}>
          ฝึกอีกรอบ
        </button>
      </div>
    </section>
  );
}

export interface ResultItem {
  id: string;
  correct: boolean;
  /** เนื้อหาในรายการ "ที่ตอบผิด" */
  label: ReactNode;
}

interface TestResultProps {
  code: string;
  /** ชื่อสถานี (แสดงในตรา) */
  name: string;
  items: readonly ResultItem[];
  nowPassed: boolean;
  newlyPassed: boolean;
  /** หน่วยของรายการ เช่น "คำ" / "ตัว" */
  unit: string;
  nextHref?: string;
  onRetryWrong: (ids: string[]) => void;
  onLearn: () => void;
  learnLabel: string;
}

export function LessonTestResult({
  code,
  name,
  items,
  nowPassed,
  newlyPassed,
  unit,
  nextHref,
  onRetryWrong,
  onLearn,
  learnLabel,
}: TestResultProps) {
  const wrong = items.filter((r) => !r.correct);
  const score = items.length - wrong.length;
  return (
    <section className={cx('card', styles.result)} aria-live="polite">
      {nowPassed ? (
        <div className={cx(styles.stamp, newlyPassed && styles.stampNew)} aria-hidden>
          <span className="kana" lang="ja">
            {name}
          </span>
          <small>{code}</small>
        </div>
      ) : null}
      <p className={styles.resultBig}>
        {score} / {items.length}
      </p>
      <p className={styles.muted}>
        {newlyPassed
          ? `ได้ตราสถานี ${code} แล้ว! ${unit}ในบทนี้จะถูกนัดทบทวนตามรอบ`
          : nowPassed
            ? 'บทนี้ผ่านแล้ว — ทบทวนได้เรื่อยๆ'
            : `ตอบถูกครบทุก${unit} (สอบซ้ำเฉพาะ${unit}ที่ผิดได้) จึงจะได้ตราสถานี`}
      </p>
      {wrong.length > 0 && (
        <ul className={styles.wrongList} aria-label={`${unit}ที่ตอบผิด`}>
          {wrong.map((r) => (
            <li key={r.id}>{r.label}</li>
          ))}
        </ul>
      )}
      <div className={styles.actions}>
        {wrong.length > 0 && (
          <button type="button" className="btn btn-primary" onClick={() => onRetryWrong(wrong.map((r) => r.id))}>
            สอบซ้ำเฉพาะ{unit}ที่ผิด ({wrong.length})
          </button>
        )}
        {nowPassed && nextHref && (
          <Link to={nextHref} className={cx('btn', wrong.length === 0 && 'btn-primary')}>
            บทถัดไป <ArrowRight size={18} strokeWidth={2} aria-hidden />
          </Link>
        )}
        <button type="button" className="btn" onClick={onLearn}>
          {learnLabel}
        </button>
      </div>
    </section>
  );
}

export function LessonNav({
  prev,
  next,
  lineHref,
}: {
  prev?: { href: string; title: string };
  next?: { href: string; title: string };
  lineHref: string;
}) {
  return (
    <nav className={styles.lessonNav} aria-label="บทอื่น">
      {prev ? (
        <Link to={prev.href} className="btn btn-ghost">
          <ArrowLeft size={18} strokeWidth={1.8} aria-hidden /> {prev.title}
        </Link>
      ) : (
        <span />
      )}
      <Link to={lineHref} className="btn btn-ghost">
        แผนที่สาย
      </Link>
      {next ? (
        <Link to={next.href} className="btn btn-ghost">
          {next.title} <ArrowRight size={18} strokeWidth={1.8} aria-hidden />
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
