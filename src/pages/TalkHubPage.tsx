import { animePath, dailyPath, travelPath } from '../app/paths';
import { HubLine } from '../components/line/HubLine';
import { ANIME_DECK } from '../data/anime';
import { DAILY_DECK } from '../data/daily';
import { TRAVEL_DECK } from '../data/travel';
import { progressStore } from '../features/progress/progressStore';
import { cx } from '../lib/cx';
import { useStore } from '../lib/persistentStore';
import styles from '../components/line/HubPage.module.css';

/**
 * บทสนทนา (ปุ่มในเมนูหลัก) — รวมสายวลี 3 สาย: ท่องเที่ยว · ชีวิตประจำวัน · การ์ตูน
 * หน้าแรกยังแสดงทั้ง 3 หมวดแยกกันตามเดิม หน้านี้เป็นทางลัดจากเมนู
 */
export default function TalkHubPage() {
  const data = useStore(progressStore);
  return (
    <div className={cx('container', styles.page)}>
      <header className={styles.head}>
        <h1 className={styles.h1}>บทสนทนา</h1>
        <p className={styles.lead}>
          วลีและประโยคพูดตามสถานการณ์ 3 สาย — ใช้ตอนเที่ยว ใช้ในชีวิตประจำวัน และฟังการ์ตูนให้เข้าใจ
          ทุกวลีมีเสียง โรมาจิ และตัวอย่างการใช้
        </p>
      </header>
      <ul className={styles.lines}>
        <HubLine
          deck={TRAVEL_DECK}
          data={data}
          lineTone="travel"
          glyph="旅"
          name="ใช้ท่องเที่ยว"
          desc="รถไฟ ร้านอาหาร ซื้อของ โรงแรม และป้ายที่เห็นบ่อย"
          unit="วลี"
          href={travelPath()}
        />
        <HubLine
          deck={DAILY_DECK}
          data={data}
          lineTone="daily"
          glyph="日"
          name="ใช้ในชีวิตประจำวัน"
          desc="คุยกับคนญี่ปุ่นและใช้ชีวิตในญี่ปุ่น ภาษาสุภาพ"
          unit="วลี"
          href={dailyPath()}
        />
        <HubLine
          deck={ANIME_DECK}
          data={data}
          lineTone="anime"
          glyph="漫"
          name="ดูการ์ตูน / ซีรีส์"
          desc="คำอุทาน วิธีเรียกชื่อ คำลงท้าย ภาษากันเอง"
          unit="วลี"
          href={animePath()}
        />
      </ul>
    </div>
  );
}
