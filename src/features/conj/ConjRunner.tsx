import { Check, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { SpeakButton } from '../../components/SpeakButton';
import { conjugate, stepsTo, viaForm } from '../../data/conj/conjugate';
import { FORM_INFO, type ConjRule } from '../../data/conj/types';
import { cx } from '../../lib/cx';
import quiz from '../quiz/quiz.module.css';
import { ConjBuild } from './ConjBuild';
import { ruleFor, type ConjChoice, type ConjQuestion } from './conjLogic';
import { FormText, WordFace } from './ConjText';
import styles from './conj.module.css';

export interface ConjResult {
  rule: ConjRule;
  /** แบบทดสอบ/ทบทวน = ถูกทุกข้อของกฎนี้ · แบบฝึก = ผลครั้งแรก */
  correct: boolean;
}

interface ConjRunnerProps {
  questions: readonly ConjQuestion[];
  /** practice = ตอบผิดได้ลองอีกรอบท้ายชุด · test = ข้อละครั้ง · free = ฝึกอิสระ (จบรอบได้ทุกเมื่อ) */
  mode: 'practice' | 'test' | 'free';
  /** เรียกทุกข้อที่ตอบ */
  onAnswer?: (q: ConjQuestion, correct: boolean) => void;
  /** รู้ผลของกฎแล้ว (กฎละครั้งเดียว): แบบทดสอบ = ตอบครบทุกข้อของกฎ · แบบฝึก = ตอบข้อแรกของกฎ */
  onRule?: (rule: ConjRule, correct: boolean) => void;
  onFinish: (results: ConjResult[]) => void;
  onQuit: () => void;
  /** ฝึกแบบไม่จำกัด: ขอข้อเพิ่มเมื่อหมดชุด */
  onMore?: () => ConjQuestion[];
}

function heading(q: ConjQuestion): string {
  if (q.type === 'group') return 'คำนี้อยู่กลุ่มไหน';
  if (q.type === 'pick') return 'เลือกคำที่อยู่ในกลุ่มนี้';
  if (q.type === 'back') return 'มาจากคำไหน (เลือกรูปพจนานุกรม)';
  if (q.type === 'rebuild') return 'เรียงตัวอักษรเป็นรูปพจนานุกรม';
  if (q.type === 'build') return 'เรียงตัวอักษรเป็นรูปที่ถาม';
  return 'เลือกรูปที่ผันถูก';
}

function ChoiceLabel({ q, choice }: { q: ConjQuestion; choice: ConjChoice }) {
  if (choice.word) return <WordFace word={choice.word} size="md" />;
  if (q.type === 'group') return <span className={styles.choiceGroup}>กลุ่ม {choice.key}</span>;
  return <FormText prefix={q.word.prefix} text={choice.key} className={styles.choiceForm} />;
}

/** ตัวทำแบบฝึก/แบบทดสอบ/ฝึกอิสระของสายผันคำ (หน้าตาเดียวกับสายอื่น) */
export function ConjRunner({ questions, mode, onAnswer, onRule, onFinish, onQuit, onMore }: ConjRunnerProps) {
  const [queue, setQueue] = useState<ConjQuestion[]>(() => [...questions]);
  const [index, setIndex] = useState(0);
  const [answered, setAnswered] = useState<{ correct: boolean; chosen?: string } | null>(null);
  const [tally, setTally] = useState({ done: 0, right: 0 });
  const results = useRef(new Map<string, ConjResult>());
  const pending = useRef(new Map<string, { asked: number; correct: boolean }>());
  const retried = useRef(new Set<string>());
  const q = queue[index]!;
  const endless = !!onMore;
  const isLast = !endless && index === queue.length - 1;

  const finish = useCallback(() => onFinish([...results.current.values()]), [onFinish]);

  const goNext = useCallback(() => {
    if (isLast) {
      finish();
      return;
    }
    if (onMore && index === queue.length - 1) {
      const more = onMore();
      setQueue((list) => [...list, ...more]);
    }
    setIndex((i) => i + 1);
    setAnswered(null);
  }, [isLast, finish, onMore, index, queue.length]);

  const answer = (correct: boolean, chosen?: string) => {
    if (answered) return;
    setAnswered({ correct, chosen });
    setTally((t) => ({ done: t.done + 1, right: t.right + (correct ? 1 : 0) }));
    onAnswer?.(q, correct);
    // แบบทดสอบ: กฎหนึ่งมีหลายข้อ ต้องถูกครบ (รู้ผลเมื่อตอบครบ) · แบบฝึก: นับข้อแรกของกฎ
    const prev = pending.current.get(q.rule.id) ?? { asked: 0, correct: true };
    const now = { asked: prev.asked + 1, correct: prev.correct && correct };
    pending.current.set(q.rule.id, now);
    const need = mode === 'test' ? questions.filter((x) => x.rule.id === q.rule.id).length : 1;
    if (now.asked === need) {
      results.current.set(q.rule.id, { rule: q.rule, correct: now.correct });
      onRule?.(q.rule, now.correct);
    }
    // แบบฝึก: ข้อที่ผิดได้ลองอีกครั้งท้ายชุด — ข้อละครั้งเดียว
    if (!correct && mode === 'practice' && !retried.current.has(q.id)) {
      retried.current.add(q.id);
      setQueue((list) => [...list, { ...q, id: `${q.id}:again` }]);
    }
  };

  // ตอบถูก: ไปข้อถัดไปเองหลังเห็นเฉลยแป๊บหนึ่ง
  useEffect(() => {
    if (!answered?.correct) return;
    const t = window.setTimeout(goNext, 1300);
    return () => window.clearTimeout(t);
  }, [answered, goNext]);

  const choose = (key: string) => answer(key === q.answer, key);
  const done = index + (answered ? 1 : 0);

  // คีย์ลัด: 1–4 เลือกคำตอบ · Enter ข้อถัดไป
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (answered && e.key === 'Enter') {
        // ปุ่มที่โฟกัสอยู่จัดการเอง (กันข้ามสองข้อ)
        if (e.target instanceof HTMLButtonElement) return;
        goNext();
        return;
      }
      const n = Number(e.key);
      if (!answered && n >= 1 && n <= q.choices.length) choose(q.choices[n - 1]!.key);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const formKana = q.form ? conjugate(q.word, q.form) : null;
  // เหตุผลเวลาตอบผิด: กฎของรูปกลาง (ます / て) ก่อน แล้วจึงกฎของรูปที่ถาม
  const via = q.form && !q.rule.reverse ? viaForm(q.form) : null;
  const why = q.rule.reverse
    ? [q.rule.title]
    : [...(via ? [ruleFor(q.word, via)] : []), ruleFor(q.word, q.form) ?? q.rule].flatMap((r) => (r ? [r.title] : []));
  // เฉลย: คำเดิม → รูปที่ผัน · กฎย้อนกลับ: รูปที่ผัน → คำเดิม
  const solution = !q.form ? [q.word.kana] : q.rule.reverse ? [formKana!, q.word.kana] : stepsTo(q.word, q.form);

  return (
    <div className={quiz.runner}>
      <div className={quiz.progressRow}>
        {mode === 'free' && tally.done > 0 ? (
          <button type="button" className="btn btn-sm" onClick={finish}>
            <Check size={16} aria-hidden /> จบรอบ
          </button>
        ) : (
          <button type="button" className="btn btn-ghost btn-sm" onClick={onQuit}>
            <X size={16} aria-hidden /> ออก
          </button>
        )}
        {endless ? (
          <span className={styles.endless}>ไม่จำกัดข้อ</span>
        ) : (
          <div
            className={quiz.progress}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={queue.length}
            aria-valuenow={done}
            aria-label="ความคืบหน้า"
          >
            <span style={{ transform: `translateX(${(done / queue.length) * 100 - 100}%)` }} />
          </div>
        )}
        <span className="small muted" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {endless ? `ถูก ${tally.right}/${tally.done}` : `${Math.min(index + 1, queue.length)}/${queue.length}`}
        </span>
      </div>

      <section className={cx('card', quiz.question)} aria-live="polite">
        <p className="small muted">{heading(q)}</p>

        {q.type === 'pick' ? (
          <p className={styles.askBig}>กลุ่ม {q.word.group}</p>
        ) : q.type === 'back' ? (
          <div className={styles.prompt}>
            <FormText prefix={q.word.prefix} text={formKana!} className={styles.promptForm} />
            <span className={styles.askChip}>{FORM_INFO[q.form!].ask}</span>
          </div>
        ) : q.type === 'rebuild' ? (
          <div className={styles.prompt}>
            <FormText prefix={q.word.prefix} text={formKana!} className={styles.promptForm} />
            <p className={styles.promptThai}>{q.word.thai}</p>
            <span className={styles.askChip}>→ รูปพจนานุกรม</span>
          </div>
        ) : (
          <div className={styles.prompt}>
            <WordFace word={q.word} size="xl" />
            <p className={styles.promptThai}>{q.word.thai}</p>
            {q.form && <span className={styles.askChip}>→ {FORM_INFO[q.form].ask}</span>}
          </div>
        )}

        {q.type === 'build' || q.type === 'rebuild' ? (
          <ConjBuild key={q.id} q={q} disabled={!!answered} onAnswer={(ok) => answer(ok)} />
        ) : (
          <div className={cx(quiz.choices, q.type === 'group' && styles.choices3)}>
            {q.choices.map((c, i) => {
              const state = !answered
                ? undefined
                : c.key === q.answer
                  ? 'correct'
                  : answered.chosen === c.key
                    ? 'wrong'
                    : 'dim';
              return (
                <button
                  key={c.key}
                  type="button"
                  className={cx(quiz.choice, state && quiz[state])}
                  onClick={() => choose(c.key)}
                  disabled={!!answered}
                >
                  <span className={quiz.key} aria-hidden>
                    {i + 1}
                  </span>
                  <ChoiceLabel q={q} choice={c} />
                  {state === 'correct' && <Check className={quiz.mark} size={20} strokeWidth={2} aria-label="คำตอบที่ถูก" />}
                  {state === 'wrong' && <X className={quiz.mark} size={20} strokeWidth={2} aria-label="คำตอบที่เลือก" />}
                </button>
              );
            })}
          </div>
        )}
      </section>

      {answered && (
        <div className={cx('notice', quiz.feedback, answered.correct ? 'notice-good' : 'notice-bad')}>
          <div className={styles.feedback}>
            <p>
              {answered.correct ? 'ถูกต้อง!' : 'ยังไม่ถูก —'}{' '}
              <span className={cx('kana', styles.feedbackJa)} lang="ja">
                {solution.join(' → ')}
              </span>{' '}
              {formKana ? `(${q.word.thai})` : `(${q.word.thai}) = กลุ่ม ${q.word.group}`}
            </p>
            {!answered.correct && (
              <p className={styles.why}>
                กฎ: {why.join(' · แล้ว ')}
                {mode === 'practice' && ' · เดี๋ยวจะถามข้อนี้อีกครั้ง'}
              </p>
            )}
          </div>
          <div className="row">
            <SpeakButton text={formKana ?? q.word.kana} size="sm" label="ฟังคำนี้" />
            {!answered.correct && (
              <button type="button" className="btn btn-primary btn-sm" onClick={goNext} autoFocus>
                {isLast ? 'ดูผล' : 'ข้อถัดไป'} →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
