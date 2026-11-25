import { useRef, useState } from 'react';
import { Link } from 'react-router';
import { conjPath } from '../app/paths';
import { conjugate } from '../data/conj/conjugate';
import { CONJ_N5 } from '../data/conj/n5';
import { FORM_INFO, type ConjKind, type VerbGroup } from '../data/conj/types';
import {
  cleanPrefs,
  FREE_COUNTS,
  FREE_TOPICS,
  FREE_TYPES,
  freeKey,
  freeQuestions,
  freeWords,
  retryQuestions,
  topicWords,
  usesGroups,
  type ConjQuestion,
  type FreePrefs,
  type FreeTopic,
  type FreeType,
} from '../features/conj/conjLogic';
import { ConjRunner } from '../features/conj/ConjRunner';
import styles from '../features/conj/conj.module.css';
import { deckProgress, lessonPassed } from '../features/line/lineLogic';
import { progressStore, recordPractice } from '../features/progress/progressStore';
import { settingsStore, updateSettings } from '../features/settings/settings';
import { cx } from '../lib/cx';
import { tone } from '../lib/tone';
import page from '../components/line/LessonPage.module.css';

/** ไม่จำกัดข้อ: เติมข้อทีละชุด */
const BATCH = 10;

const GROUP_LABEL: Record<VerbGroup, string> = { 1: 'กลุ่ม 1', 2: 'กลุ่ม 2', 3: 'กลุ่ม 3 (する・くる)' };
/** หัวข้อแยกตามชนิดคำ */
const SECTIONS: { title: string; topics: FreeTopic[] }[] = [
  { title: 'คำกริยา', topics: topicsOf('verb') },
  { title: 'คุณศัพท์ い', topics: topicsOf('i') },
  { title: 'คุณศัพท์ な', topics: topicsOf('na') },
];

function topicsOf(kind: ConjKind): FreeTopic[] {
  return FREE_TOPICS.filter((t) => (t === 'group' ? kind === 'verb' : FORM_INFO[t].kind === kind));
}

const TYPE_LABEL: Record<FreeType, string> = { form: 'เลือก 4 ตัวเลือก', build: 'เรียงคานะ', back: 'ย้อนหาคำเดิม' };

/** ครั้งแรก: รูปของบทที่ผ่านแล้ว (ยังไม่ผ่านบทไหน = รูป ます) · ครั้งต่อไปใช้ตัวเลือกล่าสุด */
function initialPrefs(): FreePrefs {
  const saved = settingsStore.get().conjFree;
  const prefs = saved && cleanPrefs(saved, FREE_TOPICS);
  if (prefs && prefs.topics.length && prefs.groups.length && prefs.types.length) return prefs;
  const progress = deckProgress(CONJ_N5, progressStore.get());
  const learned = new Set(
    CONJ_N5.lessons
      .filter((l) => lessonPassed(CONJ_N5, l, progress))
      .flatMap((l) => l.words.map((id) => CONJ_N5.words[id]!.form ?? ('group' as const))),
  );
  const topics = FREE_TOPICS.filter((t) => learned.has(t));
  return { topics: topics.length ? topics : ['masu'], groups: [1, 2, 3], types: ['form', 'build'], count: 10 };
}

interface Answer {
  q: ConjQuestion;
  correct: boolean;
}

type Phase =
  | { kind: 'setup' }
  | { kind: 'run'; questions: ConjQuestion[]; key: number; endless: boolean }
  | { kind: 'result'; answers: Answer[] };

const toggle = <T,>(list: readonly T[], x: T): T[] => (list.includes(x) ? list.filter((y) => y !== x) : [...list, x]);

const topicLabel = (t: FreeTopic) => (t === 'group' ? 'แยกกลุ่มคำ' : FORM_INFO[t].thai);
const KIND_LABEL: Record<ConjKind, string> = { verb: '', i: ' · คุณศัพท์ い', na: ' · คุณศัพท์ な' };

/** ฝึกผันคำอิสระ: เลือกรูป กลุ่มคำ วิธีตอบ และจำนวนข้อเอง — นับเป็นการฝึก (เป้ารายวัน) แต่ไม่นับเป็นผลสอบ */
export default function ConjFreePage() {
  const [prefs, setPrefs] = useState<FreePrefs>(initialPrefs);
  const [phase, setPhase] = useState<Phase>({ kind: 'setup' });
  const answers = useRef<Answer[]>([]);

  const onlyGroup = prefs.topics.length > 0 && prefs.topics.every((t) => t === 'group');
  const needsGroups = prefs.topics.some(usesGroups);
  const total = prefs.topics.reduce((n, t) => n + freeWords(t, prefs).length, 0);
  // คำที่ถามย้อนกลับไม่ได้ (ข้ามเมื่อเลือกวิธีตอบนี้อย่างเดียว)
  const skipped =
    prefs.types.length > 0 && prefs.topics.reduce((n, t) => n + topicWords(t, prefs.groups).length, 0) > total;
  const missing = !prefs.topics.length
    ? 'เลือกอย่างน้อย 1 รูป'
    : needsGroups && !prefs.groups.length
      ? 'เลือกอย่างน้อย 1 กลุ่มคำกริยา'
      : !onlyGroup && !prefs.types.length
        ? 'เลือกอย่างน้อย 1 วิธีตอบ'
        : total === 0
          ? 'รูปที่เลือกย้อนหาคำเดิมไม่ได้ เลือกวิธีตอบอื่นเพิ่ม'
          : null;

  const run = (questions: ConjQuestion[], endless: boolean) => {
    answers.current = [];
    setPhase({ kind: 'run', questions, key: Date.now(), endless });
    window.scrollTo(0, 0);
  };

  const start = () => {
    updateSettings({ conjFree: prefs });
    run(freeQuestions(usable(prefs), prefs.count || BATCH), prefs.count === 0);
  };

  const finish = () => {
    setPhase({ kind: 'result', answers: [...answers.current] });
    window.scrollTo(0, 0);
  };

  return (
    <div className={cx('container tone', page.page)} style={tone('n5')}>
      <header>
        <h1 className={page.h1}>ฝึกผันคำอิสระ</h1>
        <p className={page.muted}>
          {phase.kind === 'setup'
            ? 'เลือกรูป กลุ่มคำ และวิธีตอบเอง ฝึกได้เรื่อยๆ ไม่นับเป็นผลสอบ'
            : phase.kind === 'run'
              ? 'สุ่มคำใหม่ทุกข้อ'
              : 'สรุปรอบนี้'}
        </p>
      </header>

      {phase.kind === 'setup' && (
        <div className={styles.setup}>
          <section className="card stack">
            <div className={styles.setupHead}>
              <h2 className={styles.setupTitle}>1. รูปที่จะฝึก</h2>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() =>
                  setPrefs((p) => ({ ...p, topics: p.topics.length === FREE_TOPICS.length ? [] : [...FREE_TOPICS] }))
                }
              >
                {prefs.topics.length === FREE_TOPICS.length ? 'ล้างทั้งหมด' : 'เลือกทั้งหมด'}
              </button>
            </div>
            {SECTIONS.map(({ title, topics }) => (
              <div key={title} className="stack">
                <div className={styles.setupHead}>
                  <p className={styles.subhead}>{title}</p>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() =>
                      setPrefs((p) => ({
                        ...p,
                        topics: topics.every((t) => p.topics.includes(t))
                          ? p.topics.filter((t) => !topics.includes(t))
                          : [...new Set([...p.topics, ...topics])],
                      }))
                    }
                  >
                    {topics.every((t) => prefs.topics.includes(t)) ? `ล้าง${title}` : `เลือก${title}ทั้งหมด`}
                  </button>
                </div>
                <div className={styles.chips} role="group" aria-label={`รูปของ${title}`}>
                  {topics.map((t) => (
                    <label key={t} className="chip">
                      <input
                        type="checkbox"
                        checked={prefs.topics.includes(t)}
                        onChange={() => setPrefs((p) => ({ ...p, topics: toggle(p.topics, t) }))}
                      />
                      <span>
                        {t !== 'group' && (
                          <span className={cx('kana', styles.topicJa)} lang="ja">
                            {FORM_INFO[t].ja}{' '}
                          </span>
                        )}
                        {topicLabel(t)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </section>

          <section className="card stack">
            <h2 className={styles.setupTitle}>2. กลุ่มคำกริยา</h2>
            <div className={styles.chips} role="group" aria-label="กลุ่มคำกริยา">
              {([1, 2, 3] as const).map((g) => (
                <label key={g} className="chip">
                  <input
                    type="checkbox"
                    checked={prefs.groups.includes(g)}
                    onChange={() => setPrefs((p) => ({ ...p, groups: toggle(p.groups, g) }))}
                  />
                  <span>{GROUP_LABEL[g]}</span>
                </label>
              ))}
            </div>
            <p className="small muted">ใช้กับรูปของคำกริยาเท่านั้น (ข้อแยกกลุ่มคำใช้คำจากทุกกลุ่มเสมอ)</p>
          </section>

          <section className="card stack">
            <h2 className={styles.setupTitle}>3. วิธีตอบ</h2>
            <div className={styles.chips} role="group" aria-label="วิธีตอบ">
              {FREE_TYPES.map((t) => (
                <label key={t} className="chip">
                  <input
                    type="checkbox"
                    checked={prefs.types.includes(t)}
                    onChange={() => setPrefs((p) => ({ ...p, types: toggle(p.types, t) }))}
                  />
                  <span>{TYPE_LABEL[t]}</span>
                </label>
              ))}
            </div>
            {skipped && (
              <p className="small muted" role="status">
                คุณศัพท์ な และคำนาม + する ถามย้อนไม่ได้ (โจทย์มีคำเดิมอยู่แล้ว) จึงข้ามให้
              </p>
            )}
          </section>

          <section className="card stack">
            <h2 className={styles.setupTitle}>4. จำนวนข้อ</h2>
            <div className="segmented" role="group" aria-label="จำนวนข้อ">
              {FREE_COUNTS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-pressed={prefs.count === c}
                  onClick={() => setPrefs((p) => ({ ...p, count: c }))}
                >
                  {c === 0 ? 'ไม่จำกัด' : `${c} ข้อ`}
                </button>
              ))}
            </div>
            {prefs.count === 0 && <p className="small muted">กด "จบรอบ" เมื่อไรก็ได้ แล้วจะสรุปผลให้</p>}
          </section>

          <div className={styles.startRow}>
            <span className="small muted">{missing ?? `มีข้อให้สุ่ม ${total} แบบ (คำ × รูป)`}</span>
            <button type="button" className="btn btn-primary" onClick={start} disabled={!!missing}>
              เริ่มฝึก
            </button>
          </div>
        </div>
      )}

      {phase.kind === 'run' && (
        <ConjRunner
          key={phase.key}
          questions={phase.questions}
          mode="free"
          onAnswer={(q, correct) => {
            answers.current.push({ q, correct });
            // ฝึก = บันทึกแค่ว่าฝึกแล้ว (นับเป้ารายวัน ไม่กระทบผลสอบ/รอบทบทวน)
            recordPractice(CONJ_N5.progressKey, q.rule.id);
          }}
          onFinish={finish}
          onQuit={() => setPhase({ kind: 'setup' })}
          onMore={
            phase.endless
              ? () => freeQuestions(usable(prefs), BATCH, { recent: answers.current.map((a) => freeKey(a.q)) })
              : undefined
          }
        />
      )}

      {phase.kind === 'result' && (
        <FreeResult
          answers={phase.answers}
          onAgain={start}
          onSetup={() => setPhase({ kind: 'setup' })}
          onRetry={(wrong) => run(retryQuestions(wrong, prefs.types), false)}
        />
      )}

      <nav className={page.lessonNav} aria-label="กลับ">
        <span />
        <Link to={conjPath()} className="btn btn-ghost">
          แผนที่สาย
        </Link>
        <span />
      </nav>
    </div>
  );
}

/** ข้อแยกกลุ่มไม่ใช้กลุ่มคำและวิธีตอบ — เลือกหัวข้อนี้อย่างเดียวก็เริ่มได้ */
const usable = (p: FreePrefs): FreePrefs => ({ ...p, types: p.types.length ? p.types : ['form'] });

function FreeResult({
  answers,
  onAgain,
  onSetup,
  onRetry,
}: {
  answers: readonly Answer[];
  onAgain: () => void;
  onSetup: () => void;
  onRetry: (wrong: ConjQuestion[]) => void;
}) {
  const right = answers.filter((a) => a.correct).length;
  const wrong = answers.filter((a) => !a.correct).map((a) => a.q);
  // รูปที่ผิดบ่อยที่สุดอยู่บน
  const topics = FREE_TOPICS.map((t) => {
    const list = answers.filter((a) => (a.q.form ?? 'group') === t);
    return { t, total: list.length, right: list.filter((a) => a.correct).length };
  })
    .filter((x) => x.total > 0)
    .sort((a, b) => a.right / a.total - b.right / b.total);
  const unique = wrong.filter((q, i) => wrong.findIndex((x) => freeKey(x) === freeKey(q)) === i);

  return (
    <div className={styles.summary}>
      <section className={cx('card', styles.scoreCard)} aria-live="polite">
        <p className={styles.score}>
          {right} / {answers.length}
        </p>
        <p className="muted">
          {wrong.length === 0 ? 'ถูกทุกข้อ!' : `ผิด ${wrong.length} ข้อ`} · ฝึกอิสระไม่นับเป็นผลสอบ
        </p>
        <div className={styles.actions}>
          {unique.length > 0 && (
            <button type="button" className="btn btn-primary" onClick={() => onRetry(unique)}>
              ฝึกเฉพาะข้อที่ผิด ({unique.length})
            </button>
          )}
          <button type="button" className={cx('btn', unique.length === 0 && 'btn-primary')} onClick={onAgain}>
            ฝึกอีกรอบ
          </button>
          <button type="button" className="btn" onClick={onSetup}>
            เปลี่ยนตัวเลือก
          </button>
        </div>
      </section>

      <section className="card stack" aria-labelledby="topics-title">
        <h2 id="topics-title" className={styles.setupTitle}>
          ผลแยกตามรูป
        </h2>
        <ul className={styles.topicRows}>
          {topics.map(({ t, total, right: ok }) => (
            <li key={t} className={styles.topicRow}>
              <span>
                {t !== 'group' && (
                  <span className={cx('kana', styles.topicJa)} lang="ja">
                    {FORM_INFO[t].ja}{' '}
                  </span>
                )}
                {topicLabel(t)}
                {t !== 'group' && KIND_LABEL[FORM_INFO[t].kind]}
              </span>
              <span className={styles.topicScore}>
                {ok}/{total}
              </span>
              <span className={styles.bar} aria-hidden>
                <span style={{ width: `${(ok / total) * 100}%` }} />
              </span>
            </li>
          ))}
        </ul>
      </section>

      {unique.length > 0 && (
        <section className="card stack" aria-labelledby="wrong-title">
          <h2 id="wrong-title" className={styles.setupTitle}>
            ข้อที่ผิด
          </h2>
          <ul className={styles.wrongRows}>
            {unique.map((q) => (
              <li key={freeKey(q)}>
                <span className={cx('kana', styles.feedbackJa)} lang="ja">
                  {q.word.kana}
                  {q.form && ` → ${conjugate(q.word, q.form)}`}
                </span>
                <span className="small muted">
                  {q.word.thai}
                  {q.form ? ` · กฎ: ${q.rule.title}` : ` · กลุ่ม ${q.word.group}`}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
