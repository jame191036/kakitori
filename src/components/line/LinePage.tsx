import { ArrowRight, ChevronDown, RotateCcw } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { lessonCode, lessonWords, type LineDeck, type LineLesson } from '../../data/line';
import {
  deckProgress,
  dueWords,
  lessonStates,
  lessonStops,
  nextLesson,
  segmentSummaries,
  wordsAnswered,
  wordsPassed,
} from '../../features/line/lineLogic';
import { progressStore } from '../../features/progress/progressStore';
import type { StationState } from '../../features/progress/stations';
import { cx } from '../../lib/cx';
import { useStore } from '../../lib/persistentStore';
import { tone, type Tone } from '../../lib/tone';
import { useNow } from '../../lib/useNow';
import { RouteMap } from '../train/RouteMap';
import { StampBook } from '../train/StampBook';
import styles from './LinePage.module.css';

const STATE_TEXT = { done: 'ผ่านแล้ว', current: 'บทถัดไป', todo: 'ยังไม่ถึง' } as const;

/**
 * ความกว้างขั้นต่ำต่อสถานีบนแผนที่ของช่วง — ชื่อสถานีไม่ตัดบรรทัด ชื่อยาว (เช่น まいにちの あいさつ)
 * จึงต้องกว้างพอไม่ให้ทับชื่อข้างๆ (ตัวคานะบนมือถือ ~18px ต่อตัว) · เกินจอแล้วแถบเลื่อนซ้าย-ขวาได้
 */
function stopWidth(stops: readonly { name: string }[]): number {
  const longest = Math.max(0, ...stops.map((s) => [...s.name].length));
  return Math.max(120, longest * 19 + 24);
}

export interface LinePageProps<T extends { id: string }> {
  deck: LineDeck<T>;
  lineTone: Tone;
  /** ตัวอักษรในวงป้ายสาย เช่น 語 / 漢 */
  glyph: string;
  /** ชื่อสายภาษาญี่ปุ่นเหนือหัวข้อ เช่น 単語 / 漢字 */
  lineJa: string;
  title: string;
  intro: string;
  /** หน่วยของรายการ เช่น "คำ" / "ตัว" */
  unit: string;
  /** ข้อความตอนที่ยังเปิดไม่ครบทุกช่วง */
  comingNote: string;
  lessonHref: (lessonId: string) => string;
  /** หน้าทบทวนของสายนี้ (ไม่ใส่ = ยังไม่มี) */
  reviewHref?: string;
  /** ข้อความย่อของรายการในการ์ดบท (เช่น คานะของคำ / ตัวคันจิ) */
  previewOf: (item: T) => string;
  /** ทางลัดเฉพาะของสายนี้ ใต้แถบบทถัดไป (เช่น ฝึกอิสระของสายผันคำ) */
  extra?: ReactNode;
}

/**
 * หน้าแผนที่สายบทเรียน (ใช้ทั้งคำศัพท์และคันจิ): แบ่งเป็นช่วง (区間) ตามหัวข้อ
 * ช่วงที่มีบทถัดไปกางไว้ (แผนที่ช่วง + การ์ดบท + ตราของช่วง) ช่วงอื่นพับไว้ ช่วงที่ยังไม่เปิดเป็น 工事中
 */
export function LinePage<T extends { id: string }>({
  deck,
  lineTone,
  glyph,
  lineJa,
  title,
  intro,
  unit,
  comingNote,
  lessonHref,
  reviewHref,
  previewOf,
  extra,
}: LinePageProps<T>) {
  const now = useNow();
  const progress = deckProgress(deck, useStore(progressStore));
  const states = lessonStates(deck, progress);
  const next = nextLesson(deck, progress);
  const summaries = segmentSummaries(deck, progress);
  // ช่วงที่เปิดแล้วอยู่หน้าเสมอ (เปิดต่อท้ายทีละช่วง) → แยกเป็น 2 กลุ่มได้โดยเลขช่วงไม่สลับกัน
  const open = summaries.filter((s) => s.segment.lessons.length > 0);
  const soon = summaries.filter((s) => s.segment.lessons.length === 0);
  const passedLessons = states.filter((s) => s === 'done').length;
  const totalWords = Object.keys(deck.words).length;
  const answered = !!reviewHref && wordsAnswered(progress);
  const due = reviewHref ? dueWords(deck, progress, now).length : 0;
  const dueText = due > 0 ? ` (${due} ${unit}ถึงรอบ)` : '';

  return (
    <div className={cx('container tone', styles.page)} style={tone(lineTone)}>
      <header className={styles.head}>
        <span className={cx('kana', styles.badge)} lang="ja">
          {glyph}
        </span>
        <div className={styles.headText}>
          <p className={cx('kana', styles.lineJa)} lang="ja">
            {lineJa}
          </p>
          <h1 className={styles.h1}>{title}</h1>
          <p className={styles.muted}>{intro}</p>
          <p className={styles.stats}>
            ผ่านแล้ว {passedLessons} จาก {deck.lessons.length} บท · ตอบถูกแล้ว {wordsPassed(deck, progress)} จาก{' '}
            {totalWords} {unit}
          </p>
        </div>
      </header>

      {open.length < deck.segments.length && (
        <p className={styles.notice}>
          เปิดแล้ว {open.length} จาก {deck.segments.length} ช่วง — {comingNote}
        </p>
      )}

      <section className={styles.nextBar} aria-label="บทถัดไป">
        {next ? (
          <>
            <p className={styles.nextText}>
              <span className={cx('kana', styles.eyebrow)}>次は</span>
              <span className={styles.nextCode}>{lessonCode(deck, next)}</span>
              <span className={styles.nextTitle}>{next.title}</span>
            </p>
            <div className={styles.nextActions}>
              {reviewHref && answered && (
                <Link to={reviewHref} className="btn">
                  <RotateCcw size={16} strokeWidth={2} aria-hidden /> ทบทวน{dueText}
                </Link>
              )}
              <Link to={lessonHref(next.id)} className="btn btn-primary">
                เรียนบทถัดไป <ArrowRight size={18} strokeWidth={2} aria-hidden />
              </Link>
            </div>
          </>
        ) : (
          <>
            <p className={styles.allDone}>
              <span className="kana">終点</span> ผ่านครบทุกบทแล้ว
            </p>
            {reviewHref && (
              <Link to={reviewHref} className="btn btn-primary">
                <RotateCcw size={16} strokeWidth={2} aria-hidden /> ทบทวน{dueText}
              </Link>
            )}
          </>
        )}
      </section>

      {extra}

      <h2 className={styles.sectionTitle}>
        <span className={cx('kana', styles.accentJa)}>区間</span> ช่วงของสาย
      </h2>
      <ol className={styles.segments}>
        {open.map(({ segment, states: segStates, passed, current, range }, i) => {
          const total = segment.lessons.length;
          const done = passed === total;
          const stops = lessonStops(deck, segment.lessons, lessonHref);
          return (
            <li key={segment.id}>
              <details className={cx(styles.segment, current && styles.segCurrent)} open={current}>
                <summary className={styles.segHead}>
                  <span className={cx(styles.segNo, done && styles.segNoDone)}>{i + 1}</span>
                  <span className={styles.segText}>
                    <span className={cx('kana', styles.segJa)} lang="ja">
                      {segment.name}
                    </span>
                    <span className={styles.segTitle}>{segment.title}</span>
                    <span className={styles.segMeta}>
                      {range} · {total} บท
                    </span>
                  </span>
                  <span className={styles.segProgress}>
                    <span className={styles.segCount}>
                      {passed}/{total}
                    </span>
                    <span className={styles.segBar} aria-hidden>
                      <span style={{ width: `${(passed / total) * 100}%` }} />
                    </span>
                  </span>
                  <ChevronDown className={styles.chev} size={20} strokeWidth={2} aria-hidden />
                </summary>
                <div className={styles.segBody}>
                  <RouteMap stops={stops} states={segStates} scroll minStop={stopWidth(stops)} />
                  <LessonCards
                    deck={deck}
                    lessons={segment.lessons}
                    states={segStates}
                    lessonHref={lessonHref}
                    previewOf={previewOf}
                  />
                  <div className={styles.segStamps}>
                    <p className={styles.segStampsHead}>
                      <span className={cx('kana', styles.accentJa)}>駅スタンプ</span> ตราของช่วงนี้ {passed}/{total}
                    </p>
                    <StampBook stops={stops} states={segStates} />
                  </div>
                </div>
              </details>
            </li>
          );
        })}
      </ol>

      {soon.length > 0 && (
        <section className={styles.soonBlock} aria-labelledby="soon-title">
          <p id="soon-title" className={styles.soonHead}>
            <span className={styles.koji}>
              <span className="kana">工事中</span> กำลังสร้าง
            </span>
            อีก {soon.length} ช่วง
          </p>
          <ol className={styles.soonGrid}>
            {soon.map(({ segment }, i) => (
              <li key={segment.id} className={styles.soonItem}>
                <span className={styles.segNo}>{open.length + i + 1}</span>
                <span className={styles.segText}>
                  <span className={cx('kana', styles.segJa)} lang="ja">
                    {segment.name}
                  </span>
                  <span className={styles.soonTitle}>{segment.title}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* สมุดตรา: ตราแยกอยู่ในการ์ดของแต่ละช่วงด้านบน — ตรงนี้สรุปแค่จำนวน (ตราทั้งสายยาวเกินไปบนมือถือ) */}
      <section className={styles.stampSummary} aria-labelledby="stamps-title">
        <h2 id="stamps-title" className={styles.h2}>
          <span className={cx('kana', styles.accentJa)}>駅スタンプ</span> ตราสถานีของฉัน
        </h2>
        <p>
          สะสมแล้ว <strong className={styles.stampCount}>{passedLessons}</strong> / {deck.lessons.length} ดวง
          <span className={styles.muted}> · ตราของแต่ละช่วงอยู่ในการ์ดช่วงด้านบน</span>
        </p>
      </section>
    </div>
  );
}

function LessonCards<T extends { id: string }>({
  deck,
  lessons,
  states,
  lessonHref,
  previewOf,
}: {
  deck: LineDeck<T>;
  lessons: readonly LineLesson[];
  states: readonly StationState[];
  lessonHref: (lessonId: string) => string;
  previewOf: (item: T) => string;
}) {
  return (
    <ul className={styles.lessons}>
      {lessons.map((lesson, i) => {
        const state = states[i]!;
        return (
          <li key={lesson.id}>
            <Link to={lessonHref(lesson.id)} className={cx(styles.lesson, styles[state])}>
              <span className={styles.lessonCode}>{lessonCode(deck, lesson)}</span>
              <span className={styles.lessonText}>
                <span className={cx('kana', styles.lessonJa)} lang="ja">
                  {lesson.name}
                </span>
                <span className={styles.lessonTitle}>{lesson.title}</span>
                <span className={cx('kana', styles.preview)} lang="ja">
                  {lessonWords(deck, lesson).slice(0, 4).map(previewOf).join('・')}
                  {lesson.words.length > 4 && ' …'}
                </span>
              </span>
              <span className={styles.state}>{STATE_TEXT[state]}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
