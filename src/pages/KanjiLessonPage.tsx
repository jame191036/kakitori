import { useState } from 'react';
import { useParams, useSearchParams } from 'react-router';
import { kanjiPath } from '../app/paths';
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
import { KANJI_N5 } from '../data/kanji/n5';
import type { KanjiDeck } from '../data/kanji/types';
import { getLesson, lessonCode, lessonWords, type LineLesson } from '../data/line';
import { N5_DECK } from '../data/vocab/n5';
import { KanjiCards } from '../features/kanji/KanjiCards';
import { practiceQuestions, testQuestions, type KanjiQuestion } from '../features/kanji/kanjiLogic';
import { KanjiRunner, type KanjiResult } from '../features/kanji/KanjiRunner';
import { deckProgress, lessonPassed } from '../features/line/lineLogic';
import { recordAnswer, recordPractice, progressStore } from '../features/progress/progressStore';
import { cx } from '../lib/cx';
import { useStore } from '../lib/persistentStore';
import { tone } from '../lib/tone';
import NotFoundPage from './NotFoundPage';

/** บทเรียนคันจิ (หนึ่งสถานี): เรียน (ลำดับขีด คำอ่าน คำตัวอย่าง) → ฝึกเขียน → ทดสอบ (ถูกครบทุกตัว = ได้ตรา) */
export default function KanjiLessonPage() {
  const { lessonId } = useParams();
  const lesson = getLesson(KANJI_N5, lessonId);
  if (!lesson) return <NotFoundPage />;
  return <Lesson key={lesson.id} deck={KANJI_N5} lesson={lesson} />;
}

interface Session {
  kind: 'practice' | 'test';
  questions: KanjiQuestion[];
  key: number;
  passedAtStart: boolean;
}

function Lesson({ deck, lesson }: { deck: KanjiDeck; lesson: LineLesson }) {
  const [params, setParams] = useSearchParams();
  const raw = params.get('step');
  const step: LessonStep = raw === 'practice' || raw === 'test' ? raw : 'learn';
  const data = useStore(progressStore);
  const passed = lessonPassed(deck, lesson, deckProgress(deck, data));
  const items = lessonWords(deck, lesson);
  const code = lessonCode(deck, lesson);
  const at = deck.lessons.indexOf(lesson);
  const prev = deck.lessons[at - 1];
  const next = deck.lessons[at + 1];

  const [session, setSession] = useState<Session | null>(null);
  const [result, setResult] = useState<{ kind: Session['kind']; results: KanjiResult[]; passedBefore: boolean } | null>(
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
        kind === 'practice' ? practiceQuestions(deck, lesson, N5_DECK) : testQuestions(deck, lesson, N5_DECK, { only }),
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
            บทที่ {at + 1} · {items.length} ตัว ·{' '}
            {passed ? <strong className={styles.passed}>ผ่านแล้ว ได้ตราสถานี {code}</strong> : 'ยังไม่ผ่าน'}
          </>
        }
      />

      <LessonSteps step={step} onStep={go} />

      {step === 'learn' && <KanjiCards items={items} vocab={N5_DECK} onDone={() => go('practice')} />}

      {step !== 'learn' && session && (
        <KanjiRunner
          key={session.key}
          questions={session.questions}
          mode={session.kind}
          onAnswer={(kanji, correct) =>
            // ทดสอบ = บันทึกผล (นัดรอบทบทวน) · ฝึก = บันทึกแค่ว่าฝึกแล้ว (ไม่กระทบผลสอบ/รอบทบทวน)
            session.kind === 'test'
              ? recordAnswer(deck.progressKey, kanji.id, correct)
              : recordPractice(deck.progressKey, kanji.id)
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
          title="ฝึกเขียนคันจิในบทนี้"
          text="เขียนตามเส้นจางทีละขีดครบทุกตัว แล้วตามด้วยข้อจำตัวและอ่านคำ — ข้อที่ผิดจะได้ลองอีกครั้งท้ายชุด (ไม่นับเป็นผลสอบ)"
          action="เริ่มฝึก"
          onStart={() => start('practice')}
        />
      )}
      {step === 'test' && !session && !result && (
        <LessonIntro
          title={`ทดสอบสถานี ${code}`}
          text={`ตัวละ 1 ข้อ (${items.length} ข้อ) ทั้งความหมาย ตัวคันจิ และคำอ่าน — ตอบถูกครบทุกตัวได้ตราสถานี ผลสอบจะนัดรอบทบทวนให้`}
          action="เริ่มทดสอบ"
          onStart={() => start('test')}
        />
      )}

      {result?.kind === 'practice' && (
        <PracticeDone
          correct={result.results.filter((r) => r.correct).length}
          total={result.results.length}
          unit="ตัว"
          onTest={() => go('test')}
          onAgain={() => start('practice')}
        />
      )}

      {result?.kind === 'test' && (
        <LessonTestResult
          code={code}
          name={lesson.name}
          unit="ตัว"
          items={result.results.map(({ kanji, correct }) => ({
            id: kanji.id,
            correct,
            label: (
              <>
                <span className="kana" lang="ja">
                  {kanji.char}
                </span>
                <span>{kanji.thai}</span>
              </>
            ),
          }))}
          nowPassed={passed}
          newlyPassed={passed && !result.passedBefore}
          nextHref={next ? kanjiPath(next.id) : undefined}
          onRetryWrong={(ids) => start('test', ids)}
          onLearn={() => go('learn')}
          learnLabel="ทวนการ์ดคันจิ"
        />
      )}

      <LessonNav
        prev={prev && { href: kanjiPath(prev.id), title: prev.title }}
        next={next && { href: kanjiPath(next.id), title: next.title }}
        lineHref={kanjiPath()}
      />
    </div>
  );
}
