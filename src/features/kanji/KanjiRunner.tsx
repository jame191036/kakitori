import { Check, X } from 'lucide-react';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { SpeakButton } from '../../components/SpeakButton';
import { useKanjiStrokes } from '../../data/kanji/strokes';
import type { KanjiEntry } from '../../data/kanji/types';
import { cx } from '../../lib/cx';
import quiz from '../quiz/quiz.module.css';
import { STRICTNESS_LENIENCY, useSettings } from '../settings/settings';
import { StrokeCheckBoard } from '../writing/StrokeCheckBoard';
import { Highlighted } from './KanjiCards';
import type { KanjiQType, KanjiQuestion } from './kanjiLogic';
import styles from './kanji.module.css';

export interface KanjiResult {
  kanji: KanjiEntry;
  /** ผลครั้งแรกของคันจิตัวนี้ในรอบนี้ */
  correct: boolean;
}

interface KanjiRunnerProps {
  questions: readonly KanjiQuestion[];
  /** practice = ตอบผิดได้ลองอีกรอบท้ายชุด · test = ข้อละครั้ง */
  mode: 'practice' | 'test';
  /** เรียกครั้งแรกที่ตอบแต่ละตัว (แบบทดสอบใช้บันทึกผล) */
  onAnswer?: (kanji: KanjiEntry, correct: boolean) => void;
  onFinish: (results: KanjiResult[]) => void;
  onQuit: () => void;
}

const TYPE_LABEL: Record<KanjiQType, string> = {
  write: 'เขียนตามเส้นจางทีละขีด',
  meaningToKanji: 'ดูความหมาย → เลือกคันจิ',
  kanjiToMeaning: 'ดูคันจิ → เลือกความหมาย',
  reading: 'คำนี้อ่านว่าอะไร',
};

/** กระดานเขียนคันจิแบบมีเส้นนำ (ต้องอยู่ใน <Suspense> — โหลดข้อมูลลำดับขีด) */
function WriteKanji({ q, disabled, onAnswer }: { q: KanjiQuestion; disabled: boolean; onAnswer: (ok: boolean) => void }) {
  const settings = useSettings();
  const data = useKanjiStrokes().chars[q.kanji.char];
  if (!data) return null;
  return (
    <div className={styles.writeBoard}>
      <StrokeCheckBoard
        key={q.id}
        data={data}
        guide
        disabled={disabled}
        leniency={STRICTNESS_LENIENCY[settings.strictness]}
        label={`เขียนคันจิ ${q.kanji.char}`}
        hideRestart
        // เขียนครบโดยไม่ต้องใช้คำใบ้ = ถูก
        onComplete={({ hintsUsed }) => onAnswer(hintsUsed === 0)}
      />
    </div>
  );
}

/** ตัวทำแบบฝึก/แบบทดสอบคันจิ (หน้าตาเดียวกับแบบทดสอบตัวอักษรและคำศัพท์) */
export function KanjiRunner({ questions, mode, onAnswer, onFinish, onQuit }: KanjiRunnerProps) {
  const [queue, setQueue] = useState<KanjiQuestion[]>(() => [...questions]);
  const [index, setIndex] = useState(0);
  const [answered, setAnswered] = useState<{ correct: boolean; chosen?: string } | null>(null);
  const results = useRef(new Map<string, boolean>());
  const retried = useRef(new Set<string>());
  const q = queue[index]!;
  const isLast = index === queue.length - 1;

  const goNext = useCallback(() => {
    if (isLast) {
      // ผลของแต่ละตัว = ครั้งแรกที่ตอบ (แบบฝึกมี 2 ข้อต่อตัว — นับข้อแรก)
      const seen = new Set<string>();
      onFinish(
        questions
          .filter((x) => !seen.has(x.kanji.id) && seen.add(x.kanji.id))
          .map((x) => ({ kanji: x.kanji, correct: results.current.get(x.kanji.id) ?? false })),
      );
      return;
    }
    setIndex((i) => i + 1);
    setAnswered(null);
  }, [isLast, onFinish, questions]);

  const answer = (correct: boolean, chosen?: string) => {
    if (answered) return;
    setAnswered({ correct, chosen });
    if (!results.current.has(q.kanji.id)) {
      results.current.set(q.kanji.id, correct);
      onAnswer?.(q.kanji, correct);
    }
    // แบบฝึก: ข้อที่ผิดได้ลองอีกครั้งท้ายชุด — ข้อละครั้งเดียว
    if (!correct && mode === 'practice' && !retried.current.has(q.id)) {
      retried.current.add(q.id);
      setQueue((list) => [...list, { ...q, id: `${q.id}:again` }]);
    }
  };

  // ตอบถูก: ไปข้อถัดไปเองหลังเห็นเฉลยแป๊บหนึ่ง (ข้อเขียนรอนานกว่าเล็กน้อยให้เห็นตัวที่เขียนเสร็จ)
  useEffect(() => {
    if (!answered?.correct) return;
    const t = window.setTimeout(goNext, q.type === 'write' ? 1200 : 900);
    return () => window.clearTimeout(t);
  }, [answered, goNext, q.type]);

  const options: string[] =
    q.type === 'reading' ? q.readingChoices : q.type === 'write' ? [] : q.choices.map((c) => c.id);
  const correctOption = q.type === 'reading' ? q.word!.kana : q.kanji.id;
  const choose = (opt: string) => answer(opt === correctOption, opt);
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
      if (!answered && options.length && n >= 1 && n <= options.length) choose(options[n - 1]!);
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
        <p className="small muted">{TYPE_LABEL[q.type]}</p>

        {(q.type === 'meaningToKanji' || q.type === 'write') && (
          <div className={styles.prompt}>
            <p className={styles.promptThai}>{q.kanji.thai}</p>
            {q.type === 'write' && <p className={styles.promptHint}>{q.kanji.strokes} ขีด · เขียนตามลำดับตัวเลข</p>}
          </div>
        )}
        {q.type === 'kanjiToMeaning' && (
          <div className={styles.prompt}>
            <span className={cx('kana', styles.promptKanji)} lang="ja">
              {q.kanji.char}
            </span>
          </div>
        )}
        {q.type === 'reading' && q.word && (
          <div className={styles.prompt}>
            <span className={styles.promptWord}>
              <Highlighted text={q.word.kanji ?? q.word.kana} char={q.kanji.char} />
            </span>
            <p className={styles.promptHint}>{q.word.thai}</p>
          </div>
        )}

        {q.type === 'write' && (
          <Suspense fallback={<p className="muted">กำลังโหลดกระดาน…</p>}>
            <WriteKanji q={q} disabled={!!answered} onAnswer={(ok) => answer(ok)} />
          </Suspense>
        )}

        {options.length > 0 && (
          <div className={quiz.choices}>
            {options.map((opt, i) => {
              const isAnswer = opt === correctOption;
              const state = !answered ? undefined : isAnswer ? 'correct' : answered.chosen === opt ? 'wrong' : 'dim';
              const entry = q.choices.find((c) => c.id === opt);
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
                  {q.type === 'meaningToKanji' ? (
                    <span className={cx('kana', styles.choiceKanji)} lang="ja">
                      {entry?.char}
                    </span>
                  ) : q.type === 'kanjiToMeaning' ? (
                    <span className={styles.choiceThai}>{entry?.thai}</span>
                  ) : (
                    <span className={cx('kana', styles.choiceKana)} lang="ja">
                      {opt}
                    </span>
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
            {answered.correct ? 'ถูกต้อง!' : q.type === 'write' ? 'เขียนเสร็จแล้ว — ลองอีกครั้งโดยไม่ต้องใช้คำใบ้' : 'ยังไม่ถูก — คำตอบคือ'}{' '}
            {q.type === 'reading' && q.word ? (
              <>
                <span className="kana" lang="ja">
                  {q.word.kanji} = {q.word.kana}
                </span>{' '}
                ({q.word.thai})
              </>
            ) : (
              <>
                <span className="kana" lang="ja">
                  {q.kanji.char}
                </span>{' '}
                = {q.kanji.thai}
              </>
            )}
            {!answered.correct && mode === 'practice' && ' · เดี๋ยวจะถามข้อนี้อีกครั้ง'}
          </span>
          <div className="row">
            {q.type === 'reading' && q.word && <SpeakButton text={q.word.kana} size="sm" />}
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
