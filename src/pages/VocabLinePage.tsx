import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router';
import { vocabPath } from '../app/paths';
import { RouteMap } from '../components/train/RouteMap';
import { StampBook } from '../components/train/StampBook';
import { lessonCode, lessonWords } from '../data/vocab';
import { N5_DECK } from '../data/vocab/n5';
import { progressStore } from '../features/progress/progressStore';
import { deckProgress, lessonStates, lessonStops, nextLesson, wordsPassed } from '../features/vocab/vocabLogic';
import { cx } from '../lib/cx';
import { useStore } from '../lib/persistentStore';
import { tone } from '../lib/tone';
import styles from './VocabLinePage.module.css';

const STATE_TEXT = { done: 'ผ่านแล้ว', current: 'บทถัดไป', todo: 'ยังไม่ถึง' } as const;

/** สายคำศัพท์ N5: แผนที่บท (สถานี) + การ์ดบทเรียน + ตราสถานี */
export default function VocabLinePage() {
  const deck = N5_DECK;
  const progress = deckProgress(deck, useStore(progressStore));
  const states = lessonStates(deck, progress);
  const stops = lessonStops(deck);
  const next = nextLesson(deck, progress);
  const passedLessons = states.filter((s) => s === 'done').length;
  const totalWords = Object.keys(deck.words).length;

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
            คำศัพท์พื้นฐานระดับ JLPT N5 แบ่งเป็นบทตามหัวข้อ บทละประมาณ 8 คำ — เรียน ฝึก แล้วทดสอบให้ผ่านทีละสถานี
          </p>
          <p className={styles.stats}>
            ผ่านแล้ว {passedLessons} จาก {deck.lessons.length} บท · ตอบถูกแล้ว {wordsPassed(deck, progress)} จาก{' '}
            {totalWords} คำ
          </p>
        </div>
      </header>

      <p className={styles.notice}>
        ตอนนี้มี {deck.lessons.length} บทแรก ({totalWords} คำ) ให้ลองใช้ก่อน — กำลังทยอยเพิ่มจนครบคำศัพท์ N5
      </p>

      <section className={styles.routeCard} aria-labelledby="route-title">
        <div className={styles.routeHead}>
          <h2 id="route-title" className={styles.h2}>
            <span className={cx('kana', styles.accentJa)}>路線図</span> แผนที่สาย
          </h2>
          {next ? (
            <Link to={vocabPath(next.id)} className="btn btn-primary">
              เรียนบทถัดไป: {next.title} <ArrowRight size={18} strokeWidth={2} aria-hidden />
            </Link>
          ) : (
            <p className={styles.allDone}>
              <span className="kana">終点</span> ผ่านครบทุกบทแล้ว
            </p>
          )}
        </div>
        <RouteMap stops={stops} states={states} scroll minStop={120} />
      </section>

      <h2 className={styles.sectionTitle}>บทเรียน</h2>
      <ul className={styles.lessons}>
        {deck.lessons.map((lesson, i) => {
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

      <h2 className={styles.sectionTitle}>
        <span className={cx('kana', styles.accentJa)}>駅スタンプ</span> ตราสถานีของฉัน
      </h2>
      <StampBook stops={stops} states={states} />
    </div>
  );
}
