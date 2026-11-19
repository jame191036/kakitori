import { ArrowLeft, ArrowRight, BookOpen, ListChecks, PenLine } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { vocabPath } from '../app/paths';
import { getLesson, lessonCode, lessonWords, type VocabDeck, type VocabLesson } from '../data/vocab';
import { N5_DECK } from '../data/vocab/n5';
import { recordActivity, recordAnswer, progressStore } from '../features/progress/progressStore';
import { useSpeech } from '../features/speech/useSpeech';
import { LearnCards } from '../features/vocab/LearnCards';
import {
  deckProgress,
  lessonPassed,
  practiceQuestions,
  testQuestions,
  type VocabQuestion,
} from '../features/vocab/vocabLogic';
import { VocabRunner, type WordResult } from '../features/vocab/VocabRunner';
import { cx } from '../lib/cx';
import { useStore } from '../lib/persistentStore';
import { tone } from '../lib/tone';
import NotFoundPage from './NotFoundPage';
import styles from './VocabLessonPage.module.css';

type Step = 'learn' | 'practice' | 'test';

const STEPS: { id: Step; label: string; icon: typeof BookOpen }[] = [
  { id: 'learn', label: 'เรียน', icon: BookOpen },
  { id: 'practice', label: 'ฝึก', icon: PenLine },
  { id: 'test', label: 'ทดสอบ', icon: ListChecks },
];

/** บทเรียนคำศัพท์ (หนึ่งสถานี): เรียน → ฝึก → ทดสอบ (ถูกครบทุกคำ = ได้ตราสถานี) */
export default function VocabLessonPage() {
  const { lessonId } = useParams();
  const lesson = getLesson(N5_DECK, lessonId);
  if (!lesson) return <NotFoundPage />;
  return <Lesson key={lesson.id} deck={N5_DECK} lesson={lesson} />;
}

interface Session {
  kind: 'practice' | 'test';
  questions: VocabQuestion[];
  key: number;
  /** ผ่านบทนี้แล้วหรือยังตอนเริ่ม (ผลสอบบันทึกระหว่างทำ — ใช้ดูว่าเพิ่งได้ตราในรอบนี้ไหม) */
  passedAtStart: boolean;
}

function Lesson({ deck, lesson }: { deck: VocabDeck; lesson: VocabLesson }) {
  const [params, setParams] = useSearchParams();
  const raw = params.get('step');
  const step: Step = raw === 'practice' || raw === 'test' ? raw : 'learn';
  const data = useStore(progressStore);
  const passed = lessonPassed(deck, lesson, deckProgress(deck, data));
  const words = lessonWords(deck, lesson);
  const code = lessonCode(deck, lesson);
  const at = deck.lessons.indexOf(lesson);
  const prev = deck.lessons[at - 1];
  const next = deck.lessons[at + 1];
  const { available: audio } = useSpeech();

  const [session, setSession] = useState<Session | null>(null);
  const [result, setResult] = useState<{ kind: Session['kind']; results: WordResult[]; passedBefore: boolean } | null>(
    null,
  );

  const go = (s: Step) => {
    setSession(null);
    setResult(null);
    setParams(s === 'learn' ? {} : { step: s });
    window.scrollTo(0, 0);
  };

  const start = (kind: Session['kind'], only?: string[]) => {
    setResult(null);
    setSession({
      kind,
      key: Date.now(),
      passedAtStart: passed,
      questions:
        kind === 'practice'
          ? practiceQuestions(deck, lesson, { audio })
          : testQuestions(deck, lesson, { audio, only }),
    });
  };

  return (
    <div className={cx('container tone', styles.page)} style={tone('n5')}>
      <header className={styles.head}>
        <span className={styles.code} aria-hidden>
          <small>{deck.letter}</small>
          {code.slice(deck.letter.length)}
        </span>
        <div className={styles.headText}>
          <p className={cx('kana', styles.nameJa)} lang="ja">
            {lesson.name}
          </p>
          <h1 className={styles.h1}>{lesson.title}</h1>
          <p className={styles.muted}>
            บทที่ {at + 1} · {words.length} คำ ·{' '}
            {passed ? <strong className={styles.passed}>ผ่านแล้ว ได้ตราสถานี {code}</strong> : 'ยังไม่ผ่าน'}
          </p>
        </div>
      </header>

      <nav className={styles.steps} aria-label="ขั้นตอนในบท">
        {STEPS.map(({ id, label, icon: Icon }, i) => (
          <button
            key={id}
            type="button"
            className={styles.step}
            aria-pressed={step === id}
            onClick={() => go(id)}
          >
            <span className={styles.stepNum} aria-hidden>
              {i + 1}
            </span>
            <Icon size={18} strokeWidth={1.8} aria-hidden />
            {label}
          </button>
        ))}
      </nav>

      {step === 'learn' && <LearnCards words={words} onDone={() => go('practice')} />}

      {step !== 'learn' && session && (
        <VocabRunner
          key={session.key}
          questions={session.questions}
          mode={session.kind}
          onAnswer={(word, correct) =>
            session.kind === 'test' ? recordAnswer(deck.progressKey, word.id, correct) : recordActivity()
          }
          onFinish={(results) => {
            setResult({ kind: session.kind, results, passedBefore: session.passedAtStart });
            setSession(null);
            window.scrollTo(0, 0);
          }}
          onQuit={() => setSession(null)}
        />
      )}

      {step === 'practice' && !session && !result && (
        <Intro
          title="ฝึกคำในบทนี้"
          text={`คำละ 1 ข้อ มีทั้งเลือกคำ ฟังเสียง เรียงตัวอักษร และเขียนด้วยมือ — ข้อที่ผิดจะได้ลองอีกครั้งท้ายชุด (ไม่นับเป็นผลสอบ)`}
          action="เริ่มฝึก"
          onStart={() => start('practice')}
        />
      )}
      {step === 'test' && !session && !result && (
        <Intro
          title={`ทดสอบสถานี ${code}`}
          text={`คำละ 1 ข้อ (${words.length} ข้อ) ตอบถูกครบทุกคำได้ตราสถานี — คำที่ผิดสอบซ้ำได้ ผลสอบจะนัดรอบทบทวนให้`}
          action="เริ่มทดสอบ"
          onStart={() => start('test')}
        />
      )}

      {result?.kind === 'practice' && (
        <section className={cx('card', styles.result)}>
          <p className={styles.resultBig}>ฝึกครบแล้ว!</p>
          <p className={styles.muted}>
            รอบแรกตอบถูก {result.results.filter((r) => r.correct).length} จาก {result.results.length} คำ
          </p>
          <div className={styles.actions}>
            <button type="button" className="btn btn-primary" onClick={() => go('test')}>
              ไปทดสอบ <ArrowRight size={18} strokeWidth={2} aria-hidden />
            </button>
            <button type="button" className="btn" onClick={() => start('practice')}>
              ฝึกอีกรอบ
            </button>
          </div>
        </section>
      )}

      {result?.kind === 'test' && (
        <TestResult
          code={code}
          name={lesson.name}
          results={result.results}
          nowPassed={passed}
          newlyPassed={passed && !result.passedBefore}
          nextHref={next ? vocabPath(next.id) : undefined}
          onRetryWrong={(ids) => start('test', ids)}
          onLearn={() => go('learn')}
        />
      )}

      <nav className={styles.lessonNav} aria-label="บทอื่น">
        {prev ? (
          <Link to={vocabPath(prev.id)} className="btn btn-ghost">
            <ArrowLeft size={18} strokeWidth={1.8} aria-hidden /> {prev.title}
          </Link>
        ) : (
          <span />
        )}
        <Link to={vocabPath()} className="btn btn-ghost">
          แผนที่สาย
        </Link>
        {next ? (
          <Link to={vocabPath(next.id)} className="btn btn-ghost">
            {next.title} <ArrowRight size={18} strokeWidth={1.8} aria-hidden />
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </div>
  );
}

function Intro({ title, text, action, onStart }: { title: string; text: string; action: string; onStart: () => void }) {
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

interface TestResultProps {
  code: string;
  name: string;
  results: readonly WordResult[];
  nowPassed: boolean;
  newlyPassed: boolean;
  nextHref?: string;
  onRetryWrong: (ids: string[]) => void;
  onLearn: () => void;
}

function TestResult({ code, name, results, nowPassed, newlyPassed, nextHref, onRetryWrong, onLearn }: TestResultProps) {
  const wrong = results.filter((r) => !r.correct);
  const score = results.length - wrong.length;
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
        {score} / {results.length}
      </p>
      <p className={styles.muted}>
        {newlyPassed
          ? `ได้ตราสถานี ${code} แล้ว! คำในบทนี้จะถูกนัดทบทวนตามรอบ`
          : nowPassed
            ? 'บทนี้ผ่านแล้ว — ทบทวนได้เรื่อยๆ'
            : 'ตอบถูกครบทุกคำ (สอบซ้ำเฉพาะคำที่ผิดได้) จึงจะได้ตราสถานี'}
      </p>
      {wrong.length > 0 && (
        <ul className={styles.wrongList} aria-label="คำที่ตอบผิด">
          {wrong.map(({ word }) => (
            <li key={word.id}>
              <span className="kana" lang="ja">
                {word.kana}
              </span>
              {word.kanji && (
                <span className={cx('kana', styles.muted)} lang="ja">
                  {word.kanji}
                </span>
              )}
              <span>{word.thai}</span>
            </li>
          ))}
        </ul>
      )}
      <div className={styles.actions}>
        {wrong.length > 0 && (
          <button type="button" className="btn btn-primary" onClick={() => onRetryWrong(wrong.map((r) => r.word.id))}>
            สอบซ้ำเฉพาะคำที่ผิด ({wrong.length})
          </button>
        )}
        {nowPassed && nextHref && (
          <Link to={nextHref} className={cx('btn', wrong.length === 0 && 'btn-primary')}>
            บทถัดไป <ArrowRight size={18} strokeWidth={2} aria-hidden />
          </Link>
        )}
        <button type="button" className="btn" onClick={onLearn}>
          ทวนการ์ดคำ
        </button>
      </div>
    </section>
  );
}
