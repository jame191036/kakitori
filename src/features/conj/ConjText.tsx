import type { ConjVerb } from '../../data/conj/types';
import { cx } from '../../lib/cx';
import styles from './conj.module.css';

/** คำกริยารูปพจนานุกรม: คานะตัวใหญ่ + คันจิตัวเล็ก */
export function VerbFace({ verb, size }: { verb: ConjVerb; size: 'xl' | 'md' }) {
  return (
    <span className={cx(styles.face, styles[size])}>
      <FormText prefix={verb.prefix} text={verb.kana} className={styles.faceKana} />
      {verb.kanji && (
        <span className={cx('kana', styles.faceKanji)} lang="ja">
          {verb.kanji}
        </span>
      )}
    </span>
  );
}

/** รูปคานะ — คำนาม + する ยาว จึงตัดบรรทัดได้ตรงหลังคำนาม (ไม่ตัดกลางคำ) */
export function FormText({ prefix, text, className }: { prefix: string; text: string; className?: string }) {
  return (
    <span className={cx('kana', styles.form, className)} lang="ja">
      {prefix ? (
        <>
          {prefix}
          <wbr />
          {text.slice(prefix.length)}
        </>
      ) : (
        text
      )}
    </span>
  );
}

/** ส่วนต้นที่เหมือนกันของสองรูป (ใช้เน้นเฉพาะส่วนที่เปลี่ยน) */
function commonLength(a: string, b: string): number {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return i;
}

/** คำ → รูปที่ผัน โดยเน้นส่วนที่เปลี่ยนทั้งสองฝั่ง เช่น の[む] → の[んで] */
export function Change({ from, to, className }: { from: string; to: string; className?: string }) {
  const n = commonLength(from, to);
  return (
    <span className={cx('kana', styles.change, className)} lang="ja">
      <span className={styles.form}>
        {from.slice(0, n)}
        <span className={styles.old}>{from.slice(n)}</span>
      </span>
      <span className={styles.arrow} aria-hidden>
        →
      </span>
      <span className={styles.form}>
        {to.slice(0, n)}
        <strong className={styles.hot}>{to.slice(n)}</strong>
      </span>
    </span>
  );
}
