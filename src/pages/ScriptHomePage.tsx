import { useMemo } from 'react';
import { Link } from 'react-router';
import { scriptPath } from '../app/paths';
import { useScriptPack } from '../app/ScriptContext';
import { getScript } from '../data/scripts';
import { ContinueCard } from '../components/ContinueCard';
import { KanaTable, MasteryLegend } from '../components/KanaTable';
import { masteryLevel } from '../features/progress/progressLogic';
import { useScriptProgress } from '../features/progress/progressStore';
import styles from './ScriptHomePage.module.css';

export default function ScriptHomePage() {
  const pack = useScriptPack();
  const progress = useScriptProgress(pack.id);
  // เส้นทาง "เรียนต่อ" เฉพาะชุดนี้ (หน้าแรกใช้เส้นทางรวม ฮิรางานะ → คาตาคานะ)
  const packs = useMemo(() => [pack], [pack]);
  const mastered = pack.chars.filter((c) => masteryLevel(progress?.[c.id]) === 3).length;

  const actions: { to: string; title: string; desc: string }[] = [
    {
      to: scriptPath(pack.id, `practice`),
      title: 'คัดตัวอักษร',
      desc: 'ดูลำดับขีด เขียนทับ ตรวจทีละขีด และเขียนอิสระ',
    },
    {
      to: scriptPath(pack.id, `quiz`),
      title: 'แบบทดสอบ',
      desc: 'เลือกคำอ่าน เลือกตัวอักษร ฟังเสียง และเขียนตอบ',
    },
    {
      to: scriptPath(pack.id, `review`),
      title: 'ทบทวน',
      desc: 'ทบทวนตัวที่ถึงรอบและตัวที่ผิดบ่อย สำรองความคืบหน้าเป็นไฟล์',
    },
    {
      to: scriptPath(pack.id, `worksheet`),
      title: 'พิมพ์แบบฝึก',
      desc: 'สร้างกระดาษคัดลายมือ A4 สำหรับเขียนด้วยมือ',
    },
  ];

  return (
    <div className="container page">
      <header className={styles.hero}>
        <h1 className="page-title">
          {pack.name}{' '}
          <span className="kana" lang="ja">
            {pack.nameJa}
          </span>
        </h1>
        <p className="muted">{pack.description}</p>
        {/* สลับไปอีกชุด (ปุ่ม ひらがな/カタカナ บนหัวเว็บเดิม ย้ายมาอยู่ที่นี่) */}
        {pack.counterpart && getScript(pack.counterpart) && (
          <p className="small">
            <Link to={scriptPath(pack.counterpart)}>
              ไปที่{getScript(pack.counterpart)!.name}{' '}
              <span className="kana" lang="ja">
                {getScript(pack.counterpart)!.nameJa}
              </span>{' '}
              →
            </Link>
          </p>
        )}
      </header>

      <ContinueCard packs={packs} />

      <nav className={styles.actions} aria-label="เมนูการเรียน">
        {actions.map(({ to, title, desc }) => (
          <Link key={to} to={to} className={styles.action}>
            <span className={styles.actionText}>
              <strong>{title}</strong>
              <span className="small muted">{desc}</span>
            </span>
            <span className={styles.arrow} aria-hidden>
              →
            </span>
          </Link>
        ))}
      </nav>

      <section className="card stack">
        <div className={styles.tableHead}>
          <h2 className={styles.h2}>ตารางตัวอักษร</h2>
          <span className="small muted">
            จำได้แล้ว {mastered}/{pack.chars.length} · กดที่ตัวอักษรเพื่อฝึกเขียน
          </span>
        </div>
        <KanaTable pack={pack} progress={progress} hrefFor={(c) => scriptPath(pack.id, `practice/${c.id}`)} />
        <MasteryLegend />
      </section>
    </div>
  );
}
