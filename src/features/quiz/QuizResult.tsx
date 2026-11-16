import { Link } from 'react-router';
import { romajiLabel } from '../../data/scripts';
import type { CharEntry, ScriptPack } from '../../data/types';
import { questionTypeInfo } from './quizText';
import type { AnswerRecord } from './QuizRunner';
import styles from './quiz.module.css';

interface QuizResultProps {
  pack: ScriptPack;
  records: AnswerRecord[];
  onRetry: () => void;
  onReviewWrong: (chars: CharEntry[]) => void;
  onSetup: () => void;
}

function verdict(pct: number): string {
  if (pct === 100) return 'เต็ม! ไม่ผิดเลยสักข้อ';
  if (pct >= 80) return 'เก่งมาก! อีกนิดเดียว';
  if (pct >= 50) return 'ดีแล้ว ทบทวนตัวที่ผิดอีกหน่อยนะ';
  return 'ไม่เป็นไร ลองกลับไปฝึกเขียนแล้วมาสอบใหม่';
}

export function QuizResult({ pack, records, onRetry, onReviewWrong, onSetup }: QuizResultProps) {
  const correct = records.filter((r) => r.correct).length;
  const pct = records.length ? Math.round((correct / records.length) * 100) : 0;
  const wrong = records.filter((r) => !r.correct);
  const wrongChars = [...new Map(wrong.map((r) => [r.question.answer.id, r.question.answer])).values()];

  return (
    <div className={styles.result}>
      <section className={`card ${styles.scoreCard}`}>
        <p className="muted">คะแนนของคุณ</p>
        <p className={styles.bigScore}>
          {correct}
          <span className="muted"> / {records.length}</span>
        </p>
        <div className={styles.meter} aria-hidden>
          <span style={{ transform: `translateX(${pct - 100}%)` }} />
        </div>
        <p>{verdict(pct)}</p>
      </section>

      {wrong.length > 0 && (
        <section className="card stack">
          <h2 className={styles.setupTitle}>ข้อที่ผิด ({wrong.length})</h2>
          <ul className={styles.wrongList}>
            {wrong.map((r, i) => (
              <li key={i}>
                <span className="kana" lang="ja" style={{ fontSize: '1.8rem' }}>
                  {r.question.answer.char}
                </span>
                <span>
                  {romajiLabel(r.question.answer)} <span className="muted">({r.question.answer.thai})</span>
                  <br />
                  <span className="small muted">
                    {questionTypeInfo(r.question.type, pack).label}
                    {r.chosen && (
                      <>
                        {' '}
                        · คุณตอบ{' '}
                        {r.question.type === 'charToReading' ? (
                          r.chosen.romaji
                        ) : (
                          <span className="kana" lang="ja">
                            {r.chosen.char}
                          </span>
                        )}
                      </>
                    )}
                  </span>
                </span>
                <Link
                  to={`/${pack.id}/practice/${r.question.answer.id}`}
                  className="btn btn-sm"
                  style={{ marginLeft: 'auto' }}
                >
                  ฝึกเขียน
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className={styles.resultActions}>
        {wrongChars.length > 0 && (
          <button type="button" className="btn btn-primary" onClick={() => onReviewWrong(wrongChars)}>
            สอบเฉพาะตัวที่ผิด
          </button>
        )}
        <button type="button" className={wrongChars.length ? 'btn' : 'btn btn-primary'} onClick={onRetry}>
          ทำอีกครั้ง
        </button>
        <button type="button" className="btn" onClick={onSetup}>
          ตั้งค่าใหม่
        </button>
      </div>
    </div>
  );
}
