import { ClipboardCheck, PenLine, Target, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { useScriptPack } from '../app/ScriptContext';
import { KanaTable, MasteryLegend } from '../components/KanaTable';
import { romajiLabel } from '../data/scripts';
import { masteryLevel, MASTERY_LABEL, weakChars } from '../features/progress/progressLogic';
import { resetProgress, useScriptProgress } from '../features/progress/progressStore';
import { cx } from '../lib/cx';
import styles from './ReviewPage.module.css';

const MAX_REVIEW = 15;
const rtf = new Intl.RelativeTimeFormat('th', { numeric: 'auto' });

function relativeTime(ts: number | null): string {
  if (!ts) return '';
  const minutes = Math.round((ts - Date.now()) / 60000);
  if (Math.abs(minutes) < 60) return rtf.format(minutes, 'minute');
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return rtf.format(hours, 'hour');
  return rtf.format(Math.round(hours / 24), 'day');
}

export default function ReviewPage() {
  const pack = useScriptPack();
  const navigate = useNavigate();
  const progress = useScriptProgress(pack.id);
  const weak = weakChars(pack, progress);

  const counts = [0, 0, 0, 0];
  pack.chars.forEach((c) => counts[masteryLevel(progress?.[c.id])]!++);
  const total = pack.chars.length;
  const hasAny = counts[0]! < total;

  const startReview = () => {
    const ids = weak.slice(0, MAX_REVIEW).map((w) => w.entry.id);
    navigate(`/${pack.id}/quiz?chars=${ids.join(',')}`);
  };

  const reset = () => {
    if (window.confirm(`ล้างความคืบหน้าทั้งหมดของ${pack.name}? (ย้อนกลับไม่ได้)`)) resetProgress(pack.id);
  };

  return (
    <div className="container page">
      <header className="stack" style={{ gap: 4 }}>
        <h1 className="page-title">ทบทวน{pack.name}</h1>
        <p className="muted">
          ระบบจำตัวที่คุณตอบผิดหรือเขียนผิดไว้ในเบราว์เซอร์นี้ แล้วนำมาให้ฝึกซ้ำจนจำได้
        </p>
      </header>

      <section className="card stack">
        <div className={styles.overviewHead}>
          <h2 className={styles.h2}>ภาพรวม</h2>
          <span className="muted small">
            จำได้แล้ว <strong className={styles.strong}>{counts[3]}</strong> จาก {total} ตัว
          </span>
        </div>
        <div className={styles.stack} role="img" aria-label={MASTERY_LABEL.map((l, i) => `${l} ${counts[i]} ตัว`).join(', ')}>
          {[3, 2, 1, 0].map((lvl) =>
            counts[lvl] ? (
              <span key={lvl} className={styles[`m${lvl}`]} style={{ flexGrow: counts[lvl] }}>
                {counts[lvl]}
              </span>
            ) : null,
          )}
        </div>
        <MasteryLegend />
      </section>

      <section className="card stack">
        <div className={styles.overviewHead}>
          <h2 className={styles.h2}>
            <Target size={20} aria-hidden /> ตัวที่ผิดบ่อย
          </h2>
          {weak.length > 0 && (
            <button type="button" className="btn btn-primary" onClick={startReview}>
              <ClipboardCheck size={18} aria-hidden /> ทบทวนด้วยแบบทดสอบ ({Math.min(weak.length, MAX_REVIEW)} ตัว)
            </button>
          )}
        </div>

        {weak.length === 0 ? (
          <div className={styles.empty}>
            <p>{hasAny ? 'ยังไม่มีตัวที่ผิดบ่อย เยี่ยมมาก! 🎉' : 'ยังไม่มีข้อมูล — ลองทำแบบทดสอบหรือฝึกเขียนก่อนนะ'}</p>
            <div className="row" style={{ justifyContent: 'center' }}>
              <Link to={`/${pack.id}/quiz`} className="btn btn-primary">
                <ClipboardCheck size={18} aria-hidden /> ทำแบบทดสอบ
              </Link>
              <Link to={`/${pack.id}/practice`} className="btn">
                <PenLine size={18} aria-hidden /> ฝึกเขียน
              </Link>
            </div>
          </div>
        ) : (
          <ul className={styles.weakGrid}>
            {weak.map(({ entry, stat }) => (
              <li key={entry.id} className={styles.weakItem}>
                <span className={cx('kana', styles.weakChar)} lang="ja">
                  {entry.char}
                </span>
                <span className={styles.weakInfo}>
                  <strong>
                    {romajiLabel(entry)} <span className="muted">({entry.thai})</span>
                  </strong>
                  <span className="small muted">
                    ผิด {stat.wrong} · ถูก {stat.correct}
                    {stat.lastWrong ? ` · ผิดล่าสุด ${relativeTime(stat.lastWrong)}` : ''}
                  </span>
                </span>
                <Link
                  to={`/${pack.id}/practice/${entry.id}?mode=trace`}
                  className="btn btn-sm btn-icon"
                  aria-label={`ฝึกเขียน ${entry.char}`}
                  title="ฝึกเขียน"
                >
                  <PenLine size={16} aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card stack">
        <h2 className={styles.h2}>ความคืบหน้ารายตัว</h2>
        <KanaTable pack={pack} progress={progress} hrefFor={(c) => `/${pack.id}/practice/${c.id}`} compact />
        <MasteryLegend />
      </section>

      {hasAny && (
        <section className={styles.danger}>
          <p className="small muted">
            ข้อมูลทั้งหมดเก็บอยู่ในเบราว์เซอร์นี้เท่านั้น ถ้าล้างประวัติเบราว์เซอร์ ข้อมูลจะหายไปด้วย
          </p>
          <button type="button" className="btn btn-sm btn-danger" onClick={reset}>
            <Trash2 size={16} aria-hidden /> ล้างความคืบหน้า{pack.name}
          </button>
        </section>
      )}
    </div>
  );
}
