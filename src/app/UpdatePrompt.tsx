import { useEffect, useEffectEvent, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import styles from './UpdatePrompt.module.css';

/** เวลาออก — ตรงกับ transition ตอนออกใน UpdatePrompt.module.css */
const EXIT_MS = 150;
/** "พร้อมใช้งานออฟไลน์" เป็นแค่ข้อมูล ปิดเองได้ (ไม่ให้บังกระดานเขียนบนมือถือ) */
const OFFLINE_NOTICE_MS = 5000;

/** แจ้งเมื่อพร้อมใช้งานออฟไลน์ หรือเมื่อมีเวอร์ชันใหม่ (ให้ผู้ใช้กดอัปเดตเอง ไม่รีโหลดกลางแบบทดสอบ) */
export function UpdatePrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  const [closing, setClosing] = useState(false);

  // เล่นแอนิเมชันออกก่อน แล้วค่อยเอาออกจากหน้า
  const close = () => {
    setClosing(true);
    window.setTimeout(() => {
      setOfflineReady(false);
      setNeedRefresh(false);
      setClosing(false);
    }, EXIT_MS);
  };

  // ข้อความ "มีเวอร์ชันใหม่" ต้องรอผู้ใช้เลือก จึงปิดเองเฉพาะข้อความพร้อมใช้งานออฟไลน์
  const autoClose = useEffectEvent(close);
  useEffect(() => {
    if (!offlineReady || needRefresh) return;
    const t = window.setTimeout(autoClose, OFFLINE_NOTICE_MS);
    return () => window.clearTimeout(t);
  }, [offlineReady, needRefresh]);

  if (!offlineReady && !needRefresh) return null;

  return (
    <div className={`${styles.toast} ${closing ? styles.closing : ''} no-print`} role="status">
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
