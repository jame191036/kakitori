import { ArrowRight, Lightbulb } from 'lucide-react';
import { Link } from 'react-router';
import { kanjiPath, scriptPath, vocabPath } from '../app/paths';
import { KANJI_N5 } from '../data/kanji/n5';
import type { LineDeck } from '../data/line';
import { scripts } from '../data/scripts';
import { N5_DECK } from '../data/vocab/n5';
import { deckProgress, lessonStates, nextLesson, wordsPassed } from '../features/line/lineLogic';
import type { ProgressData } from '../features/progress/progressLogic';
import { progressStore } from '../features/progress/progressStore';
import { packStations, stationDone } from '../features/progress/stations';
import { cx } from '../lib/cx';
import { useStore } from '../lib/persistentStore';
import { tone } from '../lib/tone';
import styles from './N5HubPage.module.css';

/** สายที่ยังไม่เปิด (แสดงเป็น 工事中) */
const COMING = [{ glyph: '文', name: 'ไวยากรณ์ N5', desc: 'รูปประโยคพื้นฐาน คำช่วย และการผันคำกริยา' }];

/**
 * หมวด JLPT N5 — สายคำศัพท์และสายคันจิ · ไวยากรณ์ตามมา
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
        <LiveLine
          deck={N5_DECK}
          data={data}
          glyph="語"
          name="คำศัพท์ N5"
          desc="เรียนทีละบทตามหัวข้อ"
          unit="คำ"
          href={vocabPath()}
        />
        <LiveLine
          deck={KANJI_N5}
          data={data}
          glyph="漢"
          name="คันจิ N5"
          desc="ดูลำดับขีด ฝึกเขียน และอ่านคำ"
          unit="ตัว"
          href={kanjiPath()}
        />
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

interface LiveLineProps {
  deck: LineDeck;
  data: ProgressData;
  glyph: string;
  name: string;
  desc: string;
  unit: string;
  href: string;
}

/** สายที่เปิดแล้ว: ความคืบหน้า + ปุ่มไปบทถัดไป */
function LiveLine({ deck, data, glyph, name, desc, unit, href }: LiveLineProps) {
  const progress = deckProgress(deck, data);
  const passed = lessonStates(deck, progress).filter((s) => s === 'done').length;
  const next = nextLesson(deck, progress);
  return (
    <li className="tone" style={tone('n5')}>
      <Link to={href} className={cx(styles.line, styles.live)}>
        <span className={cx('kana', styles.badge)} lang="ja">
          {glyph}
        </span>
        <span className={styles.info}>
          <span className={styles.name}>{name}</span>
          <span className={styles.desc}>
            {desc} · ผ่านแล้ว {passed}/{deck.lessons.length} บท · ตอบถูก {wordsPassed(deck, progress)} {unit}
          </span>
          <span className={styles.track} aria-hidden>
            <span style={{ width: `${(passed / Math.max(1, deck.lessons.length)) * 100}%` }} />
          </span>
        </span>
        <span className={styles.go}>
          {next ? `ต่อ: ${next.title}` : 'ดูแผนที่สาย'} <ArrowRight size={16} strokeWidth={2} aria-hidden />
        </span>
      </Link>
    </li>
  );
}
