import { ArrowRight, ClipboardCheck, Eye, PenTool, Printer, Target, WifiOff, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router';
import { SITE_NAME } from '../app/config';
import { ContinueCard } from '../components/ContinueCard';
import { TodayCard } from '../components/TodayCard';
import { findChar, scriptList } from '../data/scripts';
import { useStrokeData } from '../data/useStrokes';
import { masteryLevel } from '../features/progress/progressLogic';
import { progressStore } from '../features/progress/progressStore';
import { useStore } from '../lib/persistentStore';
import { StrokeAnimator } from '../features/writing/StrokeAnimator';
import styles from './HomePage.module.css';

const FEATURES: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: Eye, title: 'ดูลำดับขีด', desc: 'แอนิเมชันการเขียนทีละขีด พร้อมเลขกำกับลำดับและทิศทาง' },
  { icon: PenTool, title: 'ตรวจลายมือทีละขีด', desc: 'เขียนด้วยนิ้ว ปากกา หรือเมาส์ ระบบบอกทันทีว่าผิดลำดับหรือผิดทิศ' },
  {
    icon: ClipboardCheck,
    title: 'แบบทดสอบ 5 แบบ',
    desc: 'เลือกคำอ่าน เลือกตัวอักษร ฟังเสียง เขียนตอบ และจับคู่ฮิรางานะ–คาตาคานะ',
  },
  { icon: Target, title: 'ทบทวนตัวที่ผิดบ่อย', desc: 'ระบบจำตัวที่คุณยังไม่แม่น แล้วนำมาถามซ้ำบ่อยขึ้น' },
  { icon: Printer, title: 'พิมพ์แบบฝึกคัด', desc: 'สร้างกระดาษคัดลายมือ A4 พร้อมตัวจางให้เขียนทับ' },
  { icon: WifiOff, title: 'ใช้ออฟไลน์ได้', desc: 'ติดตั้งลงหน้าจอมือถือ แล้วฝึกได้แม้ไม่มีอินเทอร์เน็ต' },
];

export default function HomePage() {
  const first = scriptList[0]!;
  // แอนิเมชันหน้าแรกใช้ か (ka) ให้ตรงกับโลโก้ kakitori
  const heroChar = (findChar(first, 'ka') ?? first.chars[0]!).char;
  const heroData = useStrokeData(first, heroChar)!;
  const progress = useStore(progressStore);
  const hasProgress = Object.values(progress.scripts).some((s) => Object.keys(s).length > 0);

  return (
    <div className="container page">
      <section className={styles.hero}>
        <div className={styles.heroText}>
          <p className={styles.eyebrow}>{SITE_NAME}</p>
          <h1 className={styles.title}>
            ฝึกคัดตัวอักษรญี่ปุ่น
            <br />
            ทีละขีด ให้ถูกตั้งแต่แรก
          </h1>
          <p className="muted">
            ฮิรางานะและคาตาคานะ ดูลำดับขีด เขียนทับ ให้ระบบตรวจลายมือ แล้วทดสอบความจำ — ใช้ได้ทันที ฟรี
            ไม่ต้องสมัครสมาชิก
          </p>
          <div className="row">
            {/* ผู้ใช้ใหม่: ชวนอ่านพื้นฐานก่อน / ผู้ใช้เดิม: ปุ่มหลักอยู่ในการ์ด "เรียนต่อ" ด้านล่าง */}
            <Link to="/start" className={hasProgress ? 'btn' : 'btn btn-primary'}>
              {hasProgress ? 'พื้นฐานสำหรับมือใหม่' : 'เริ่มต้นที่นี่'} <ArrowRight size={18} aria-hidden />
            </Link>
            <Link to={`/${first.id}`} className="btn">
              ดูตารางตัวอักษร
            </Link>
          </div>
        </div>
        <div className={styles.heroArt}>
          <StrokeAnimator
            data={heroData}
            speed={1}
            showNumbers
            controls={false}
            label={`ตัวอย่างลำดับขีดของ ${heroChar} (แตะเพื่อเล่นซ้ำ)`}
          />
        </div>
      </section>

      <TodayCard packs={scriptList} />
      <ContinueCard packs={scriptList} />

      <section className="stack">
        <h2 className={styles.h2}>เลือกชุดตัวอักษร</h2>
        <div className={styles.scripts}>
          {scriptList.map((pack) => {
            const p = progress.scripts[pack.id];
            const mastered = pack.chars.filter((c) => masteryLevel(p?.[c.id]) === 3).length;
            return (
              <Link key={pack.id} to={`/${pack.id}`} className={`card ${styles.scriptCard}`}>
                <span className={`kana ${styles.scriptGlyph}`}>{pack.chars[0]!.char}</span>
                <span className={styles.scriptText}>
                  <strong>
                    {pack.name} <span className="kana muted">{pack.nameJa}</span>
                  </strong>
                  <span className="small muted">
                    {pack.chars.length} ตัว · จำได้แล้ว {mastered} ตัว
                  </span>
                </span>
                <ArrowRight size={20} aria-hidden className="muted" />
              </Link>
            );
          })}
        </div>
      </section>

      <section className="stack">
        <h2 className={styles.h2}>มีอะไรให้ฝึกบ้าง</h2>
        <div className={styles.features}>
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className={styles.feature}>
              <span className={styles.featureIcon}>
                <Icon size={20} aria-hidden />
              </span>
              <span>
                <strong>{title}</strong>
                <span className="small muted" style={{ display: 'block' }}>
                  {desc}
                </span>
              </span>
            </div>
          ))}
        </div>
      </section>

      <p className={`small muted ${styles.privacy}`}>
        🔒 เว็บนี้ไม่มีระบบสมาชิกและไม่ส่งข้อมูลของคุณไปที่ไหน ความคืบหน้าถูกจำไว้ในเบราว์เซอร์ของเครื่องนี้เท่านั้น
      </p>
    </div>
  );
}
