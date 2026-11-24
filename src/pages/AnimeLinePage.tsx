import { animePath, animeReviewPath } from '../app/paths';
import { LinePage } from '../components/line/LinePage';
import { ANIME_DECK } from '../data/anime';
import { faceText } from '../data/phrase/build';

/** หมวดการ์ตูน / ซีรีส์ = สายวลี + ฉากตัวอย่าง (หน้าแผนที่สายใช้ร่วมกับสายอื่น — components/line/LinePage) */
export default function AnimeLinePage() {
  const total = ANIME_DECK.segments.length;
  return (
    <LinePage
      deck={ANIME_DECK}
      lineTone="anime"
      glyph="漫"
      // アニメ = อนิเมะ (การ์ตูนญี่ปุ่น)
      lineJa="アニメ"
      title="ภาษาญี่ปุ่นจากการ์ตูนและซีรีส์"
      intro={`สำนวนที่ได้ยินบ่อยในการ์ตูนและซีรีส์ญี่ปุ่น ${total} ช่วง — คำอุทาน วิธีเรียกชื่อ คำลงท้ายแบบผู้ชาย/ผู้หญิง ภาษาวัยรุ่น ทุกบทมีฉากสั้นแต่งขึ้นเอง วลีแบบกันเองมีแบบสุภาพให้ดูคู่กัน คำหยาบมีคำเตือน มีโรมาจิ (ซ่อนได้) และเสียงทุกวลี`}
      unit="วลี"
      comingNote="ช่วงที่เหลือกำลังทยอยเพิ่ม"
      lessonHref={animePath}
      reviewHref={animeReviewPath()}
      previewOf={faceText}
    />
  );
}
