import { Suspense } from 'react';
import { groupLabel } from '../../data/scripts';
import type { ScriptPack } from '../../data/types';
import { useStrokeData } from '../../data/useStrokes';
import { lineLetter, stationName, stationReading, type Station } from '../../features/progress/stations';
import { StrokeDraw } from '../../features/writing/StrokeDraw';
import { cx } from '../../lib/cx';
import { packTone, tone } from '../../lib/tone';
import styles from './StationSign.module.css';

interface StationSignProps {
  station: Station;
  prev: Station | null;
  next: Station | null;
}

/**
 * ป้ายชื่อสถานี (駅名標) แบบป้ายรถไฟญี่ปุ่น: เลขสถานี · ชื่อสถานีตัวใหญ่ (เขียนตัวเองตามลำดับขีด)
 * · แถบสีสายด้านล่างบอกสถานีก่อนหน้า/ถัดไป (ต้นสาย = 始発 · ปลายสาย = 終点)
 */
export function StationSign({ station, prev, next }: StationSignProps) {
  const { pack, group } = station;
  const name = stationName(group);
  return (
    <div
      className={cx('tone', styles.sign)}
      style={tone(packTone(pack))}
      role="group"
      aria-label={`ป้ายสถานี ${station.code}: ${pack.name} ${groupLabel(group)}`}
    >
      <div className={styles.top}>
        <span className={styles.num} aria-hidden>
          <small>{lineLetter(pack)}</small>
          {station.code.slice(1)}
        </span>
        <div className={styles.name}>
          <Suspense fallback={<span className={cx('kana', styles.nameText)}>{name}</span>}>
            <SignGlyph pack={pack} char={name} />
          </Suspense>
          <span className={styles.reading}>{stationReading(group)}</span>
        </div>
        <span className={styles.line}>
          <span className="kana">{pack.nameJa}線</span>
          <br />
          สาย{pack.name}
        </span>
      </div>
      <div className={styles.band}>
        <span>
          {prev ? (
            <>
              ← <span className="kana">{stationName(prev.group)}</span> {stationReading(prev.group)}
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
              <span className="kana">{stationName(next.group)}</span> {stationReading(next.group)} →
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

/** ชื่อสถานีที่เขียนตัวเอง — ตัวควบ (きゃ) ไม่มีลำดับขีดของตัวเอง จึงแสดงเป็นตัวหนังสือ */
function SignGlyph({ pack, char }: { pack: ScriptPack; char: string }) {
  const data = useStrokeData(pack, char);
  if (!data) return <span className={cx('kana', styles.nameText)}>{char}</span>;
  return <StrokeDraw data={data} label={`ลำดับขีดของ ${char} (แตะเพื่อดูอีกครั้ง)`} delay={350} className={styles.ink} />;
}
