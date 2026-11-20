import { grammarPath, grammarReviewPath } from '../app/paths';
import { LinePage } from '../components/line/LinePage';
import { GRAMMAR_N5 } from '../data/grammar/n5';

/** สายไวยากรณ์ N5 (หน้าแผนที่สายใช้ร่วมกับสายคำศัพท์และคันจิ — components/line/LinePage) */
export default function GrammarLinePage() {
  return (
    <LinePage
      deck={GRAMMAR_N5}
      lineTone="n5"
      glyph="文"
      // 文法 (bunpō) = ไวยากรณ์
      lineJa="文法"
      title="สายไวยากรณ์ N5"
      intro="รูปประโยคพื้นฐานของ JLPT N5 แบ่งเป็นช่วงตามเรื่อง บทละ 2–4 รูป — อ่านคำอธิบายและประโยคตัวอย่าง ฝึกเติมคำ แปล และเรียงประโยค แล้วทดสอบทีละสถานี"
      unit="รูป"
      comingNote="ช่วงที่เหลือ (รูป て · รูปธรรมดา · รูปอื่นๆ) กำลังทยอยเพิ่มจนครบไวยากรณ์ N5 (ประมาณ 75 รูป)"
      lessonHref={grammarPath}
      reviewHref={grammarReviewPath()}
      previewOf={(p) => p.pattern}
    />
  );
}
