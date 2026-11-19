import { ArrowRight, Lightbulb } from 'lucide-react';
import { Link } from 'react-router';
import { scriptPath, vocabPath } from '../app/paths';
import { scripts } from '../data/scripts';
import { N5_DECK } from '../data/vocab/n5';
import { progressStore } from '../features/progress/progressStore';
import { packStations, stationDone } from '../features/progress/stations';
import { deckProgress, lessonStates, nextLesson, wordsPassed } from '../features/vocab/vocabLogic';
import { cx } from '../lib/cx';
import { useStore } from '../lib/persistentStore';
import { tone } from '../lib/tone';
import styles from './N5HubPage.module.css';

/** สายที่ยังไม่เปิด (แสดงเป็น 工事中) */
const COMING = [
  { glyph: '漢', name: 'คันจิ N5', desc: 'คันจิพื้นฐานประมาณ 100 ตัว พร้อมฝึกเขียนตามลำดับขีด' },
  { glyph: '文', name: 'ไวยากรณ์ N5', desc: 'รูปประโยคพื้นฐาน คำช่วย และการผันคำกริยา' },
];

/**
 * หมวด JLPT N5 — ตอนนี้มีสายคำศัพท์ · คันจิ/ไวยากรณ์ตามมา
 * (ไม่มีรายการเนื้อหา N5 อย่างเป็นทางการ จำนวนคำ/คันจิเป็นตัวเลขโดยประมาณที่ใช้กันทั่วไป)
 */
export default function N5HubPage() {
  const data = useStore(progressStore);
  const deck = N5_DECK;
  const progress = deckProgress(deck, data);
  const states = lessonStates(deck, progress);
  const passed = states.filter((s) => s === 'done').length;
  const next = nextLesson(deck, progress);
  // แนะนำให้อ่านฮิรางานะระดับ 1 ได้ก่อน (คำศัพท์ทั้งหมดแสดงเป็นคานะ)
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
            คำศัพท์ในหมวดนี้เขียนด้วยคานะ — แนะนำให้อ่านฮิรางานะได้ก่อน (ผ่านระดับ 1){' '}
            <Link to={scriptPath('hiragana')}>ไปที่สายฮิรางานะ</Link>
          </span>
        </p>
      )}

      <ul className={styles.lines}>
        <li className="tone" style={tone('n5')}>
          <Link to={vocabPath()} className={cx(styles.line, styles.live)}>
            <span className={cx('kana', styles.badge)} lang="ja">
              語
            </span>
            <span className={styles.info}>
              <span className={styles.name}>คำศัพท์ N5</span>
              <span className={styles.desc}>
                เรียนทีละบทตามหัวข้อ · ผ่านแล้ว {passed}/{deck.lessons.length} บท · ตอบถูก {wordsPassed(deck, progress)}{' '}
                คำ
              </span>
              <span className={styles.track} aria-hidden>
                <span style={{ width: `${(passed / deck.lessons.length) * 100}%` }} />
              </span>
            </span>
            <span className={styles.go}>
              {next ? `ต่อ: ${next.title}` : 'ทบทวน'} <ArrowRight size={16} strokeWidth={2} aria-hidden />
            </span>
          </Link>
        </li>
        {COMING.map((c) => (
          <li key={c.name} className="tone" style={tone('n5')}>
            <div className={cx(styles.line, styles.soon)} aria-disabled="true">
              <span className={cx('kana', styles.badge)} lang="ja">
                {c.glyph}
              </span>
              <span className={styles.info}>
                <span className={styles.name}>{c.name}</span>
                <span className={styles.desc}>{c.desc}</span>
              </span>
              <span className={styles.koji}>
                <span className="kana">工事中</span> กำลังสร้าง
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
