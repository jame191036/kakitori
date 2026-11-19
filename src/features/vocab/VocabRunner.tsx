import { Check, Volume2, X } from 'lucide-react';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { SpeakButton } from '../../components/SpeakButton';
import { WORD_KIND_LABEL, type VocabWord } from '../../data/vocab';
import { cx } from '../../lib/cx';
import { speak, useSpeech } from '../speech/useSpeech';
import quiz from '../quiz/quiz.module.css';
import { ArrangeQuestion } from './ArrangeQuestion';
import type { VocabQType, VocabQuestion } from './vocabLogic';
import { WordFace } from './WordFace';
import { WriteQuestion } from './WriteQuestion';
import styles from './vocab.module.css';

export interface WordResult {
  word: VocabWord;
  /** ผลครั้งแรกของคำนี้ในรอบนี้ */
  correct: boolean;
}

interface VocabRunnerProps {
  questions: readonly VocabQuestion[];
  /** practice = ตอบผิดได้ลองอีกรอบท้ายชุด · test = ข้อละครั้ง */
  mode: 'practice' | 'test';
  /** เรียกครั้งแรกที่ตอบแต่ละคำ (แบบทดสอบใช้บันทึกผล) */
  onAnswer?: (word: VocabWord, correct: boolean) => void;
  onFinish: (results: WordResult[]) => void;
  onQuit: () => void;
}

const TYPE_LABEL: Record<VocabQType, string> = {
  meaningToWord: 'ดูความหมาย → เลือกคำ',
  wordToMeaning: 'ดูคำ → เลือกความหมาย',
  audioToMeaning: 'ฟังเสียง → เลือกความหมาย',
  arrange: 'เรียงตัวอักษรให้เป็นคำ',
  write: 'เขียนคำนี้ด้วยมือ',
};

/** ตัวทำแบบฝึก/แบบทดสอบคำศัพท์ (หน้าตาเดียวกับแบบทดสอบตัวอักษร) */
export function VocabRunner({ questions, mode, onAnswer, onFinish, onQuit }: VocabRunnerProps) {
  const { available: audioOk } = useSpeech();
  const [queue, setQueue] = useState<VocabQuestion[]>(() => [...questions]);
  const [index, setIndex] = useState(0);
  const [answered, setAnswered] = useState<{ correct: boolean; chosen?: string } | null>(null);
  const results = useRef(new Map<string, boolean>());
  const retried = useRef(new Set<string>());
  const q = queue[index]!;
  const isLast = index === queue.length - 1;

  const goNext = useCallback(() => {
    if (isLast) {
      onFinish(questions.map((x) => ({ word: x.word, correct: results.current.get(x.word.id) ?? false })));
      return;
    }
    setIndex((i) => i + 1);
    setAnswered(null);
  }, [isLast, onFinish, questions]);

  const answer = (correct: boolean, chosen?: string) => {
    if (answered) return;
    setAnswered({ correct, chosen });
    if (!results.current.has(q.word.id)) {
      results.current.set(q.word.id, correct);
      onAnswer?.(q.word, correct);
    }
    // แบบฝึก: คำที่ผิดได้ลองอีกครั้งท้ายชุด — คำละครั้งเดียว (ข้อที่ถามซ้ำผิดอีกก็ไม่เพิ่มอีก)
    if (!correct && mode === 'practice' && !retried.current.has(q.word.id)) {
      retried.current.add(q.word.id);
      setQueue((list) => [...list, { ...q, id: `${q.id}:again` }]);
    }
  };

  // ตอบถูก: ไปข้อถัดไปเองหลังเห็นเฉลยแป๊บหนึ่ง
  useEffect(() => {
    if (!answered?.correct) return;
    const t = window.setTimeout(goNext, 900);
    return () => window.clearTimeout(t);
  }, [answered, goNext]);

  // ข้อฟังเสียง: เล่นให้ฟังเองเมื่อขึ้นข้อใหม่
  useEffect(() => {
    if (q.type === 'audioToMeaning' && audioOk) speak(q.word.kana);
  }, [q.id, q.type, q.word.kana, audioOk]);

  // คีย์ลัด: 1–4 เลือกคำตอบ · Enter ข้อถัดไป
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (answered && e.key === 'Enter') {
        goNext();
        return;
      }
      const n = Number(e.key);
      if (!answered && q.choices.length && n >= 1 && n <= q.choices.length) {
        const c = q.choices[n - 1]!;
        answer(c.id === q.word.id, c.id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const choiceKind = q.type === 'meaningToWord' ? 'word' : 'meaning';
  const done = index + (answered ? 1 : 0);

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

        {(q.type === 'meaningToWord' || q.type === 'arrange' || q.type === 'write') && (
          <div className={styles.promptMeaning}>
            <p className={styles.promptThai}>{q.word.thai}</p>
            <span className={styles.kindTag}>{WORD_KIND_LABEL[q.word.kind]}</span>
            {q.type === 'write' && <p className={styles.promptRomaji}>{q.word.romaji}</p>}
          </div>
        )}
        {q.type === 'wordToMeaning' && (
          <div className={styles.promptWord}>
            <WordFace word={q.word} size="xl" />
            <SpeakButton text={q.word.kana} />
          </div>
        )}
        {q.type === 'audioToMeaning' && (
          <button type="button" className={cx('btn', quiz.audioBtn)} onClick={() => speak(q.word.kana)}>
            <Volume2 size={36} strokeWidth={1.4} aria-hidden />
            <span>ฟังอีกครั้ง</span>
          </button>
        )}

        {q.type === 'arrange' && (
          <ArrangeQuestion key={q.id} word={q.word} tiles={q.tiles} disabled={!!answered} onAnswer={answer} />
        )}
        {q.type === 'write' && (
          <Suspense fallback={<p className="muted">กำลังโหลดกระดาน…</p>}>
            <WriteQuestion key={q.id} word={q.word} disabled={!!answered} onAnswer={answer} />
          </Suspense>
        )}
        {q.choices.length > 0 && (
          <div className={cx(quiz.choices, choiceKind === 'meaning' && styles.choicesMeaning)}>
            {q.choices.map((c, i) => {
              const isAnswer = c.id === q.word.id;
              const state = !answered ? undefined : isAnswer ? 'correct' : answered.chosen === c.id ? 'wrong' : 'dim';
              return (
                <button
                  key={c.id}
                  type="button"
                  className={cx(quiz.choice, state && quiz[state])}
                  onClick={() => answer(isAnswer, c.id)}
                  disabled={!!answered}
                >
                  <span className={quiz.key} aria-hidden>
                    {i + 1}
                  </span>
                  {choiceKind === 'word' ? (
                    <WordFace word={c} size="md" />
                  ) : (
                    <span className={styles.choiceThai}>{c.thai}</span>
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
          <span className={styles.feedbackText}>
            {answered.correct ? 'ถูกต้อง!' : 'ยังไม่ถูก — คำตอบคือ'}{' '}
            <span className="kana" lang="ja">
              {q.word.kana}
            </span>
            {q.word.kanji && (
              <span className="kana" lang="ja">
                {' '}
                ({q.word.kanji})
              </span>
            )}{' '}
            = {q.word.romaji} — {q.word.thai}
            {!answered.correct && mode === 'practice' && ' · เดี๋ยวจะถามคำนี้อีกครั้ง'}
          </span>
          <div className="row">
            <SpeakButton text={q.word.kana} size="sm" />
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
