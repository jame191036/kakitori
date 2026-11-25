import { Shuffle } from 'lucide-react';
import { Link } from 'react-router';
import { conjFreePath, conjPath, conjReviewPath } from '../app/paths';
import { LinePage } from '../components/line/LinePage';
import { CONJ_N5 } from '../data/conj/n5';
import styles from '../features/conj/conj.module.css';

/** สายผันคำ N5 (หน้าแผนที่สายใช้ร่วมกับสายอื่น — components/line/LinePage) + ทางลัดไปฝึกอิสระ */
export default function ConjLinePage() {
  return (
    <LinePage
      deck={CONJ_N5}
      lineTone="n5"
      glyph="活"
      // 活用 (katsuyou) = การผัน
      lineJa="活用"
      title="สายผันคำ N5"
      intro="ฝึกเปลี่ยนรูปคำกริยาและคำคุณศัพท์ N5 ทีละกฎ — แยกกลุ่มคำ รูป ます · て · た · ない ย้อนหาคำเดิม และคุณศัพท์ い / な อ่านกฎ ฝึกผันหลายๆ คำ แล้วทดสอบทีละสถานี (สุ่มคำใหม่ทุกครั้ง)"
      unit="กฎ"
      comingNote="ช่วงที่เหลือกำลังทยอยเพิ่ม"
      lessonHref={conjPath}
      reviewHref={conjReviewPath()}
      previewOf={(r) => r.pattern}
      extra={
        <section className={styles.freeLink} aria-label="ฝึกอิสระ">
          <p className={styles.freeText}>
            <span className={styles.freeName}>ฝึกอิสระ</span>
            <span className={styles.freeDesc}>เลือกรูปและกลุ่มคำเอง ทำได้ไม่จำกัดข้อ ไม่นับเป็นผลสอบ</span>
          </p>
          <Link to={conjFreePath()} className="btn">
            <Shuffle size={16} strokeWidth={2} aria-hidden /> ไปฝึกอิสระ
          </Link>
        </section>
      }
    />
  );
}
