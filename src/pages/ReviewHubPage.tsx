import { ArrowRight, RotateCcw } from 'lucide-react';
import { Link } from 'react-router';
import { KANA_ROOT, scriptPath } from '../app/paths';
import { TodayCard } from '../components/TodayCard';
import { scriptList } from '../data/scripts';
import { dueChars, hasAnswered, weakChars } from '../features/progress/progressLogic';
import { progressStore } from '../features/progress/progressStore';
import { cx } from '../lib/cx';
import { useStore } from '../lib/persistentStore';
import { packTone, tone } from '../lib/tone';
import { useNow } from '../lib/useNow';
import styles from './ReviewHubPage.module.css';

/** ทบทวน (เมนูหลัก): วันนี้ (เป้า + รอบทบทวน) แล้วการ์ดทบทวนของแต่ละสาย */
export default function ReviewHubPage() {
  const now = useNow();
  const progress = useStore(progressStore);
  const started = scriptList.some((p) => hasAnswered(progress.scripts[p.id]));

  return (
    <div className={cx('container', styles.page)}>
      <header className={styles.head}>
        <h1 className={styles.h1}>ทบทวน</h1>
        <p className={styles.lead}>
          ระบบนัดทบทวนตัวที่ใกล้จะลืม และรวมตัวที่ผิดบ่อยไว้ให้ฝึกซ้ำ — ทบทวนวันละนิดช่วยให้จำได้นาน
        </p>
      </header>

      <TodayCard packs={scriptList} />

      <h2 className={styles.sectionTitle}>ทบทวนแต่ละสาย</h2>
      <div className={styles.cards}>
        {scriptList.map((pack) => {
          const p = progress.scripts[pack.id];
          const answered = hasAnswered(p);
          const due = dueChars(pack, p, now).length;
          const weak = weakChars(pack, p).length;
          return (
            <Link
              key={pack.id}
              to={scriptPath(pack.id, 'review')}
              className={cx('tone', styles.card)}
              style={tone(packTone(pack))}
            >
              <span className={cx('kana', styles.badge)} aria-hidden>
                {pack.chars[0]!.char}
              </span>
              <span className={styles.cardText}>
                <span className={cx('kana', styles.lineJa)}>{pack.nameJa}線</span>
                <span className={styles.cardTitle}>ทบทวนสาย{pack.name}</span>
                <span className={styles.muted}>ภาพรวม ตัวที่ผิดบ่อย ความคืบหน้ารายตัว และสำรองข้อมูล</span>
              </span>
              <span className={styles.counts}>
                {answered ? (
                  <>
                    <span className={cx(styles.count, due > 0 && styles.countHot)}>
                      <strong>{due}</strong> ถึงรอบ
                    </span>
                    <span className={styles.count}>
                      <strong>{weak}</strong> ผิดบ่อย
                    </span>
                  </>
                ) : (
                  <span className={styles.muted}>ยังไม่เริ่ม</span>
                )}
              </span>
              <span className={styles.go} aria-hidden>
                <RotateCcw size={16} strokeWidth={2} />
                เปิด
                <ArrowRight size={16} strokeWidth={2} />
              </span>
            </Link>
          );
        })}
      </div>
      {!started && (
        <p className={cx(styles.muted, styles.note)}>
          ยังไม่มีตัวที่ต้องทบทวน — ฝึกเขียนหรือทำแบบทดสอบใน <Link to={KANA_ROOT}>หมวดตัวอักษร</Link> ก่อน
          แล้วระบบจะนัดวันทบทวนให้
        </p>
      )}
    </div>
  );
}
