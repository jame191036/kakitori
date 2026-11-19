import { useState } from 'react';
import { useParams, useSearchParams } from 'react-router';
import { vocabPath } from '../app/paths';
import {
  LessonHeader,
  LessonIntro,
  LessonNav,
  LessonSteps,
  LessonTestResult,
  PracticeDone,
  type LessonStep,
} from '../components/line/LessonParts';
import styles from '../components/line/LessonPage.module.css';
import { getLesson, lessonCode, lessonWords, type VocabDeck, type VocabLesson } from '../data/vocab';
import { N5_DECK } from '../data/vocab/n5';
import { recordAnswer, recordPractice, progressStore } from '../features/progress/progressStore';
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
  const step: LessonStep = raw === 'practice' || raw === 'test' ? raw : 'learn';
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

  const go = (s: LessonStep) => {
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
      <LessonHeader
        letter={deck.letter}
        code={code}
        name={lesson.name}
        title={lesson.title}
        meta={
          <>
            บทที่ {at + 1} · {words.length} คำ ·{' '}
            {passed ? <strong className={styles.passed}>ผ่านแล้ว ได้ตราสถานี {code}</strong> : 'ยังไม่ผ่าน'}
          </>
        }
      />

      <LessonSteps step={step} onStep={go} />

      {step === 'learn' && <LearnCards words={words} onDone={() => go('practice')} />}

      {step !== 'learn' && session && (
        <VocabRunner
          key={session.key}
          questions={session.questions}
          mode={session.kind}
          onAnswer={(word, correct) =>
            // ทดสอบ = บันทึกผล (นัดรอบทบทวน) · ฝึก = บันทึกแค่ว่าฝึกแล้ว (ไม่กระทบผลสอบ/รอบทบทวน)
            session.kind === 'test'
              ? recordAnswer(deck.progressKey, word.id, correct)
              : recordPractice(deck.progressKey, word.id)
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
        <LessonIntro
          title="ฝึกคำในบทนี้"
          text="คำละ 1 ข้อ มีทั้งเลือกคำ ฟังเสียง เรียงตัวอักษร และเขียนด้วยมือ — ข้อที่ผิดจะได้ลองอีกครั้งท้ายชุด (ไม่นับเป็นผลสอบ)"
          action="เริ่มฝึก"
          onStart={() => start('practice')}
        />
      )}
      {step === 'test' && !session && !result && (
        <LessonIntro
          title={`ทดสอบสถานี ${code}`}
          text={`คำละ 1 ข้อ (${words.length} ข้อ) ตอบถูกครบทุกคำได้ตราสถานี — คำที่ผิดสอบซ้ำได้ ผลสอบจะนัดรอบทบทวนให้`}
          action="เริ่มทดสอบ"
          onStart={() => start('test')}
        />
      )}

      {result?.kind === 'practice' && (
        <PracticeDone
          correct={result.results.filter((r) => r.correct).length}
          total={result.results.length}
          unit="คำ"
          onTest={() => go('test')}
          onAgain={() => start('practice')}
        />
      )}

      {result?.kind === 'test' && (
        <LessonTestResult
          code={code}
          name={lesson.name}
          unit="คำ"
          items={result.results.map(({ word, correct }) => ({
            id: word.id,
            correct,
            label: (
              <>
                <span className="kana" lang="ja">
                  {word.kana}
                </span>
                {word.kanji && (
                  <span className={cx('kana', styles.muted)} lang="ja">
                    {word.kanji}
                  </span>
                )}
                <span>{word.thai}</span>
              </>
            ),
          }))}
          nowPassed={passed}
          newlyPassed={passed && !result.passedBefore}
          nextHref={next ? vocabPath(next.id) : undefined}
          onRetryWrong={(ids) => start('test', ids)}
          onLearn={() => go('learn')}
          learnLabel="ทวนการ์ดคำ"
        />
      )}

      <LessonNav
        prev={prev && { href: vocabPath(prev.id), title: prev.title }}
        next={next && { href: vocabPath(next.id), title: next.title }}
        lineHref={vocabPath()}
      />
    </div>
  );
}
