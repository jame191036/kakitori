import { SECTIONS } from '../app/sections';
import { HubList } from '../components/HubList';
import { findChar, scriptList } from '../data/scripts';
import { useStrokeData } from '../data/useStrokes';
import { masteryLevel } from '../features/progress/progressLogic';
import { progressStore } from '../features/progress/progressStore';
import { StrokeAnimator } from '../features/writing/StrokeAnimator';
import { useStore } from '../lib/persistentStore';
import styles from './HomePage.module.css';

/**
 * หน้าแรก = ศูนย์รวมชั้นบนสุด: เลือกหมวด (ตัวอักษร / ท่องเที่ยว / …) — หมวดที่ยังไม่มีแสดงเป็น "เร็วๆ นี้"
 * ("เรียนต่อ" อยู่ในหน้าตัวอักษร · "วันนี้" (เป้า + รอบทบทวน) อยู่ในหน้าทบทวน
 *  · บทเรียนพื้นฐานเข้าได้จากแถบแนะนำมือใหม่ หน้าตัวอักษร และลิงก์ท้ายเว็บ)
 */
export default function HomePage() {
  const first = scriptList[0]!;
  // ตัวอย่างลำดับขีดเล็กๆ ข้างหัวเรื่อง: か (ka) ให้ตรงกับโลโก้ kakitori
  const sample = findChar(first, 'ka') ?? first.chars[0]!;
  const sampleData = useStrokeData(first, sample.char)!;
  const progress = useStore(progressStore);
  const kanaTotal = scriptList.reduce((n, p) => n + p.chars.length, 0);
  const kanaMastered = scriptList.reduce(
    (n, p) => n + p.chars.filter((c) => masteryLevel(progress.scripts[p.id]?.[c.id]) === 3).length,
    0,
  );

  return (
    <div className="container page">
      <header className={styles.intro}>
        <div className={styles.introText}>
          <h1 className="page-title">เลือกสิ่งที่อยากเรียน</h1>
          <p className="muted">เว็บฝึกภาษาญี่ปุ่นฟรี ไม่ต้องสมัครสมาชิก — เริ่มที่หมวดตัวอักษรก่อน</p>
        </div>
        <figure className={styles.sample}>
          <StrokeAnimator
            data={sampleData}
            speed={1}
            showNumbers
            controls={false}
            label={`ตัวอย่างลำดับขีดของ ${sample.char} (แตะเพื่อเล่นซ้ำ)`}
          />
        </figure>
      </header>

      {/* หมวด: ตัวอักษรเปิดแล้ว ที่เหลือ "เร็วๆ นี้" */}
      <section className={`card ${styles.sections}`} aria-label="หมวด">
        <HubList
          items={SECTIONS.map((s) => ({
            key: s.id,
            to: s.to,
            glyph: s.glyph,
            glyphLang: s.glyph === 'N5' ? undefined : 'ja',
            title: s.name,
            desc: s.desc,
            meta: s.id === 'kana' ? `${kanaTotal} ตัว · จำได้แล้ว ${kanaMastered}` : undefined,
          }))}
        />
      </section>

      <p className={`small muted ${styles.privacy}`}>
        เว็บนี้ไม่มีระบบสมาชิกและไม่ส่งข้อมูลของคุณไปที่ไหน ความคืบหน้าถูกจำไว้ในเบราว์เซอร์ของเครื่องนี้เท่านั้น
      </p>
    </div>
  );
}
