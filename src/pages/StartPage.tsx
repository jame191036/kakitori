import { useEffect } from 'react';
import { Link } from 'react-router';
import { ContinueCard } from '../components/ContinueCard';
import { SpeakButton } from '../components/SpeakButton';
import { scriptList } from '../data/scripts';
import { updateSettings } from '../features/settings/settings';
import { cx } from '../lib/cx';
import styles from './StartPage.module.css';

/**
 * หน้า "เริ่มต้นที่นี่" — พื้นฐานสำหรับคนที่ไม่รู้ภาษาญี่ปุ่นเลย
 * ⚠️ เนื้อหาภาษาญี่ปุ่นในหน้านี้ควรให้ผู้รู้ภาษาญี่ปุ่นตรวจก่อนเปิดใช้จริง
 */

type Kind = 'kanji' | 'hira' | 'kata';

// 私はタイのコーヒーが好きです — ฉันชอบกาแฟไทย
const SENTENCE: [string, Kind][] = [
  ['私', 'kanji'],
  ['は', 'hira'],
  ['タイ', 'kata'],
  ['の', 'hira'],
  ['コーヒー', 'kata'],
  ['が', 'hira'],
  ['好', 'kanji'],
  ['きです', 'hira'],
];

const KIND_LABEL: Record<Kind, string> = { hira: 'ฮิรางานะ', kata: 'คาตาคานะ', kanji: 'คันจิ' };

const TABLE: [string, string[], string[]][] = [
  ['', ['a', 'i', 'u', 'e', 'o'], []],
  ['–', ['あ', 'い', 'う', 'え', 'お'], ['a', 'i', 'u', 'e', 'o']],
  ['k', ['か', 'き', 'く', 'け', 'こ'], ['ka', 'ki', 'ku', 'ke', 'ko']],
  ['s', ['さ', 'し', 'す', 'せ', 'そ'], ['sa', 'shi', 'su', 'se', 'so']],
];

export default function StartPage() {
  useEffect(() => {
    updateSettings({ introSeen: true });
  }, []);

  return (
    <div className={`container page ${styles.page}`}>
      <header className="stack" style={{ gap: 6 }}>
        <h1 className="page-title">เริ่มต้นที่นี่</h1>
        <p className="muted">พื้นฐานที่ควรรู้ก่อนเริ่มเขียน — ใช้เวลาอ่านประมาณ 5 นาที ไม่ต้องรู้ภาษาญี่ปุ่นมาก่อน</p>
      </header>

      <section className="card stack">
        <h2 className={styles.h2}>1. ภาษาญี่ปุ่นใช้ตัวอักษร 3 แบบ</h2>
        <ul className={styles.list}>
          <li>
            <strong>ฮิรางานะ</strong> <span className="kana">ひらがな</span> — ตัวอักษรพื้นฐาน เส้นโค้งมน
            ใช้เขียนคำญี่ปุ่นทั่วไป คำช่วย และส่วนท้ายของคำกริยา
          </li>
          <li>
            <strong>คาตาคานะ</strong> <span className="kana">カタカナ</span> — เสียงเหมือนฮิรางานะทุกตัว
            แต่เส้นตรงและเป็นมุม ใช้เขียนคำที่มาจากภาษาอื่นและชื่อต่างชาติ เช่น <span className="kana">タイ</span>{' '}
            (tai = ประเทศไทย)
          </li>
          <li>
            <strong>คันจิ</strong> <span lang="ja">漢字</span> — ตัวอักษรที่มาจากภาษาจีน แต่ละตัวมีความหมายในตัว
            มีหลายพันตัว (ยังไม่มีในเว็บนี้)
          </li>
        </ul>
        <div className={styles.sentenceBox}>
          <p className="small muted">ในประโยคเดียวมักใช้ทั้ง 3 แบบปนกัน:</p>
          <p className={styles.sentence} lang="ja">
            {SENTENCE.map(([text, kind], i) => (
              <span key={i} className={cx(styles.seg, styles[kind])} title={KIND_LABEL[kind]}>
                {text}
              </span>
            ))}
            <SpeakButton text={SENTENCE.map(([t]) => t).join('')} label="ฟังประโยคตัวอย่าง" size="sm" />
          </p>
          <p>
            watashi wa tai no koohii ga suki desu — <strong>ฉันชอบกาแฟไทย</strong>
          </p>
          <p className={styles.legend}>
            {(['hira', 'kata', 'kanji'] as Kind[]).map((k) => (
              <span key={k} className={cx(styles.seg, styles[k])}>
                {KIND_LABEL[k]}
              </span>
            ))}
          </p>
          <p className="small muted">
            หมายเหตุ: <span className="kana">は</span> ในประโยคนี้อ่านว่า “wa” เพราะทำหน้าที่เป็นคำช่วย
          </p>
        </div>
      </section>

      <section className="card stack">
        <h2 className={styles.h2}>2. เริ่มจากฮิรางานะ แล้วต่อด้วยคาตาคานะ</h2>
        <p>
          เด็กญี่ปุ่นก็เริ่มเรียนจากฮิรางานะ ทั้งสองชุดมีตัวพื้นฐาน 46 ตัวที่<strong>เสียงตรงกันทีละคู่</strong> เช่น{' '}
          <span className="kana">あ</span> = <span className="kana">ア</span> = a — พอเรียนฮิรางานะครบ
          การเรียนคาตาคานะจะเร็วขึ้นมาก เพราะเสียงเหมือนเดิม แค่จำรูปใหม่
        </p>
      </section>

      <section className="card stack">
        <h2 className={styles.h2}>3. อ่านตารางตัวอักษรยังไง</h2>
        <p>
          ตัวอักษรเรียงเป็นตาราง: <strong>แต่ละแถว</strong>ขึ้นต้นด้วยพยัญชนะเดียวกัน <strong>แต่ละคอลัมน์</strong>
          เป็นสระเดียวกัน (a i u e o) — จำสระ 5 ตัวได้ ก็เดาเสียงส่วนใหญ่ได้แล้ว
        </p>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <tbody>
              {TABLE.map(([consonant, cells, romaji], r) => (
                <tr key={r}>
                  <th scope="row">{consonant}</th>
                  {cells.map((c, i) =>
                    r === 0 ? (
                      <th key={i} scope="col">
                        {c}
                      </th>
                    ) : (
                      <td key={i}>
                        <span className="kana" lang="ja">
                          {c}
                        </span>
                        <span className={cx(styles.romaji, romaji[i]!.length > 2 && styles.irregular)}>
                          {romaji[i]}
                        </span>
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="small">
          <strong>ข้อยกเว้นที่ต้องจำ:</strong> <span className="kana">し</span> = shi, <span className="kana">ち</span> =
          chi, <span className="kana">つ</span> = tsu, <span className="kana">ふ</span> = fu,{' '}
          <span className="kana">ん</span> = n (ตัวสะกด)
        </p>
        <p className="small muted">
          คำอ่านภาษาไทยในเว็บเป็นเสียงโดยประมาณ ฟังเสียงจริงได้จากปุ่มลำโพง (ถ้าเครื่องรองรับ)
        </p>
      </section>

      <section className="card stack">
        <h2 className={styles.h2}>4. เครื่องหมายเล็กๆ ที่มุมขวาบน</h2>
        <ul className={styles.list}>
          <li>
            <strong>ตัวขุ่น ゛</strong> (ขีดเล็ก 2 ขีด) ทำให้เสียงเปลี่ยน เช่น{' '}
            <span className="kana">か</span> ka → <span className="kana">が</span> ga,{' '}
            <span className="kana">さ</span> sa → <span className="kana">ざ</span> za,{' '}
            <span className="kana">た</span> ta → <span className="kana">だ</span> da,{' '}
            <span className="kana">は</span> ha → <span className="kana">ば</span> ba
          </li>
          <li>
            <strong>ตัวครึ่งขุ่น ゜</strong> (วงกลมเล็ก) ใช้กับแถว <span className="kana">は</span> เท่านั้น เช่น{' '}
            <span className="kana">は</span> ha → <span className="kana">ぱ</span> pa
          </li>
        </ul>
      </section>

      <section className="card stack">
        <h2 className={styles.h2}>5. ทำไมต้องเขียนตามลำดับขีด</h2>
        <ul className={styles.list}>
          <li>ตัวอักษรจะได้สัดส่วนสวยและอ่านง่าย เขียนได้เร็วและเป็นธรรมชาติ</li>
          <li>เป็นพื้นฐานสำคัญถ้าจะเรียนคันจิต่อในอนาคต</li>
          <li>
            หลักทั่วไป: เขียน<strong>จากบนลงล่าง</strong> และ<strong>จากซ้ายไปขวา</strong> — บางตัวมีข้อยกเว้น
            ดูได้จากแอนิเมชันในหน้าคัดตัวอักษร
          </li>
          <li>
            <strong>ทิศทางของขีดก็สำคัญ</strong> เช่น <span className="kana">シ</span> (shi) กับ{' '}
            <span className="kana">ツ</span> (tsu) หน้าตาคล้ายกันมาก แต่ขีดยาวลากคนละทิศ
          </li>
        </ul>
      </section>

      <section className="card stack">
        <h2 className={styles.h2}>
          6. เครื่องหมายเสียงยาว <span className="kana">ー</span> (ในคาตาคานะ)
        </h2>
        <p>
          ขีด <span className="kana">ー</span> ทำให้สระของตัวก่อนหน้าลากเสียงยาว เช่น <span className="kana">ケーキ</span> (keeki = เค้ก),{' '}
          <span className="kana">ノート</span> (nooto = สมุด) — ในเว็บนี้โรมาจิจะเขียนเป็นสระซ้ำ
        </p>
      </section>

      <section className="card stack">
        <h2 className={styles.h2}>7. วิธีเรียนในเว็บนี้ (แนะนำ)</h2>
        <p>เรียนทีละแถว โดยแต่ละแถวทำตามนี้:</p>
        <ol className={styles.list}>
          <li>
            <strong>ดูลำดับขีด</strong> — ดูแอนิเมชันว่าเขียนขีดไหนก่อนหลัง
          </li>
          <li>
            <strong>เขียนทับ</strong> — ลากตามเส้นจาง ระบบตรวจทุกขีด
          </li>
          <li>
            <strong>ตรวจทีละขีด</strong> — เขียนเองโดยไม่มีเส้นนำ
          </li>
          <li>
            <strong>เขียนอิสระ</strong> (ไม่บังคับ) — ลองเขียนทั้งตัวจากความจำแล้วดูคะแนน
          </li>
          <li>
            <strong>ทดสอบแถว</strong> — ตอบให้ถูกครบทุกตัว แล้วไปแถวถัดไป
          </li>
        </ol>
        <p className="small muted">
          ปุ่ม “เรียนต่อ” จะพาไปขั้นถัดไปให้เอง และหน้า “ทบทวน” จะรวมตัวที่ผิดบ่อยมาให้ฝึกซ้ำ
        </p>
      </section>

      <ContinueCard packs={scriptList} />

      <p className="small muted" style={{ textAlign: 'center' }}>
        อยากดูตัวอักษรทั้งหมดก่อน? <Link to={`/${scriptList[0]!.id}`}>ดูตาราง{scriptList[0]!.name}</Link>
      </p>
    </div>
  );
}
