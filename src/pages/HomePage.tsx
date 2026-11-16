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

const FEATURES: { title: string; desc: string }[] = [
  { title: 'ดูลำดับขีด', desc: 'แอนิเมชันการเขียนทีละขีด พร้อมเลขกำกับลำดับและทิศทาง' },
  { title: 'ตรวจลายมือทีละขีด', desc: 'เขียนด้วยนิ้ว ปากกา หรือเมาส์ ระบบบอกทันทีว่าผิดลำดับหรือผิดทิศ' },
  {
    title: 'แบบทดสอบ 5 แบบ',
    desc: 'เลือกคำอ่าน เลือกตัวอักษร ฟังเสียง เขียนตอบ และจับคู่ฮิรางานะ–คาตาคานะ',
  },
  { title: 'ทบทวนตามรอบ', desc: 'ระบบนัดทบทวนตัวที่ใกล้จะลืม และนำตัวที่ผิดบ่อยมาถามซ้ำ' },
  { title: 'พิมพ์แบบฝึกคัด', desc: 'สร้างกระดาษคัดลายมือ A4 พร้อมตัวจางให้เขียนทับ' },
  { title: 'ใช้ออฟไลน์ได้', desc: 'ติดตั้งลงหน้าจอมือถือ แล้วฝึกได้แม้ไม่มีอินเทอร์เน็ต' },
];

export default function HomePage() {
  const first = scriptList[0]!;
  // แอนิเมชันหน้าแรกใช้ か (ka) ให้ตรงกับโลโก้ kakitori
  const hero = findChar(first, 'ka') ?? first.chars[0]!;
  const heroData = useStrokeData(first, hero.char)!;
  const progress = useStore(progressStore);
  const hasProgress = Object.values(progress.scripts).some((s) => Object.keys(s).length > 0);

  return (
    <div className="container page">
      {/* หน้าปกสมุด: ชื่อ คำอธิบายสั้น และตัวอย่างช่องคัด */}
      <section className={styles.hero}>
        <div className={styles.heroText}>
          <p className={styles.eyebrow}>
            {SITE_NAME}
            <span className="kana" lang="ja">
              書き取り
            </span>
          </p>
          <h1 className={styles.title}>
            ฝึกคัดตัวอักษรญี่ปุ่น
            <br />
            ทีละขีด ให้ถูกตั้งแต่แรก
          </h1>
          <p className={styles.lead}>
            ฮิรางานะและคาตาคานะ ดูลำดับขีด เขียนทับ ให้ระบบตรวจลายมือ แล้วทดสอบความจำ — ใช้ได้ทันที ฟรี
            ไม่ต้องสมัครสมาชิก
          </p>
          <div className={styles.actions}>
            {/* ผู้ใช้ใหม่: ชวนอ่านพื้นฐานก่อน / ผู้ใช้เดิม: ปุ่มหลักอยู่ในส่วน "เรียนต่อ" ด้านล่าง */}
            <Link to="/start" className={hasProgress ? 'btn' : 'btn btn-primary'}>
              {hasProgress ? 'พื้นฐานสำหรับมือใหม่' : 'เริ่มต้นที่นี่'}
            </Link>
            <Link to={`/${first.id}`} className={styles.textLink}>
              ดูตารางตัวอักษร →
            </Link>
          </div>
        </div>
        <figure className={styles.heroArt}>
          <StrokeAnimator
            data={heroData}
            speed={1}
            showNumbers
            controls={false}
            label={`ตัวอย่างลำดับขีดของ ${hero.char} (แตะเพื่อเล่นซ้ำ)`}
          />
          <figcaption className={styles.caption}>
            <span className="kana" lang="ja">
              {hero.char}
            </span>{' '}
            {hero.romaji} · {heroData.strokes.length} ขีด — แตะเพื่อดูอีกครั้ง
          </figcaption>
        </figure>
      </section>

      {/* "วันนี้" กับ "เรียนต่อ" เป็นเรื่องเดียวกัน จึงวางชิดกันกว่าส่วนอื่น */}
      <div className={styles.daily}>
        <TodayCard packs={scriptList} />
        <ContinueCard packs={scriptList} />
      </div>

      {/* สารบัญ: เลือกชุดตัวอักษร */}
      <section className="card stack">
        <h2 className={styles.h2}>ชุดตัวอักษร</h2>
        <ul className={styles.toc}>
          {scriptList.map((pack) => {
            const p = progress.scripts[pack.id];
            const mastered = pack.chars.filter((c) => masteryLevel(p?.[c.id]) === 3).length;
            return (
              <li key={pack.id}>
                <Link to={`/${pack.id}`} className={styles.tocRow}>
                  <span className={`kana ${styles.tocGlyph}`} lang="ja">
                    {pack.chars[0]!.char}
                  </span>
                  <span className={styles.tocName}>
                    <strong>{pack.name}</strong>{' '}
                    <span className="kana muted" lang="ja">
                      {pack.nameJa}
                    </span>
                  </span>
                  <span className={styles.leader} aria-hidden />
                  <span className={styles.tocMeta}>
                    {pack.chars.length} ตัว · จำได้แล้ว {mastered}
                  </span>
                  <span className={styles.arrow} aria-hidden>
                    →
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="card stack">
        <h2 className={styles.h2}>มีอะไรให้ฝึกบ้าง</h2>
        <dl className={styles.features}>
          {FEATURES.map(({ title, desc }) => (
            <div key={title}>
              <dt>{title}</dt>
              <dd>{desc}</dd>
            </div>
          ))}
        </dl>
      </section>

      <p className={`small muted ${styles.privacy}`}>
        เว็บนี้ไม่มีระบบสมาชิกและไม่ส่งข้อมูลของคุณไปที่ไหน ความคืบหน้าถูกจำไว้ในเบราว์เซอร์ของเครื่องนี้เท่านั้น
      </p>
    </div>
  );
}
