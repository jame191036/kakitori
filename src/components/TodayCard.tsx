import { Link } from 'react-router';
import { vocabReviewPath } from '../app/paths';
import type { ScriptPack } from '../data/types';
import type { VocabDeck } from '../data/vocab';
import {
  deckProgress,
  dueWords,
  nextWordReview,
  VOCAB_REVIEW_BATCH,
  wordsAnswered,
} from '../features/vocab/vocabLogic';
import { GOAL_OPTIONS, streakInfo } from '../features/progress/activity';
import {
  dueChars,
  hasAnswered,
  nextReview,
  REVIEW_BATCH,
  reviewHref,
} from '../features/progress/progressLogic';
import { activityStore, progressStore, setDailyGoal } from '../features/progress/progressStore';
import { useSettings } from '../features/settings/settings';
import { cx } from '../lib/cx';
import { daysFromNowLabel } from '../lib/day';
import { useStore } from '../lib/persistentStore';
import { useNow } from '../lib/useNow';
import styles from './TodayCard.module.css';

interface TodayCardProps {
  packs: readonly ScriptPack[];
  /** ชุดคำศัพท์ที่นับรอบทบทวนด้วย (ตอนนี้มีแค่ N5 — ปุ่มพาไปหน้าทบทวนคำศัพท์ N5) */
  decks?: readonly VocabDeck[];
}

/** การ์ด "วันนี้": วันที่ฝึกต่อเนื่อง เป้ารายวัน และตัวอักษร/คำที่ถึงรอบทบทวน (ซ่อนไว้จนกว่าจะเริ่มฝึก) */
export function TodayCard({ packs, decks = [] }: TodayCardProps) {
  const now = useNow();
  const { dailyGoal } = useSettings();
  const activity = useStore(activityStore);
  const progress = useStore(progressStore);
  const streak = streakInfo(activity, now, dailyGoal);
  const kanaAnswered = packs.some((p) => hasAnswered(progress.scripts[p.id]));
  const wordAnswered = decks.some((d) => wordsAnswered(deckProgress(d, progress)));
  const answered = kanaAnswered || wordAnswered;

  if (!streak.hasAny && !answered) return null;

  const due = packs
    .map((pack) => ({ pack, chars: dueChars(pack, progress.scripts[pack.id], now) }))
    .filter((d) => d.chars.length > 0);
  const dueDecks = decks
    .map((deck) => ({ deck, words: dueWords(deck, deckProgress(deck, progress), now) }))
    .filter((d) => d.words.length > 0);
  // หน่วยของรอบถัดไป: ตัวอักษร = "ตัว" · คำศัพท์ = "คำ" · ปนกัน = "รายการ"
  const unit = kanaAnswered && wordAnswered ? 'รายการ' : wordAnswered ? 'คำ' : 'ตัว';
  const upcoming = [
    ...packs.map((pack) => nextReview(pack, progress.scripts[pack.id], now)),
    ...decks.map((deck) => nextWordReview(deck, deckProgress(deck, progress), now)),
  ].reduce<{ inDays: number; count: number } | null>((best, r) => {
      if (!r) return best;
      if (!best || r.inDays < best.inDays) return r;
      return r.inDays === best.inDays ? { inDays: r.inDays, count: best.count + r.count } : best;
    }, null);

  const remaining = Math.max(0, dailyGoal - streak.todayCount);
  const goalText = streak.todayMet
    ? 'ถึงเป้าวันนี้แล้ว'
    : streak.current > 0
      ? `อีก ${remaining} ครั้ง จะนับต่อเป็น ${streak.current + 1} วัน`
      : `อีก ${remaining} ครั้ง จะเริ่มนับวันที่ฝึกต่อเนื่อง`;

  const filled = Math.min(streak.todayCount, dailyGoal);

  return (
    <section className={styles.card} aria-labelledby="today-title">
      <div className={styles.head}>
        <h2 id="today-title" className={styles.title}>
          {/* 今日 (kyō) = วันนี้ */}
          <span className={cx('kana', styles.titleJa)}>今日</span> วันนี้
        </h2>
        <div className={styles.goalPick}>
          <span className="small muted" id="goal-label">
            เป้าต่อวัน
          </span>
          <div className="segmented" role="group" aria-labelledby="goal-label">
            {GOAL_OPTIONS.map((g) => (
              <button
                key={g}
                type="button"
                aria-pressed={dailyGoal === g}
                onClick={() => setDailyGoal(g)}
                aria-label={`${g} ครั้งต่อวัน`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.body}>
        {/* วันที่ฝึกต่อเนื่อง: ตัวเลขใหญ่ */}
        <div className={styles.streak}>
          <span className={styles.streakNum}>{streak.current}</span>
          <span>
            <span className={styles.streakLabel}>วันติดต่อกัน</span>
            <span className="small muted" style={{ display: 'block' }}>
              {streak.best > 0 ? `สถิติสูงสุด ${streak.best} วัน` : 'ฝึกให้ถึงเป้าทุกวันเพื่อสะสมวัน'}
            </span>
          </span>
        </div>

        {/* เป้าวันนี้: ฝึก 1 ครั้ง = ระบาย 1 ช่อง */}
        <div className={styles.goal}>
          <div
            className={styles.tally}
            role="progressbar"
            aria-label="ความคืบหน้าเป้าวันนี้"
            aria-valuemin={0}
            aria-valuemax={dailyGoal}
            aria-valuenow={filled}
          >
            {Array.from({ length: dailyGoal }, (_, i) => (
              <span key={i} className={i < filled ? styles.done : undefined} />
            ))}
          </div>
          <p className="small">
            <strong className={streak.todayMet ? styles.met : undefined}>
              {streak.todayCount}/{dailyGoal}
            </strong>{' '}
            <span className="muted">ครั้ง · {goalText}</span>
          </p>
          <p className="small muted">1 ครั้ง = ตอบคำถาม 1 ข้อ หรือเขียนเสร็จ 1 ตัว</p>
        </div>
      </div>

      <div className={styles.review}>
        <p className={styles.reviewTitle}>ถึงรอบทบทวน</p>
        {due.length + dueDecks.length > 0 ? (
          <div className="row">
            {due.map(({ pack, chars }) => (
              <Link key={pack.id} to={reviewHref(pack.id, chars)} className="btn btn-primary btn-sm">
                ทบทวน{pack.name} {Math.min(chars.length, REVIEW_BATCH)} ตัว
                {chars.length > REVIEW_BATCH && ` (จาก ${chars.length})`}
              </Link>
            ))}
            {dueDecks.map(({ deck, words }) => (
              <Link key={deck.id} to={vocabReviewPath('due')} className="btn btn-primary btn-sm">
                ทบทวน{deck.name} {Math.min(words.length, VOCAB_REVIEW_BATCH)} คำ
                {words.length > VOCAB_REVIEW_BATCH && ` (จาก ${words.length})`}
              </Link>
            ))}
          </div>
        ) : (
          <p className="small muted">
            {answered
              ? `ไม่มี${unit}ที่ต้องทบทวนวันนี้${upcoming ? ` · รอบถัดไป ${daysFromNowLabel(upcoming.inDays)} (${upcoming.count} ${unit})` : ''}`
              : 'ทำแบบทดสอบหรือฝึกแบบตรวจทีละขีด แล้วระบบจะนัดวันทบทวนให้'}
          </p>
        )}
      </div>
    </section>
  );
}
