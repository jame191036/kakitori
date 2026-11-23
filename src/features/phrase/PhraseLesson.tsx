import { useState } from 'react';
import { useSearchParams } from 'react-router';
import {
  LessonHeader,
  LessonIntro,
  LessonNav,
  LessonSteps,
  LessonTestResult,
  PracticeDone,
  type LessonStep,
} from '../../components/line/LessonParts';
import styles from '../../components/line/LessonPage.module.css';
import { lessonCode, lessonWords, type LineLesson } from '../../data/line';
import { faceText } from '../../data/phrase/build';
import type { Phrase, PhraseDeck } from '../../data/phrase/types';
import { cx } from '../../lib/cx';
import { useStore } from '../../lib/persistentStore';
import { tone, type Tone } from '../../lib/tone';
import { deckProgress, lessonPassed } from '../line/lineLogic';
import { recordAnswer, recordPractice, progressStore } from '../progress/progressStore';
import { useSpeech } from '../speech/useSpeech';
import { DialogueCard } from './DialogueCard';
import { PhraseCards } from './PhraseCards';
import { practiceQuestions, testQuestions, type PhraseQuestion } from './phraseLogic';
import { PhraseRunner, type PhraseResult } from './PhraseRunner';

interface Session {
  kind: 'practice' | 'test';
  questions: PhraseQuestion[];
  key: number;
  passedAtStart: boolean;
}

interface PhraseLessonProps {
  deck: PhraseDeck;
  lesson: LineLesson;
  lineTone: Tone;
  /** URL ของบท (ไม่ใส่ id = แผนที่สาย) */
  pathOf: (lessonId?: string) => string;
}

/** บทเรียนของสายวลี (หนึ่งสถานี): เรียน (การ์ดวลี + เสียง + บทสนทนาตัวอย่าง) → ฝึก → ทดสอบ (ถูกครบทุกวลี = ได้ตรา) */
export function PhraseLesson({ deck, lesson, lineTone, pathOf }: PhraseLessonProps) {
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
  const count = (kind: Phrase['kind']) => items.filter((x) => x.kind === kind).length;
  const signsOnly = count('sign') === items.length;
  const dialogue = deck.dialogues?.[lesson.id];
  const hasHear = count('hear') > 0;
  // บทที่มีวลีชนิดเดียว (เช่น พูดล้วน) ไม่ต้องแยกจำนวน — ไม่ขึ้น "ได้ยิน 0"
  const kindsText = signsOnly
    ? `${items.length} ป้าย`
    : hasHear && count('say') > 0
      ? `${items.length} วลี (พูด ${count('say')} · ได้ยิน ${count('hear')})`
      : `${items.length} วลี`;

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
    <div className={cx('container tone', styles.page)} style={tone(lineTone)}>
      <LessonHeader
        letter={deck.letter}
        code={code}
        name={lesson.name}
        title={lesson.title}
        meta={
          <>
            บทที่ {at + 1} · {kindsText} ·{' '}
            {passed ? <strong className={styles.passed}>ผ่านแล้ว ได้ตราสถานี {code}</strong> : 'ยังไม่ผ่าน'}
          </>
        }
      />

      <LessonSteps step={step} onStep={go} />

      {step === 'learn' && <PhraseCards items={items} onDone={() => go('practice')} />}
      {step === 'learn' && dialogue && <DialogueCard dialogue={dialogue} />}

      {step !== 'learn' && session && (
        <PhraseRunner
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
            signsOnly
              ? 'ป้ายละ 2 ข้อ: ดูป้ายแล้วเลือกความหมาย และดูความหมายแล้วเลือกป้าย — ข้อที่ผิดจะได้ลองอีกครั้งท้ายชุด (ไม่นับเป็นผลสอบ)'
              : audio
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
          text={
            signsOnly
              ? `ป้ายละ 1 ข้อ (${items.length} ข้อ) ดูป้ายแล้วเลือกความหมาย — ตอบถูกครบทุกป้ายได้ตราสถานี`
              : hasHear
                ? `วลีละ 1 ข้อ (${items.length} ข้อ) — ประโยคที่พูด: เลือกวลีที่ควรพูด · ประโยคที่จะได้ยิน: ${audio ? 'ฟังแล้ว' : 'อ่านแล้ว'}เลือกความหมาย ตอบถูกครบทุกวลีได้ตราสถานี`
                : `วลีละ 1 ข้อ (${items.length} ข้อ) เลือกวลีที่ควรพูดตามสถานการณ์ — ตอบถูกครบทุกวลีได้ตราสถานี`
          }
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
                  {faceText(phrase)}
                </span>
                <span>{phrase.thai}</span>
              </>
            ),
          }))}
          nowPassed={passed}
          newlyPassed={passed && !result.passedBefore}
          nextHref={next ? pathOf(next.id) : undefined}
          onRetryWrong={(ids) => start('test', ids)}
          onLearn={() => go('learn')}
          learnLabel="ทวนการ์ดวลี"
        />
      )}

      <LessonNav
        prev={prev && { href: pathOf(prev.id), title: prev.title }}
        next={next && { href: pathOf(next.id), title: next.title }}
        lineHref={pathOf()}
      />
    </div>
  );
}
