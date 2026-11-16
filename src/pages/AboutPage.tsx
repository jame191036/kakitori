import { SITE_NAME, SITE_NAME_JA } from '../app/config';
import { ArticleLayout, type TocItem } from '../components/ArticleLayout';
import styles from './AboutPage.module.css';

const TOC: TocItem[] = [
  { id: 'privacy', label: 'ความเป็นส่วนตัว' },
  { id: 'install', label: 'ติดตั้งเป็นแอป' },
  { id: 'credits', label: 'เครดิตและสัญญาอนุญาต' },
];

export default function AboutPage() {
  return (
    <ArticleLayout toc={TOC}>
      <h1 className="page-title">เกี่ยวกับ {SITE_NAME}</h1>
      <p className="muted">
        ชื่อ {SITE_NAME} มาจากคำว่า <span lang="ja">{SITE_NAME_JA}</span> ในภาษาญี่ปุ่น หมายถึงแบบฝึกคัดเขียนตัวอักษร
      </p>

      <section id="privacy" className="card stack">
        <h2 className={styles.h2}>ความเป็นส่วนตัว</h2>
        <p>
          เว็บนี้ไม่มีระบบสมาชิก ไม่มีฐานข้อมูล และไม่ส่งข้อมูลการเรียนของคุณออกไปที่ไหน
          ความคืบหน้าและการตั้งค่าถูกเก็บไว้ใน <strong>localStorage ของเบราว์เซอร์เครื่องนี้เท่านั้น</strong>{' '}
          จึงไม่ซิงก์ข้ามเครื่องเอง และจะหายไปถ้าล้างข้อมูลเบราว์เซอร์ — ที่หน้า “ทบทวน”
          คุณบันทึกไฟล์สำรองเก็บไว้ นำไปเปิดในเครื่องอื่น หรือล้างข้อมูลเองได้
        </p>
        <p className="small muted">
          เสียงอ่านใช้ระบบอ่านออกเสียงที่มีอยู่ในเครื่อง/เบราว์เซอร์ของคุณ บางเบราว์เซอร์อาจใช้บริการออนไลน์ของผู้ผลิตเบราว์เซอร์เอง
        </p>
      </section>

      <section id="install" className="card stack">
        <h2 className={styles.h2}>ติดตั้งเป็นแอป (ใช้ออฟไลน์ได้)</h2>
        <ul className={styles.list}>
          <li>
            <strong>Android (Chrome):</strong> เมนู ⋮ → “ติดตั้งแอป” หรือ “เพิ่มลงในหน้าจอหลัก”
          </li>
          <li>
            <strong>iPhone / iPad (Safari):</strong> ปุ่มแชร์ → “เพิ่มไปยังหน้าจอโฮม”
          </li>
          <li>
            <strong>คอมพิวเตอร์ (Chrome / Edge):</strong> กดไอคอนติดตั้งที่ช่อง URL
          </li>
        </ul>
        <p className="small muted">
          หลังเปิดเว็บครั้งแรกขณะออนไลน์ เว็บจะเก็บไฟล์ที่จำเป็นไว้ในเครื่อง แล้วใช้งานแบบออฟไลน์ได้ทันที
        </p>
      </section>

      <section id="credits" className="card stack">
        <h2 className={styles.h2}>เครดิตและสัญญาอนุญาต</h2>
        <ul className={styles.list}>
          <li>
            ข้อมูลลำดับขีด:{' '}
            <a href="https://kanjivg.tagaini.net" target="_blank" rel="noreferrer">
              KanjiVG
            </a>{' '}
            © Ulrich Apel — สัญญาอนุญาต{' '}
            <a href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank" rel="noreferrer">
              CC BY-SA 3.0
            </a>{' '}
            (ข้อมูลที่แปลงแล้วในเว็บนี้ใช้สัญญาอนุญาตเดียวกัน)
          </li>
          <li>
            ฟอนต์:{' '}
            <a href="https://fonts.google.com/specimen/Klee+One" target="_blank" rel="noreferrer">
              Klee One
            </a>{' '}
            (Fontworks) และ{' '}
            <a href="https://fonts.google.com/noto/specimen/Noto+Sans+Thai" target="_blank" rel="noreferrer">
              Noto Sans Thai
            </a>{' '}
            (Google) — SIL Open Font License
          </li>
          <li>
            ไอคอน:{' '}
            <a href="https://lucide.dev" target="_blank" rel="noreferrer">
              Lucide
            </a>{' '}
            — ISC License
          </li>
        </ul>
      </section>
    </ArticleLayout>
  );
}
