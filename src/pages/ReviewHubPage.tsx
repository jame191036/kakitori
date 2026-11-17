import { Link } from 'react-router';
import { KANA_ROOT, scriptPath } from '../app/paths';
import { HubList } from '../components/HubList';
import { TodayCard } from '../components/TodayCard';
import { scriptList } from '../data/scripts';
import { dueChars, hasAnswered, weakChars } from '../features/progress/progressLogic';
import { progressStore } from '../features/progress/progressStore';
import { useStore } from '../lib/persistentStore';
import { useNow } from '../lib/useNow';
import styles from './KanaHubPage.module.css';

/** ทบทวน (เมนูหลัก): สรุปรอบทบทวนของทุกหมวด แล้วพาไปหน้าทบทวนของแต่ละชุด */
export default function ReviewHubPage() {
  const now = useNow();
  const progress = useStore(progressStore);
  const started = scriptList.some((p) => hasAnswered(progress.scripts[p.id]));

  return (
    <div className="container page">
      <header className="stack" style={{ gap: 6 }}>
        <h1 className="page-title">ทบทวน</h1>
        <p className="muted">
          ระบบนัดทบทวนตัวที่ใกล้จะลืม และรวมตัวที่ผิดบ่อยไว้ให้ฝึกซ้ำ — ทบทวนวันละนิดช่วยให้จำได้นาน
        </p>
      </header>

      <TodayCard packs={scriptList} />

      <section className="card stack" aria-labelledby="review-sets-title">
        <h2 id="review-sets-title" className={styles.h2}>
          ทบทวนแต่ละชุด
        </h2>
        <HubList
          items={scriptList.map((pack) => {
            const p = progress.scripts[pack.id];
            const due = dueChars(pack, p, now).length;
            const weak = weakChars(pack, p).length;
            return {
              key: pack.id,
              to: scriptPath(pack.id, 'review'),
              glyph: pack.chars[0]!.char,
              glyphLang: 'ja' as const,
              title: pack.name,
              desc: 'ภาพรวม ตัวที่ผิดบ่อย ความคืบหน้ารายตัว และสำรองข้อมูล',
              meta: hasAnswered(p) ? `ถึงรอบ ${due} ตัว · ผิดบ่อย ${weak} ตัว` : 'ยังไม่เริ่ม',
            };
          })}
        />
        {!started && (
          <p className="small muted">
            ยังไม่มีตัวที่ต้องทบทวน — ฝึกเขียนหรือทำแบบทดสอบใน <Link to={KANA_ROOT}>หมวดตัวอักษร</Link> ก่อน
            แล้วระบบจะนัดวันทบทวนให้
          </p>
        )}
      </section>
    </div>
  );
}
