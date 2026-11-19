import { ArrowRight, RotateCcw } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router';
import type { LineDeck } from '../../data/line';
import {
  deckProgress,
  dueWords,
  nextWordReview,
  REVIEW_BATCH_SIZE,
  weakWords,
  wordsAnswered,
} from '../../features/line/lineLogic';
import { MASTERY_LABEL, masteryLevel } from '../../features/progress/progressLogic';
import { progressStore, recordAnswer } from '../../features/progress/progressStore';
import { cx } from '../../lib/cx';
import { daysFromNowLabel } from '../../lib/day';
import { useStore } from '../../lib/persistentStore';
import { tone, type Tone } from '../../lib/tone';
import { useNow } from '../../lib/useNow';
import styles from './LineReviewPage.module.css';

type ReviewSet = 'due' | 'weak';

export interface ReviewResultItem {
  id: string;
  correct: boolean;
}

export interface RunnerArgs<Q> {
  key: number;
  questions: Q[];
  /** เรียกครั้งแรกที่ตอบแต่ละรายการ — บันทึกผลเหมือนแบบทดสอบในบท */
  onAnswer: (id: string, correct: boolean) => void;
  onFinish: (results: ReviewResultItem[]) => void;
  onQuit: () => void;
}

/** ข้อความของรายการในรายการที่ผิด/ผิดบ่อย */
export interface ItemLabel {
  /** ตัวหลัก (ภาษาญี่ปุ่น) */
  main: string;
  /** ตัวรอง เช่น คันจิของคำ หรือคำอ่านของคันจิ */
  sub?: string;
  thai: string;
}

export interface LineReviewPageProps<T extends { id: string }, Q> {
  deck: LineDeck<T>;
  lineTone: Tone;
  /** ตัวอักษรในวงป้าย */
  glyph: string;
  title: string;
  /** ชื่อเรียกรายการ เช่น "คำ" / "คันจิ" */
  noun: string;
  /** ลักษณนาม เช่น "คำ" / "ตัว" */
  unit: string;
  /** กลับไปแผนที่สาย */
  lineHref: string;
  lineLabel: string;
  makeQuestions: (items: T[]) => Q[];
  renderRunner: (args: RunnerArgs<Q>) => ReactNode;
  itemLabel: (item: T) => ItemLabel;
}

interface Session<Q> {
  set: ReviewSet;
  questions: Q[];
  key: number;
}

function ItemText({ label }: { label: ItemLabel }) {
  return (
    <>
      <span className="kana" lang="ja">
        {label.main}
      </span>
      {label.sub && (
        <span className={cx('kana', styles.muted)} lang="ja">
          {label.sub}
        </span>
      )}
      <span className={styles.wordThai}>{label.thai}</span>
    </>
  );
}

/**
 * หน้าทบทวนของสายบทเรียน (คำศัพท์ / คันจิ): รายการที่ถึงรอบ (กล่องทบทวน 1→2→4→7→14 วัน แบบเดียวกับตัวอักษร)
 * และรายการที่ผิดบ่อย · ผลทบทวนบันทึกเหมือนแบบทดสอบในบท · ?start=due|weak (จากการ์ด "วันนี้") = เริ่มทบทวนทันที
 */
export function LineReviewPage<T extends { id: string }, Q>({
  deck,
  lineTone,
  glyph,
  title,
  noun,
  unit,
  lineHref,
  lineLabel,
  makeQuestions,
  renderRunner,
  itemLabel,
}: LineReviewPageProps<T, Q>) {
  const now = useNow();
  const progress = deckProgress(deck, useStore(progressStore));
  const [params, setParams] = useSearchParams();

  /** ชุดทบทวนครั้งละไม่เกิน REVIEW_BATCH_SIZE รายการ — ที่น่าห่วงที่สุดก่อน */
  const makeSession = (set: ReviewSet): Session<Q> | null => {
    const p = deckProgress(deck, progressStore.get());
    const list = set === 'due' ? dueWords(deck, p, Date.now()) : weakWords(deck, p);
    const items = list.slice(0, REVIEW_BATCH_SIZE).map((x) => x.word);
    return items.length ? { set, key: Date.now(), questions: makeQuestions(items) } : null;
  };

  const [session, setSession] = useState<Session<Q> | null>(() => {
    const start = params.get('start');
    return start === 'due' || start === 'weak' ? makeSession(start) : null;
  });
  const [result, setResult] = useState<{ set: ReviewSet; results: ReviewResultItem[] } | null>(null);

  useEffect(() => {
    if (params.has('start')) setParams({}, { replace: true });
  }, [params, setParams]);

  const start = (set: ReviewSet) => {
    setResult(null);
    setSession(makeSession(set));
    window.scrollTo(0, 0);
  };

  const due = dueWords(deck, progress, now);
  const weak = weakWords(deck, progress);
  const upcoming = nextWordReview(deck, progress, now);
  const answered = wordsAnswered(progress);
  const levels = [0, 0, 0, 0];
  for (const w of Object.values(deck.words)) levels[masteryLevel(progress?.[w.id])]!++;
  const moreDue = result?.set === 'due' ? due.length : 0;

  return (
    <div className={cx('container tone', styles.page)} style={tone(lineTone)}>
      <header className={styles.head}>
        <span className={cx('kana', styles.badge)} lang="ja" aria-hidden>
          {glyph}
        </span>
        <div className={styles.headText}>
          {/* 復習 (fukushū) = ทบทวน */}
          <p className={cx('kana', styles.lineJa)} lang="ja">
            復習
          </p>
          <h1 className={styles.h1}>{title}</h1>
          <p className={styles.muted}>
            ระบบนัดทบทวน{noun}ที่ใกล้จะลืม (ห่างขึ้นเรื่อยๆ 1 → 2 → 4 → 7 → 14 วัน) และรวม{noun}ที่ผิดบ่อยไว้ให้ฝึกซ้ำ —
            ผลทบทวนนับเหมือนแบบทดสอบในบท
          </p>
        </div>
      </header>

      {session &&
        renderRunner({
          key: session.key,
          questions: session.questions,
          onAnswer: (id, correct) => recordAnswer(deck.progressKey, id, correct),
          onFinish: (results) => {
            setResult({ set: session.set, results });
            setSession(null);
            window.scrollTo(0, 0);
          },
          onQuit: () => setSession(null),
        })}

      {!session && result && (
        <section className={cx('card', styles.result)} aria-live="polite">
          <p className={styles.muted}>
            {result.set === 'due' ? `ทบทวน${noun}ที่ถึงรอบ` : `ฝึก${noun}ที่ผิดบ่อย`}
          </p>
          <p className={styles.resultBig}>
            {result.results.filter((r) => r.correct).length} / {result.results.length}
          </p>
          <p className={styles.muted}>
            {result.results.every((r) => r.correct)
              ? `ถูกหมดทุก${unit}! จะกลับมาให้ทบทวนห่างออกไปอีก`
              : `${noun}ที่ผิดจะกลับไปเริ่มรอบใหม่ และกลับมาให้ทบทวนเร็วขึ้น`}
          </p>
          {result.results.some((r) => !r.correct) && (
            <ul className={styles.wordList} aria-label={`${noun}ที่ตอบผิด`}>
              {result.results
                .filter((r) => !r.correct)
                .map((r) => (
                  <li key={r.id}>
                    <ItemText label={itemLabel(deck.words[r.id]!)} />
                  </li>
                ))}
            </ul>
          )}
          <div className={styles.actions}>
            {moreDue > 0 && (
              <button type="button" className="btn btn-primary" onClick={() => start('due')}>
                ทบทวนต่อ (เหลือ {moreDue} {unit}) <ArrowRight size={18} strokeWidth={2} aria-hidden />
              </button>
            )}
            <button type="button" className={cx('btn', moreDue === 0 && 'btn-primary')} onClick={() => setResult(null)}>
              กลับหน้าทบทวน
            </button>
            <Link to={lineHref} className="btn btn-ghost">
              แผนที่สาย
            </Link>
          </div>
        </section>
      )}

      {!session && !result && !answered && (
        <section className={cx('card', styles.empty)}>
          <p>
            ยังไม่มี{noun}ที่ต้องทบทวน — ทำแบบทดสอบในบทเรียนก่อน แล้วระบบจะนัดวันทบทวนให้แต่ละ{unit}
          </p>
          <Link to={lineHref} className="btn btn-primary">
            {lineLabel} <ArrowRight size={18} strokeWidth={2} aria-hidden />
          </Link>
        </section>
      )}

      {!session && !result && answered && (
        <>
          <div className={styles.sets}>
            <section className={cx(styles.set, due.length > 0 && styles.setHot)} aria-labelledby="due-title">
              <h2 id="due-title" className={styles.setTitle}>
                ถึงรอบทบทวน
              </h2>
              <p className={styles.setNum}>
                <strong>{due.length}</strong> {unit}
              </p>
              <p className={styles.muted}>
                {due.length > 0
                  ? due.length > REVIEW_BATCH_SIZE
                    ? `ทบทวนครั้งละ ${REVIEW_BATCH_SIZE} ${unit} เริ่มจาก${noun}ที่ใกล้ลืมที่สุด`
                    : `${noun}ที่ถึงวันนัดแล้ว ทบทวนก่อนจะลืม`
                  : upcoming
                    ? `วันนี้ไม่มี${noun}ถึงรอบ · รอบถัดไป ${daysFromNowLabel(upcoming.inDays)} (${upcoming.count} ${unit})`
                    : `วันนี้ไม่มี${noun}ถึงรอบ`}
              </p>
              <button
                type="button"
                className="btn btn-primary"
                disabled={due.length === 0}
                onClick={() => start('due')}
              >
                <RotateCcw size={16} strokeWidth={2} aria-hidden /> ทบทวน {Math.min(due.length, REVIEW_BATCH_SIZE)} {unit}
              </button>
            </section>

            <section className={styles.set} aria-labelledby="weak-title">
              <h2 id="weak-title" className={styles.setTitle}>
                ตอบผิดบ่อย
              </h2>
              <p className={styles.setNum}>
                <strong>{weak.length}</strong> {unit}
              </p>
              <p className={styles.muted}>
                {weak.length > 0 ? `${noun}ที่เคยตอบผิดและยังจำได้ไม่แม่น` : `ยังไม่มี${noun}ที่ผิดบ่อย เยี่ยมมาก`}
              </p>
              <button type="button" className="btn" disabled={weak.length === 0} onClick={() => start('weak')}>
                ฝึก {Math.min(weak.length, REVIEW_BATCH_SIZE)} {unit}
              </button>
            </section>
          </div>

          <section aria-labelledby="mastery-title">
            <h2 id="mastery-title" className={styles.sectionTitle}>
              ความคืบหน้าทั้งสาย
            </h2>
            <ul className={styles.levels}>
              {levels.map((n, i) => (
                <li key={MASTERY_LABEL[i]} className={styles[`level${i}`]}>
                  <strong>{n}</strong>
                  <span>{MASTERY_LABEL[i]}</span>
                </li>
              ))}
            </ul>
            <p className={cx('small', styles.muted)}>
              จำได้แล้ว = ตอบถูกในรอบทบทวนต่อเนื่องจนถึงกล่องสุดท้าย (อย่างน้อย 5 วัน) · {noun}เหล่านี้จะกลับมาให้ทบทวนทุก
              ~2 สัปดาห์
            </p>
          </section>

          {weak.length > 0 && (
            <section aria-labelledby="weak-list-title">
              <h2 id="weak-list-title" className={styles.sectionTitle}>
                {noun}ที่ผิดบ่อย
              </h2>
              <ul className={styles.wordList}>
                {weak.slice(0, 30).map(({ word, stat }) => (
                  <li key={word.id}>
                    <ItemText label={itemLabel(word)} />
                    <span className={styles.wrongCount}>ผิด {stat.wrong} ครั้ง</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
