import { ArrowRight, BookOpen, ListChecks, PenLine, Printer, RotateCcw, TrainFront, type LucideIcon } from 'lucide-react';
import { Suspense, useMemo } from 'react';
import { Link } from 'react-router';
import { scriptPath } from '../app/paths';
import { RouteMap } from '../components/train/RouteMap';
import { StampBook } from '../components/train/StampBook';
import { LEVELS, scriptList } from '../data/scripts';
import type { ScriptPack } from '../data/types';
import { useStrokeData } from '../data/useStrokes';
import { buildPath, nextStep, stepHref } from '../features/progress/learningPath';
import { masteryLevel } from '../features/progress/progressLogic';
import { progressStore } from '../features/progress/progressStore';
import {
  lineLetter,
  nextStationOf,
  packStations,
  stationDone,
  stationName,
  stationStates,
} from '../features/progress/stations';
import { StrokeDraw } from '../features/writing/StrokeDraw';
import { cx } from '../lib/cx';
import { useStore } from '../lib/persistentStore';
import { packTone, tone } from '../lib/tone';
import styles from './KanaHubPage.module.css';

/** เครื่องมือในแต่ละชุด (ปุ่มในการ์ด) */
const TOOLS: { path: string; label: string; icon: LucideIcon }[] = [
  { path: 'practice', label: 'คัดตัวอักษร', icon: PenLine },
  { path: 'quiz', label: 'แบบทดสอบ', icon: ListChecks },
  { path: 'review', label: 'ทบทวน', icon: RotateCcw },
  { path: 'worksheet', label: 'พิมพ์แบบฝึก', icon: Printer },
];

const LESSONS = [
  // 始 = เริ่ม (始める hajimeru)
  { to: '/start', glyph: '始', title: 'เริ่มต้นที่นี่', desc: 'พื้นฐานที่ควรรู้ก่อนเริ่มเขียน — อ่านประมาณ 5 นาที' },
  {
    to: '/start#small-long',
    glyph: 'っ',
    title: 'ตัวเล็กและเสียงยาว',
    desc: 'ตัวควบ っ และเสียงยาว พร้อมฝึกฟังแยกเสียง (ระดับ 2)',
  },
];

/**
 * หมวดตัวอักษร (ชั้นที่ 2): การ์ดสายฮิรางานะ/คาตาคานะ (เข้าเครื่องมือได้จากการ์ดเลย)
 * + แผนที่สถานีของสายที่กำลังเรียน + ตราสถานี + บทเรียนพื้นฐาน
 */
export default function KanaHubPage() {
  const progress = useStore(progressStore);
  const path = useMemo(() => buildPath(scriptList), []);
  const step = nextStep(path, progress);

  // สายที่กำลังนั่งอยู่ = สาย + ระดับของขั้นถัดไป (ผ่านครบแล้ว → ช่วงสุดท้ายของเส้นทาง)
  const last = path[path.length - 1]!;
  const linePack = step?.pack ?? last.pack;
  const lineLevel = step?.level ?? last.level;
  const lineStations = packStations(linePack).filter((st) => st.level === lineLevel);
  const lineStates = stationStates(lineStations, progress, step);
  const linePassed = lineStates.filter((s) => s === 'done').length;
  const level = LEVELS.find((l) => l.id === lineLevel)!;

  return (
    <div className={cx('container', styles.page)}>
      <header className={styles.head}>
        <h1 className={styles.h1}>ตัวอักษร</h1>
        <p className={styles.lead}>
          เลือกสายที่จะนั่ง แล้วกดเข้าไปฝึกได้เลย — แนะนำให้เริ่มจากสายฮิรางานะ แล้วค่อยต่อสายคาตาคานะ
        </p>
      </header>

      <div className={styles.cards}>
        {scriptList.map((pack, i) => (
          <ScriptCard key={pack.id} pack={pack} delay={250 + i * 500} />
        ))}
      </div>

      <h2 className={styles.sectionTitle}>
        <span className="kana">路線図</span> เส้นทางที่กำลังนั่งอยู่
      </h2>
      <section className={cx('tone', styles.routeCard)} style={tone(packTone(linePack))} aria-labelledby="route-title">
        <div className={styles.routeHead}>
          <span className={cx('kana', styles.badge)}>{linePack.chars[0]!.char}</span>
          <div>
            <h3 id="route-title" className={styles.routeTitle}>
              สาย{linePack.name} <span className={cx('kana', styles.lineJa)}>{linePack.nameJa}線</span>
            </h3>
            <p className={styles.muted}>
              ระดับ {level.id} {level.name} · {lineStations.length} สถานี · ผ่านแล้ว {linePassed}
            </p>
          </div>
          {step && (
            <Link to={stepHref(step)} className={cx('btn btn-primary', styles.routeCta)}>
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
          )}
        </div>
        <RouteMap stations={lineStations} states={lineStates} />
      </section>

      {lineLevel === 1 && (
        <section className={cx('tone', styles.nextLine)} style={tone('l2')} aria-label="ระดับถัดไป">
          <span className={cx('kana', styles.badge)}>ゃ</span>
          <div>
            <p className={styles.nextLabel}>ระดับ 2 · หลังจบระดับ 1 ทั้งสองสาย</p>
            <p className={styles.nextTitle}>ตัวเล็กและตัวควบ</p>
            <p className={styles.muted}>
              <span className="kana">ゃ ゅ ょ っ</span> และตัวควบ เช่น <span className="kana">きゃ</span> —
              ทั้งฮิรางานะและคาตาคานะ
            </p>
          </div>
        </section>
      )}

      <h2 className={styles.sectionTitle}>
        <span className="kana">駅スタンプ</span> ตราสถานีของฉัน
      </h2>
      <p className={cx(styles.muted, styles.stampNote)}>
        สาย{linePack.name} ระดับ {level.id} — ผ่านแถวไหน (ฝึกเขียนครบและตอบถูกครบ) ได้ตราของสถานีนั้น
      </p>
      <StampBook stations={lineStations} states={lineStates} />

      <h2 className={styles.sectionTitle}>บทเรียน</h2>
      <ul className={styles.lessons}>
        {LESSONS.map((l) => (
          <li key={l.to}>
            <Link to={l.to} className={styles.lesson}>
              <span className={cx('kana', styles.lessonGlyph)}>{l.glyph}</span>
              <span className={styles.lessonText}>
                <span className={styles.lessonTitle}>{l.title}</span>
                <span className={styles.muted}>{l.desc}</span>
              </span>
              <BookOpen size={18} strokeWidth={1.8} aria-hidden className={styles.lessonIcon} />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** การ์ดสายของชุดตัวอักษร: ตัวแรกเขียนตัวเองในวงป้ายสถานี + ความคืบหน้า + ปุ่มเครื่องมือ */
function ScriptCard({ pack, delay }: { pack: ScriptPack; delay: number }) {
  const progress = useStore(progressStore);
  const p = progress.scripts[pack.id];
  const stations = packStations(pack);
  const passed = stations.filter((st) => stationDone(st, progress)).length;
  const next = nextStationOf(stations, progress);
  const mastered = pack.chars.filter((c) => masteryLevel(p?.[c.id]) === 3).length;
  const glyph = pack.chars[0]!.char;

  return (
    <article className={cx('tone', styles.card)} style={tone(packTone(pack))} aria-labelledby={`line-${pack.id}`}>
      <div className={styles.art}>
        <Suspense fallback={<span className={cx('kana', styles.artText)}>{glyph}</span>}>
          <CardGlyph pack={pack} char={glyph} delay={delay} />
        </Suspense>
        <span className={styles.code} aria-hidden>
          {lineLetter(pack)}
        </span>
      </div>
      <div className={styles.body}>
        <p className={cx('kana', styles.lineJa)}>{pack.nameJa}線</p>
        <h2 id={`line-${pack.id}`} className={styles.cardTitle}>
          <Link to={scriptPath(pack.id)}>สาย{pack.name}</Link>
        </h2>
        <p className={styles.muted}>{pack.description}</p>
        <div className={styles.progress}>
          <span className={styles.bar} aria-hidden>
            <span style={{ width: `${Math.max(1.5, (mastered / pack.chars.length) * 100)}%` }} />
          </span>
          <span className={styles.muted}>
            จำได้แล้ว {mastered} จาก {pack.chars.length} ตัว · ผ่านแล้ว {passed} จาก {stations.length} สถานี
          </span>
        </div>
        <p className={styles.nextStop}>
          <TrainFront size={14} strokeWidth={2.2} aria-hidden />
          {next ? (
            <>
              {passed > 0 ? 'สถานีต่อไป' : 'เริ่มที่สถานี'}{' '}
              <span className="kana">{stationName(next.group)}</span> ({next.code})
            </>
          ) : (
            'ผ่านครบทุกสถานีแล้ว'
          )}
        </p>
        <ul className={styles.tools}>
          {TOOLS.map(({ path, label, icon: Icon }) => (
            <li key={path}>
              <Link to={scriptPath(pack.id, path)}>
                <Icon size={16} strokeWidth={1.9} aria-hidden />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

function CardGlyph({ pack, char, delay }: { pack: ScriptPack; char: string; delay: number }) {
  const data = useStrokeData(pack, char);
  if (!data) return <span className={cx('kana', styles.artText)}>{char}</span>;
  return <StrokeDraw data={data} ghost delay={delay} label={`ลำดับขีดของ ${char} (แตะเพื่อดูอีกครั้ง)`} />;
}
