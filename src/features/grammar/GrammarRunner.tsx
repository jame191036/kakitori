import { Check, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { SpeakButton } from '../../components/SpeakButton';
import { parseInline } from '../../data/grammar/sentence';
import type { GrammarPoint } from '../../data/grammar/types';
import { cx } from '../../lib/cx';
import quiz from '../quiz/quiz.module.css';
import { GrammarArrange } from './GrammarArrange';
import { choiceKey, type GrammarQType, type GrammarQuestion } from './grammarLogic';
import { FuriganaToggle, JaText } from './JaText';
import styles from './grammar.module.css';

export interface GrammarResult {
  point: GrammarPoint;
  /** ผลครั้งแรกของรูปนี้ในรอบนี้ */
  correct: boolean;
}

interface GrammarRunnerProps {
  questions: readonly GrammarQuestion[];
  /** practice = ตอบผิดได้ลองอีกรอบท้ายชุด · test = ข้อละครั้ง */
  mode: 'practice' | 'test';
  /** เรียกครั้งแรกที่ตอบแต่ละรูป (แบบทดสอบใช้บันทึกผล) */
  onAnswer?: (point: GrammarPoint, correct: boolean) => void;
  onFinish: (results: GrammarResult[]) => void;
  onQuit: () => void;
}

const TYPE_LABEL: Record<GrammarQType, string> = {
  fill: 'เลือกคำที่หายไปให้ตรงกับคำแปล',
  meaning: 'ประโยคนี้แปลว่าอะไร',
  arrange: 'เรียงประโยคให้ตรงกับคำแปล',
};

/** ตัวทำแบบฝึก/แบบทดสอบไวยากรณ์ (หน้าตาเดียวกับแบบทดสอบคำศัพท์และคันจิ) */
export function GrammarRunner({ questions, mode, onAnswer, onFinish, onQuit }: GrammarRunnerProps) {
  const [queue, setQueue] = useState<GrammarQuestion[]>(() => [...questions]);
  const [index, setIndex] = useState(0);
  const [answered, setAnswered] = useState<{ correct: boolean; chosen?: string } | null>(null);
  const results = useRef(new Map<string, boolean>());
  const retried = useRef(new Set<string>());
  const q = queue[index]!;
  const isLast = index === queue.length - 1;
  const { sentence } = q.example;

  const goNext = useCallback(() => {
    if (isLast) {
      // ผลของแต่ละรูป = ครั้งแรกที่ตอบ (แบบฝึกมีหลายข้อต่อรูป — นับข้อแรก)
      const seen = new Set<string>();
      onFinish(
        questions
          .filter((x) => !seen.has(x.point.id) && seen.add(x.point.id))
          .map((x) => ({ point: x.point, correct: results.current.get(x.point.id) ?? false })),
      );
      return;
    }
    setIndex((i) => i + 1);
    setAnswered(null);
  }, [isLast, onFinish, questions]);

  const answer = (correct: boolean, chosen?: string) => {
    if (answered) return;
    setAnswered({ correct, chosen });
    if (!results.current.has(q.point.id)) {
      results.current.set(q.point.id, correct);
      onAnswer?.(q.point, correct);
    }
    // แบบฝึก: ข้อที่ผิดได้ลองอีกครั้งท้ายชุด — ข้อละครั้งเดียว
    if (!correct && mode === 'practice' && !retried.current.has(q.id)) {
      retried.current.add(q.id);
      setQueue((list) => [...list, { ...q, id: `${q.id}:again` }]);
    }
  };

  // ตอบถูก: ไปข้อถัดไปเองหลังเห็นเฉลยแป๊บหนึ่ง (ประโยคยาวกว่าคำ จึงรอนานกว่าเล็กน้อย)
  useEffect(() => {
    if (!answered?.correct) return;
    const t = window.setTimeout(goNext, 1300);
    return () => window.clearTimeout(t);
  }, [answered, goNext]);

  const choose = (opt: string) => answer(choiceKey(q, opt) === q.answer, opt);
  const done = index + (answered ? 1 : 0);

  // คีย์ลัด: 1–4 เลือกคำตอบ · Enter ข้อถัดไป
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (answered && e.key === 'Enter') {
        goNext();
        return;
      }
      const n = Number(e.key);
      if (!answered && q.choices.length && n >= 1 && n <= q.choices.length) choose(q.choices[n - 1]!);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div className={quiz.runner}>
      <div className={quiz.progressRow}>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onQuit}>
          <X size={16} aria-hidden /> ออก
        </button>
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
        <span className="small muted" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {Math.min(index + 1, queue.length)}/{queue.length}
        </span>
      </div>

      <section className={cx('card', quiz.question)} aria-live="polite">
        <div className={styles.cardTop}>
          <p className="small muted">{TYPE_LABEL[q.type]}</p>
          <FuriganaToggle />
        </div>

        {q.type === 'fill' && (
          <div className={styles.prompt}>
            <JaText segs={sentence.segs} end={sentence.end} mode="blank" className={styles.promptJa} />
            <p className={styles.promptHint}>{q.example.thai}</p>
          </div>
        )}
        {q.type === 'meaning' && (
          <div className={styles.prompt}>
            <JaText segs={sentence.segs} end={sentence.end} className={styles.promptJa} />
            <SpeakButton text={sentence.plain} size="sm" label="ฟังประโยคนี้" />
          </div>
        )}
        {q.type === 'arrange' && (
          <>
            <div className={styles.prompt}>
              <p className={styles.promptThai}>{q.example.thai}</p>
            </div>
            <GrammarArrange
              key={q.id}
              example={q.example}
              tiles={q.tiles}
              disabled={!!answered}
              onAnswer={(ok) => answer(ok)}
            />
          </>
        )}

        {q.choices.length > 0 && (
          <div className={quiz.choices}>
            {q.choices.map((opt, i) => {
              const isAnswer = choiceKey(q, opt) === q.answer;
              const state = !answered ? undefined : isAnswer ? 'correct' : answered.chosen === opt ? 'wrong' : 'dim';
              return (
                <button
                  key={opt}
                  type="button"
                  className={cx(quiz.choice, state && quiz[state])}
                  onClick={() => choose(opt)}
                  disabled={!!answered}
                >
                  <span className={quiz.key} aria-hidden>
                    {i + 1}
                  </span>
                  {q.type === 'fill' ? (
                    <JaText segs={parseInline(opt)} className={styles.choiceJa} />
                  ) : (
                    <span className={styles.choiceThai}>{opt}</span>
                  )}
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
          <span>
            {answered.correct ? 'ถูกต้อง!' : 'ยังไม่ถูก — ประโยคที่ถูกคือ'}{' '}
            <JaText segs={sentence.segs} end={sentence.end} mode="highlight" /> ({q.example.thai})
            {!answered.correct && mode === 'practice' && ' · เดี๋ยวจะถามข้อนี้อีกครั้ง'}
          </span>
          <div className="row">
            <SpeakButton text={sentence.plain} size="sm" label="ฟังประโยคนี้" />
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
