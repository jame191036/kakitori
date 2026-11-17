import { scriptPath } from '../app/paths';
import { ContinueCard } from '../components/ContinueCard';
import { HubList } from '../components/HubList';
import { levelsOf, scriptList } from '../data/scripts';
import { masteryLevel } from '../features/progress/progressLogic';
import { progressStore } from '../features/progress/progressStore';
import { useStore } from '../lib/persistentStore';
import styles from './KanaHubPage.module.css';

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

/** หมวดตัวอักษร (ชั้นที่ 2): เลือกฮิรางานะ/คาตาคานะ + บทเรียนพื้นฐาน */
export default function KanaHubPage() {
  const progress = useStore(progressStore);

  return (
    <div className="container page">
      <header className="stack" style={{ gap: 6 }}>
        <h1 className="page-title">ตัวอักษร</h1>
        <p className="muted">
          ฮิรางานะและคาตาคานะ — ตัวอักษรพื้นฐานที่ต้องอ่านและเขียนให้ได้ก่อนเรียนเรื่องอื่น
          เริ่มจากฮิรางานะก่อน แล้วค่อยต่อคาตาคานะ
        </p>
      </header>

      <ContinueCard packs={scriptList} />

      <section className="card stack" aria-labelledby="scripts-title">
        <h2 id="scripts-title" className={styles.h2}>
          เลือกชุดตัวอักษร
        </h2>
        <HubList
          items={scriptList.map((pack) => {
            const p = progress.scripts[pack.id];
            const mastered = pack.chars.filter((c) => masteryLevel(p?.[c.id]) === 3).length;
            return {
              key: pack.id,
              to: scriptPath(pack.id),
              glyph: pack.chars[0]!.char,
              glyphLang: 'ja' as const,
              title: (
                <>
                  {pack.name}{' '}
                  <span className="kana muted" lang="ja">
                    {pack.nameJa}
                  </span>
                </>
              ),
              desc: `${levelsOf(pack).length} ระดับ · ตาราง คัดตัวอักษร แบบทดสอบ ทบทวน พิมพ์แบบฝึก`,
              meta: `${pack.chars.length} ตัว · จำได้แล้ว ${mastered}`,
            };
          })}
        />
      </section>

      <section className="card stack" aria-labelledby="lessons-title">
        <h2 id="lessons-title" className={styles.h2}>
          บทเรียน
        </h2>
        <HubList
          items={[
            {
              key: 'start',
              to: '/start',
              // 始 = เริ่ม (始める hajimeru)
              glyph: '始',
              glyphLang: 'ja',
              title: 'เริ่มต้นที่นี่',
              desc: 'พื้นฐานที่ควรรู้ก่อนเริ่มเขียน — อ่านประมาณ 5 นาที',
            },
            {
              key: 'small-long',
              to: '/start#small-long',
              glyph: 'っ',
              glyphLang: 'ja',
              title: 'ตัวเล็กและเสียงยาว',
              desc: 'ตัวควบ っ และเสียงยาว พร้อมฝึกฟังแยกเสียง (ระดับ 2)',
            },
          ]}
        />
      </section>

      <section className="card stack" aria-labelledby="features-title">
        <h2 id="features-title" className={styles.h2}>
          ในหมวดนี้ฝึกอะไรได้บ้าง
        </h2>
        <dl className={styles.features}>
          {FEATURES.map(({ title, desc }) => (
            <div key={title}>
              <dt>{title}</dt>
              <dd>{desc}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
