import { useState } from 'react';
import { useParams, useSearchParams } from 'react-router';
import { travelPath } from '../app/paths';
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
import { getLesson, lessonCode, lessonWords, type LineLesson } from '../data/line';
import { TRAVEL_DECK } from '../data/travel';
import type { TravelDeck } from '../data/travel/types';
import { deckProgress, lessonPassed } from '../features/line/lineLogic';
import { recordAnswer, recordPractice, progressStore } from '../features/progress/progressStore';
import { useSpeech } from '../features/speech/useSpeech';
import { TravelCards } from '../features/travel/TravelCards';
import { practiceQuestions, testQuestions, type TravelQuestion } from '../features/travel/travelLogic';
import { TravelRunner, type PhraseResult } from '../features/travel/TravelRunner';
import { cx } from '../lib/cx';
import { useStore } from '../lib/persistentStore';
import { tone } from '../lib/tone';
import NotFoundPage from './NotFoundPage';

/** บทเรียนท่องเที่ยว (หนึ่งสถานี): เรียน (การ์ดวลี + เสียง) → ฝึก → ทดสอบ (ถูกครบทุกวลี = ได้ตรา) */
export default function TravelLessonPage() {
  const { lessonId } = useParams();
  const lesson = getLesson(TRAVEL_DECK, lessonId);
  if (!lesson) return <NotFoundPage />;
  return <Lesson key={lesson.id} deck={TRAVEL_DECK} lesson={lesson} />;
}

interface Session {
  kind: 'practice' | 'test';
  questions: TravelQuestion[];
  key: number;
  passedAtStart: boolean;
}

function Lesson({ deck, lesson }: { deck: TravelDeck; lesson: LineLesson }) {
  const [params, setParams] = useSearchParams();
  const raw = params.get('step');
  const step: LessonStep = raw === 'practice' || raw === 'test' ? raw : 'learn';
  const data = useStore(progressStore);
  const { available: audio } = useSpeech();
  const passed = lessonPassed(deck, lesson, deckProgress(deck, data));
  const items = lessonWords(deck, lesson);
  const code = lessonCode(deck, lesson);
  const at = deck.lessons.indexOf(lesson);
  const prev = deck.lessons[at - 1];
  const next = deck.lessons[at + 1];
  const says = items.filter((x) => x.kind === 'say').length;

  const [session, setSession] = useState<Session | null>(null);
  const [result, setResult] = useState<{ kind: Session['kind']; results: PhraseResult[]; passedBefore: boolean } | null>(
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
      questions: kind === 'practice' ? practiceQuestions(deck, lesson, { audio }) : testQuestions(deck, lesson, { audio, only }),
    });
  };

  return (
    <div className={cx('container tone', styles.page)} style={tone('travel')}>
      <LessonHeader
        letter={deck.letter}
        code={code}
        name={lesson.name}
        title={lesson.title}
        meta={
          <>
            บทที่ {at + 1} · {items.length} วลี (พูด {says} · ได้ยิน {items.length - says}) ·{' '}
            {passed ? <strong className={styles.passed}>ผ่านแล้ว ได้ตราสถานี {code}</strong> : 'ยังไม่ผ่าน'}
          </>
        }
      />

      <LessonSteps step={step} onStep={go} />

      {step === 'learn' && <TravelCards items={items} onDone={() => go('practice')} />}

      {step !== 'learn' && session && (
        <TravelRunner
          key={session.key}
          deck={deck}
          questions={session.questions}
          mode={session.kind}
          onAnswer={(phrase, correct) =>
            // ทดสอบ = บันทึกผล (นัดรอบทบทวน) · ฝึก = บันทึกแค่ว่าฝึกแล้ว (ไม่กระทบผลสอบ/รอบทบทวน)
            session.kind === 'test' ? recordAnswer(deck.progressKey, phrase.id, correct) : recordPractice(deck.progressKey, phrase.id)
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
          title="ฝึกวลีในบทนี้"
          text={
            audio
              ? 'วลีละ 2 ข้อ: เลือกวลีที่ควรพูดตามสถานการณ์ เรียงวลี และฟังแล้วเลือกความหมาย — ข้อที่ผิดจะได้ลองอีกครั้งท้ายชุด (ไม่นับเป็นผลสอบ)'
              : 'วลีละ 2 ข้อ: เลือกวลีที่ควรพูดตามสถานการณ์ เรียงวลี และอ่านแล้วเลือกความหมาย (เครื่องนี้ไม่มีเสียงภาษาญี่ปุ่น จึงไม่มีข้อฟัง) — ไม่นับเป็นผลสอบ'
          }
          action="เริ่มฝึก"
          onStart={() => start('practice')}
        />
      )}
      {step === 'test' && !session && !result && (
        <LessonIntro
          title={`ทดสอบสถานี ${code}`}
          text={`วลีละ 1 ข้อ (${items.length} ข้อ) — ประโยคที่พูด: เลือกวลีที่ควรพูด · ประโยคที่จะได้ยิน: ${audio ? 'ฟังแล้ว' : 'อ่านแล้ว'}เลือกความหมาย ตอบถูกครบทุกวลีได้ตราสถานี`}
          action="เริ่มทดสอบ"
          onStart={() => start('test')}
        />
      )}

      {result?.kind === 'practice' && (
        <PracticeDone
          correct={result.results.filter((r) => r.correct).length}
          total={result.results.length}
          unit="วลี"
          onTest={() => go('test')}
          onAgain={() => start('practice')}
        />
      )}

      {result?.kind === 'test' && (
        <LessonTestResult
          code={code}
          name={lesson.name}
          unit="วลี"
          items={result.results.map(({ phrase, correct }) => ({
            id: phrase.id,
            correct,
            label: (
              <>
                <span className="kana" lang="ja">
                  {phrase.kana}
                </span>
                <span>{phrase.thai}</span>
              </>
            ),
          }))}
          nowPassed={passed}
          newlyPassed={passed && !result.passedBefore}
          nextHref={next ? travelPath(next.id) : undefined}
          onRetryWrong={(ids) => start('test', ids)}
          onLearn={() => go('learn')}
          learnLabel="ทวนการ์ดวลี"
        />
      )}

      <LessonNav
        prev={prev && { href: travelPath(prev.id), title: prev.title }}
        next={next && { href: travelPath(next.id), title: next.title }}
        lineHref={travelPath()}
      />
    </div>
  );
}
