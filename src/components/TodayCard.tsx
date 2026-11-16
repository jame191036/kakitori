import { CalendarCheck, Flame } from 'lucide-react';
import { Link } from 'react-router';
import type { ScriptPack } from '../data/types';
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
}

/** การ์ด "วันนี้": วันที่ฝึกต่อเนื่อง เป้ารายวัน และตัวที่ถึงรอบทบทวน (ซ่อนไว้จนกว่าจะเริ่มฝึก) */
export function TodayCard({ packs }: TodayCardProps) {
  const now = useNow();
  const { dailyGoal } = useSettings();
  const activity = useStore(activityStore);
  const progress = useStore(progressStore);
  const streak = streakInfo(activity, now, dailyGoal);
  const answered = packs.some((p) => hasAnswered(progress.scripts[p.id]));

  if (!streak.hasAny && !answered) return null;

  const due = packs
    .map((pack) => ({ pack, chars: dueChars(pack, progress.scripts[pack.id], now) }))
    .filter((d) => d.chars.length > 0);
  const upcoming = packs
    .map((pack) => nextReview(pack, progress.scripts[pack.id], now))
    .reduce<{ inDays: number; count: number } | null>((best, r) => {
      if (!r) return best;
      if (!best || r.inDays < best.inDays) return r;
      return r.inDays === best.inDays ? { inDays: r.inDays, count: best.count + r.count } : best;
    }, null);

  const remaining = Math.max(0, dailyGoal - streak.todayCount);
  const goalText = streak.todayMet
    ? 'ถึงเป้าวันนี้แล้ว ✓'
    : streak.current > 0
      ? `อีก ${remaining} ครั้ง จะนับต่อเป็น ${streak.current + 1} วัน`
      : `อีก ${remaining} ครั้ง จะเริ่มนับวันที่ฝึกต่อเนื่อง`;

  return (
    <section className={cx('card', styles.card)} aria-labelledby="today-title">
      <div className={styles.top}>
        <div className={styles.streak}>
          <span className={cx(styles.flame, streak.current > 0 && styles.flameOn)} aria-hidden>
            <Flame size={26} />
          </span>
          <div>
            <h2 id="today-title" className={styles.title}>
              {streak.current > 0 ? `ฝึกต่อเนื่อง ${streak.current} วัน` : 'วันนี้'}
            </h2>
            <p className="small muted">
              {streak.best > 0 ? `สถิติสูงสุด ${streak.best} วัน` : 'ฝึกให้ถึงเป้าทุกวันเพื่อสะสมวันต่อเนื่อง'}
            </p>
          </div>
        </div>
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

      <div className={styles.goal}>
        <div className={styles.goalHead}>
          <span>
            เป้าวันนี้{' '}
            <strong className={streak.todayMet ? styles.met : undefined}>
              {streak.todayCount}/{dailyGoal}
            </strong>{' '}
            ครั้ง
          </span>
          <span className="small muted">{goalText}</span>
        </div>
        <div
          className={cx(styles.bar, streak.todayMet && styles.barMet)}
          role="progressbar"
          aria-label="ความคืบหน้าเป้าวันนี้"
          aria-valuemin={0}
          aria-valuemax={dailyGoal}
          aria-valuenow={Math.min(streak.todayCount, dailyGoal)}
        >
          <span
            style={{
              transform: `translateX(${Math.min(100, (streak.todayCount / dailyGoal) * 100) - 100}%)`,
            }}
          />
        </div>
        <p className="small muted">1 ครั้ง = ตอบคำถาม 1 ข้อ หรือเขียนเสร็จ 1 ตัว</p>
      </div>

      <div className={styles.review}>
        <p className={styles.reviewTitle}>
          <CalendarCheck size={18} aria-hidden /> ถึงรอบทบทวน
        </p>
        {due.length > 0 ? (
          <div className="row">
            {due.map(({ pack, chars }) => (
              <Link key={pack.id} to={reviewHref(pack.id, chars)} className="btn btn-primary btn-sm">
                ทบทวน{pack.name} {Math.min(chars.length, REVIEW_BATCH)} ตัว
                {chars.length > REVIEW_BATCH && ` (จาก ${chars.length})`}
              </Link>
            ))}
          </div>
        ) : (
          <p className="small muted">
            {answered
              ? `ไม่มีตัวที่ต้องทบทวนวันนี้ ✓${upcoming ? ` · รอบถัดไป ${daysFromNowLabel(upcoming.inDays)} (${upcoming.count} ตัว)` : ''}`
              : 'ทำแบบทดสอบหรือฝึกแบบตรวจทีละขีด แล้วระบบจะนัดวันทบทวนให้'}
          </p>
        )}
      </div>
    </section>
  );
}
