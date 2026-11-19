import { ArrowRight, TrainFront } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router';
import { REVIEW_ROOT } from '../app/paths';
import { SECTIONS } from '../app/sections';
import { StationSign } from '../components/train/StationSign';
import { groupLabel, scriptList } from '../data/scripts';
import { streakInfo } from '../features/progress/activity';
import {
  buildPath,
  charState,
  nextStep,
  rowNeeds,
  stepHref,
  type NextStep,
  type PathStep,
} from '../features/progress/learningPath';
import type { ProgressData } from '../features/progress/progressLogic';
import { activityStore, progressStore } from '../features/progress/progressStore';
import { packStations } from '../features/progress/stations';
import { N5_DECK } from '../data/vocab/n5';
import { deckProgress, lessonStates } from '../features/vocab/vocabLogic';
import { useSettings } from '../features/settings/settings';
import { cx } from '../lib/cx';
import { useStore } from '../lib/persistentStore';
import { tone } from '../lib/tone';
import { useNow } from '../lib/useNow';
import styles from './HomePage.module.css';

/**
 * หน้าแรก = ชานชาลา: ป้ายสถานีต่อไปของผู้เรียน (ขั้นถัดไปของเส้นทางเรียนต่อ) + ปุ่มไปต่อ
 * + ตั๋วสรุป (วันต่อเนื่อง · เป้าวันนี้ · ตราสถานี) + แผนที่สาย (หมวด) — หมวดที่ยังไม่เปิดเป็น 工事中
 */
export default function HomePage() {
  const progress = useStore(progressStore);
  const activity = useStore(activityStore);
  const { dailyGoal } = useSettings();
  const now = useNow();
  const path = useMemo(() => buildPath(scriptList), []);
  const step = nextStep(path, progress);
  const streak = streakInfo(activity, now, dailyGoal);

  // สถานีบนป้าย: ขั้นถัดไป · ถ้าผ่านครบแล้วใช้สถานีสุดท้ายของเส้นทาง (ปลายทาง)
  const lastPack = path[path.length - 1]!.pack;
  const stations = packStations(step?.pack ?? lastPack);
  const at = step ? stations.findIndex((st) => st.group.id === step.group.id) : stations.length - 1;
  const station = stations[at]!;
  const isStart = !!step && step.index === 1 && step.status.kind === 'write' && step.status.remaining === step.chars.length;

  const n5Passed = lessonStates(N5_DECK, deckProgress(N5_DECK, progress)).filter((s) => s === 'done').length;
  const stamps = (step ? step.doneCount : path.length) + n5Passed;
  const remaining = Math.max(0, dailyGoal - streak.todayCount);

  return (
    <div className={cx('container', styles.page)}>
      <section className={styles.hero} aria-label="สถานีต่อไป">
        <div>
          <p className={styles.kicker}>
            {step ? (
              <>
                <span className="kana">{isStart ? '始発' : '次は'}</span> ·{' '}
                {isStart ? 'สถานีแรกของคุณ' : 'สถานีต่อไปของคุณ'}
              </>
            ) : (
              <>
                <span className="kana">終点</span> · ผ่านครบทุกสถานีแล้ว
              </>
            )}
          </p>
          <StationSign station={station} prev={stations[at - 1] ?? null} next={stations[at + 1] ?? null} />
        </div>

        <div className={styles.side}>
          <h1 className={styles.h1}>เรียนภาษาญี่ปุ่น เหมือนนั่งรถไฟไปทีละสถานี</h1>
          <p className={styles.lead}>
            แต่ละแถวตัวอักษรคือหนึ่งสถานี ฝึกเขียนให้ครบ ทำแบบทดสอบให้ผ่าน แล้วรับตราสถานีไปสะสม — ฟรี
            ไม่ต้องสมัครสมาชิก
          </p>
          {step ? <Platform step={step} progress={progress} /> : null}
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
            <Link to={REVIEW_ROOT} className={cx('btn btn-primary', styles.cta)}>
              ไปหน้าทบทวน
              <ArrowRight size={18} strokeWidth={2} aria-hidden />
            </Link>
          )}
        </div>
      </section>

      <ul className={styles.tickets} aria-label="สรุปการเดินทาง">
        <li className={styles.ticket}>
          <span className={styles.ticketBig}>{streak.current} วัน</span>
          <span className={styles.ticketSmall}>เดินทางติดต่อกัน (ทำครบเป้า)</span>
        </li>
        <li className={styles.ticket}>
          <span className={styles.ticketBig}>
            {Math.min(streak.todayCount, dailyGoal)}/{dailyGoal}
          </span>
          <span className={styles.ticketSmall}>
            {streak.todayMet ? 'ถึงเป้าวันนี้แล้ว' : `ครั้งวันนี้ (อีก ${remaining} ครั้งครบเป้า)`}
          </span>
        </li>
        <li className={styles.ticket}>
          <span className={styles.ticketBig}>{stamps} ตรา</span>
          <span className={styles.ticketSmall}>
            ตราสถานีที่สะสมแล้ว (จาก {path.length + N5_DECK.lessons.length})
          </span>
        </li>
      </ul>

      <h2 className={styles.sectionTitle}>
        <span className="kana">路線図</span> เลือกเส้นทาง
      </h2>
      <ul className={styles.lines}>
        {SECTIONS.map((sec) => {
          const body = (
            <>
              <span className={cx(styles.badge, sec.glyph !== 'N5' && 'kana')}>{sec.glyph}</span>
              <span className={styles.lineInfo}>
                <span className={styles.lineName}>{sec.name}</span>
                <span className={styles.lineDesc}>{sec.desc}</span>
              </span>
              <span className={styles.trackWrap}>
                {sec.id === 'kana' ? (
                  <KanaTrack path={path} reached={step ? step.index - 1 : path.length} />
                ) : sec.id === 'jlpt-n5' ? (
                  <LessonTrack passed={n5Passed} total={N5_DECK.lessons.length} />
                ) : (
                  <>
                    <span className={styles.trackSoon} />
                    <span className={styles.koji}>
                      <span className="kana">工事中</span> กำลังสร้าง
                    </span>
                  </>
                )}
              </span>
            </>
          );
          return (
            <li key={sec.id} className="tone" style={tone(sec.tone)}>
              {sec.to ? (
                <Link to={sec.to} className={cx(styles.line, styles.lineLive)}>
                  {body}
                  <span className={styles.lineGo}>
                    ขึ้นรถ <ArrowRight size={16} strokeWidth={2} aria-hidden />
                  </span>
                </Link>
              ) : (
                <div className={cx(styles.line, styles.lineSoon)} aria-disabled="true">
                  {body}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <p className={cx('small muted', styles.privacy)}>
        เว็บนี้ไม่มีระบบสมาชิกและไม่ส่งข้อมูลของคุณไปที่ไหน ความคืบหน้าถูกจำไว้ในเบราว์เซอร์ของเครื่องนี้เท่านั้น
      </p>
    </div>
  );
}

/** ชานชาลา: ตัวอักษรในแถวนี้ + บอกว่าต้องทำอะไรต่อ */
function Platform({ step, progress }: { step: NextStep; progress: ProgressData }) {
  const needs = rowNeeds(step.group.kind);
  const p = progress.scripts[step.pack.id];
  const { status } = step;
  const STATE_TITLE = {
    done: 'ผ่านแล้ว',
    written: 'เขียนแล้ว ยังไม่เคยตอบถูก',
    todo: needs.write ? 'ยังไม่ได้เขียน' : 'ยังไม่เคยตอบถูก',
  } as const;

  return (
    <div className={styles.platform}>
      <p className={styles.platformLabel}>
        ชานชาลา {step.pack.name} {groupLabel(step.group)}
      </p>
      <ol className={styles.chips} aria-label="สถานะตัวอักษรในแถวนี้">
        {step.chars.map((c) => {
          const state = charState(p?.[c.id], needs);
          return (
            <li key={c.id} className={styles[state]} title={STATE_TITLE[state]}>
              <span className="kana">{c.char}</span>
              <small>{c.romaji}</small>
            </li>
          );
        })}
      </ol>
      <p className={styles.todo}>
        {status.kind === 'write'
          ? needs.correct
            ? `ฝึกเขียนให้ครบทุกตัวในแถว (เหลือ ${status.remaining} ตัว) แล้วทำแบบทดสอบให้ผ่าน`
            : `ฝึกเขียนตัวเล็กให้ครบทุกตัว (เหลือ ${status.remaining} ตัว)`
          : needs.write
            ? `เขียนครบแล้ว! ทำแบบทดสอบแถวนี้ให้ตอบถูกครบทุกตัว (เหลือ ${status.remaining} ตัว)`
            : `ตัวควบฝึกอ่านและฟัง: ทำแบบทดสอบแถวนี้ให้ตอบถูกครบทุกตัว (เหลือ ${status.remaining} ตัว)`}
      </p>
    </div>
  );
}

/** รางย่อของสายที่นับเป็นบท (คำศัพท์ N5): ต้นสาย → ปลายทาง */
function LessonTrack({ passed, total }: { passed: number; total: number }) {
  const pct = (passed / total) * 100;
  return (
    <span className={styles.track} aria-label={`ผ่านแล้ว ${passed} จาก ${total} บท`} role="img">
      <span className={styles.trackFill} style={{ width: `${pct}%` }} />
      <span className={styles.stop} style={{ left: '0%' }}>
        <span className={cx(styles.stopDot, styles.stopOn)} />
        <span className={styles.stopLabel}>บทที่ 1</span>
      </span>
      <span className={styles.stop} style={{ left: '100%' }}>
        <span className={cx(styles.stopDot, passed >= total && styles.stopOn)} />
        <span className={styles.stopLabel}>บทที่ {total}</span>
      </span>
      <span className={styles.trainMarker} style={{ left: `${pct}%` }}>
        <TrainFront size={14} strokeWidth={2.2} aria-hidden />
      </span>
    </span>
  );
}

/** รางย่อของสายตัวอักษร: 4 ช่วง (ฮิรางานะ ร.1 → คาตาคานะ ร.1 → ฮิรางานะ ร.2 → คาตาคานะ ร.2) */
function KanaTrack({ path, reached }: { path: readonly PathStep[]; reached: number }) {
  const total = path.length;
  const stops = path
    .map((s, i) => ({ s, i }))
    .filter(({ s, i }) => i === 0 || path[i - 1]!.pack.id !== s.pack.id || path[i - 1]!.level !== s.level)
    .map(({ s, i }) => ({ label: `${s.pack.name} ร.${s.level}`, at: (i / total) * 100, on: reached >= i }));
  const pct = (reached / total) * 100;

  return (
    <span className={styles.track} aria-label={`ผ่านแล้ว ${reached} จาก ${total} สถานี`} role="img">
      <span className={styles.trackFill} style={{ width: `${pct}%` }} />
      {stops.map((st) => (
        <span key={st.label} className={styles.stop} style={{ left: `${st.at}%` }}>
          <span className={cx(styles.stopDot, st.on && styles.stopOn)} />
          <span className={styles.stopLabel}>{st.label}</span>
        </span>
      ))}
      <span className={styles.stop} style={{ left: '100%' }}>
        <span className={cx(styles.stopDot, reached >= total && styles.stopOn)} />
        <span className={styles.stopLabel}>ปลายทาง</span>
      </span>
      <span className={styles.trainMarker} style={{ left: `${pct}%` }}>
        <TrainFront size={14} strokeWidth={2.2} aria-hidden />
      </span>
    </span>
  );
}
