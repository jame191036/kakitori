import { ArrowRight, ChevronDown, RotateCcw } from 'lucide-react';
import { Link } from 'react-router';
import { vocabPath, vocabReviewPath } from '../app/paths';
import { RouteMap } from '../components/train/RouteMap';
import { StampBook } from '../components/train/StampBook';
import { lessonCode, lessonWords, type VocabDeck, type VocabLesson } from '../data/vocab';
import { N5_DECK } from '../data/vocab/n5';
import { progressStore } from '../features/progress/progressStore';
import type { StationState } from '../features/progress/stations';
import {
  deckProgress,
  dueWords,
  lessonStates,
  lessonStops,
  nextLesson,
  segmentSummaries,
  wordsAnswered,
  wordsPassed,
} from '../features/vocab/vocabLogic';
import { cx } from '../lib/cx';
import { useStore } from '../lib/persistentStore';
import { tone } from '../lib/tone';
import { useNow } from '../lib/useNow';
import styles from './VocabLinePage.module.css';

const STATE_TEXT = { done: 'ผ่านแล้ว', current: 'บทถัดไป', todo: 'ยังไม่ถึง' } as const;

/**
 * สายคำศัพท์ N5: แบ่งเป็นช่วง (区間) ตามหัวข้อ — ช่วงที่มีบทถัดไปเปิดกางไว้ (แผนที่ช่วง + การ์ดบท)
 * ช่วงอื่นพับไว้ ช่วงที่ยังไม่เปิดเป็น 工事中 · ท้ายหน้าเป็นสมุดตราของทุกบท
 */
export default function VocabLinePage() {
  const deck = N5_DECK;
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
  const openCount = open.length;
  const answered = wordsAnswered(progress);
  const due = dueWords(deck, progress, now).length;

  return (
    <div className={cx('container tone', styles.page)} style={tone('n5')}>
      <header className={styles.head}>
        <span className={cx('kana', styles.badge)} lang="ja">
          語
        </span>
        <div className={styles.headText}>
          {/* 単語 (tango) = คำศัพท์ */}
          <p className={cx('kana', styles.lineJa)} lang="ja">
            単語
          </p>
          <h1 className={styles.h1}>สายคำศัพท์ N5</h1>
          <p className={styles.muted}>
            คำศัพท์พื้นฐานระดับ JLPT N5 แบ่งเป็นช่วงตามหัวข้อ ช่วงละหลายบท บทละประมาณ 8 คำ — เรียน ฝึก
            แล้วทดสอบให้ผ่านทีละสถานี
          </p>
          <p className={styles.stats}>
            ผ่านแล้ว {passedLessons} จาก {deck.lessons.length} บท · ตอบถูกแล้ว {wordsPassed(deck, progress)} จาก{' '}
            {totalWords} คำ
          </p>
        </div>
      </header>

      {openCount < deck.segments.length && (
        <p className={styles.notice}>
          เปิดแล้ว {openCount} จาก {deck.segments.length} ช่วง — ช่วงที่เหลือกำลังทยอยเพิ่มจนครบคำศัพท์ N5 (ประมาณ 670
          คำ)
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
              {answered && (
                <Link to={vocabReviewPath()} className="btn">
                  <RotateCcw size={16} strokeWidth={2} aria-hidden /> ทบทวน{due > 0 && ` (${due} คำถึงรอบ)`}
                </Link>
              )}
              <Link to={vocabPath(next.id)} className="btn btn-primary">
                เรียนบทถัดไป <ArrowRight size={18} strokeWidth={2} aria-hidden />
              </Link>
            </div>
          </>
        ) : (
          <>
            <p className={styles.allDone}>
              <span className="kana">終点</span> ผ่านครบทุกบทแล้ว
            </p>
            <Link to={vocabReviewPath()} className="btn btn-primary">
              <RotateCcw size={16} strokeWidth={2} aria-hidden /> ทบทวนคำศัพท์{due > 0 && ` (${due} คำถึงรอบ)`}
            </Link>
          </>
        )}
      </section>

      <h2 className={styles.sectionTitle}>
        <span className={cx('kana', styles.accentJa)}>区間</span> ช่วงของสาย
      </h2>
      <ol className={styles.segments}>
        {open.map(({ segment, states: segStates, passed, current, range }, i) => {
          const total = segment.lessons.length;
          const done = passed === total;
          const stops = lessonStops(deck, segment.lessons);
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
                  <RouteMap stops={stops} states={segStates} scroll minStop={120} />
                  <LessonCards deck={deck} lessons={segment.lessons} states={segStates} />
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

      {/* สมุดตรา: ตราแยกอยู่ในการ์ดของแต่ละช่วงด้านบน — ตรงนี้สรุปแค่จำนวน (87 ดวงยาวเกินไปบนมือถือ) */}
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

function LessonCards({
  deck,
  lessons,
  states,
}: {
  deck: VocabDeck;
  lessons: readonly VocabLesson[];
  states: readonly StationState[];
}) {
  return (
    <ul className={styles.lessons}>
      {lessons.map((lesson, i) => {
        const state = states[i]!;
        return (
          <li key={lesson.id}>
            <Link to={vocabPath(lesson.id)} className={cx(styles.lesson, styles[state])}>
              <span className={styles.lessonCode}>{lessonCode(deck, lesson)}</span>
              <span className={styles.lessonText}>
                <span className={cx('kana', styles.lessonJa)} lang="ja">
                  {lesson.name}
                </span>
                <span className={styles.lessonTitle}>{lesson.title}</span>
                <span className={cx('kana', styles.preview)} lang="ja">
                  {lessonWords(deck, lesson)
                    .slice(0, 4)
                    .map((w) => w.kana)
                    .join('・')}
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
