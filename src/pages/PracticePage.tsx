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
import { findChar, groupLabel, isCompound, romajiLabel } from '../data/scripts';
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
import type { CheckResult } from '../features/writing/StrokeCheckBoard';
import { StrokeStepBoard, StrokeStepList } from '../features/writing/StrokeStepBoard';
import step from '../features/writing/StrokeStepBoard.module.css';
import { referenceStrokes } from '../features/writing/engine/refStrokes';
import { cx } from '../lib/cx';
import { ExampleWord } from '../components/ExampleWord';
import { rowNeeds, rowStatus } from '../features/progress/learningPath';
import { CompoundPanel } from '../features/writing/CompoundPanel';
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

  // เปิดหน้า เปลี่ยนตัว หรือเปลี่ยนโหมด → เลื่อนให้ "ชุดเขียน" (กระดาน + บรรทัดสถานะ + ปุ่มไปต่อ) อยู่ในจอครบ
  // ถ้าจอเตี้ยเกินจะใส่ครบ (มือถือแนวนอน) เบราว์เซอร์จะชิดขอบบน → อย่างน้อยเห็นกระดานเต็มอัน
  // ถ้าเห็นครบอยู่แล้วจะไม่เลื่อน
  const boardRef = useRef<HTMLDivElement>(null);
  const scrolledOnce = useRef(false);
  const modeKey = params.get('mode');
  useEffect(() => {
    const el = boardRef.current;
    // หน้าตัวควบไม่มีกระดานเขียน — ไม่ต้องเลื่อน (จะทำให้หัวหน้าที่มีคำอ่านเลื่อนหายไป)
    if (!el || el.dataset.noscroll !== undefined) return;
    const smooth = scrolledOnce.current && !matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ block: 'nearest', behavior: smooth ? 'smooth' : 'auto' });
    scrolledOnce.current = true;
  }, [charId, modeKey]);

  // ตารางข้าง (จอกว้าง) เลื่อนภายในตัวเองได้ → เปลี่ยนตัวแล้วให้ช่องที่เลือกอยู่ในส่วนที่มองเห็น
  // เลื่อนเฉพาะแผงนี้ ไม่ใช้ scrollIntoView (จะพาทั้งหน้าเลื่อนตามไปด้วย)
  const sideRef = useRef<HTMLElement>(null);

  // ความสูงตารางข้าง = ส่วนที่เหลือของจอใต้ขอบบนของแผง (ก่อนเลื่อนหน้า แผงยังไม่ติดจอและเริ่มต่ำกว่า
  // ถ้าใช้ความสูงตอนติดจอ ส่วนล่างของแผงจะเลยขอบจอ ช่องท้ายตารางจะมองไม่เห็นแม้เลื่อนในแผงสุดแล้ว)
  useEffect(() => {
    const side = sideRef.current;
    if (!side) return;
    let frame = 0;
    const fit = () => {
      frame = 0;
      if (side.offsetParent === null) return; // จอแคบ: ไม่มีตารางข้าง
      const top = Math.max(side.getBoundingClientRect().top, 0);
      side.style.maxHeight = `${Math.max(240, Math.floor(window.innerHeight - top - 16))}px`;
    };
    const onChange = () => {
      if (!frame) frame = requestAnimationFrame(fit);
    };
    fit();
    window.addEventListener('scroll', onChange, { passive: true });
    window.addEventListener('resize', onChange);
    return () => {
      window.removeEventListener('scroll', onChange);
      window.removeEventListener('resize', onChange);
      cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    const side = sideRef.current;
    if (!side || side.clientHeight === 0) return;
    const align = () => {
      const cell = side.querySelector<HTMLElement>('[aria-current="true"]');
      if (!cell) return;
      const s = side.getBoundingClientRect();
      const c = cell.getBoundingClientRect();
      // ส่วนที่มองเห็นจริง: แผงอาจยาวเลยขอบล่างจอ (ตอนหน้ายังไม่ได้เลื่อน แผงยังไม่ติดจอ)
      const top = Math.max(s.top, 0);
      const bottom = Math.min(s.bottom, window.innerHeight);
      if (c.top < top + 40 || c.bottom > bottom - 16) {
        side.scrollTop += (c.top + c.bottom) / 2 - (top + bottom) / 2;
      }
    };
    align();
    // ฟอนต์ญี่ปุ่นโหลดเสร็จทีหลัง → แถวสูงขึ้นและช่องที่เลือกเลื่อนตำแหน่ง: จัดใหม่เมื่อขนาดตารางเปลี่ยน
    // เฉพาะช่วงแรก และหยุดทันทีถ้าผู้ใช้เลื่อน/แตะแผงเอง (ไม่แย่งการเลื่อนของผู้ใช้)
    const content = side.lastElementChild;
    const ro = new ResizeObserver(() => align());
    if (content) ro.observe(content);
    const stop = () => ro.disconnect();
    const timer = window.setTimeout(stop, 2000);
    side.addEventListener('wheel', stop, { passive: true, once: true });
    side.addEventListener('pointerdown', stop, { once: true });
    return () => {
      stop();
      window.clearTimeout(timer);
      side.removeEventListener('wheel', stop);
      side.removeEventListener('pointerdown', stop);
    };
  }, [charId]);

  const entry = findChar(pack, charId);
  const strokes = useStrokeData(pack, entry?.char ?? '');
  // ตัวควบ (きゃ) ไม่มีลำดับขีดของตัวเอง → แสดงหน้าวิธีเขียน/วิธีอ่านแทนกระดาน
  if (!entry || (!strokes && !isCompound(entry))) return <NotFoundPage />;
  const compound = isCompound(entry);

  const modeParam = params.get('mode');
  const mode: Mode = isMode(modeParam) ? modeParam : 'animate';
  const modeInfo = MODES.find((m) => m.id === mode)!;
  const leniency = STRICTNESS_LENIENCY[settings.strictness];

  const index = pack.chars.indexOf(entry);
  const prev = pack.chars[index - 1];
  const next = pack.chars[index + 1];
  const group = pack.groups.find((g) => g.id === entry.group);
  // ตัวเล็ก/ー ไม่มีเสียงของตัวเอง: ไม่มีปุ่มฟังเสียง
  const silent = group?.kind === 'small';
  const rowState = rowStatus(
    pack.chars.filter((c) => c.group === entry.group),
    progress,
    rowNeeds(group?.kind),
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
  // ปุ่มไปต่อเมื่อเขียนครบ (อยู่ใต้กระดาน) — แถวพร้อมสอบ: ทดสอบแถวเป็นปุ่มหลัก, ไม่งั้นตัวถัดไปเป็นปุ่มหลัก
  const rowQuiz = group && rowState.kind === 'quiz' ? group : undefined;
  const completeActions =
    rowQuiz || next ? (
      <>
        {rowQuiz && (
          <Link to={`/${pack.id}/quiz?groups=${rowQuiz.id}`} className="btn btn-primary btn-sm">
            ทดสอบแถว <span className="kana">{rowQuiz.head}</span>
          </Link>
        )}
        {next && (
          <Link
            to={hrefFor(next.id)}
            state={{ dir: 1 }}
            preventScrollReset
            className={cx('btn btn-sm', !rowQuiz && 'btn-primary')}
          >
            ตัวถัดไป <span className="kana">{next.char}</span> →
          </Link>
        )}
      </>
    ) : undefined;
  // key = ตัวอักษร → เล่นแอนิเมชันใหม่ทุกครั้งที่เปลี่ยนตัว
  const slide = dir !== 0 ? styles.slideIn : undefined;
  const slideStyle = { '--dir': dir } as CSSProperties;

  return (
    <div className={`container ${styles.layout}`}>
      <section className={styles.main} aria-labelledby="char-title">
        <header className={cx('card', styles.charHeader)}>
          <div
            key={`c-${entry.id}`}
            className={cx('kana', styles.bigChar, compound && styles.bigCompound, slide)}
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
              {!silent && <SpeakButton text={entry.char} label={`ฟังเสียง ${entry.char}`} size="sm" />}
            </div>
            <p className="small muted">
              {group && groupLabel(group)} ·{' '}
              {compound ? (
                <>
                  ตัวควบ <span className="kana">{entry.parts!.join(' + ')}</span>
                </>
              ) : (
                `${strokes!.strokes.length} ขีด`
              )}{' '}
              ·{' '}
              <span className={styles[`level${level}`]}>{MASTERY_LABEL[level]}</span>
              {entry.base && (
                <>
                  {' '}
                  · มาจาก <span className="kana">{entry.base}</span>
                </>
              )}
            </p>
          </div>
          {/* ลูกศรบอกตัวข้างเคียง (‹ お · い ›) — รู้ว่ากดแล้วไปตัวไหน */}
          <nav className={styles.nav} aria-label="เปลี่ยนตัวอักษร">
            {prev ? (
              <Link
                to={hrefFor(prev.id)}
                state={{ dir: -1 }}
                className={cx('btn', styles.navBtn)}
                aria-label={`ตัวก่อนหน้า ${prev.char}`}
              >
                <ChevronLeft size={18} strokeWidth={1.6} aria-hidden />
                <span className="kana" lang="ja" aria-hidden>
                  {prev.char}
                </span>
              </Link>
            ) : (
              <span className={cx('btn', styles.navBtn)} aria-hidden style={{ visibility: 'hidden' }} />
            )}
            {next ? (
              <Link
                to={hrefFor(next.id)}
                state={{ dir: 1 }}
                className={cx('btn', styles.navBtn)}
                aria-label={`ตัวถัดไป ${next.char}`}
              >
                <span className="kana" lang="ja" aria-hidden>
                  {next.char}
                </span>
                <ChevronRight size={18} strokeWidth={1.6} aria-hidden />
              </Link>
            ) : (
              <span className={cx('btn', styles.navBtn)} aria-hidden style={{ visibility: 'hidden' }} />
            )}
          </nav>
          {(entry.note || entry.example) && (
            <div className={styles.extra}>
              {entry.note && <p className={cx('small', styles.note)}>{entry.note}</p>}
              {entry.example && <ExampleWord word={entry.example} char={entry.char} />}
            </div>
          )}
        </header>

        {/* คอลัมน์งาน: แท็บโหมด + กระดาน (+ แผงลำดับขีด) + ส่วนพับ — ตัวควบ: วิธีเขียน/วิธีอ่านแทน */}
        <div className={styles.work}>
          {compound || !strokes ? (
            <div id="practice-board" className={styles.board} ref={boardRef} data-noscroll>
              <CompoundPanel
                key={entry.id}
                pack={pack}
                entry={entry}
                hrefFor={(id) => hrefFor(id, 'animate')}
                actions={completeActions}
              />
            </div>
          ) : (
          <>
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
                <div className={step.wrap}>
                  <div className={step.canvasCol}>
                    <StrokeAnimator
                      key={entry.id}
                      data={strokes}
                      speed={settings.animationSpeed}
                      showNumbers={settings.showStrokeNumbers}
                      label={`แอนิเมชันลำดับขีดของ ${entry.char}`}
                    />
                  </div>
                  <aside className={step.panel} aria-label="ลำดับขีด">
                    <p className={step.panelLabel}>ลำดับขีด</p>
                    <StrokeStepList data={strokes} refs={referenceStrokes(strokes)} />
                  </aside>
                </div>
              )}
              {mode === 'trace' && (
                <StrokeStepBoard
                  key={`${entry.id}-trace-${settings.strictness}`}
                  data={strokes}
                  guide
                  leniency={leniency}
                  showNumbers={settings.showStrokeNumbers}
                  label={boardLabel}
                  onComplete={onTraceDone}
                  completeActions={completeActions}
                />
              )}
              {mode === 'check' && (
                <StrokeStepBoard
                  key={`${entry.id}-check-${settings.strictness}`}
                  data={strokes}
                  guide={false}
                  leniency={leniency}
                  label={boardLabel}
                  onComplete={onCheckDone}
                  completeActions={completeActions}
                />
              )}
              {mode === 'free' && (
                <FreeWriteBoard
                  key={`${entry.id}-free`}
                  data={strokes}
                  leniency={leniency}
                  label={boardLabel}
                  completeActions={completeActions}
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

            {/*
              เขียนครบทั้งแถวแล้ว แต่ยังไม่เคยตอบถูกครบ → ชวนไปทดสอบแถวนี้ (ตามเส้นทาง "เรียนต่อ")
              อยู่ใต้กระดาน ไม่ดันกระดานลงไปจนต้องเลื่อนจอ
            */}
            {rowQuiz && (
              <p className={styles.rowReady}>
                เขียนครบทั้งแถว <span className="kana">{rowQuiz.head}</span> แล้ว —{' '}
                <Link to={`/${pack.id}/quiz?groups=${rowQuiz.id}`}>ทดสอบแถวนี้ →</Link>
              </p>
            )}
          </>
          )}

          {/* ตารางเลือกตัวอักษร: พับเก็บใต้กระดาน (เปลี่ยนตัวปกติใช้ลูกศรด้านบน) */}
          <details className={styles.picker}>
            <summary>เลือกตัวอักษร</summary>
            <div className={styles.pickerBody}>
              <KanaTable
                pack={pack}
                progress={progress}
                hrefFor={(c) => hrefFor(c.id)}
                activeId={entry.id}
                compact
              />
            </div>
          </details>

          {/* ตั้งค่าที่ไม่ได้ใช้บ่อย: พับเก็บไว้ ไม่ให้แย่งความสนใจจากกระดาน (ตัวควบไม่มีกระดาน) */}
          {!compound && (
            <details className={styles.settings}>
              <summary>วิธีฝึกและตั้งค่า</summary>
              <div className={styles.settingsBody}>
                <p className={styles.tip}>{modeInfo.tip}</p>
                <label className="chip">
                  <input
                    type="checkbox"
                    checked={settings.showStrokeNumbers}
                    onChange={(e) => updateSettings({ showStrokeNumbers: e.target.checked })}
                  />
                  แสดงเลขลำดับขีด
                </label>
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
              </div>
            </details>
          )}
        </div>

        {/* จอกว้าง (≥ 1440px): ตารางเลือกตัวอักษรเปิดค้างเป็นคอลัมน์ขวา แทนส่วนพับ "เลือกตัวอักษร" */}
        <aside className={styles.sidePicker} aria-label="เลือกตัวอักษร" ref={sideRef}>
          <p className={styles.sideLabel}>เลือกตัวอักษร</p>
          <KanaTable
            pack={pack}
            progress={progress}
            hrefFor={(c) => hrefFor(c.id)}
            activeId={entry.id}
            compact
          />
        </aside>
      </section>
    </div>
  );
}
