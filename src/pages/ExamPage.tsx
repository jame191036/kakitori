import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { examPath } from '../app/paths';
import { EXAM_SETS, getExamSet } from '../data/exam/n5';
import type { ExamSet } from '../data/exam/types';
import { answeredCount } from '../features/exam/examLogic';
import { ExamResult } from '../features/exam/ExamResult';
import { ExamRunner } from '../features/exam/ExamRunner';
import {
  beginSection,
  discardSession,
  examStore,
  setTimedPreference,
  startExam,
  submitSection,
  type ExamSession,
} from '../features/exam/examStore';
import styles from '../features/exam/exam.module.css';
import { cx } from '../lib/cx';
import { useStore } from '../lib/persistentStore';
import { tone } from '../lib/tone';

/**
 * ทำข้อสอบจำลอง 1 ชุด: หน้าก่อนเริ่ม → ส่วนที่ 1 → พัก → ส่วนที่ 2 → ผลสอบ (?result=<id>)
 * ข้อสอบที่กำลังทำเก็บในเครื่อง — ปิดหน้าแล้วกลับมาทำต่อได้ (ถ้าจับเวลา เวลายังเดินต่อ)
 */
export default function ExamPage() {
  const { setId } = useParams();
  const set = getExamSet(setId);
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const data = useStore(examStore);
  const [autoSubmitted, setAutoSubmitted] = useState(false);
  const resultId = params.get('result');
  const session = set && data.session?.setId === set.id ? data.session : null;
  const phase = !set ? 'missing' : resultId ? 'result' : !session ? 'intro' : session.started ? 'run' : 'break';

  // เปลี่ยนขั้น (เริ่ม / ส่งส่วน / ดูผล) → ขึ้นไปบนสุดของหน้า
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [phase, session?.section]);

  const onSubmit = useCallback(
    (auto: boolean) => {
      if (!set) return;
      const id = submitSection(set);
      setAutoSubmitted(auto);
      if (id) navigate(examPath(set.id, id), { replace: true });
    },
    [set, navigate],
  );

  if (!set) {
    return (
      <div className={cx('container', styles.page)}>
        <p className="notice notice-bad">ไม่พบข้อสอบชุดนี้</p>
        <Link to={examPath()} className="btn">
          กลับหน้าข้อสอบจำลอง
        </Link>
      </div>
    );
  }

  const retry = () => {
    setAutoSubmitted(false);
    startExam(set, data.timed);
    navigate(examPath(set.id), { replace: true });
  };

  let body: React.ReactNode;
  if (phase === 'result') {
    const attempt = data.attempts.find((a) => a.id === resultId && a.setId === set.id);
    body = attempt ? (
      <>
        {autoSubmitted && <p className="notice notice-warn">หมดเวลา — ระบบส่งคำตอบให้อัตโนมัติ</p>}
        <ExamResult set={set} attempt={attempt} onRetry={retry} />
      </>
    ) : (
      <div className={styles.narrow}>
        <p className="notice notice-bad">ไม่พบผลสอบนี้ในเครื่อง (อาจถูกล้างข้อมูลเบราว์เซอร์ไปแล้ว)</p>
        <Link to={examPath()} className="btn">
          กลับหน้าข้อสอบจำลอง
        </Link>
      </div>
    );
  } else if (phase === 'run') {
    body = (
      <ExamRunner
        set={set}
        session={session!}
        onSubmit={onSubmit}
        onLeave={() => navigate(examPath())}
        onDiscard={() => {
          discardSession();
          navigate(examPath());
        }}
      />
    );
  } else if (phase === 'break') {
    body = <ExamBreak set={set} session={session!} autoSubmitted={autoSubmitted} onStart={() => beginSection(set)} />;
  } else {
    const other = data.session && data.session.setId !== set.id ? getExamSet(data.session.setId) : undefined;
    body = (
      <ExamIntro
        set={set}
        timed={data.timed}
        onTimed={setTimedPreference}
        otherTitle={other?.title}
        onStart={() => {
          setAutoSubmitted(false);
          startExam(set, data.timed);
        }}
      />
    );
  }

  return (
    <div className={cx('container tone', styles.page)} style={tone('n5')}>
      {body}
    </div>
  );
}

interface ExamIntroProps {
  set: ExamSet;
  timed: boolean;
  onTimed: (timed: boolean) => void;
  /** ชื่อชุดอื่นที่ทำค้างอยู่ (เริ่มชุดนี้จะยกเลิกชุดนั้น) */
  otherTitle?: string;
  onStart: () => void;
}

function ExamIntro({ set, timed, onTimed, otherTitle, onStart }: ExamIntroProps) {
  const total = set.questions.length;
  return (
    <section className={cx('card', styles.intro)} aria-labelledby="intro-title">
      <p className={cx('kana', styles.introJa)} lang="ja">
        もぎしけん N5
      </p>
      <h1 id="intro-title" className={styles.h1}>
        ข้อสอบจำลอง N5 · {set.title}
      </h1>
      <ol className={styles.sectionList}>
        {set.sections.map((s, i) => (
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
      </ol>
      <ul className={styles.rules}>
        <li>รวม {total} ข้อ ข้อละ 4 ตัวเลือก — เลือกแล้วเปลี่ยนได้จนกว่าจะกดส่งส่วนนั้น</li>
        <li>ระหว่างสอบไม่มีคำอ่านเหนือคันจิและไม่มีคำแปล (เหมือนสอบจริง) — ดูเฉลยละเอียดได้หลังส่ง</li>
        <li>ส่งส่วนที่ 1 แล้วจะกลับไปแก้ไม่ได้ · ข้อที่ไม่ได้ตอบนับเป็นข้อผิด</li>
        <li>ยังไม่มีส่วนการฟัง</li>
      </ul>
      <label className={cx('chip', styles.timedToggle)}>
        <input type="checkbox" checked={timed} onChange={(e) => onTimed(e.target.checked)} />
        จับเวลาเหมือนสอบจริง (หมดเวลาแล้วส่งอัตโนมัติ · ออกจากหน้านี้เวลาก็ยังเดิน)
      </label>
      {otherTitle && <p className="notice notice-warn">มี{otherTitle}ทำค้างอยู่ — ถ้าเริ่มชุดนี้ ชุดนั้นจะถูกยกเลิก</p>}
      <div className={styles.actions}>
        <button type="button" className="btn btn-primary" onClick={onStart}>
          เริ่มทำส่วนที่ 1
        </button>
        <Link to={examPath()} className="btn btn-ghost">
          ดูชุดอื่น ({EXAM_SETS.length} ชุด)
        </Link>
      </div>
    </section>
  );
}

interface ExamBreakProps {
  set: ExamSet;
  session: ExamSession;
  autoSubmitted: boolean;
  onStart: () => void;
}

/** พักระหว่างส่วน (ข้อสอบจริงก็มีช่วงพัก) — ยังไม่บอกคะแนนจนกว่าจะส่งครบ */
function ExamBreak({ set, session, autoSubmitted, onStart }: ExamBreakProps) {
  const done = set.sections[session.section - 1]!;
  const next = set.sections[session.section]!;
  return (
    <section className={cx('card', styles.intro)} aria-labelledby="break-title">
      {autoSubmitted && <p className="notice notice-warn">หมดเวลาส่วนที่ {session.section} — ระบบส่งคำตอบให้อัตโนมัติ</p>}
      <h1 id="break-title" className={styles.h1}>
        ส่งส่วนที่ {session.section} แล้ว
      </h1>
      <p className="muted">
        ตอบไป {answeredCount(done.questions, session.answers)} จาก {done.questions.length} ข้อ — ผลคะแนนจะแสดงหลังส่งครบทุกส่วน
        พักสายตาสักครู่ได้ แล้วเริ่มส่วนถัดไปเมื่อพร้อม
      </p>
      <ol className={styles.sectionList} start={session.section + 1}>
        <li>
          <span className={styles.sectionNo}>ส่วนที่ {session.section + 1}</span>
          <span className={styles.sectionName}>
            <span className="kana" lang="ja">
              {next.ja}
            </span>
            <span className="muted small">{next.th}</span>
          </span>
          <span className={styles.sectionMeta}>
            {session.timed ? `${next.minutes} นาที · ` : ''}
            {next.questions.length} ข้อ
          </span>
        </li>
      </ol>
      <div className={styles.actions}>
        <button type="button" className="btn btn-primary" onClick={onStart}>
          เริ่มส่วนที่ {session.section + 1}
        </button>
      </div>
    </section>
  );
}
