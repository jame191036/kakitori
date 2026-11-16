import { Flame, X } from 'lucide-react';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { goalReachedSignal } from '../features/progress/progressStore';
import { cx } from '../lib/cx';
import { useStore } from '../lib/persistentStore';
import styles from './GoalToast.module.css';

/** เวลาออกของแจ้งเตือน — ตรงกับ transition ตอนออกใน GoalToast.module.css */
const EXIT_MS = 150;

const subscribeVisibility = (cb: () => void) => {
  document.addEventListener('visibilitychange', cb);
  return () => document.removeEventListener('visibilitychange', cb);
};
const isHidden = () => document.hidden;

function Toast({ streak }: { streak: number }) {
  const [closing, setClosing] = useState(false);
  // แท็บถูกซ่อน (สลับไปแอปอื่น) → หยุดนับเวลา ผู้ใช้จะไม่พลาดข้อความ
  const hidden = useSyncExternalStore(subscribeVisibility, isHidden, () => false);

  useEffect(() => {
    if (!closing) return;
    const t = window.setTimeout(() => goalReachedSignal.set(null), EXIT_MS);
    return () => window.clearTimeout(t);
  }, [closing]);

  return (
    <div className={cx(styles.toast, closing && styles.closing, hidden && styles.paused)}>
      {/* ตัวนับเวลาแบบ CSS: หยุดเองเมื่อเอาเมาส์ชี้หรือแท็บถูกซ่อน แล้วปิดเมื่อครบเวลา */}
      <span className={styles.timer} onAnimationEnd={() => setClosing(true)} aria-hidden />
      <span className={styles.icon} aria-hidden>
        <Flame size={22} />
      </span>
      <span>
        <strong>ถึงเป้าวันนี้แล้ว!</strong>
        <span className="small muted" style={{ display: 'block' }}>
          ฝึกต่อเนื่อง {streak} วัน — ฝึกต่อได้ตามสบาย
        </span>
      </span>
      <button
        type="button"
        className="btn btn-ghost btn-sm btn-icon"
        onClick={() => setClosing(true)}
        aria-label="ปิดการแจ้งเตือน"
      >
        <X size={18} aria-hidden />
      </button>
    </div>
  );
}

/** แจ้งเตือนสั้นๆ ตอนฝึกถึงเป้าวันนี้ (แสดงครั้งเดียวต่อวัน) */
export function GoalToast() {
  const streak = useStore(goalReachedSignal);
  // กล่อง role=status อยู่ตลอด เพื่อให้โปรแกรมอ่านหน้าจออ่านข้อความเมื่อมันปรากฏ
  return (
    <div role="status" className="no-print">
      {streak !== null && <Toast key={streak} streak={streak} />}
    </div>
  );
}
