import { vocabPath, vocabReviewPath } from '../app/paths';
import { LinePage } from '../components/line/LinePage';
import { N5_DECK } from '../data/vocab/n5';

/** สายคำศัพท์ N5 (หน้าแผนที่สายใช้ร่วมกับสายคันจิ — components/line/LinePage) */
export default function VocabLinePage() {
  return (
    <LinePage
      deck={N5_DECK}
      lineTone="n5"
      glyph="語"
      // 単語 (tango) = คำศัพท์
      lineJa="単語"
      title="สายคำศัพท์ N5"
      intro="คำศัพท์พื้นฐานระดับ JLPT N5 แบ่งเป็นช่วงตามหัวข้อ ช่วงละหลายบท บทละประมาณ 8 คำ — เรียน ฝึก แล้วทดสอบให้ผ่านทีละสถานี"
      unit="คำ"
      comingNote="ช่วงที่เหลือกำลังทยอยเพิ่มจนครบคำศัพท์ N5 (ประมาณ 670 คำ)"
      lessonHref={vocabPath}
      reviewHref={vocabReviewPath()}
      previewOf={(w) => w.kana}
    />
  );
}
