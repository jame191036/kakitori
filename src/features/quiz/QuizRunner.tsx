import { ArrowRight, Check, HelpCircle, Volume2, X } from 'lucide-react';
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { SpeakButton } from '../../components/SpeakButton';
import { counterpartOf, romajiLabel } from '../../data/scripts';
import type { CharEntry, ScriptPack } from '../../data/types';
import { useStrokeSet } from '../../data/useStrokes';
import { cx } from '../../lib/cx';
import { recordAnswer } from '../progress/progressStore';
import { STRICTNESS_LENIENCY, useSettings } from '../settings/settings';
import { speak, useSpeech } from '../speech/useSpeech';
import { StrokeAnimator } from '../writing/StrokeAnimator';
import { StrokeCheckBoard } from '../writing/StrokeCheckBoard';
import { isCorrectChoice, type QuizQuestion } from './quizLogic';
import { questionTypeInfo } from './quizText';
import styles from './quiz.module.css';

export interface AnswerRecord {
  question: QuizQuestion;
  correct: boolean;
  chosen?: CharEntry;
}

interface QuizRunnerProps {
  pack: ScriptPack;
  questions: QuizQuestion[];
  onFinish: (records: AnswerRecord[]) => void;
  onQuit: () => void;
}

const AUTO_NEXT_MS = 900;

export function QuizRunner({ pack, questions, onFinish, onQuit }: QuizRunnerProps) {
  const strokeSet = useStrokeSet(pack);
  const settings = useSettings();
  const { available: audioOk } = useSpeech();
  const [index, setIndex] = useState(0);
  const [records, setRecords] = useState<AnswerRecord[]>([]);
  const timer = useRef<number | undefined>(undefined);

  const q = questions[index]!;
  const answered = records.length > index ? records[index]! : null;
  const isLast = index === questions.length - 1;

  useEffect(() => () => window.clearTimeout(timer.current), []);

  // ข้อแบบฟังเสียง: เล่นเสียงให้อัตโนมัติเมื่อขึ้นข้อใหม่
  useEffect(() => {
    if (q.type === 'audioToChar') speak(q.answer.char);
  }, [q]);

  const goNext = (all: AnswerRecord[] = records) => {
    window.clearTimeout(timer.current);
    if (isLast) onFinish(all);
    else setIndex((i) => i + 1);
  };

  const answer = (correct: boolean, chosen?: CharEntry) => {
    if (answered) return;
    recordAnswer(pack.id, q.answer.id, correct);
    const next = [...records, { question: q, correct, chosen }];
    setRecords(next);
    if (correct && q.type !== 'readingToWrite') {
      timer.current = window.setTimeout(() => goNext(next), AUTO_NEXT_MS);
    }
  };

  // คีย์ลัด: 1–4 เลือกคำตอบ, Enter ไปข้อถัดไป
  const onKeyDown = useEffectEvent((e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement) return;
    if (!answered && q.choices.length && /^[1-4]$/.test(e.key)) {
      const choice = q.choices[Number(e.key) - 1];
      if (choice) answer(isCorrectChoice(q, choice), choice);
    } else if (answered && e.key === 'Enter') {
      e.preventDefault();
      goNext();
    }
  });
  useEffect(() => {
    const h = (e: KeyboardEvent) => onKeyDown(e);
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const strokes = strokeSet.chars[q.answer.char]!;
  const score = records.filter((r) => r.correct).length;
  const pair = q.type === 'pairToChar' ? counterpartOf(pack, q.answer) : undefined;

  return (
    <div className={styles.runner}>
      <div className={styles.progressRow}>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onQuit}>
          <X size={16} aria-hidden /> ออก
        </button>
        <div
          className={styles.progress}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={questions.length}
          aria-valuenow={index + 1}
          aria-label="ความคืบหน้า"
        >
          <span style={{ width: `${((index + (answered ? 1 : 0)) / questions.length) * 100}%` }} />
        </div>
        <span className="small muted" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {index + 1}/{questions.length} · ถูก {score}
        </span>
      </div>

      <section className={cx('card', styles.question)} aria-live="polite">
        <p className="small muted">{questionTypeInfo(q.type, pack).label}</p>

        {q.type === 'pairToChar' && pair && (
          <div className={cx('kana', styles.promptChar)} lang="ja">
            {pair.char}
          </div>
        )}
        {q.type === 'charToReading' && (
          <div className={cx('kana', styles.promptChar)} lang="ja">
            {q.answer.char}
          </div>
        )}
        {(q.type === 'readingToChar' || q.type === 'readingToWrite') && (
          <div className={styles.promptReading}>
            <span>{romajiLabel(q.answer)}</span>
            <span className={styles.promptThai}>{q.answer.thai}</span>
          </div>
        )}
        {q.type === 'audioToChar' && (
          <button
            type="button"
            className={cx('btn', styles.audioBtn)}
            onClick={() => speak(q.answer.char)}
            disabled={!audioOk}
          >
            <Volume2 size={36} aria-hidden />
            <span>ฟังอีกครั้ง</span>
          </button>
        )}

        {q.type === 'readingToWrite' ? (
          <div className={styles.writeArea}>
            {answered && !answered.correct ? (
              <StrokeAnimator
                key={`ans-${q.id}`}
                data={strokes}
                speed={settings.animationSpeed}
                showNumbers
                label={`เฉลย: ลำดับขีดของ ${q.answer.char}`}
                speedControl={false}
              />
            ) : (
              <StrokeCheckBoard
                key={`w-${q.id}`}
                data={strokes}
                guide={false}
                leniency={STRICTNESS_LENIENCY[settings.strictness]}
                label={`เขียนตัวอักษรที่อ่านว่า ${q.answer.romaji}`}
                hideRestart
                disabled={!!answered}
                onComplete={({ hintsUsed }) => answer(hintsUsed === 0)}
              />
            )}
            {!answered && (
              <button type="button" className="btn btn-ghost" onClick={() => answer(false)}>
                <HelpCircle size={18} aria-hidden /> ไม่รู้ / ดูเฉลย
              </button>
            )}
          </div>
        ) : (
          <div className={cx(styles.choices, q.type === 'charToReading' && styles.choicesReading)}>
            {q.choices.map((c, i) => {
              const isAnswer = isCorrectChoice(q, c);
              const state = !answered
                ? undefined
                : isAnswer
                  ? 'correct'
                  : answered.chosen?.id === c.id
                    ? 'wrong'
                    : 'dim';
              return (
                <button
                  key={c.id}
                  type="button"
                  className={cx(styles.choice, state && styles[state])}
                  onClick={() => answer(isAnswer, c)}
                  disabled={!!answered}
                >
                  <span className={styles.key} aria-hidden>
                    {i + 1}
                  </span>
                  {q.type === 'charToReading' ? (
                    <span className={styles.choiceReading}>
                      <span>{c.romaji}</span>
                      <span className="small muted">{c.thai}</span>
                    </span>
                  ) : (
                    <span className={cx('kana', styles.choiceChar)} lang="ja">
                      {c.char}
                    </span>
                  )}
                  {state === 'correct' && <Check className={styles.mark} size={20} aria-label="คำตอบที่ถูก" />}
                  {state === 'wrong' && <X className={styles.mark} size={20} aria-label="คำตอบที่เลือก" />}
                </button>
              );
            })}
          </div>
        )}
      </section>

      {answered && (
        <div className={cx('notice', styles.feedback, answered.correct ? 'notice-good' : 'notice-bad')}>
          <span className={styles.feedbackText}>
            {answered.correct ? 'ถูกต้อง!' : 'ยังไม่ถูก — คำตอบคือ'}{' '}
            {pair && (
              <>
                <span className="kana" lang="ja">
                  {pair.char}
                </span>{' '}
                →{' '}
              </>
            )}
            <span className="kana" lang="ja">
              {q.answer.char}
            </span>{' '}
            = {romajiLabel(q.answer)} ({q.answer.thai})
          </span>
          <div className="row">
            <SpeakButton text={q.answer.char} size="sm" />
            {(!answered.correct || q.type === 'readingToWrite') && (
              <button type="button" className="btn btn-primary btn-sm" onClick={() => goNext()} autoFocus>
                {isLast ? 'ดูผลสอบ' : 'ข้อถัดไป'} <ArrowRight size={16} aria-hidden />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
