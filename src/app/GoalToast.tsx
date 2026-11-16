import { Flame, X } from 'lucide-react';
import { useEffect } from 'react';
import { goalReachedSignal } from '../features/progress/progressStore';
import { useStore } from '../lib/persistentStore';
import styles from './GoalToast.module.css';

const SHOW_MS = 6000;

/** แจ้งเตือนสั้นๆ ตอนฝึกถึงเป้าวันนี้ (แสดงครั้งเดียวต่อวัน) */
export function GoalToast() {
  const streak = useStore(goalReachedSignal);

  useEffect(() => {
    if (streak === null) return;
    const t = window.setTimeout(() => goalReachedSignal.set(null), SHOW_MS);
    return () => window.clearTimeout(t);
  }, [streak]);

  // กล่อง role=status อยู่ตลอด เพื่อให้โปรแกรมอ่านหน้าจออ่านข้อความเมื่อมันปรากฏ
  return (
    <div role="status" className="no-print">
      {streak !== null && (
        <div className={styles.toast}>
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
            onClick={() => goalReachedSignal.set(null)}
            aria-label="ปิดการแจ้งเตือน"
          >
            <X size={18} aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}
