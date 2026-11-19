import { ArrowRight, RotateCcw } from 'lucide-react';
import type { CSSProperties } from 'react';
import { Link } from 'react-router';
import { KANA_ROOT, kanjiReviewPath, N5_ROOT, scriptPath, vocabReviewPath } from '../app/paths';
import { TodayCard, type TodayLine } from '../components/TodayCard';
import { KANJI_N5 } from '../data/kanji/n5';
import type { LineDeck } from '../data/line';
import { scriptList } from '../data/scripts';
import { N5_DECK } from '../data/vocab/n5';
import { deckProgress, dueWords, weakWords, wordsAnswered } from '../features/line/lineLogic';
import { dueChars, hasAnswered, weakChars } from '../features/progress/progressLogic';
import { progressStore } from '../features/progress/progressStore';
import { cx } from '../lib/cx';
import { useStore } from '../lib/persistentStore';
import { packTone, tone } from '../lib/tone';
import { useNow } from '../lib/useNow';
import styles from './ReviewHubPage.module.css';

/** การ์ดทบทวนของสายบทเรียน N5 */
interface LineCard {
  deck: LineDeck;
  href: string;
  glyph: string;
  lineJa: string;
  title: string;
  desc: string;
}

// 単語線 = สายคำศัพท์ · 漢字線 = สายคันจิ
const LINE_CARDS: readonly LineCard[] = [
  {
    deck: N5_DECK,
    href: vocabReviewPath(),
    glyph: '語',
    lineJa: '単語線',
    title: 'ทบทวนคำศัพท์ N5',
    desc: 'คำที่ถึงรอบ คำที่ผิดบ่อย และความคืบหน้าทั้งสาย',
  },
  {
    deck: KANJI_N5,
    href: kanjiReviewPath(),
    glyph: '漢',
    lineJa: '漢字線',
    title: 'ทบทวนคันจิ N5',
    desc: 'คันจิที่ถึงรอบ ตัวที่ผิดบ่อย และความคืบหน้าทั้งสาย',
  },
];

const TODAY_LINES: readonly TodayLine[] = [
  { deck: N5_DECK, unit: 'คำ', dueHref: vocabReviewPath('due') },
  { deck: KANJI_N5, unit: 'ตัว', dueHref: kanjiReviewPath('due') },
];

/** ทบทวน (เมนูหลัก): วันนี้ (เป้า + รอบทบทวน) แล้วการ์ดทบทวนของแต่ละสาย */
export default function ReviewHubPage() {
  const now = useNow();
  const progress = useStore(progressStore);
  const lineStarted = LINE_CARDS.some((c) => wordsAnswered(deckProgress(c.deck, progress)));
  const started = scriptList.some((p) => hasAnswered(progress.scripts[p.id])) || lineStarted;

  return (
    <div className={cx('container', styles.page)}>
      <header className={styles.head}>
        <h1 className={styles.h1}>ทบทวน</h1>
        <p className={styles.lead}>
          ระบบนัดทบทวนตัวอักษร คำศัพท์ และคันจิที่ใกล้จะลืม และรวมที่ผิดบ่อยไว้ให้ฝึกซ้ำ — ทบทวนวันละนิดช่วยให้จำได้นาน
        </p>
      </header>

      <TodayCard packs={scriptList} lines={TODAY_LINES} />

      <h2 className={styles.sectionTitle}>ทบทวนแต่ละสาย</h2>
      <div className={styles.cards}>
        {scriptList.map((pack) => {
          const p = progress.scripts[pack.id];
          return (
            <ReviewCard
              key={pack.id}
              to={scriptPath(pack.id, 'review')}
              style={tone(packTone(pack))}
              glyph={pack.chars[0]!.char}
              lineJa={`${pack.nameJa}線`}
              title={`ทบทวนสาย${pack.name}`}
              desc="ภาพรวม ตัวที่ผิดบ่อย ความคืบหน้ารายตัว และสำรองข้อมูล"
              counts={hasAnswered(p) ? { due: dueChars(pack, p, now).length, weak: weakChars(pack, p).length } : null}
            />
          );
        })}
        {LINE_CARDS.map((c) => {
          const p = deckProgress(c.deck, progress);
          return (
            <ReviewCard
              key={c.deck.id}
              to={c.href}
              style={tone('n5')}
              glyph={c.glyph}
              lineJa={c.lineJa}
              title={c.title}
              desc={c.desc}
              counts={
                wordsAnswered(p) ? { due: dueWords(c.deck, p, now).length, weak: weakWords(c.deck, p).length } : null
              }
            />
          );
        })}
      </div>
      {!started && (
        <p className={cx(styles.muted, styles.note)}>
          ยังไม่มีรายการที่ต้องทบทวน — ฝึกเขียนหรือทำแบบทดสอบใน <Link to={KANA_ROOT}>หมวดตัวอักษร</Link> หรือ
          ทำแบบทดสอบในบทเรียน <Link to={N5_ROOT}>JLPT N5</Link> ก่อน แล้วระบบจะนัดวันทบทวนให้
        </p>
      )}
    </div>
  );
}

interface ReviewCardProps {
  to: string;
  style: CSSProperties;
  glyph: string;
  lineJa: string;
  title: string;
  desc: string;
  /** null = ยังไม่เริ่ม */
  counts: { due: number; weak: number } | null;
}

function ReviewCard({ to, style, glyph, lineJa, title, desc, counts }: ReviewCardProps) {
  return (
    <Link to={to} className={cx('tone', styles.card)} style={style}>
      <span className={cx('kana', styles.badge)} aria-hidden>
        {glyph}
      </span>
      <span className={styles.cardText}>
        <span className={cx('kana', styles.lineJa)}>{lineJa}</span>
        <span className={styles.cardTitle}>{title}</span>
        <span className={styles.muted}>{desc}</span>
      </span>
      <span className={styles.counts}>
        {counts ? (
          <>
            <span className={cx(styles.count, counts.due > 0 && styles.countHot)}>
              <strong>{counts.due}</strong> ถึงรอบ
            </span>
            <span className={styles.count}>
              <strong>{counts.weak}</strong> ผิดบ่อย
            </span>
          </>
        ) : (
          <span className={styles.muted}>ยังไม่เริ่ม</span>
        )}
      </span>
      <span className={styles.go} aria-hidden>
        <RotateCcw size={16} strokeWidth={2} />
        เปิด
        <ArrowRight size={16} strokeWidth={2} />
      </span>
    </Link>
  );
}
