import { travelPath, travelReviewPath } from '../app/paths';
import { LinePage } from '../components/line/LinePage';
import { TRAVEL_DECK } from '../data/travel';

/** หมวดท่องเที่ยว = สายวลีท่องเที่ยว (หน้าแผนที่สายใช้ร่วมกับสาย N5 — components/line/LinePage) */
export default function TravelLinePage() {
  const total = TRAVEL_DECK.segments.length;
  return (
    <LinePage
      deck={TRAVEL_DECK}
      lineTone="travel"
      glyph="旅"
      // 旅行 (ryokō) = การท่องเที่ยว
      lineJa="旅行"
      title="ภาษาญี่ปุ่นสำหรับเที่ยว"
      intro={`วลีที่ใช้จริงตอนเที่ยวญี่ปุ่น ${total} ช่วงตามสถานการณ์ บทละ 6–7 วลี — ทั้งประโยคที่ต้องพูด และประโยคที่จะได้ยินจากพนักงานหรือประกาศ มีโรมาจิและเสียงทุกวลี`}
      unit="วลี"
      comingNote="ช่วงที่เหลือกำลังทยอยเพิ่ม"
      lessonHref={travelPath}
      reviewHref={travelReviewPath()}
      previewOf={(x) => x.kana}
    />
  );
}
