import { kanjiPath } from '../app/paths';
import { LinePage } from '../components/line/LinePage';
import { KANJI_N5 } from '../data/kanji/n5';

/** สายคันจิ N5 (หน้าแผนที่สายใช้ร่วมกับสายคำศัพท์ — components/line/LinePage) */
export default function KanjiLinePage() {
  return (
    <LinePage
      deck={KANJI_N5}
      lineTone="n5"
      glyph="漢"
      // 漢字 (kanji) = ตัวอักษรจีนที่ใช้ในภาษาญี่ปุ่น
      lineJa="漢字"
      title="สายคันจิ N5"
      intro="คันจิพื้นฐาน 103 ตัวของ JLPT N5 แบ่งเป็นช่วงตามหัวข้อ บทละ 4–7 ตัว — ดูลำดับขีด ฝึกเขียน แล้วทดสอบความหมายและคำอ่านทีละสถานี"
      unit="ตัว"
      comingNote="ช่วงที่เหลือกำลังทยอยเพิ่มจนครบคันจิ N5 (103 ตัว)"
      lessonHref={kanjiPath}
      previewOf={(k) => k.char}
    />
  );
}
