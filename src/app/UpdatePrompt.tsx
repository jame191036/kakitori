import { useRegisterSW } from 'virtual:pwa-register/react';
import styles from './UpdatePrompt.module.css';

/** แจ้งเมื่อพร้อมใช้งานออฟไลน์ หรือเมื่อมีเวอร์ชันใหม่ (ให้ผู้ใช้กดอัปเดตเอง ไม่รีโหลดกลางแบบทดสอบ) */
export function UpdatePrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!offlineReady && !needRefresh) return null;

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  return (
    <div className={`${styles.toast} no-print`} role="status">
      <span>
        {needRefresh ? 'มีเวอร์ชันใหม่ของเว็บแล้ว' : 'พร้อมใช้งานแบบออฟไลน์แล้ว ✓'}
      </span>
      <div className="row">
        {needRefresh && (
          <button type="button" className="btn btn-primary btn-sm" onClick={() => updateServiceWorker(true)}>
            อัปเดต
          </button>
        )}
        <button type="button" className="btn btn-sm" onClick={close}>
          {needRefresh ? 'ภายหลัง' : 'ปิด'}
        </button>
      </div>
    </div>
  );
}
