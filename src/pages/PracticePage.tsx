import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useRef, type CSSProperties } from 'react';
import {
  Link,
  Navigate,
  useLocation,
  useNavigationType,
  useParams,
  useSearchParams,
} from 'react-router';
import { useScriptPack } from '../app/ScriptContext';
import { KanaTable } from '../components/KanaTable';
import { SpeakButton } from '../components/SpeakButton';
import { findChar, groupLabel, romajiLabel } from '../data/scripts';
import { useStrokeData } from '../data/useStrokes';
import { masteryLevel, MASTERY_LABEL } from '../features/progress/progressLogic';
import { recordPractice, useScriptProgress } from '../features/progress/progressStore';
import {
  STRICTNESS_LABEL,
  STRICTNESS_LENIENCY,
  STRICTNESS_ORDER,
  updateSettings,
  useSettings,
} from '../features/settings/settings';
import { FreeWriteBoard } from '../features/writing/FreeWriteBoard';
import { StrokeAnimator } from '../features/writing/StrokeAnimator';
import { StrokeCheckBoard, type CheckResult } from '../features/writing/StrokeCheckBoard';
import { cx } from '../lib/cx';
import { ExampleWord } from '../components/ExampleWord';
import { rowStatus } from '../features/progress/learningPath';
import NotFoundPage from './NotFoundPage';
import styles from './PracticePage.module.css';

type Mode = 'animate' | 'trace' | 'check' | 'free';

const MODES: { id: Mode; label: string; tip: string }[] = [
  {
    id: 'animate',
    label: 'ดูลำดับขีด',
    tip: 'ดูลำดับและทิศทางการเขียนให้จำก่อน กด "ดูทีละขีด" เพื่อดูช้าๆ แล้วค่อยไปฝึกเขียนทับ',
  },
  {
    id: 'trace',
    label: 'เขียนทับ',
    tip: 'ลากตามเส้นจางทีละขีดตามลำดับ (เริ่มที่จุดสีแดง) ระบบจะตรวจลำดับและทิศทางให้ ผิด 3 ครั้งจะมีคำใบ้',
  },
  {
    id: 'check',
    label: 'ตรวจทีละขีด',
    tip: 'ไม่มีเส้นนำแล้ว เขียนทีละขีดจากความจำ ระบบตรวจทุกขีด ขนาดหรือตำแหน่งเยื้องนิดหน่อยไม่เป็นไร',
  },
  {
    id: 'free',
    label: 'เขียนอิสระ',
    tip: 'เขียนทั้งตัวรวดเดียวจากความจำ แล้วกด "ตรวจ" เพื่อดูคะแนนและข้อผิดพลาดของแต่ละขีด',
  },
];

const isMode = (v: string | null): v is Mode => MODES.some((m) => m.id === v);

/** /:script/practice → ไปตัวแรก */
export function PracticeIndex() {
  const pack = useScriptPack();
  return <Navigate to={`/${pack.id}/practice/${pack.chars[0]!.id}`} replace />;
}

export default function PracticePage() {
  const pack = useScriptPack();
  const { charId } = useParams();
  const [params, setParams] = useSearchParams();
  const settings = useSettings();
  const progress = useScriptProgress(pack.id);
  // ทิศที่เปลี่ยนตัว (ลูกศรด้านบน / ปุ่ม "ตัวถัดไป" ด้านล่าง) — ใช้เลื่อนตัวอักษรเข้ามาจากทิศนั้น
  // เฉพาะการกดลิงก์ (PUSH) ไม่ใช่ตอนกดย้อนกลับของเบราว์เซอร์
  const navType = useNavigationType();
  const { state } = useLocation();
  const dir = navType === 'PUSH' ? ((state as { dir?: number } | null)?.dir ?? 0) : 0;

  // มือถือจอเล็ก/แนวนอน: เปิดหน้า เปลี่ยนตัว หรือเปลี่ยนโหมด → เลื่อนให้กระดานอยู่ในจอครบทั้งอัน
  // (ระหว่างเขียนบนกระดานเลื่อนหน้าไม่ได้) — ถ้าเห็นครบอยู่แล้วจะไม่เลื่อน
  const boardRef = useRef<HTMLDivElement>(null);
  const scrolledOnce = useRef(false);
  const modeKey = params.get('mode');
  useEffect(() => {
    // เลื่อนแค่ตัวกระดาน (svg แรก) ไม่รวมข้อความ/ปุ่มด้านล่าง → เลื่อนน้อยที่สุด การ์ดตัวอักษรด้านบนยังเห็นมากที่สุด
    const el = boardRef.current?.querySelector('svg');
    if (!el) return;
    const smooth = scrolledOnce.current && !matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ block: 'nearest', behavior: smooth ? 'smooth' : 'auto' });
    scrolledOnce.current = true;
  }, [charId, modeKey]);

  const entry = findChar(pack, charId);
  const strokes = useStrokeData(pack, entry?.char ?? '');
  if (!entry || !strokes) return <NotFoundPage />;

  const modeParam = params.get('mode');
  const mode: Mode = isMode(modeParam) ? modeParam : 'animate';
  const modeInfo = MODES.find((m) => m.id === mode)!;
  const leniency = STRICTNESS_LENIENCY[settings.strictness];

  const index = pack.chars.indexOf(entry);
  const prev = pack.chars[index - 1];
  const next = pack.chars[index + 1];
  const group = pack.groups.find((g) => g.id === entry.group);
  const rowState = rowStatus(
    pack.chars.filter((c) => c.group === entry.group),
    progress,
  );
  const level = masteryLevel(progress?.[entry.id]);
  const hrefFor = (id: string, m: Mode = mode) =>
    `/${pack.id}/practice/${id}${m === 'animate' ? '' : `?mode=${m}`}`;
  const setMode = (m: Mode) =>
    setParams(m === 'animate' ? {} : { mode: m }, { replace: true, preventScrollReset: true });

  const onTraceDone = () => recordPractice(pack.id, entry.id);
  // ตรวจทีละขีด: ใช้ตัวช่วย = ผิด, ไม่ผิดเลย = ถูก, ผิดบ้างแต่ไม่ใช้ตัวช่วย = ไม่ตัดสิน
  const onCheckDone = ({ mistakes, hintsUsed }: CheckResult) =>
    recordPractice(pack.id, entry.id, {
      correct: hintsUsed > 0 ? false : mistakes === 0 ? true : undefined,
    });

  const boardLabel = `กระดานเขียนตัว ${entry.char}`;
  // key = ตัวอักษร → เล่นแอนิเมชันใหม่ทุกครั้งที่เปลี่ยนตัว
  const slide = dir !== 0 ? styles.slideIn : undefined;
  const slideStyle = { '--dir': dir } as CSSProperties;

  return (
    <div className={`container ${styles.layout}`}>
      <aside className={styles.picker}>
        <details className={styles.pickerDetails} open>
          <summary className={styles.pickerSummary}>
            เลือกตัวอักษร
          </summary>
          <KanaTable
            pack={pack}
            progress={progress}
            hrefFor={(c) => hrefFor(c.id)}
            activeId={entry.id}
            compact
          />
        </details>
      </aside>

      <section className={styles.main} aria-labelledby="char-title">
        <header className={cx('card', styles.charHeader)}>
          <div
            key={`c-${entry.id}`}
            className={cx('kana', styles.bigChar, slide)}
            style={slideStyle}
            id="char-title"
            lang="ja"
          >
            {entry.char}
          </div>
          <div key={`i-${entry.id}`} className={cx(styles.charInfo, slide)} style={slideStyle}>
            <div className={styles.reading}>
              <span className={styles.romaji}>{romajiLabel(entry)}</span>
              <span className={styles.thai}>{entry.thai}</span>
              <SpeakButton text={entry.char} label={`ฟังเสียง ${entry.char}`} size="sm" />
            </div>
            <p className="small muted">
              {group && groupLabel(group)} · {strokes.strokes.length} ขีด ·{' '}
              <span className={styles[`level${level}`]}>{MASTERY_LABEL[level]}</span>
              {entry.base && (
                <>
                  {' '}
                  · มาจาก <span className="kana">{entry.base}</span>
                </>
              )}
            </p>
          </div>
          <div className={styles.nav}>
            {prev ? (
              <Link
                to={hrefFor(prev.id)}
                state={{ dir: -1 }}
                className="btn btn-icon"
                aria-label={`ตัวก่อนหน้า ${prev.char}`}
              >
                <ChevronLeft size={20} strokeWidth={1.6} aria-hidden />
              </Link>
            ) : (
              <span className="btn btn-icon" aria-hidden style={{ visibility: 'hidden' }} />
            )}
            {next ? (
              <Link
                to={hrefFor(next.id)}
                state={{ dir: 1 }}
                className="btn btn-icon"
                aria-label={`ตัวถัดไป ${next.char}`}
              >
                <ChevronRight size={20} strokeWidth={1.6} aria-hidden />
              </Link>
            ) : (
              <span className="btn btn-icon" aria-hidden style={{ visibility: 'hidden' }} />
            )}
          </div>
          {(entry.note || entry.example) && (
            <div className={styles.extra}>
              {entry.note && <p className={cx('small', styles.note)}>{entry.note}</p>}
              {entry.example && <ExampleWord word={entry.example} char={entry.char} />}
            </div>
          )}
        </header>

        <div className={styles.modeBar}>
          <div className="segmented" role="tablist" aria-label="โหมดฝึก">
            {MODES.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={mode === id}
                aria-controls="practice-board"
                onClick={() => setMode(id)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div id="practice-board" role="tabpanel" className={styles.board} ref={boardRef}>
          {mode === 'animate' && (
            <StrokeAnimator
              key={entry.id}
              data={strokes}
              speed={settings.animationSpeed}
              showNumbers={settings.showStrokeNumbers}
              label={`แอนิเมชันลำดับขีดของ ${entry.char}`}
            />
          )}
          {mode === 'trace' && (
            <StrokeCheckBoard
              key={`${entry.id}-trace-${settings.strictness}`}
              data={strokes}
              guide
              leniency={leniency}
              showNumbers={settings.showStrokeNumbers}
              label={boardLabel}
              onComplete={onTraceDone}
            />
          )}
          {mode === 'check' && (
            <StrokeCheckBoard
              key={`${entry.id}-check-${settings.strictness}`}
              data={strokes}
              guide={false}
              leniency={leniency}
              label={boardLabel}
              onComplete={onCheckDone}
            />
          )}
          {mode === 'free' && (
            <FreeWriteBoard
              key={`${entry.id}-free`}
              data={strokes}
              leniency={leniency}
              label={boardLabel}
              onShowOrder={() => setMode('animate')}
              onResult={(r) =>
                recordPractice(pack.id, entry.id, {
                  score: r.score,
                  correct: r.score >= 70 ? true : r.score < 40 ? false : undefined,
                })
              }
            />
          )}
        </div>

        <div className={styles.footerBar}>
          <p className="small muted">{modeInfo.tip}</p>
          <div className={styles.options}>
            {(mode === 'animate' || mode === 'trace') && (
              <label className="chip">
                <input
                  type="checkbox"
                  checked={settings.showStrokeNumbers}
                  onChange={(e) => updateSettings({ showStrokeNumbers: e.target.checked })}
                />
                แสดงเลขลำดับขีด
              </label>
            )}
            {mode !== 'animate' && (
              <div className="row">
                <span className="small muted">ความเข้มงวดในการตรวจ</span>
                <div className="segmented" role="group" aria-label="ความเข้มงวดในการตรวจ">
                  {STRICTNESS_ORDER.map((s) => (
                    <button
                      key={s}
                      type="button"
                      aria-pressed={settings.strictness === s}
                      onClick={() => updateSettings({ strictness: s })}
                    >
                      {STRICTNESS_LABEL[s]}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="row" style={{ justifyContent: 'center' }}>
            {/* เขียนครบทั้งแถวแล้ว แต่ยังไม่เคยตอบถูกครบ → ชวนไปทดสอบแถวนี้ (ตามเส้นทาง "เรียนต่อ") */}
            {group && rowState.kind === 'quiz' && (
              <Link to={`/${pack.id}/quiz?groups=${group.id}`} className="btn btn-primary">
                ทดสอบแถว <span className="kana">{group.head}</span>
              </Link>
            )}
            {next && (
              <Link
                to={hrefFor(next.id)}
                state={{ dir: 1 }}
                className={rowState.kind === 'quiz' ? 'btn' : 'btn btn-primary'}
              >
                ตัวถัดไป <span className="kana">{next.char}</span> →
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
