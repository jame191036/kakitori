import { ArrowRight, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { vocabPath } from '../app/paths';
import type { VocabDeck, VocabWord } from '../data/vocab';
import { N5_DECK } from '../data/vocab/n5';
import { MASTERY_LABEL, masteryLevel } from '../features/progress/progressLogic';
import { progressStore, recordAnswer } from '../features/progress/progressStore';
import { useSpeech } from '../features/speech/useSpeech';
import {
  deckProgress,
  dueWords,
  nextWordReview,
  reviewQuestions,
  VOCAB_REVIEW_BATCH,
  weakWords,
  wordsAnswered,
  type VocabQuestion,
} from '../features/vocab/vocabLogic';
import { VocabRunner, type WordResult } from '../features/vocab/VocabRunner';
import { cx } from '../lib/cx';
import { daysFromNowLabel } from '../lib/day';
import { useStore } from '../lib/persistentStore';
import { tone } from '../lib/tone';
import { useNow } from '../lib/useNow';
import styles from './VocabReviewPage.module.css';

type ReviewSet = 'due' | 'weak';

interface Session {
  set: ReviewSet;
  questions: VocabQuestion[];
  key: number;
}

const SET_TITLE: Record<ReviewSet, string> = { due: 'ทบทวนคำที่ถึงรอบ', weak: 'ฝึกคำที่ผิดบ่อย' };

/** คำของชุดทบทวน (ครั้งละไม่เกิน VOCAB_REVIEW_BATCH คำ — คำที่น่าห่วงที่สุดก่อน) */
function wordsFor(deck: VocabDeck, set: ReviewSet, now: number): VocabWord[] {
  const progress = deckProgress(deck, progressStore.get());
  const list = set === 'due' ? dueWords(deck, progress, now) : weakWords(deck, progress);
  return list.slice(0, VOCAB_REVIEW_BATCH).map((x) => x.word);
}

/**
 * ทบทวนคำศัพท์ N5: คำที่ถึงรอบ (กล่องทบทวน 1→2→4→7→14 วัน แบบเดียวกับตัวอักษร) และคำที่ผิดบ่อย
 * ผลทบทวนบันทึกเหมือนแบบทดสอบในบท (เลื่อน/รีเซ็ตกล่อง และนับเป็นการตอบถูกของคำนั้น)
 */
export default function VocabReviewPage() {
  const deck = N5_DECK;
  const now = useNow();
  const progress = deckProgress(deck, useStore(progressStore));
  const { available: audio } = useSpeech();
  const [params, setParams] = useSearchParams();

  const makeSession = (set: ReviewSet): Session | null => {
    const words = wordsFor(deck, set, Date.now());
    return words.length ? { set, key: Date.now(), questions: reviewQuestions(deck, words, { audio }) } : null;
  };

  // ?start=due|weak (จากการ์ด "วันนี้") = เริ่มทบทวนทันที
  const [session, setSession] = useState<Session | null>(() => {
    const start = params.get('start');
    return start === 'due' || start === 'weak' ? makeSession(start) : null;
  });
  const [result, setResult] = useState<{ set: ReviewSet; results: WordResult[] } | null>(null);

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

  return (
    <div className={cx('container tone', styles.page)} style={tone('n5')}>
      <header className={styles.head}>
        <span className={cx('kana', styles.badge)} lang="ja" aria-hidden>
          復
        </span>
        <div className={styles.headText}>
          {/* 復習 (fukushū) = ทบทวน */}
          <p className={cx('kana', styles.lineJa)} lang="ja">
            復習
          </p>
          <h1 className={styles.h1}>ทบทวนคำศัพท์ N5</h1>
          <p className={styles.muted}>
            ระบบนัดทบทวนคำที่ใกล้จะลืม (ห่างขึ้นเรื่อยๆ 1 → 2 → 4 → 7 → 14 วัน) และรวมคำที่ผิดบ่อยไว้ให้ฝึกซ้ำ —
            ผลทบทวนนับเหมือนแบบทดสอบในบท
          </p>
        </div>
      </header>

      {session && (
        <VocabRunner
          key={session.key}
          questions={session.questions}
          mode="test"
          onAnswer={(word, correct) => recordAnswer(deck.progressKey, word.id, correct)}
          onFinish={(results) => {
            setResult({ set: session.set, results });
            setSession(null);
            window.scrollTo(0, 0);
          }}
          onQuit={() => setSession(null)}
        />
      )}

      {!session && result && (
        <ReviewResult
          title={SET_TITLE[result.set]}
          results={result.results}
          moreDue={result.set === 'due' ? due.length : 0}
          onMore={() => start('due')}
          onBack={() => setResult(null)}
        />
      )}

      {!session && !result && !answered && (
        <section className={cx('card', styles.empty)}>
          <p>
            ยังไม่มีคำที่ต้องทบทวน — ทำแบบทดสอบในบทเรียนก่อน แล้วระบบจะนัดวันทบทวนให้แต่ละคำ
          </p>
          <Link to={vocabPath()} className="btn btn-primary">
            ไปแผนที่สายคำศัพท์ <ArrowRight size={18} strokeWidth={2} aria-hidden />
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
                <strong>{due.length}</strong> คำ
              </p>
              <p className={styles.muted}>
                {due.length > 0
                  ? due.length > VOCAB_REVIEW_BATCH
                    ? `ทบทวนครั้งละ ${VOCAB_REVIEW_BATCH} คำ เริ่มจากคำที่ใกล้ลืมที่สุด`
                    : 'คำที่ถึงวันนัดแล้ว ทบทวนก่อนจะลืม'
                  : upcoming
                    ? `วันนี้ไม่มีคำถึงรอบ · รอบถัดไป ${daysFromNowLabel(upcoming.inDays)} (${upcoming.count} คำ)`
                    : 'วันนี้ไม่มีคำถึงรอบ'}
              </p>
              <button
                type="button"
                className="btn btn-primary"
                disabled={due.length === 0}
                onClick={() => start('due')}
              >
                <RotateCcw size={16} strokeWidth={2} aria-hidden /> ทบทวน {Math.min(due.length, VOCAB_REVIEW_BATCH)} คำ
              </button>
            </section>

            <section className={styles.set} aria-labelledby="weak-title">
              <h2 id="weak-title" className={styles.setTitle}>
                ตอบผิดบ่อย
              </h2>
              <p className={styles.setNum}>
                <strong>{weak.length}</strong> คำ
              </p>
              <p className={styles.muted}>
                {weak.length > 0 ? 'คำที่เคยตอบผิดและยังจำได้ไม่แม่น' : 'ยังไม่มีคำที่ผิดบ่อย เยี่ยมมาก'}
              </p>
              <button type="button" className="btn" disabled={weak.length === 0} onClick={() => start('weak')}>
                ฝึก {Math.min(weak.length, VOCAB_REVIEW_BATCH)} คำ
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
              จำได้แล้ว = ตอบถูกในรอบทบทวนต่อเนื่องจนถึงกล่องสุดท้าย (อย่างน้อย 5 วัน) · คำเหล่านี้จะกลับมาให้ทบทวนทุก
              ~2 สัปดาห์
            </p>
          </section>

          {weak.length > 0 && (
            <section aria-labelledby="weak-list-title">
              <h2 id="weak-list-title" className={styles.sectionTitle}>
                คำที่ผิดบ่อย
              </h2>
              <ul className={styles.wordList}>
                {weak.slice(0, 30).map(({ word, stat }) => (
                  <li key={word.id}>
                    <span className="kana" lang="ja">
                      {word.kana}
                    </span>
                    {word.kanji && (
                      <span className={cx('kana', styles.muted)} lang="ja">
                        {word.kanji}
                      </span>
                    )}
                    <span className={styles.wordThai}>{word.thai}</span>
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

interface ReviewResultProps {
  title: string;
  results: readonly WordResult[];
  moreDue: number;
  onMore: () => void;
  onBack: () => void;
}

function ReviewResult({ title, results, moreDue, onMore, onBack }: ReviewResultProps) {
  const wrong = results.filter((r) => !r.correct);
  return (
    <section className={cx('card', styles.result)} aria-live="polite">
      <p className={styles.muted}>{title}</p>
      <p className={styles.resultBig}>
        {results.length - wrong.length} / {results.length}
      </p>
      <p className={styles.muted}>
        {wrong.length === 0
          ? 'ถูกหมดทุกคำ! คำเหล่านี้จะกลับมาให้ทบทวนห่างออกไปอีก'
          : 'คำที่ผิดจะกลับไปเริ่มรอบใหม่ และกลับมาให้ทบทวนเร็วขึ้น'}
      </p>
      {wrong.length > 0 && (
        <ul className={styles.wordList} aria-label="คำที่ตอบผิด">
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
              <span className={styles.wordThai}>{word.thai}</span>
            </li>
          ))}
        </ul>
      )}
      <div className={styles.actions}>
        {moreDue > 0 && (
          <button type="button" className="btn btn-primary" onClick={onMore}>
            ทบทวนต่อ (เหลือ {moreDue} คำ) <ArrowRight size={18} strokeWidth={2} aria-hidden />
          </button>
        )}
        <button type="button" className={cx('btn', moreDue === 0 && 'btn-primary')} onClick={onBack}>
          กลับหน้าทบทวน
        </button>
        <Link to={vocabPath()} className="btn btn-ghost">
          แผนที่สาย
        </Link>
      </div>
    </section>
  );
}
