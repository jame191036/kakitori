import { dailyPath, dailyReviewPath } from '../app/paths';
import { LinePage } from '../components/line/LinePage';
import { DAILY_DECK } from '../data/daily';
import { faceText } from '../data/phrase/build';

/** หมวดชีวิตประจำวัน = สายวลี + บทสนทนา (หน้าแผนที่สายใช้ร่วมกับสายอื่น — components/line/LinePage) */
export default function DailyLinePage() {
  const total = DAILY_DECK.segments.length;
  return (
    <LinePage
      deck={DAILY_DECK}
      lineTone="daily"
      glyph="日"
      // 日常 (nichijō) = ชีวิตประจำวัน
      lineJa="日常"
      title="ภาษาญี่ปุ่นในชีวิตประจำวัน"
      intro={`วลีสุภาพที่ใช้คุยกับคนญี่ปุ่นและใช้ชีวิตในญี่ปุ่น ${total} ช่วงตามสถานการณ์ — ทุกบทมีบทสนทนาตัวอย่าง วลีที่ใช้กับเพื่อนบ่อยมีแบบกันเองให้ดูคู่กัน มีโรมาจิ (ซ่อนได้) และเสียงทุกวลี`}
      unit="วลี"
      comingNote="ช่วงที่เหลือกำลังทยอยเพิ่ม"
      lessonHref={dailyPath}
      reviewHref={dailyReviewPath()}
      previewOf={faceText}
    />
  );
}
