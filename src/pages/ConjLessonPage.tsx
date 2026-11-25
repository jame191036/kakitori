import { useState } from 'react';
import { useParams, useSearchParams } from 'react-router';
import { conjPath } from '../app/paths';
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
import { CONJ_N5 } from '../data/conj/n5';
import type { ConjDeck } from '../data/conj/types';
import { getLesson, lessonCode, lessonWords, type LineLesson } from '../data/line';
import { ConjCards } from '../features/conj/ConjCards';
import { practiceQuestions, TEST_PER_RULE, testQuestions, type ConjQuestion } from '../features/conj/conjLogic';
import { ConjRunner, type ConjResult } from '../features/conj/ConjRunner';
import { deckProgress, lessonPassed } from '../features/line/lineLogic';
import { progressStore, recordAnswer, recordPractice } from '../features/progress/progressStore';
import { cx } from '../lib/cx';
import { useStore } from '../lib/persistentStore';
import { tone } from '../lib/tone';
import NotFoundPage from './NotFoundPage';

/** บทเรียนผันคำ (หนึ่งสถานี): เรียน (การ์ดกฎ) → ฝึก → ทดสอบ (กฎละ 2 ข้อ ถูกครบทุกกฎ = ได้ตรา) */
export default function ConjLessonPage() {
  const { lessonId } = useParams();
  const lesson = getLesson(CONJ_N5, lessonId);
  if (!lesson) return <NotFoundPage />;
  return <Lesson key={lesson.id} deck={CONJ_N5} lesson={lesson} />;
}

interface Session {
  kind: 'practice' | 'test';
  questions: ConjQuestion[];
  key: number;
  passedAtStart: boolean;
}

function Lesson({ deck, lesson }: { deck: ConjDeck; lesson: LineLesson }) {
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
  // บทแยกกลุ่มไม่มีข้อเรียงคานะ
  const groupLesson = items.every((r) => r.form === null);
  const reverseLesson = items.every((r) => r.reverse);

  const [session, setSession] = useState<Session | null>(null);
  const [result, setResult] = useState<{ kind: Session['kind']; results: ConjResult[]; passedBefore: boolean } | null>(null);

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
            บทที่ {at + 1} · {items.length} กฎ ·{' '}
            {passed ? <strong className={styles.passed}>ผ่านแล้ว ได้ตราสถานี {code}</strong> : 'ยังไม่ผ่าน'}
          </>
        }
      />

      <LessonSteps step={step} onStep={go} />

      {step === 'learn' && <ConjCards items={items} onDone={() => go('practice')} />}

      {step !== 'learn' && session && (
        <ConjRunner
          key={session.key}
          questions={session.questions}
          mode={session.kind}
          onRule={(rule, correct) =>
            // ทดสอบ = บันทึกผล (นัดรอบทบทวน) · ฝึก = บันทึกแค่ว่าฝึกแล้ว (ไม่กระทบผลสอบ/รอบทบทวน)
            session.kind === 'test'
              ? recordAnswer(deck.progressKey, rule.id, correct)
              : recordPractice(deck.progressKey, rule.id)
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
          title="ฝึกผันคำในบทนี้"
          text={
            groupLesson
              ? 'ดูคำแล้วบอกกลุ่ม หรือเลือกคำที่อยู่ในกลุ่มที่ถาม — ข้อที่ผิดจะได้ลองอีกครั้งท้ายชุด (ไม่นับเป็นผลสอบ)'
              : reverseLesson
                ? 'กฎละไม่เกิน 4 ข้อ ดูรูปที่ผันแล้วเลือกหรือเรียงคำเดิม — ข้อที่ผิดจะได้ลองอีกครั้งท้ายชุด (ไม่นับเป็นผลสอบ)'
                : 'กฎละไม่เกิน 4 ข้อ ทั้งเลือกรูปที่ถูก เรียงคานะ และย้อนหาคำเดิม — ข้อที่ผิดจะได้ลองอีกครั้งท้ายชุด (ไม่นับเป็นผลสอบ)'
          }
          action="เริ่มฝึก"
          onStart={() => start('practice')}
        />
      )}
      {step === 'test' && !session && !result && (
        <LessonIntro
          title={`ทดสอบสถานี ${code}`}
          text={`กฎละ ${TEST_PER_RULE} ข้อ (${items.length * TEST_PER_RULE} ข้อ) ${groupLesson ? 'แยกกลุ่มคำ' : reverseLesson ? 'เลือกและเรียงคำเดิม' : 'เลือกรูปที่ถูกและเรียงคานะ'} สุ่มคำใหม่ทุกครั้ง — ต้องถูกทั้ง ${TEST_PER_RULE} ข้อของกฎจึงนับ ถูกครบทุกกฎได้ตราสถานี ผลสอบจะนัดรอบทบทวนให้`}
          action="เริ่มทดสอบ"
          onStart={() => start('test')}
        />
      )}

      {result?.kind === 'practice' && (
        <PracticeDone
          correct={result.results.filter((r) => r.correct).length}
          total={result.results.length}
          unit="กฎ"
          onTest={() => go('test')}
          onAgain={() => start('practice')}
        />
      )}

      {result?.kind === 'test' && (
        <LessonTestResult
          code={code}
          name={lesson.name}
          unit="กฎ"
          items={result.results.map(({ rule, correct }) => ({
            id: rule.id,
            correct,
            label: (
              <>
                <span className="kana" lang="ja">
                  {rule.pattern}
                </span>
                <span>{rule.title}</span>
              </>
            ),
          }))}
          nowPassed={passed}
          newlyPassed={passed && !result.passedBefore}
          nextHref={next ? conjPath(next.id) : undefined}
          onRetryWrong={(ids) => start('test', ids)}
          onLearn={() => go('learn')}
          learnLabel="ทวนการ์ดกฎ"
        />
      )}

      <LessonNav
        prev={prev && { href: conjPath(prev.id), title: prev.title }}
        next={next && { href: conjPath(next.id), title: next.title }}
        lineHref={conjPath()}
      />
    </div>
  );
}
