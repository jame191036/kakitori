import { Volume2 } from 'lucide-react';
import { useState } from 'react';
import { MINIMAL_PAIRS, type MinimalPair } from '../../data/minimalPairs';
import { cx } from '../../lib/cx';
import { shuffle } from '../quiz/quizLogic';
import { useSpeech } from '../speech/useSpeech';
import styles from './listening.module.css';

/** จำนวนข้อต่อรอบ */
const ROUND = 8;

type Side = 'plain' | 'marked';

interface Question {
  pair: MinimalPair;
  /** คำที่เปิดเสียงให้ฟัง */
  answer: Side;
  /** ลำดับตัวเลือก (สลับซ้าย/ขวาแบบสุ่ม) */
  order: readonly [Side, Side];
}

function makeRound(random: () => number = Math.random): Question[] {
  return shuffle(MINIMAL_PAIRS, random)
    .slice(0, ROUND)
    .map((pair) => ({
      pair,
      answer: random() < 0.5 ? 'plain' : 'marked',
      order: random() < 0.5 ? ['plain', 'marked'] : ['marked', 'plain'],
    }));
}

/**
 * แบบฝึก "ฟังแล้วเลือกคำที่ได้ยิน" — แยกเสียงคู่คำที่ต่างกันแค่ตัวควบ / っ / เสียงยาว
 * (ฝึกในบทเรียน ไม่นับเข้าความคืบหน้ารายตัว) · เสียงเล่นเมื่อผู้ใช้กดเท่านั้น
 */
export function ListenQuiz() {
  const { available, speak } = useSpeech();
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<Side | null>(null);
  const [score, setScore] = useState(0);

  if (!available) {
    return (
      <p className={styles.notice}>
        แบบฝึกฟังต้องใช้เสียงภาษาญี่ปุ่นของเครื่อง — เครื่อง/เบราว์เซอร์นี้ยังไม่มี ลองเปิดด้วย Chrome, Edge
        หรือ Safari บนมือถือหรือคอมพิวเตอร์
      </p>
    );
  }

  const play = (q: Question) => speak(q.pair[q.answer].kana);

  const start = () => {
    const round = makeRound();
    setQuestions(round);
    setIndex(0);
    setPicked(null);
    setScore(0);
    play(round[0]!);
  };

  if (!questions) {
    return (
      <div className={styles.quiz}>
        <p>
          กดฟังแล้วเลือกว่าได้ยินคำไหน ({ROUND} ข้อ) — ฟังซ้ำกี่ครั้งก็ได้
        </p>
        <div>
          <button type="button" className="btn btn-primary" onClick={start}>
            <Volume2 size={18} strokeWidth={1.6} aria-hidden /> เริ่มฝึกฟัง
          </button>
        </div>
      </div>
    );
  }

  if (index >= questions.length) {
    return (
      <div className={styles.quiz}>
        <p className={styles.result} aria-live="polite">
          ถูก <strong>{score}</strong> จาก {questions.length} ข้อ
        </p>
        <p className="small muted">
          {score === questions.length
            ? 'แยกเสียงได้ครบทุกข้อ เยี่ยมมาก'
            : 'ข้อที่พลาด ลองกดฟังเทียบคู่คำด้านบนอีกครั้ง แล้วฝึกใหม่ได้เลย'}
        </p>
        <div>
          <button type="button" className="btn btn-primary" onClick={start}>
            ฝึกอีกรอบ
          </button>
        </div>
      </div>
    );
  }

  const q = questions[index]!;
  const answered = picked !== null;
  const correct = picked === q.answer;

  const choose = (side: Side) => {
    if (answered) return;
    setPicked(side);
    if (side === q.answer) setScore((s) => s + 1);
  };

  const next = () => {
    const n = index + 1;
    setIndex(n);
    setPicked(null);
    if (n < questions.length) play(questions[n]!);
  };

  return (
    <div className={styles.quiz}>
      <div className={styles.quizHead}>
        <span className="small muted">
          ข้อ {index + 1} / {questions.length} · ถูก {score}
        </span>
        <button type="button" className="btn" onClick={() => play(q)}>
          <Volume2 size={18} strokeWidth={1.6} aria-hidden /> ฟังอีกครั้ง
        </button>
      </div>

      <div className={styles.choices} role="group" aria-label="ได้ยินคำไหน">
        {q.order.map((side, i) => {
          const word = q.pair[side];
          const state = answered && side === q.answer ? styles.correct : answered && side === picked ? styles.wrong : undefined;
          return (
            <button
              key={side}
              type="button"
              className={cx(styles.choice, state, answered && side !== q.answer && side !== picked && styles.dim)}
              onClick={() => choose(side)}
              disabled={answered}
            >
              <span className={styles.key}>{i + 1}</span>
              <span className="kana" lang="ja">
                {word.kana}
              </span>
              <span className={styles.choiceRomaji}>{word.romaji}</span>
            </button>
          );
        })}
      </div>

      {answered && (
        <div className={styles.feedback} aria-live="polite">
          <p>
            <strong className={correct ? styles.good : styles.bad}>{correct ? 'ถูกต้อง' : 'ยังไม่ใช่'}</strong> —
            คำที่ได้ยินคือ <span className="kana">{q.pair[q.answer].kana}</span> ({q.pair[q.answer].romaji} ={' '}
            {q.pair[q.answer].meaning})
          </p>
          <div className={styles.compare}>
            {(['plain', 'marked'] as const).map((side) => (
              <button key={side} type="button" className="btn btn-sm btn-ghost" onClick={() => speak(q.pair[side].kana)}>
                <Volume2 size={16} strokeWidth={1.6} aria-hidden />
                <span className="kana">{q.pair[side].kana}</span> {q.pair[side].meaning}
              </button>
            ))}
          </div>
          <div>
            <button type="button" className="btn btn-primary" onClick={next}>
              {index + 1 < questions.length ? 'ข้อต่อไป →' : 'ดูผล'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
