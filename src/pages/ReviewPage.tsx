import { PenLine } from 'lucide-react';
import { useState, type ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { useScriptPack } from '../app/ScriptContext';
import { KanaTable, MasteryLegend } from '../components/KanaTable';
import { romajiLabel } from '../data/scripts';
import { backupFileName, makeBackup, parseBackup } from '../features/progress/backup';
import {
  dueChars,
  hasAnswered,
  masteryLevel,
  MASTERY_LABEL,
  nextReview,
  REVIEW_BATCH,
  REVIEW_INTERVAL_DAYS,
  reviewHref,
  weakChars,
} from '../features/progress/progressLogic';
import {
  activityStore,
  importData,
  progressStore,
  resetProgress,
  useScriptProgress,
} from '../features/progress/progressStore';
import { cx } from '../lib/cx';
import { daysFromNowLabel } from '../lib/day';
import { useNow } from '../lib/useNow';
import styles from './ReviewPage.module.css';

const MAX_WEAK_REVIEW = 15;
const rtf = new Intl.RelativeTimeFormat('th', { numeric: 'auto' });

function relativeTime(ts: number | null, now: number): string {
  if (!ts) return '';
  const minutes = Math.round((ts - now) / 60000);
  if (Math.abs(minutes) < 60) return rtf.format(minutes, 'minute');
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return rtf.format(hours, 'hour');
  return rtf.format(Math.round(hours / 24), 'day');
}

/** ดาวน์โหลดไฟล์สำรองความคืบหน้า (ทุกชุดตัวอักษร) */
function downloadBackup() {
  const now = Date.now();
  const backup = makeBackup(progressStore.get(), activityStore.get(), now);
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }),
  );
  const a = document.createElement('a');
  a.href = url;
  a.download = backupFileName(now);
  document.body.append(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

type ImportMessage = { kind: 'good' | 'bad'; text: string } | null;

function DataSection({ packName, canReset, onReset }: { packName: string; canReset: boolean; onReset: () => void }) {
  const [message, setMessage] = useState<ImportMessage>(null);

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const file = input.files?.[0];
    input.value = ''; // ให้เลือกไฟล์เดิมซ้ำได้
    if (!file) return;
    const data = parseBackup(await file.text());
    if (!data) {
      setMessage({ kind: 'bad', text: 'ไฟล์นี้ไม่ใช่ไฟล์สำรองของ kakitori หรือไฟล์เสีย' });
      return;
    }
    const { chars, days } = importData(data);
    setMessage({
      kind: 'good',
      text:
        chars || days
          ? `นำเข้าแล้ว ✓ อัปเดตความคืบหน้า ${chars} ตัวอักษร และวันที่ฝึก ${days} วัน`
          : 'นำเข้าแล้ว ✓ ข้อมูลในเครื่องนี้ใหม่กว่าหรือตรงกับไฟล์อยู่แล้ว จึงไม่มีอะไรเปลี่ยน',
    });
  };

  return (
    <section className={cx('card', 'stack', styles.data)} aria-labelledby="data-title">
      <h2 id="data-title" className={styles.h2}>
        ข้อมูลของคุณ
      </h2>
      <p className="small muted">
        ความคืบหน้าเก็บอยู่ในเบราว์เซอร์นี้เท่านั้น ถ้าล้างประวัติเบราว์เซอร์ข้อมูลจะหายไปด้วย —
        บันทึกไฟล์สำรองเก็บไว้ หรือนำไฟล์ไปเปิดในเครื่องอื่นเพื่อฝึกต่อได้ (ไฟล์เดียวรวมทุกชุดตัวอักษร)
      </p>
      <div className="row">
        <button type="button" className="btn" onClick={downloadBackup}>
          บันทึกไฟล์สำรอง
        </button>
        <label className={cx('btn', styles.fileBtn)}>
          นำเข้าไฟล์สำรอง
          <input
            type="file"
            accept=".json,application/json"
            className="visually-hidden"
            onChange={(e) => void onFile(e)}
          />
        </label>
      </div>
      <p className="small muted">
        ตอนนำเข้า ระบบจะรวมกับข้อมูลในเครื่องนี้ ตัวไหนมีทั้งสองที่ จะใช้ข้อมูลที่ฝึกล่าสุด
      </p>
      {message && (
        <p className={cx('notice', message.kind === 'good' ? 'notice-good' : 'notice-bad')} role="status">
          {message.text}
        </p>
      )}
      {canReset && (
        <div className={styles.danger}>
          <button type="button" className="btn btn-sm btn-danger" onClick={onReset}>
            ล้างความคืบหน้า{packName}
          </button>
        </div>
      )}
    </section>
  );
}

export default function ReviewPage() {
  const pack = useScriptPack();
  const navigate = useNavigate();
  const now = useNow();
  const progress = useScriptProgress(pack.id);
  const weak = weakChars(pack, progress);
  const due = dueChars(pack, progress, now);
  const upcoming = nextReview(pack, progress, now);

  const counts = [0, 0, 0, 0];
  pack.chars.forEach((c) => counts[masteryLevel(progress?.[c.id])]!++);
  const total = pack.chars.length;
  const hasAny = counts[0]! < total;

  const startWeakReview = () => {
    const ids = weak.slice(0, MAX_WEAK_REVIEW).map((w) => w.entry.id);
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
          ระบบนัดให้ทบทวนตัวที่ใกล้จะลืม และจำตัวที่คุณตอบผิดบ่อยไว้ แล้วนำมาให้ฝึกซ้ำจนจำได้
        </p>
      </header>

      {hasAnswered(progress) && (
        <section className={cx('card', 'stack', styles.dueCard)} aria-labelledby="due-title">
          <div className={styles.overviewHead}>
            <h2 id="due-title" className={styles.h2}>
              ถึงรอบทบทวนวันนี้
            </h2>
            {due.length > 0 && (
              <Link to={reviewHref(pack.id, due)} className="btn btn-primary">
                เริ่มทบทวน ({Math.min(due.length, REVIEW_BATCH)} ตัว)
              </Link>
            )}
          </div>
          {due.length > 0 ? (
            <>
              <ul className={styles.dueList} aria-label={`ตัวที่ถึงรอบทบทวน ${due.length} ตัว`}>
                {due.map(({ entry }) => (
                  <li key={entry.id} className="kana" lang="ja" title={romajiLabel(entry)}>
                    {entry.char}
                  </li>
                ))}
              </ul>
              {due.length > REVIEW_BATCH && (
                <p className="small muted">
                  ถึงรอบ {due.length} ตัว — ทบทวนรอบละ {REVIEW_BATCH} ตัว (ตัวที่น่าห่วงที่สุดก่อน) แล้วกลับมาทำต่อได้
                </p>
              )}
            </>
          ) : (
            <p className="muted">
              ทบทวนครบแล้ว ✓
              {upcoming && ` รอบถัดไป ${daysFromNowLabel(upcoming.inDays)} (${upcoming.count} ตัว)`}
            </p>
          )}
          <p className="small muted">
            ตอบถูกแล้วรอบถัดไปจะห่างขึ้นเรื่อยๆ: {REVIEW_INTERVAL_DAYS.slice(1).join(' → ')} วัน ·
            ตอบผิดจะกลับมาทบทวนใหม่ทันที · ตัวหนึ่งเลื่อนขั้นได้วันละครั้ง
          </p>
        </section>
      )}

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
            ตัวที่ผิดบ่อย
          </h2>
          {weak.length > 0 && (
            <button type="button" className="btn" onClick={startWeakReview}>
              ทบทวนด้วยแบบทดสอบ ({Math.min(weak.length, MAX_WEAK_REVIEW)} ตัว)
            </button>
          )}
        </div>

        {weak.length === 0 ? (
          <div className={styles.empty}>
            <p>{hasAny ? 'ยังไม่มีตัวที่ผิดบ่อย' : 'ยังไม่มีข้อมูล — ลองทำแบบทดสอบหรือฝึกเขียนก่อนนะ'}</p>
            <div className="row" style={{ justifyContent: 'center' }}>
              <Link to={`/${pack.id}/quiz`} className="btn btn-primary">
                ทำแบบทดสอบ
              </Link>
              <Link to={`/${pack.id}/practice`} className="btn">
                ฝึกเขียน
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
                    {stat.lastWrong ? ` · ผิดล่าสุด ${relativeTime(stat.lastWrong, now)}` : ''}
                  </span>
                </span>
                <Link
                  to={`/${pack.id}/practice/${entry.id}?mode=trace`}
                  className="btn btn-sm btn-icon"
                  aria-label={`ฝึกเขียน ${entry.char}`}
                  title="ฝึกเขียน"
                >
                  <PenLine size={16} strokeWidth={1.6} aria-hidden />
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

      <DataSection packName={pack.name} canReset={hasAny} onReset={reset} />
    </div>
  );
}
