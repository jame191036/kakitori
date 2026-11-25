import { ArrowRight, Lightbulb } from 'lucide-react';
import { Link } from 'react-router';
import { conjPath, examPath, grammarPath, kanjiPath, scriptPath, vocabPath } from '../app/paths';
import { CONJ_N5 } from '../data/conj/n5';
import { EXAM_SETS } from '../data/exam/n5';
import { GRAMMAR_N5 } from '../data/grammar/n5';
import { KANJI_N5 } from '../data/kanji/n5';
import { scripts } from '../data/scripts';
import { N5_DECK } from '../data/vocab/n5';
import { scoreExam, SECTION_MAX } from '../features/exam/examLogic';
import { examStore } from '../features/exam/examStore';
import { progressStore } from '../features/progress/progressStore';
import { packStations, stationDone } from '../features/progress/stations';
import { cx } from '../lib/cx';
import { useStore } from '../lib/persistentStore';
import { tone } from '../lib/tone';
import { HubLine } from '../components/line/HubLine';
import styles from '../components/line/HubPage.module.css';

/**
 * หมวด JLPT N5 — สายคำศัพท์ สายคันจิ สายไวยากรณ์ ข้อสอบจำลอง และสายผันคำ
 * (ไม่มีรายการเนื้อหา N5 อย่างเป็นทางการ จำนวนคำ/คันจิเป็นตัวเลขโดยประมาณที่ใช้กันทั่วไป)
 */
export default function N5HubPage() {
  const data = useStore(progressStore);
  // แนะนำให้อ่านฮิรางานะระดับ 1 ได้ก่อน (คำศัพท์และคำอ่านคันจิแสดงเป็นคานะ)
  const hiraganaL1 = packStations(scripts.hiragana).filter((st) => st.level === 1);
  const hiraganaReady = hiraganaL1.every((st) => stationDone(st, data));

  return (
    <div className={cx('container', styles.page)}>
      <header className={styles.head}>
        <h1 className={styles.h1}>JLPT N5</h1>
        <p className={styles.lead}>
          ระดับเริ่มต้นของการสอบวัดระดับภาษาญี่ปุ่น (JLPT) — อ่านคานะได้ รู้คำศัพท์พื้นฐานประมาณ 700–800 คำ
          คันจิประมาณ 100 ตัว และไวยากรณ์ง่ายๆ ที่ใช้ในชีวิตประจำวัน
        </p>
      </header>

      {!hiraganaReady && (
        <p className={styles.tip}>
          <Lightbulb size={18} strokeWidth={1.8} aria-hidden />
          <span>
            คำศัพท์และคำอ่านในหมวดนี้เขียนด้วยคานะ — แนะนำให้อ่านฮิรางานะได้ก่อน (ผ่านระดับ 1){' '}
            <Link to={scriptPath('hiragana')}>ไปที่สายฮิรางานะ</Link>
          </span>
        </p>
      )}

      <ul className={styles.lines}>
        <HubLine
          lineTone="n5"
          deck={N5_DECK}
          data={data}
          glyph="語"
          name="คำศัพท์ N5"
          desc="เรียนทีละบทตามหัวข้อ"
          unit="คำ"
          href={vocabPath()}
        />
        <HubLine
          lineTone="n5"
          deck={KANJI_N5}
          data={data}
          glyph="漢"
          name="คันจิ N5"
          desc="ดูลำดับขีด ฝึกเขียน และอ่านคำ"
          unit="ตัว"
          href={kanjiPath()}
        />
        <HubLine
          lineTone="n5"
          deck={GRAMMAR_N5}
          data={data}
          glyph="文"
          name="ไวยากรณ์ N5"
          desc="รูปประโยค คำช่วย และการผันคำกริยา"
          unit="รูป"
          href={grammarPath()}
        />
        <ExamLine />
        <HubLine
          lineTone="n5"
          deck={CONJ_N5}
          data={data}
          glyph="活"
          name="ผันคำ N5"
          desc="ฝึกเปลี่ยนรูปคำกริยา เช่น ます · て · た มีฝึกอิสระไม่จำกัดข้อ"
          unit="กฎ"
          href={conjPath()}
        />
      </ul>
    </div>
  );
}

/** ข้อสอบจำลอง: จำนวนชุด + ผลครั้งล่าสุด */
function ExamLine() {
  const exam = useStore(examStore);
  const last = exam.attempts[exam.attempts.length - 1];
  const lastSet = last && EXAM_SETS.find((s) => s.id === last.setId);
  const status = exam.session
    ? 'มีข้อสอบทำค้างอยู่'
    : last && lastSet
      ? `ครั้งล่าสุด ${scoreExam(lastSet, last.answers).scaled}/${SECTION_MAX}`
      : 'ยังไม่เคยทำ';
  return (
    <li className="tone" style={tone('n5')}>
      <Link to={examPath()} className={cx(styles.line, styles.live)}>
        <span className={cx('kana', styles.badge)} lang="ja">
          試
        </span>
        <span className={styles.info}>
          <span className={styles.name}>ข้อสอบจำลอง N5</span>
          <span className={styles.desc}>
            จับเวลาเหมือนสอบจริง พร้อมเฉลย · {EXAM_SETS.length} ชุด · {status}
          </span>
        </span>
        <span className={styles.go}>
          {exam.session ? 'ทำต่อ' : 'ไปทำข้อสอบ'} <ArrowRight size={16} strokeWidth={2} aria-hidden />
        </span>
      </Link>
    </li>
  );
}
