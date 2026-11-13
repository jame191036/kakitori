import { ClipboardCheck, PenLine, Printer, Target, type LucideIcon } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router';
import { useScriptPack } from '../app/ScriptContext';
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

  const actions: { to: string; icon: LucideIcon; title: string; desc: string }[] = [
    {
      to: `/${pack.id}/practice`,
      icon: PenLine,
      title: 'คัดตัวอักษร',
      desc: 'ดูลำดับขีด เขียนทับ ตรวจทีละขีด และเขียนอิสระ',
    },
    {
      to: `/${pack.id}/quiz`,
      icon: ClipboardCheck,
      title: 'แบบทดสอบ',
      desc: 'เลือกคำอ่าน เลือกตัวอักษร ฟังเสียง และเขียนตอบ',
    },
    {
      to: `/${pack.id}/review`,
      icon: Target,
      title: 'ทบทวน',
      desc: 'ฝึกซ้ำเฉพาะตัวที่ผิดบ่อยจนจำได้',
    },
    {
      to: `/${pack.id}/worksheet`,
      icon: Printer,
      title: 'พิมพ์แบบฝึก',
      desc: 'สร้างกระดาษคัดลายมือ A4 สำหรับเขียนด้วยมือ',
    },
  ];

  return (
    <div className="container page">
      <header className={styles.hero}>
        <h1 className="page-title">
          {pack.name} <span className="kana">{pack.nameJa}</span>
        </h1>
        <p className="muted">{pack.description}</p>
      </header>

      <ContinueCard packs={packs} />

      <nav className={styles.actions} aria-label="เมนูการเรียน">
        {actions.map(({ to, icon: Icon, title, desc }) => (
          <Link key={to} to={to} className={`card ${styles.action}`}>
            <span className={styles.actionIcon}>
              <Icon size={22} aria-hidden />
            </span>
            <span>
              <strong>{title}</strong>
              <span className="small muted" style={{ display: 'block' }}>
                {desc}
              </span>
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
        <KanaTable pack={pack} progress={progress} hrefFor={(c) => `/${pack.id}/practice/${c.id}`} />
        <MasteryLegend />
      </section>
    </div>
  );
}
