import { Check, Volume2, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { SpeakButton } from '../../components/SpeakButton';
import type { PhraseDeck, Phrase } from '../../data/phrase/types';
import { cx } from '../../lib/cx';
import { GrammarArrange } from '../grammar/GrammarArrange';
import quiz from '../quiz/quiz.module.css';
import { speak } from '../speech/useSpeech';
import { PhraseFace, RomajiToggle } from './PhraseFace';
import type { PhraseQType, PhraseQuestion } from './phraseLogic';
import styles from './phrase.module.css';

export interface PhraseResult {
  phrase: Phrase;
  /** ผลครั้งแรกของวลีนี้ในรอบนี้ */
  correct: boolean;
}

interface PhraseRunnerProps {
  deck: PhraseDeck;
  questions: readonly PhraseQuestion[];
  /** practice = ตอบผิดได้ลองอีกรอบท้ายชุด · test = ข้อละครั้ง */
  mode: 'practice' | 'test';
  /** เรียกครั้งแรกที่ตอบแต่ละวลี (แบบทดสอบใช้บันทึกผล) */
  onAnswer?: (phrase: Phrase, correct: boolean) => void;
  onFinish: (results: PhraseResult[]) => void;
  onQuit: () => void;
}

const TYPE_LABEL: Record<PhraseQType, string> = {
  say: 'สถานการณ์นี้ ควรพูดว่าอะไร',
  meaning: 'วลีนี้แปลว่าอะไร',
  listen: 'ฟังแล้วเลือกความหมาย',
  arrange: 'เรียงวลีให้ตรงกับความหมาย',
};

/** ป้าย: อ่านอย่างเดียว */
const SIGN_LABEL: Partial<Record<PhraseQType, string>> = {
  say: 'ป้ายไหนมีความหมายนี้',
  meaning: 'ป้ายนี้แปลว่าอะไร',
};

/** ตัวทำแบบฝึก/แบบทดสอบของสายท่องเที่ยว (หน้าตาเดียวกับสายคำศัพท์และไวยากรณ์) */
export function PhraseRunner({ deck, questions, mode, onAnswer, onFinish, onQuit }: PhraseRunnerProps) {
  const [queue, setQueue] = useState<PhraseQuestion[]>(() => [...questions]);
  const [index, setIndex] = useState(0);
  const [answered, setAnswered] = useState<{ correct: boolean; chosen?: string } | null>(null);
  const results = useRef(new Map<string, boolean>());
  const retried = useRef(new Set<string>());
  const q = queue[index]!;
  const { phrase } = q;
  const isLast = index === queue.length - 1;

  const goNext = useCallback(() => {
    if (isLast) {
      // ผลของแต่ละวลี = ครั้งแรกที่ตอบ (แบบฝึกมี 2 ข้อต่อวลี — นับข้อแรก)
      const seen = new Set<string>();
      onFinish(
        questions
          .filter((x) => !seen.has(x.phrase.id) && seen.add(x.phrase.id))
          .map((x) => ({ phrase: x.phrase, correct: results.current.get(x.phrase.id) ?? false })),
      );
      return;
    }
    setIndex((i) => i + 1);
    setAnswered(null);
  }, [isLast, onFinish, questions]);

  const answer = (correct: boolean, chosen?: string) => {
    if (answered) return;
    setAnswered({ correct, chosen });
    if (!results.current.has(phrase.id)) {
      results.current.set(phrase.id, correct);
      onAnswer?.(phrase, correct);
    }
    // แบบฝึก: ข้อที่ผิดได้ลองอีกครั้งท้ายชุด — ข้อละครั้งเดียว
    if (!correct && mode === 'practice' && !retried.current.has(q.id)) {
      retried.current.add(q.id);
      setQueue((list) => [...list, { ...q, id: `${q.id}:again` }]);
    }
  };

  // ข้อฟัง: เล่นเสียงให้เองเมื่อขึ้นข้อใหม่
  useEffect(() => {
    if (q.type === 'listen') speak(phrase.written);
  }, [q.id, q.type, phrase.written]);

  // ตอบถูก: ไปข้อถัดไปเองหลังเห็นเฉลยแป๊บหนึ่ง
  useEffect(() => {
    if (!answered?.correct) return;
    const t = window.setTimeout(goNext, 1300);
    return () => window.clearTimeout(t);
  }, [answered, goNext]);

  const choose = (opt: string) => answer(opt === q.answer, opt);
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
        <div className={styles.qTop}>
          <p className="small muted">{(phrase.kind === 'sign' && SIGN_LABEL[q.type]) || TYPE_LABEL[q.type]}</p>
          <RomajiToggle />
        </div>

        {(q.type === 'say' || q.type === 'arrange') && <p className={styles.promptThai}>{phrase.thai}</p>}
        {q.type === 'meaning' && <PhraseFace phrase={phrase} speak hideReading={phrase.kind === 'sign'} />}
        {q.type === 'listen' && (
          <button type="button" className={cx('btn', quiz.audioBtn)} onClick={() => speak(phrase.written)}>
            <Volume2 size={36} strokeWidth={1.6} aria-hidden />
            ฟังอีกครั้ง
          </button>
        )}
        {q.type === 'arrange' && (
          <GrammarArrange
            key={q.id}
            example={{ sentence: phrase.kanaSentence, thai: phrase.thai, wrong: [], arrange: true }}
            tiles={q.tiles}
            disabled={!!answered}
            onAnswer={(ok) => answer(ok)}
          />
        )}

        {q.choices.length > 0 && (
          <div className={cx(quiz.choices, q.type === 'say' && styles.choicesPhrase)}>
            {q.choices.map((opt, i) => {
              const isAnswer = opt === q.answer;
              const state = !answered ? undefined : isAnswer ? 'correct' : answered.chosen === opt ? 'wrong' : 'dim';
              const option = q.type === 'say' ? deck.words[opt] : undefined;
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
                  {option ? (
                    <PhraseFace
                      phrase={option}
                      size="sm"
                      hideReading={option.kind === 'sign'}
                      className={styles.choicePhrase}
                    />
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
          <div className={styles.feedbackBody}>
            <span>
              {answered.correct ? 'ถูกต้อง!' : 'ยังไม่ถูก — วลีที่ถูกคือ'}
              {!answered.correct && mode === 'practice' && ' (เดี๋ยวจะถามข้อนี้อีกครั้ง)'}
            </span>
            <PhraseFace phrase={phrase} size="sm" thai />
          </div>
          <div className="row">
            <SpeakButton text={phrase.written} size="sm" label="ฟังวลีนี้" />
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
