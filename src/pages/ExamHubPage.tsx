import { ArrowRight, Clock } from 'lucide-react';
import { Link } from 'react-router';
import { examPath } from '../app/paths';
import { EXAM_SETS, getExamSet } from '../data/exam/n5';
import type { ExamSet } from '../data/exam/types';
import { formatClock, remainingMs, scoreExam, SECTION_MAX, type Verdict } from '../features/exam/examLogic';
import { examStore, setTimedPreference, type ExamAttempt, type ExamSession } from '../features/exam/examStore';
import styles from '../features/exam/exam.module.css';
import { cx } from '../lib/cx';
import { useStore } from '../lib/persistentStore';
import { tone } from '../lib/tone';

const VERDICT_LABEL: Record<Verdict, string> = { pass: 'น่าจะผ่าน', borderline: 'เฉียดเส้น', fail: 'ยังไม่ผ่าน' };
const VERDICT_TONE: Record<Verdict, string | undefined> = { pass: styles.good, borderline: styles.warn, fail: styles.bad };

const dateOf = (t: number) => new Date(t).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });

/** ข้อสอบจำลอง N5 — รูปแบบข้อสอบ · เลือกชุด · ประวัติผลสอบ */
export default function ExamHubPage() {
  const data = useStore(examStore);
  const first = EXAM_SETS[0]!;
  const history = [...data.attempts].reverse().slice(0, 10);

  return (
    <div className={cx('container tone', styles.page)} style={tone('n5')}>
      <header className={styles.hubHead}>
        <span className={cx('kana', styles.hubBadge)} lang="ja" aria-hidden>
          試
        </span>
        <div>
          <p className={cx('kana', styles.introJa)} lang="ja">
            もぎしけん
          </p>
          <h1 className={styles.h1}>ข้อสอบจำลอง N5</h1>
          <p className="muted">
            ลองทำข้อสอบแบบเดียวกับ JLPT N5 จริง — จับเวลา ไม่มีคำอ่านช่วย แล้วดูคะแนนเทียบเต็ม {SECTION_MAX}{' '}
            พร้อมเฉลยละเอียดทุกข้อ
          </p>
        </div>
      </header>

      <section className={cx('card', styles.format)} aria-labelledby="format-title">
        <h2 id="format-title" className={styles.h2}>
          รูปแบบข้อสอบ (ชุดละ {first.questions.length} ข้อ)
        </h2>
        <ol className={styles.sectionList}>
          {first.sections.map((s, i) => (
            <li key={s.id}>
              <span className={styles.sectionNo}>ส่วนที่ {i + 1}</span>
              <span className={styles.sectionName}>
                <span className="kana" lang="ja">
                  {s.ja}
                </span>
                <span className="muted small">{s.th}</span>
              </span>
              <span className={styles.sectionMeta}>
                {s.minutes} นาที · {s.questions.length} ข้อ
              </span>
            </li>
          ))}
          <li className={styles.sectionOff}>
            <span className={styles.sectionNo}>ส่วนที่ 3</span>
            <span className={styles.sectionName}>
              <span className="kana" lang="ja">
                ちょうかい
              </span>
              <span className="muted small">การฟัง — ยังไม่มี</span>
            </span>
            <span className={styles.sectionMeta}>30 นาที</span>
          </li>
        </ol>
        <p className="small muted">
          ส่วนที่ 1–2 ของข้อสอบจริงเต็ม 120 คะแนน (ต้องได้อย่างน้อย 38) · การฟังเต็ม 60 (อย่างน้อย 19) · รวมต้องได้ 80 จาก 180
          — จำนวนข้อในแต่ละแบบเป็นตัวเลขโดยประมาณ เพราะเว็บ JLPT ไม่ได้ประกาศไว้
        </p>
        <label className={cx('chip', styles.timedToggle)}>
          <input type="checkbox" checked={data.timed} onChange={(e) => setTimedPreference(e.target.checked)} />
          จับเวลาเหมือนสอบจริง
        </label>
      </section>

      <ul className={styles.sets} aria-label="ชุดข้อสอบ">
        {EXAM_SETS.map((set) => (
          <SetCard
            key={set.id}
            set={set}
            session={data.session?.setId === set.id ? data.session : null}
            attempts={data.attempts.filter((a) => a.setId === set.id)}
          />
        ))}
      </ul>

      {history.length > 0 && (
        <section className={cx('card', styles.history)} aria-labelledby="history-title">
          <h2 id="history-title" className={styles.h2}>
            ผลสอบล่าสุด
          </h2>
          <ul className={styles.historyList}>
            {history.map((a) => {
              const set = getExamSet(a.setId);
              if (!set) return null;
              const s = scoreExam(set, a.answers);
              return (
                <li key={a.id}>
                  <Link to={examPath(set.id, a.id)} className={styles.historyRow}>
                    <span>
                      {set.title} · {dateOf(a.finishedAt)}
                      {!a.timed && <span className="muted small"> · ไม่จับเวลา</span>}
                    </span>
                    <span className={styles.historyScore}>
                      {s.scaled}/{SECTION_MAX}
                      <span className={cx(styles.pill, VERDICT_TONE[s.verdict])}>{VERDICT_LABEL[s.verdict]}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <p className="small muted">
        ข้อสอบทุกข้อร่างโดย AI (ใช้คำศัพท์ คันจิ และไวยากรณ์ N5 ที่เว็บสอน) และยังรอผู้รู้ภาษาญี่ปุ่นตรวจ ·
        ผลสอบเก็บไว้ในเครื่องนี้เท่านั้น
      </p>
    </div>
  );
}

interface SetCardProps {
  set: ExamSet;
  session: ExamSession | null;
  attempts: readonly ExamAttempt[];
}

function SetCard({ set, session, attempts }: SetCardProps) {
  const scores = attempts.map((a) => scoreExam(set, a.answers).scaled);
  const best = scores.length ? Math.max(...scores) : null;
  const last = attempts[attempts.length - 1];
  // หน้านี้ไม่ต้องนับถอยหลังทุกวินาที — คิดเวลาที่เหลือครั้งเดียวตอนแสดง
  // eslint-disable-next-line react-hooks/purity
  const left = session?.started && session.deadline !== null ? remainingMs(session.deadline, Date.now()) : null;

  return (
    <li className={cx('card', styles.setCard)}>
      <div className={styles.setInfo}>
        <h2 className={styles.setTitle}>{set.title}</h2>
        <p className="muted small">
          {best === null ? 'ยังไม่เคยทำ' : `คะแนนดีที่สุด ${best}/${SECTION_MAX} · ทำแล้ว ${attempts.length} ครั้ง`}
        </p>
        {session && (
          <p className={styles.inProgress}>
            <Clock size={15} aria-hidden /> ทำค้างอยู่ — ส่วนที่ {session.section + 1}
            {left !== null && (left > 0 ? ` · เหลือเวลา ${formatClock(left)}` : ' · หมดเวลาแล้ว')}
          </p>
        )}
      </div>
      <div className={styles.setActions}>
        <Link to={examPath(set.id)} className="btn btn-primary">
          {session ? 'ทำต่อ' : best === null ? 'เริ่มทำ' : 'ทำอีกครั้ง'} <ArrowRight size={16} aria-hidden />
        </Link>
        {last && (
          <Link to={examPath(set.id, last.id)} className="btn btn-ghost btn-sm">
            ดูผลครั้งล่าสุด
          </Link>
        )}
      </div>
    </li>
  );
}
