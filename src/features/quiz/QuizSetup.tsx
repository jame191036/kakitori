import { Play } from 'lucide-react';
import { useState } from 'react';
import { GroupSelector } from '../../components/GroupSelector';
import { charsInGroups } from '../../data/scripts';
import type { ScriptPack } from '../../data/types';
import { cx } from '../../lib/cx';
import {
  getQuizPrefs,
  QUESTION_TYPES,
  updateQuizPrefs,
  useSettings,
  type QuestionType,
  type QuizPrefs,
} from '../settings/settings';
import { useSpeech } from '../speech/useSpeech';
import { isTypeAvailable, questionTypeInfo } from './quizText';
import styles from './quiz.module.css';

const COUNTS = [10, 20, 30, 0] as const; // 0 = ทุกตัวที่เลือก

interface QuizSetupProps {
  pack: ScriptPack;
  onStart: (prefs: QuizPrefs & { groups: string[] }) => void;
}

export function QuizSetup({ pack, onStart }: QuizSetupProps) {
  const settings = useSettings();
  const saved = getQuizPrefs(settings, pack.id);
  const { available: audioOk } = useSpeech();

  const defaultGroups = pack.groups.filter((g) => g.kind === 'basic').map((g) => g.id);
  const [groups, setGroups] = useState<string[]>(saved.groups ?? defaultGroups);
  const [types, setTypes] = useState<QuestionType[]>(saved.types);
  const [count, setCount] = useState<number>(saved.count);

  const usableTypes = types.filter((t) => isTypeAvailable(t, pack, audioOk));
  // ซ่อนรูปแบบที่ชุดนี้ไม่มี (เช่น จับคู่ ถ้าไม่มีชุดคู่) แต่แสดงแบบฟังเสียงไว้เป็นปุ่มที่กดไม่ได้
  const shownTypes = QUESTION_TYPES.filter((t) => t === 'audioToChar' || isTypeAvailable(t, pack, audioOk));
  const poolSize = charsInGroups(pack, groups).length;
  const canStart = poolSize > 0 && usableTypes.length > 0;

  const toggleType = (t: QuestionType) =>
    setTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const start = () => {
    const prefs = { groups, types: usableTypes, count };
    updateQuizPrefs(pack.id, prefs);
    onStart(prefs);
  };

  return (
    <div className={styles.setup}>
      <section className="card">
        <GroupSelector pack={pack} value={groups} onChange={setGroups} legend="1. เลือกแถวที่จะสอบ" />
      </section>

      <section className="card stack">
        <h2 className={styles.setupTitle}>2. รูปแบบคำถาม</h2>
        <div className={styles.typeGrid}>
          {shownTypes.map((t) => {
            const disabled = !isTypeAvailable(t, pack, audioOk);
            const info = questionTypeInfo(t, pack);
            return (
              <label key={t} className={cx('chip', styles.typeChip, disabled && styles.disabled)}>
                <input
                  type="checkbox"
                  checked={types.includes(t) && !disabled}
                  disabled={disabled}
                  onChange={() => toggleType(t)}
                />
                <span>
                  {info.label}
                  <span className={cx('small muted', styles.example)}>{info.example}</span>
                </span>
              </label>
            );
          })}
        </div>
        {!audioOk && (
          <p className="small muted">
            เครื่อง/เบราว์เซอร์นี้ไม่มีเสียงภาษาญี่ปุ่น จึงปิดข้อสอบแบบฟังเสียงไว้
          </p>
        )}
      </section>

      <section className="card stack">
        <h2 className={styles.setupTitle}>3. จำนวนข้อ</h2>
        <div className="segmented" role="group" aria-label="จำนวนข้อ">
          {COUNTS.map((c) => (
            <button key={c} type="button" aria-pressed={count === c} onClick={() => setCount(c)}>
              {c === 0 ? `ทุกตัว (${poolSize})` : `${c} ข้อ`}
            </button>
          ))}
        </div>
        <p className="small muted">ตัวที่ยังจำไม่แม่นจะถูกสุ่มมาถามบ่อยกว่า</p>
      </section>

      <div className={styles.startBar}>
        <span className="muted small">
          {poolSize === 0 ? 'ยังไม่ได้เลือกแถว' : `เลือกไว้ ${poolSize} ตัว`}
          {usableTypes.length === 0 && ' · ยังไม่ได้เลือกรูปแบบคำถาม'}
        </span>
        <button type="button" className="btn btn-primary" onClick={start} disabled={!canStart}>
          <Play size={18} aria-hidden /> เริ่มทำแบบทดสอบ
        </button>
      </div>
    </div>
  );
}
