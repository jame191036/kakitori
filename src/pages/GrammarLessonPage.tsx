import { useState } from 'react';
import { useParams, useSearchParams } from 'react-router';
import { grammarPath } from '../app/paths';
import {
  LessonHeader,
  LessonIntro,
  LessonNav,
  LessonSteps,
  LessonTestResult,
  PracticeDone,
  RelatedLessons,
  type LessonStep,
} from '../components/line/LessonParts';
import styles from '../components/line/LessonPage.module.css';
import { GRAMMAR_N5 } from '../data/grammar/n5';
import type { GrammarDeck } from '../data/grammar/types';
import { getLesson, lessonCode, lessonWords, type LineLesson } from '../data/line';
import { GrammarCards } from '../features/grammar/GrammarCards';
import { practiceQuestions, testQuestions, type GrammarQuestion } from '../features/grammar/grammarLogic';
import { GrammarRunner, type GrammarResult } from '../features/grammar/GrammarRunner';
import { conjLinksFor } from '../features/line/formLinks';
import { deckProgress, lessonPassed } from '../features/line/lineLogic';
import { recordAnswer, recordPractice, progressStore } from '../features/progress/progressStore';
import { cx } from '../lib/cx';
import { useStore } from '../lib/persistentStore';
import { tone } from '../lib/tone';
import NotFoundPage from './NotFoundPage';

/** บทเรียนไวยากรณ์ (หนึ่งสถานี): เรียน (รูปประโยค คำอธิบาย ประโยคตัวอย่าง) → ฝึก → ทดสอบ (ถูกครบทุกรูป = ได้ตรา) */
export default function GrammarLessonPage() {
  const { lessonId } = useParams();
  const lesson = getLesson(GRAMMAR_N5, lessonId);
  if (!lesson) return <NotFoundPage />;
  return <Lesson key={lesson.id} deck={GRAMMAR_N5} lesson={lesson} />;
}

interface Session {
  kind: 'practice' | 'test';
  questions: GrammarQuestion[];
  key: number;
  passedAtStart: boolean;
}

function Lesson({ deck, lesson }: { deck: GrammarDeck; lesson: LineLesson }) {
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
  const [result, setResult] = useState<{ kind: Session['kind']; results: GrammarResult[]; passedBefore: boolean } | null>(
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
      questions: kind === 'practice' ? practiceQuestions(deck, lesson) : testQuestions(deck, lesson, { only }),
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
            บทที่ {at + 1} · {items.length} รูป ·{' '}
            {passed ? <strong className={styles.passed}>ผ่านแล้ว ได้ตราสถานี {code}</strong> : 'ยังไม่ผ่าน'}
          </>
        }
      />

      <LessonSteps step={step} onStep={go} />

      {step === 'learn' && <GrammarCards items={items} onDone={() => go('practice')} />}

      {step !== 'learn' && session && (
        <GrammarRunner
          key={session.key}
          questions={session.questions}
          mode={session.kind}
          onAnswer={(point, correct) =>
            // ทดสอบ = บันทึกผล (นัดรอบทบทวน) · ฝึก = บันทึกแค่ว่าฝึกแล้ว (ไม่กระทบผลสอบ/รอบทบทวน)
            session.kind === 'test'
              ? recordAnswer(deck.progressKey, point.id, correct)
              : recordPractice(deck.progressKey, point.id)
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
          title="ฝึกไวยากรณ์ในบทนี้"
          text="ประโยคตัวอย่างละ 1 ข้อ ทั้งเติมคำที่หายไป แปลประโยค และเรียงประโยค — ข้อที่ผิดจะได้ลองอีกครั้งท้ายชุด (ไม่นับเป็นผลสอบ)"
          action="เริ่มฝึก"
          onStart={() => start('practice')}
        />
      )}
      {step === 'test' && !session && !result && (
        <LessonIntro
          title={`ทดสอบสถานี ${code}`}
          text={`รูปละ 1 ข้อ (${items.length} ข้อ) เติมคำที่หายไปหรือแปลประโยค — ตอบถูกครบทุกรูปได้ตราสถานี ผลสอบจะนัดรอบทบทวนให้`}
          action="เริ่มทดสอบ"
          onStart={() => start('test')}
        />
      )}

      {result?.kind === 'practice' && (
        <PracticeDone
          correct={result.results.filter((r) => r.correct).length}
          total={result.results.length}
          unit="รูป"
          onTest={() => go('test')}
          onAgain={() => start('practice')}
        />
      )}

      {result?.kind === 'test' && (
        <LessonTestResult
          code={code}
          name={lesson.name}
          unit="รูป"
          items={result.results.map(({ point, correct }) => ({
            id: point.id,
            correct,
            label: (
              <>
                <span className="kana" lang="ja">
                  {point.pattern}
                </span>
                <span>{point.title}</span>
              </>
            ),
          }))}
          nowPassed={passed}
          newlyPassed={passed && !result.passedBefore}
          nextHref={next ? grammarPath(next.id) : undefined}
          onRetryWrong={(ids) => start('test', ids)}
          onLearn={() => go('learn')}
          learnLabel="ทวนการ์ดไวยากรณ์"
        />
      )}

      {(step === 'learn' || result) && <RelatedLessons title="ฝึกผันเพิ่ม" links={conjLinksFor(lesson.id)} />}

      <LessonNav
        prev={prev && { href: grammarPath(prev.id), title: prev.title }}
        next={next && { href: grammarPath(next.id), title: next.title }}
        lineHref={grammarPath()}
      />
    </div>
  );
}
