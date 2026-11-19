import { Link } from 'react-router';
import type { LineDeck } from '../data/line';
import type { ScriptPack } from '../data/types';
import {
  deckProgress,
  dueWords,
  nextWordReview,
  REVIEW_BATCH_SIZE,
  wordsAnswered,
} from '../features/line/lineLogic';
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

/** สายบทเรียน (คำศัพท์ / คันจิ) ที่นับรอบทบทวนในการ์ดด้วย */
export interface TodayLine {
  deck: LineDeck;
  /** ลักษณนาม เช่น "คำ" / "ตัว" */
  unit: string;
  /** หน้าทบทวนของสาย — เปิดแล้วเริ่มทบทวนตัวที่ถึงรอบทันที */
  dueHref: string;
}

interface TodayCardProps {
  packs: readonly ScriptPack[];
  lines?: readonly TodayLine[];
}

/** การ์ด "วันนี้": วันที่ฝึกต่อเนื่อง เป้ารายวัน และตัวอักษร/คำ/คันจิที่ถึงรอบทบทวน (ซ่อนไว้จนกว่าจะเริ่มฝึก) */
export function TodayCard({ packs, lines = [] }: TodayCardProps) {
  const now = useNow();
  const { dailyGoal } = useSettings();
  const activity = useStore(activityStore);
  const progress = useStore(progressStore);
  const streak = streakInfo(activity, now, dailyGoal);
  const kanaAnswered = packs.some((p) => hasAnswered(progress.scripts[p.id]));
  const linesAnswered = lines.filter((l) => wordsAnswered(deckProgress(l.deck, progress)));
  const answered = kanaAnswered || linesAnswered.length > 0;

  if (!streak.hasAny && !answered) return null;

  const due = packs
    .map((pack) => ({ pack, chars: dueChars(pack, progress.scripts[pack.id], now) }))
    .filter((d) => d.chars.length > 0);
  const dueLines = lines
    .map((line) => ({ line, words: dueWords(line.deck, deckProgress(line.deck, progress), now) }))
    .filter((d) => d.words.length > 0);
  // หน่วยของรอบถัดไป: ใช้หน่วยเดียวกันถ้าทุกชุดที่เริ่มแล้วนับเหมือนกัน (ตัวอักษร/คันจิ = "ตัว") · ปนกัน = "รายการ"
  const units = new Set([...(kanaAnswered ? ['ตัว'] : []), ...linesAnswered.map((l) => l.unit)]);
  const unit = units.size === 1 ? [...units][0]! : 'รายการ';
  const upcoming = [
    ...packs.map((pack) => nextReview(pack, progress.scripts[pack.id], now)),
    ...lines.map((line) => nextWordReview(line.deck, deckProgress(line.deck, progress), now)),
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
        {due.length + dueLines.length > 0 ? (
          <div className="row">
            {due.map(({ pack, chars }) => (
              <Link key={pack.id} to={reviewHref(pack.id, chars)} className="btn btn-primary btn-sm">
                ทบทวน{pack.name} {Math.min(chars.length, REVIEW_BATCH)} ตัว
                {chars.length > REVIEW_BATCH && ` (จาก ${chars.length})`}
              </Link>
            ))}
            {dueLines.map(({ line, words }) => (
              <Link key={line.deck.id} to={line.dueHref} className="btn btn-primary btn-sm">
                ทบทวน{line.deck.name} {Math.min(words.length, REVIEW_BATCH_SIZE)} {line.unit}
                {words.length > REVIEW_BATCH_SIZE && ` (จาก ${words.length})`}
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
