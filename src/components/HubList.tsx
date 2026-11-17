import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { cx } from '../lib/cx';
import styles from './HubList.module.css';

export interface HubItem {
  key: string;
  /** ไม่มี = ยังไม่เปิด (แสดง "เร็วๆ นี้" และกดไม่ได้) */
  to?: string;
  glyph: string;
  /** ภาษาของ glyph (ตัวอักษรญี่ปุ่นใช้ฟอนต์คานะ) */
  glyphLang?: 'ja';
  title: ReactNode;
  desc?: ReactNode;
  /** ข้อมูลท้ายแถว เช่น "108 ตัว · จำได้แล้ว 3" */
  meta?: ReactNode;
}

/**
 * รายการแบบสารบัญหนังสือ ใช้ในหน้าศูนย์รวมทุกชั้น (หน้าแรก → ตัวอักษร → …)
 * แถวที่ยังไม่เปิดเป็นสีจาง + ป้าย "เร็วๆ นี้"
 */
export function HubList({ items }: { items: readonly HubItem[] }) {
  return (
    <ul className={styles.list}>
      {items.map((item) => {
        const body = (
          <>
            <span className={cx(styles.glyph, item.glyphLang === 'ja' && 'kana')} lang={item.glyphLang} aria-hidden>
              {item.glyph}
            </span>
            <span className={styles.text}>
              <span className={styles.title}>{item.title}</span>
              {item.desc && <span className={styles.desc}>{item.desc}</span>}
            </span>
            <span className={styles.meta}>{item.to ? item.meta : <span className={styles.soon}>เร็วๆ นี้</span>}</span>
            {item.to && (
              <span className={styles.arrow} aria-hidden>
                →
              </span>
            )}
          </>
        );
        return (
          <li key={item.key}>
            {item.to ? (
              <Link to={item.to} className={styles.row}>
                {body}
              </Link>
            ) : (
              <div className={cx(styles.row, styles.disabled)} aria-disabled="true">
                {body}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
