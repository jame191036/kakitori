import { ArrowLeft, ArrowRight, Clock, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CHOOSE_ONE, KIND_INFO } from '../../data/exam/build';
import { examPlain, parseExamText } from '../../data/exam/text';
import type { ExamGroup, ExamMondai, ExamQuestion, ExamSet } from '../../data/exam/types';
import { cx } from '../../lib/cx';
import { answeredCount, formatClock, formatDuration, remainingMs } from './examLogic';
import { chooseAnswer, goToQuestion, type ExamSession } from './examStore';
import { ExamPassage, ExamText } from './ExamText';
import styles from './exam.module.css';

interface ExamRunnerProps {
  set: ExamSet;
  session: ExamSession;
  /** auto = หมดเวลา */
  onSubmit: (auto: boolean) => void;
  /** ออกไปก่อน (เก็บไว้ทำต่อ) */
  onLeave: () => void;
  /** ยกเลิกรอบนี้ (ไม่บันทึกผล) */
  onDiscard: () => void;
}

interface Slot {
  q: ExamQuestion;
  mondai: ExamMondai;
  group: ExamGroup;
}

const CHOOSE_ONE_SEGS = parseExamText(CHOOSE_ONE);
const INSTRUCTION = Object.fromEntries(
  Object.entries(KIND_INFO).map(([k, v]) => [k, parseExamText(v.ja)]),
) as Record<keyof typeof KIND_INFO, ReturnType<typeof parseExamText>>;

/** เวลาปัจจุบัน อัปเดตทุกวินาที (ใช้กับตัวจับเวลา) */
function useNow(): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);
  return now;
}

/** ตัวทำข้อสอบ 1 ส่วน: ทีละข้อ · เลือกคำตอบเปลี่ยนได้จนกว่าจะส่ง · กระโดดไปข้ออื่นได้ */
export function ExamRunner({ set, session, onSubmit, onLeave, onDiscard }: ExamRunnerProps) {
  const section = set.sections[session.section]!;
  const slots = useMemo<Slot[]>(
    () => section.mondai.flatMap((mondai) => mondai.groups.flatMap((group) => group.questions.map((q) => ({ q, mondai, group })))),
    [section],
  );
  const index = Math.min(session.current, slots.length - 1);
  const { q, mondai, group } = slots[index]!;
  const chosen = session.answers[q.id];
  const answered = answeredCount(section.questions, session.answers);
  const last = index === slots.length - 1;
  const isFinal = session.section === set.sections.length - 1;

  const now = useNow();
  const left = session.deadline === null ? null : remainingMs(session.deadline, now);
  const [dialog, setDialog] = useState<'submit' | 'quit' | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  // หมดเวลา: ส่งให้อัตโนมัติ (รวมกรณีกลับมาเปิดหน้านี้หลังหมดเวลาแล้ว)
  useEffect(() => {
    if (left === 0) onSubmit(true);
  }, [left, onSubmit]);

  // เปลี่ยนข้อแล้วหัวข้ออยู่นอกจอ (เลื่อนลงไปอ่านบทความยาว) → เลื่อนกลับขึ้นมา
  useEffect(() => {
    const el = topRef.current;
    if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ block: 'start' });
  }, [index]);

  const go = (i: number) => goToQuestion(Math.max(0, Math.min(slots.length - 1, i)));

  // คีย์ลัด: 1–4 เลือกคำตอบ · ← → ข้อก่อน/ถัดไป
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (dialog || e.altKey || e.ctrlKey || e.metaKey) return;
      const n = Number(e.key);
      if (n >= 1 && n <= 4) chooseAnswer(q.id, n - 1);
      else if (e.key === 'ArrowRight') go(index + 1);
      else if (e.key === 'ArrowLeft') go(index - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const refNo = (ref: number) => group.questions[ref - 1]?.no ?? ref;
  const firstGroup = mondai.groups[0]!;
  const instructionRef = (ref: number) => firstGroup.questions[ref - 1]?.no ?? ref;
  // ตัวเลือกสั้น (คำช่วย / คำอ่าน) เรียง 2 คอลัมน์ · ยาวกว่านี้เรียงคอลัมน์เดียว (จอ 390 px ใส่ได้ราว 5 ตัวต่อช่อง)
  const short = q.choices.every((c) => [...examPlain(c)].length <= 5);
  const groupIndex = group.questions.indexOf(q);

  return (
    <div className={styles.runner}>
      <div className={styles.bar} role="group" aria-label="สถานะการสอบ">
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDialog('quit')} aria-label="ออกจากข้อสอบ">
          <X size={16} aria-hidden /> <span className={styles.wideOnly}>ออก</span>
        </button>
        <span className={styles.barSection}>
          ส่วนที่ {session.section + 1}/{set.sections.length}
          <span className={styles.barCount}>
            ตอบแล้ว {answered}/{section.questions.length}
          </span>
        </span>
        {left === null ? (
          <span className={styles.timer} title="ไม่จับเวลา">
            <Clock size={16} aria-hidden /> ไม่จับเวลา
          </span>
        ) : (
          <span
            className={cx(styles.timer, left < 60_000 ? styles.timerBad : left < 5 * 60_000 && styles.timerWarn)}
            role="timer"
            aria-label={`เหลือเวลา ${formatClock(left)}`}
          >
            <Clock size={16} aria-hidden /> {formatClock(left)}
          </span>
        )}
        <button type="button" className="btn btn-primary btn-sm" onClick={() => setDialog('submit')}>
          ส่ง
        </button>
      </div>

      <div ref={topRef} className={styles.anchor} />

      <section className={cx('card', styles.mondaiHead)} aria-label={`もんだい ${mondai.no}`}>
        <p className={styles.mondaiNo}>
          <span className="kana" lang="ja">
            もんだい{mondai.no}
          </span>
          <span className={styles.mondaiTh}>{KIND_INFO[mondai.kind].th}</span>
        </p>
        <p className={styles.instruction}>
          <ExamText segs={INSTRUCTION[mondai.kind]} furigana={false} refNo={instructionRef} />{' '}
          <ExamText segs={CHOOSE_ONE_SEGS} furigana={false} />
        </p>
      </section>

      {group.passage && (
        <section className={cx('card', styles.passageCard)} aria-label="บทความ">
          <ExamPassage blocks={group.passage} furigana={false} refNo={refNo} activeRef={groupIndex + 1} />
        </section>
      )}

      <section className={cx('card', styles.question)} aria-live="polite" aria-label={`ข้อ ${q.no}`}>
        <div className={styles.stemRow}>
          <span className={styles.qNo}>{q.no}</span>
          {q.stem ? (
            <ExamText segs={q.stem} furigana={false} className={styles.stem} />
          ) : (
            <span className={styles.stemHint}>ช่อง {q.no} ในบทความ</span>
          )}
        </div>

        <div className={cx(styles.choices, short && styles.choicesShort)} role="radiogroup" aria-label={`ตัวเลือกข้อ ${q.no}`}>
          {q.choices.map((c, i) => (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={chosen === i}
              className={cx(styles.choice, chosen === i && styles.chosen)}
              onClick={() => chooseAnswer(q.id, i)}
            >
              <span className={styles.choiceKey}>{i + 1}</span>
              <ExamText segs={c} furigana={false} className={styles.choiceText} />
            </button>
          ))}
        </div>
      </section>

      <nav className={styles.nav} aria-label="เลื่อนข้อ">
        <button type="button" className="btn" onClick={() => go(index - 1)} disabled={index === 0} aria-label="ข้อก่อน">
          <ArrowLeft size={18} strokeWidth={1.8} aria-hidden /> <span className={styles.wideOnly}>ข้อก่อน</span>
        </button>
        <span className={styles.navPos}>
          {index + 1} / {slots.length}
        </span>
        {last ? (
          <button type="button" className="btn btn-primary" onClick={() => setDialog('submit')}>
            {isFinal ? 'ส่งข้อสอบ' : 'ส่งส่วนนี้'}
          </button>
        ) : (
          <button type="button" className="btn btn-primary" onClick={() => go(index + 1)}>
            ข้อถัดไป <ArrowRight size={18} strokeWidth={2} aria-hidden />
          </button>
        )}
      </nav>

      <details className={styles.palette}>
        <summary>
          ข้อทั้งหมดในส่วนนี้ · ตอบแล้ว {answered}/{section.questions.length}
        </summary>
        <div className={styles.paletteBody}>
          {section.mondai.map((m) => (
            <div key={m.no} className={styles.paletteGroup}>
              <span className={cx('kana', styles.paletteLabel)} lang="ja">
                もんだい{m.no}
              </span>
              <div className={styles.paletteGrid}>
                {m.groups
                  .flatMap((g) => g.questions)
                  .map((x) => {
                    const i = slots.findIndex((s) => s.q === x);
                    return (
                      <button
                        key={x.id}
                        type="button"
                        className={cx(
                          styles.paletteBtn,
                          session.answers[x.id] !== undefined && styles.paletteDone,
                          i === index && styles.paletteNow,
                        )}
                        aria-current={i === index ? 'true' : undefined}
                        aria-label={`ข้อ ${x.no}${session.answers[x.id] !== undefined ? ' (ตอบแล้ว)' : ''}`}
                        onClick={() => go(i)}
                      >
                        {x.no}
                      </button>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </details>

      {dialog === 'submit' && (
        <ConfirmDialog
          title={isFinal ? 'ส่งข้อสอบและดูผล?' : `ส่งส่วนที่ ${session.section + 1}?`}
          onClose={() => setDialog(null)}
        >
          {answered < section.questions.length ? (
            <p className={styles.dialogWarn}>ยังไม่ได้ตอบ {section.questions.length - answered} ข้อ — ข้อที่ไม่ได้ตอบนับเป็นข้อผิด</p>
          ) : (
            <p>ตอบครบทุกข้อแล้ว</p>
          )}
          <p className="muted small">
            ส่งแล้วกลับมาแก้คำตอบของส่วนนี้ไม่ได้
            {left !== null && ` · ยังเหลือเวลา ${formatDuration(Math.ceil(left / 1000))}`}
          </p>
          <div className={styles.dialogActions}>
            <button type="button" className="btn" onClick={() => setDialog(null)} autoFocus>
              กลับไปทำต่อ
            </button>
            <button type="button" className="btn btn-primary" onClick={() => onSubmit(false)}>
              {isFinal ? 'ส่งและดูผล' : 'ส่งส่วนนี้'}
            </button>
          </div>
        </ConfirmDialog>
      )}

      {dialog === 'quit' && (
        <ConfirmDialog title="ออกจากข้อสอบ?" onClose={() => setDialog(null)}>
          <p>
            คำตอบที่เลือกไว้ถูกเก็บในเครื่องแล้ว กลับมาทำต่อได้จากหน้าข้อสอบจำลอง
            {session.deadline !== null && ' — แต่เวลายังเดินต่อแม้ออกจากหน้านี้ (เหมือนสอบจริง)'}
          </p>
          <div className={styles.dialogActions}>
            <button type="button" className="btn" onClick={() => setDialog(null)} autoFocus>
              ทำต่อ
            </button>
            <button type="button" className="btn" onClick={onLeave}>
              ออกไปก่อน
            </button>
            <button type="button" className="btn btn-danger" onClick={onDiscard}>
              ยกเลิกรอบนี้
            </button>
          </div>
        </ConfirmDialog>
      )}
    </div>
  );
}

interface ConfirmDialogProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

/** หน้าต่างยืนยัน (ปิดด้วย Esc หรือกดพื้นหลัง) */
function ConfirmDialog({ title, onClose, children }: ConfirmDialogProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={cx('card', styles.dialog)}
        role="dialog"
        aria-modal="true"
        aria-labelledby="exam-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="exam-dialog-title" className={styles.dialogTitle}>
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}
