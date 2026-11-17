import { ArrowRight } from 'lucide-react';
import { Suspense, useMemo } from 'react';
import { Link } from 'react-router';
import { scriptPath } from '../app/paths';
import { useScriptPack } from '../app/ScriptContext';
import { TOOLS } from '../app/tools';
import { KanaTable, MasteryLegend } from '../components/KanaTable';
import { RouteMap } from '../components/train/RouteMap';
import { getScript, LEVELS } from '../data/scripts';
import type { ScriptPack } from '../data/types';
import { useStrokeData } from '../data/useStrokes';
import { buildPath, nextStep, stepHref } from '../features/progress/learningPath';
import { masteryLevel } from '../features/progress/progressLogic';
import { progressStore } from '../features/progress/progressStore';
import { lineLetter, packStations, stationName, stationStates, type Station } from '../features/progress/stations';
import { StrokeDraw } from '../features/writing/StrokeDraw';
import { cx } from '../lib/cx';
import { useStore } from '../lib/persistentStore';
import { packTone, tone } from '../lib/tone';
import styles from './ScriptHomePage.module.css';

/**
 * หน้าชุดตัวอักษร (ชั้นที่ 3) = หน้าสายรถไฟของชุดนี้:
 * แผนที่สถานีระดับ 1 และ 2 (กดสถานีเพื่อไปฝึกแถวนั้น) → เครื่องมือ 4 อย่าง → ตารางตัวอักษร
 */
export default function ScriptHomePage() {
  const pack = useScriptPack();
  const data = useStore(progressStore);
  const progress = data.scripts[pack.id];
  // สถานีปัจจุบันของสายนี้ = ขั้นถัดไปของเส้นทางเฉพาะชุดนี้ (หน้าแรกใช้เส้นทางรวมทุกชุด)
  const path = useMemo(() => buildPath([pack]), [pack]);
  const step = nextStep(path, data);
  const stations = packStations(pack);
  const states = stationStates(stations, data, step);
  const passed = states.filter((s) => s === 'done').length;
  const mastered = pack.chars.filter((c) => masteryLevel(progress?.[c.id]) === 3).length;
  const counterpart = pack.counterpart ? getScript(pack.counterpart) : undefined;
  const glyph = pack.chars[0]!.char;

  // กดสถานี: แถวที่ฝึกเขียนได้ → ไปฝึกตัวแรกของแถว · ตัวควบ (ไม่มีลำดับขีด) → แบบทดสอบเฉพาะแถว
  const hrefFor = (st: Station) =>
    st.group.kind === 'yoon'
      ? scriptPath(pack.id, `quiz?groups=${st.group.id}`)
      : scriptPath(pack.id, `practice/${st.chars[0]!.id}`);

  return (
    <div className={cx('container tone', styles.page)} style={tone(packTone(pack))}>
      <header className={styles.head}>
        <div className={styles.art}>
          <Suspense fallback={<span className={cx('kana', styles.artText)}>{glyph}</span>}>
            <HeadGlyph pack={pack} char={glyph} />
          </Suspense>
          <span className={styles.code} aria-hidden>
            {lineLetter(pack)}
          </span>
        </div>
        <div className={styles.headText}>
          <p className={cx('kana', styles.lineJa)}>{pack.nameJa}線</p>
          <h1 className={styles.h1}>สาย{pack.name}</h1>
          <p className={styles.muted}>{pack.description}</p>
          <p className={styles.stats}>
            จำได้แล้ว {mastered} จาก {pack.chars.length} ตัว · ผ่านแล้ว {passed} จาก {stations.length} สถานี
          </p>
          {counterpart && (
            <Link to={scriptPath(counterpart.id)} className={styles.transfer}>
              <span className={cx('kana', styles.transferTag)} style={tone(packTone(counterpart))}>
                乗換
              </span>{' '}
              ต่อรถไปสาย{counterpart.name}{' '}
              <span className="kana">{counterpart.nameJa}</span> →
            </Link>
          )}
        </div>
      </header>

      <section className={styles.routeCard} aria-labelledby="route-title">
        <div className={styles.routeHead}>
          <div>
            <h2 id="route-title" className={styles.h2}>
              <span className={cx('kana', styles.accentJa)}>路線図</span> แผนที่สาย{pack.name}
            </h2>
            <p className={styles.muted}>กดที่สถานีเพื่อไปฝึกแถวนั้นได้เลย</p>
          </div>
          {step ? (
            <Link to={stepHref(step)} className={cx('btn btn-primary', styles.cta)}>
              {step.status.kind === 'write' ? (
                <>
                  ฝึกเขียน <span className="kana">{step.status.next.char}</span> ต่อ
                </>
              ) : (
                <>
                  ทดสอบแถว <span className="kana">{step.group.head}</span>
                </>
              )}
              <ArrowRight size={18} strokeWidth={2} aria-hidden />
            </Link>
          ) : (
            <p className={styles.allDone}>
              <span className="kana">終点</span> ผ่านครบทุกสถานีแล้ว
            </p>
          )}
        </div>

        {LEVELS.map((level) => {
          const idx = stations.flatMap((st, i) => (st.level === level.id ? [i] : []));
          if (!idx.length) return null;
          const lineDone = idx.filter((i) => states[i] === 'done').length;
          return (
            <div key={level.id} className={styles.level}>
              <p className={styles.levelLabel}>
                ระดับ {level.id} · {level.name}{' '}
                <span className={styles.muted}>
                  ({stations[idx[0]!]!.code}–{stations[idx[idx.length - 1]!]!.code} · ผ่านแล้ว {lineDone}/
                  {idx.length})
                </span>
              </p>
              <RouteMap
                stations={idx.map((i) => stations[i]!)}
                states={idx.map((i) => states[i]!)}
                scroll
                hrefFor={hrefFor}
              />
            </div>
          );
        })}
        {step && (
          <p className={cx(styles.muted, styles.nextNote)}>
            สถานีต่อไป: <span className="kana">{stationName(step.group)}</span> — ฝึกเขียนให้ครบทุกตัวในแถว
            แล้วทำแบบทดสอบให้ตอบถูกครบ จึงได้ตราสถานี
          </p>
        )}
      </section>

      <nav className={styles.tools} aria-label="เครื่องมือ">
        {TOOLS.map(({ path: p, label, desc, icon: Icon }) => (
          <Link key={p} to={scriptPath(pack.id, p)} className={styles.tool}>
            <span className={styles.toolIcon} aria-hidden>
              <Icon size={22} strokeWidth={1.8} />
            </span>
            <span className={styles.toolText}>
              <strong>{label}</strong>
              <span className={styles.muted}>{desc}</span>
            </span>
            <ArrowRight size={18} strokeWidth={1.8} aria-hidden className={styles.toolArrow} />
          </Link>
        ))}
      </nav>

      <section className={styles.tableCard} aria-labelledby="table-title">
        <div className={styles.tableHead}>
          <h2 id="table-title" className={styles.h2}>
            ตารางตัวอักษร
          </h2>
          <span className={styles.muted}>
            จำได้แล้ว {mastered}/{pack.chars.length} · กดที่ตัวอักษรเพื่อฝึกเขียน
          </span>
        </div>
        <KanaTable pack={pack} progress={progress} hrefFor={(c) => scriptPath(pack.id, `practice/${c.id}`)} />
        <MasteryLegend />
      </section>
    </div>
  );
}

function HeadGlyph({ pack, char }: { pack: ScriptPack; char: string }) {
  const data = useStrokeData(pack, char);
  if (!data) return <span className={cx('kana', styles.artText)}>{char}</span>;
  return <StrokeDraw data={data} ghost delay={250} label={`ลำดับขีดของ ${char} (แตะเพื่อดูอีกครั้ง)`} />;
}
