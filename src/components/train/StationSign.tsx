import { Suspense, type ReactNode } from 'react';
import { groupLabel } from '../../data/scripts';
import type { ScriptPack } from '../../data/types';
import { useStrokeData } from '../../data/useStrokes';
import { lineLetter, stationName, stationReading, type Station } from '../../features/progress/stations';
import { StrokeDraw } from '../../features/writing/StrokeDraw';
import { cx } from '../../lib/cx';
import { packTone, tone, type Tone } from '../../lib/tone';
import styles from './StationSign.module.css';

/** สถานีข้างเคียงบนแถบสีสาย */
interface SignStop {
  name: string;
  reading: string;
}

interface SignBoardProps {
  lineTone: Tone;
  label: string;
  /** อักษรสาย + เลข เช่น H / 03 */
  letter: string;
  number: string;
  /** ชื่อสถานีตัวใหญ่ */
  name: ReactNode;
  reading: string;
  /** บรรทัดรองเป็นภาษาไทย (ไม่เว้นระยะตัวอักษรแบบโรมาจิ) · จอแคบซ่อนบรรทัดรองในแถบสีสาย (ชื่อไทยยาว) */
  readingThai?: boolean;
  lineJa: string;
  lineName: string;
  prev: SignStop | null;
  next: SignStop | null;
}

/**
 * โครงป้ายชื่อสถานี (駅名標) แบบป้ายรถไฟญี่ปุ่น: เลขสถานี · ชื่อสถานีตัวใหญ่ · ชื่อสาย
 * · แถบสีสายด้านล่างบอกสถานีก่อนหน้า/ถัดไป (ต้นสาย = 始発 · ปลายสาย = 終点)
 */
function SignBoard({ lineTone, label, letter, number, name, reading, readingThai, lineJa, lineName, prev, next }: SignBoardProps) {
  return (
    <div className={cx('tone', styles.sign)} style={tone(lineTone)} role="group" aria-label={label}>
      <div className={styles.top}>
        <span className={styles.num} aria-hidden>
          <small>{letter}</small>
          {number}
        </span>
        <div className={styles.name}>
          {name}
          <span className={cx(styles.reading, readingThai && styles.readingThai)}>{reading}</span>
        </div>
        <span className={styles.line}>
          <span className="kana">{lineJa}</span>
          <br />
          {lineName}
        </span>
      </div>
      <div className={cx(styles.band, readingThai && styles.bandThai)}>
        <span>
          {prev ? (
            <>
              ← <span className="kana">{prev.name}</span> <span className={styles.bandReading}>{prev.reading}</span>
            </>
          ) : (
            <>
              <span className="kana">始発</span> สถานีแรก
            </>
          )}
        </span>
        <span>
          {next ? (
            <>
              <span className="kana">{next.name}</span> <span className={styles.bandReading}>{next.reading}</span> →
            </>
          ) : (
            <>
              <span className="kana">終点</span> ปลายทาง
            </>
          )}
        </span>
      </div>
    </div>
  );
}

interface StationSignProps {
  station: Station;
  prev: Station | null;
  next: Station | null;
}

const signStop = (st: Station | null): SignStop | null =>
  st && { name: stationName(st.group), reading: stationReading(st.group) };

/** ป้ายสถานีของสายตัวอักษร: ชื่อสถานี = ตัวแรกของแถว เขียนตัวเองตามลำดับขีด */
export function StationSign({ station, prev, next }: StationSignProps) {
  const { pack, group } = station;
  const name = stationName(group);
  return (
    <SignBoard
      lineTone={packTone(pack)}
      label={`ป้ายสถานี ${station.code}: ${pack.name} ${groupLabel(group)}`}
      letter={lineLetter(pack)}
      number={station.code.slice(1)}
      name={
        <Suspense fallback={<span className={cx('kana', styles.nameText)}>{name}</span>}>
          <SignGlyph pack={pack} char={name} />
        </Suspense>
      }
      reading={stationReading(group)}
      lineJa={`${pack.nameJa}線`}
      lineName={`สาย${pack.name}`}
      prev={signStop(prev)}
      next={signStop(next)}
    />
  );
}

/** ชื่อสถานีที่เขียนตัวเอง — ตัวควบ (きゃ) ไม่มีลำดับขีดของตัวเอง จึงแสดงเป็นตัวหนังสือ */
function SignGlyph({ pack, char }: { pack: ScriptPack; char: string }) {
  const data = useStrokeData(pack, char);
  if (!data) return <span className={cx('kana', styles.nameText)}>{char}</span>;
  return <StrokeDraw data={data} label={`ลำดับขีดของ ${char} (แตะเพื่อดูอีกครั้ง)`} delay={350} className={styles.ink} />;
}

/** บทเรียนบนป้าย (สายคำศัพท์): ชื่อบทภาษาญี่ปุ่น + ชื่อบทภาษาไทย */
export interface LessonSignStop {
  code: string;
  name: string;
  title: string;
}

interface LessonSignProps {
  lesson: LessonSignStop;
  prev: LessonSignStop | null;
  next: LessonSignStop | null;
  lineTone: Tone;
  lineJa: string;
  lineName: string;
}

/** ป้ายสถานีของสายบทเรียน (คำศัพท์): ชื่อบทเป็นคานะหลายตัว จึงแสดงเป็นตัวหนังสือขนาดย่อตามความยาว */
export function LessonSign({ lesson, prev, next, lineTone, lineJa, lineName }: LessonSignProps) {
  const long = [...lesson.name].length > 3;
  const letter = lesson.code.replace(/\d+$/, '');
  return (
    <SignBoard
      lineTone={lineTone}
      label={`ป้ายสถานี ${lesson.code}: ${lineName} บท${lesson.title}`}
      letter={letter}
      number={lesson.code.slice(letter.length)}
      name={
        <span className={cx('kana', styles.nameText, styles.nameWord, long && styles.nameLong)} lang="ja">
          {lesson.name}
        </span>
      }
      reading={lesson.title}
      readingThai
      lineJa={lineJa}
      lineName={lineName}
      prev={prev && { name: prev.name, reading: prev.title }}
      next={next && { name: next.name, reading: next.title }}
    />
  );
}
