import { Check, Minus, RotateCcw, X } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { examPath, grammarPath, kanjiPath, vocabPath } from '../../app/paths';
import { KIND_INFO, PART_LABEL } from '../../data/exam/build';
import type { ExamGroup, ExamPart, ExamQuestion, ExamSet } from '../../data/exam/types';
import { cx } from '../../lib/cx';
import { FuriganaToggle } from '../grammar/JaText';
import { useSettings } from '../settings/settings';
import {
  answerSentence,
  formatDuration,
  scoreExam,
  SECTION_MAX,
  SECTION_MIN,
  TOTAL_MAX,
  TOTAL_PASS,
  type Verdict,
} from './examLogic';
import type { ExamAttempt } from './examStore';
import { ExamPassage, ExamText } from './ExamText';
import styles from './exam.module.css';

const VERDICT: Record<Verdict, { label: string; tone: string; text: string }> = {
  pass: {
    label: 'น่าจะผ่าน',
    tone: styles.good!,
    text: 'ได้ตั้งแต่ 60% ขึ้นไป — ถ้าส่วนการฟังทำได้ใกล้เคียงกัน มีโอกาสผ่าน N5 สูง',
  },
  borderline: {
    label: 'เฉียดเส้น',
    tone: styles.warn!,
    text: 'เกินเส้นผ่านมาไม่มาก คะแนนจริงอาจต่างจากนี้ได้ — ทบทวนข้อที่ผิดแล้วลองใหม่',
  },
  fail: {
    label: 'ยังไม่ผ่าน',
    tone: styles.bad!,
    text: 'ยังต่ำกว่าเส้นผ่าน — ทบทวนบทเรียนในหมวดที่ได้น้อยก่อน แล้วค่อยกลับมาทำใหม่',
  },
};

/** ลิงก์ทบทวนของแต่ละหมวด */
const STUDY: Record<ExamPart, { label: string; href: string }[]> = {
  vocab: [
    { label: 'สายคำศัพท์', href: vocabPath() },
    { label: 'สายคันจิ', href: kanjiPath() },
  ],
  grammar: [{ label: 'สายไวยากรณ์', href: grammarPath() }],
  reading: [{ label: 'สายไวยากรณ์', href: grammarPath() }],
};

interface ExamResultProps {
  set: ExamSet;
  attempt: ExamAttempt;
  onRetry: () => void;
}

/** ผลสอบ: คะแนนเทียบเต็ม 120 · คะแนนแยกหมวด · เฉลยละเอียดทุกข้อ */
export function ExamResult({ set, attempt, onRetry }: ExamResultProps) {
  const score = scoreExam(set, attempt.answers);
  const verdict = VERDICT[score.verdict];
  const wrong = set.questions.filter((q) => attempt.answers[q.id] !== q.answer);
  const [filter, setFilter] = useState<'wrong' | 'all'>(wrong.length ? 'wrong' : 'all');
  const date = new Date(attempt.finishedAt).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <div className={styles.result}>
      <section className={cx('card', styles.scoreCard)} aria-labelledby="score-title">
        <p id="score-title" className="muted">
          ผลสอบ{set.title} · {date}
          {!attempt.timed && ' · ไม่จับเวลา'}
        </p>
        <p className={styles.bigScore}>
          {score.scaled}
          <span className={styles.bigMax}> / {SECTION_MAX}</span>
        </p>
        <p className={cx(styles.verdict, verdict.tone)}>{verdict.label}</p>
        <p>
          ตอบถูก {score.correct} จาก {score.total} ข้อ
          {score.answered < score.total && ` · ไม่ได้ตอบ ${score.total - score.answered} ข้อ`}
        </p>
        <div className={styles.meter} aria-hidden>
          <span style={{ transform: `translateX(${(score.correct / score.total) * 100 - 100}%)` }} />
        </div>
        <p className={styles.verdictText}>{verdict.text}</p>
        <ul className={styles.facts}>
          <li>
            เกณฑ์ขั้นต่ำของส่วนนี้ {SECTION_MIN} คะแนน —{' '}
            {score.scaled >= SECTION_MIN ? 'ผ่านเกณฑ์' : 'ยังไม่ถึงเกณฑ์ (ถึงคะแนนรวมจะพอ ก็ไม่ผ่าน)'}
          </li>
          <li>
            ถ้าส่วนการฟังได้สัดส่วนเท่ากัน คะแนนรวมจะประมาณ {score.projected} / {TOTAL_MAX} (ต้องได้ {TOTAL_PASS} ขึ้นไป)
          </li>
        </ul>
        <p className={cx('small muted', styles.disclaimer)}>
          ยังไม่มีส่วนการฟัง (เต็ม 60) · JLPT จริงปรับคะแนนตามความยากของแต่ละข้อ ผลนี้จึงเป็นการประมาณจากสัดส่วนข้อที่ถูก
        </p>
        <div className={styles.actions}>
          <button type="button" className="btn btn-primary" onClick={onRetry}>
            <RotateCcw size={16} aria-hidden /> ทำชุดนี้อีกครั้ง
          </button>
          <Link to={examPath()} className="btn btn-ghost">
            กลับหน้าข้อสอบจำลอง
          </Link>
        </div>
      </section>

      <section className={cx('card', styles.parts)} aria-labelledby="parts-title">
        <h2 id="parts-title" className={styles.h2}>
          คะแนนแยกหมวด
        </h2>
        <ul className={styles.partList}>
          {(Object.keys(PART_LABEL) as ExamPart[]).map((p) => {
            const line = score.parts[p];
            return (
              <li key={p} className={styles.partRow}>
                <span className={styles.partName}>
                  <span className="kana" lang="ja">
                    {PART_LABEL[p].ja}
                  </span>
                  <span className="muted small">{PART_LABEL[p].th}</span>
                </span>
                <span className={styles.partBar} aria-hidden>
                  <span style={{ transform: `translateX(${(line.correct / line.total) * 100 - 100}%)` }} />
                </span>
                <span className={styles.partNum}>
                  {line.correct}/{line.total}
                </span>
                {line.correct < line.total && (
                  <span className={styles.partStudy}>
                    ทบทวน:{' '}
                    {STUDY[p].map((s, i) => (
                      <span key={s.href}>
                        {i > 0 && ' · '}
                        <Link to={s.href}>{s.label}</Link>
                      </span>
                    ))}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
        <p className="small muted">
          เวลาที่ใช้:{' '}
          {set.sections
            .map((s, i) => `ส่วนที่ ${i + 1} ${formatDuration(attempt.seconds[i] ?? 0)} (จาก ${s.minutes} นาที)`)
            .join(' · ')}
        </p>
      </section>

      <Review set={set} attempt={attempt} filter={filter} setFilter={setFilter} wrongCount={wrong.length} />
    </div>
  );
}

interface ReviewProps {
  set: ExamSet;
  attempt: ExamAttempt;
  filter: 'wrong' | 'all';
  setFilter: (f: 'wrong' | 'all') => void;
  wrongCount: number;
}

function Review({ set, attempt, filter, setFilter, wrongCount }: ReviewProps) {
  const { furigana } = useSettings();
  const show = (q: ExamQuestion) => filter === 'all' || attempt.answers[q.id] !== q.answer;
  return (
    <section className={styles.review} aria-labelledby="review-title">
      <div className={styles.reviewHead}>
        <h2 id="review-title" className={styles.h2}>
          เฉลย
        </h2>
        <FuriganaToggle />
      </div>
      <div className="segmented" role="tablist" aria-label="เลือกข้อที่จะดู">
        <button type="button" role="tab" aria-selected={filter === 'wrong'} onClick={() => setFilter('wrong')}>
          ข้อที่ผิด ({wrongCount})
        </button>
        <button type="button" role="tab" aria-selected={filter === 'all'} onClick={() => setFilter('all')}>
          ทั้งหมด ({set.questions.length})
        </button>
      </div>
      {filter === 'wrong' && wrongCount === 0 && <p className="notice notice-good">ถูกทุกข้อ เก่งมาก!</p>}

      {set.sections.map((section, si) => {
        const mondai = section.mondai.filter((m) => m.groups.some((g) => g.questions.some(show)));
        if (!mondai.length) return null;
        return (
          <div key={section.id} className={styles.reviewSection}>
            <h3 className={styles.reviewSectionTitle}>
              ส่วนที่ {si + 1} ·{' '}
              <span className="kana" lang="ja">
                {section.ja}
              </span>
            </h3>
            {mondai.map((m) => (
              <div key={m.no} className={styles.reviewMondai}>
                <p className={styles.reviewMondaiTitle}>
                  <span className="kana" lang="ja">
                    もんだい{m.no}
                  </span>{' '}
                  · {KIND_INFO[m.kind].th}
                </p>
                {m.groups.map((g, gi) =>
                  g.questions.some(show) ? (
                    <ReviewGroup key={gi} group={g} attempt={attempt} furigana={furigana} show={show} />
                  ) : null,
                )}
              </div>
            ))}
          </div>
        );
      })}
    </section>
  );
}

interface ReviewGroupProps {
  group: ExamGroup;
  attempt: ExamAttempt;
  furigana: boolean;
  show: (q: ExamQuestion) => boolean;
}

function ReviewGroup({ group, attempt, furigana, show }: ReviewGroupProps) {
  const refNo = (ref: number) => group.questions[ref - 1]?.no ?? ref;
  return (
    <>
      {group.passage && (
        <details className={styles.reviewPassage}>
          <summary>ดูบทความพร้อมคำแปล</summary>
          <ExamPassage blocks={group.passage} furigana={furigana} refNo={refNo} />
          <p className={styles.passageThai}>{group.passageThai}</p>
        </details>
      )}
      {group.questions.filter(show).map((q) => (
        <ReviewItem key={q.id} q={q} chosen={attempt.answers[q.id]} furigana={furigana} />
      ))}
    </>
  );
}

function ReviewItem({ q, chosen, furigana }: { q: ExamQuestion; chosen: number | undefined; furigana: boolean }) {
  const right = chosen === q.answer;
  const sentence = q.kind === 'composition' || q.kind === 'context' || q.kind === 'grammar-form' ? answerSentence(q) : q.stem;
  return (
    <article className={cx(styles.reviewItem, right ? styles.itemRight : styles.itemWrong)} aria-label={`ข้อ ${q.no}`}>
      <header className={styles.itemHead}>
        <span className={styles.qNo}>{q.no}</span>
        <span className={cx(styles.itemStatus, right ? styles.good : styles.bad)}>
          {right ? (
            <>
              <Check size={16} strokeWidth={2.4} aria-hidden /> ถูก
            </>
          ) : chosen === undefined ? (
            <>
              <Minus size={16} strokeWidth={2.4} aria-hidden /> ไม่ได้ตอบ
            </>
          ) : (
            <>
              <X size={16} strokeWidth={2.4} aria-hidden /> ผิด
            </>
          )}
        </span>
      </header>

      {sentence && <ExamText segs={sentence} furigana={furigana} className={styles.itemStem} />}

      <ol className={styles.itemChoices}>
        {q.choices.map((c, i) => (
          <li
            key={i}
            className={cx(
              styles.itemChoice,
              i === q.answer && styles.choiceRight,
              i === chosen && i !== q.answer && styles.choiceWrong,
            )}
          >
            <span className={styles.choiceKey}>{i + 1}</span>
            <ExamText segs={c} furigana={furigana} />
            {i === q.answer && <Check size={16} strokeWidth={2.4} aria-label="คำตอบที่ถูก" />}
            {i === chosen && i !== q.answer && <X size={16} strokeWidth={2.4} aria-label="คำตอบที่เลือก" />}
          </li>
        ))}
      </ol>

      <p className={styles.itemThai}>{q.thai}</p>
      <p className={styles.itemExplain}>{q.explain}</p>
    </article>
  );
}
