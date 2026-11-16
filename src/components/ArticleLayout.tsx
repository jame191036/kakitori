import { useEffect, useState, type MouseEvent, type ReactNode } from 'react';
import { cx } from '../lib/cx';
import styles from './ArticleLayout.module.css';

export interface TocItem {
  /** id ของ <section> ในบทความ */
  id: string;
  label: ReactNode;
}

interface ArticleLayoutProps {
  toc: TocItem[];
  children: ReactNode;
  className?: string;
}

/**
 * หน้าอ่านบทความ: เนื้อหาความกว้างอ่านสบาย + สารบัญติดจอด้านซ้าย (เฉพาะจอกว้าง)
 * จอแคบไม่มีสารบัญ เนื้อหาอยู่กึ่งกลางเหมือนเดิม
 */
export function ArticleLayout({ toc, children, className }: ArticleLayoutProps) {
  return (
    <div className={cx('container', styles.layout)}>
      <ArticleToc items={toc} />
      <div className={cx('page', styles.article, className)}>{children}</div>
    </div>
  );
}

/** เส้นอ้างอิงสำหรับ "หัวข้อที่กำลังอ่าน": หัวข้อสุดท้ายที่ขอบบนเลื่อนผ่านระดับนี้ (วัดจากใต้แถบด้านบน) */
const READ_LINE = 140;

function ArticleToc({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState(items[0]?.id);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const root = document.documentElement;
      // เลื่อนจนสุดหน้าแล้ว → หัวข้อสุดท้าย (หัวข้อท้ายๆ สั้นจนขอบบนไม่ถึงเส้นอ้างอิง)
      if (window.scrollY + window.innerHeight >= root.scrollHeight - 4) {
        setActive(items[items.length - 1]?.id);
        return;
      }
      let current = items[0]?.id;
      for (const { id } of items) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= READ_LINE) current = id;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(frame);
    };
  }, [items]);

  const go = (e: MouseEvent<HTMLAnchorElement>, id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    // ย้ายโฟกัสไปที่หัวข้อ (คนใช้คีย์บอร์ด/โปรแกรมอ่านหน้าจอ จะอ่านต่อจากตรงนั้น)
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
    el.focus({ preventScroll: true });
    setActive(id);
  };

  return (
    <nav className={styles.toc} aria-label="ในหน้านี้">
      <p className={styles.tocLabel}>ในหน้านี้</p>
      <ol className={styles.tocList}>
        {items.map(({ id, label }) => (
          <li key={id}>
            <a
              href={`#${id}`}
              className={cx(styles.tocLink, active === id && styles.tocActive)}
              aria-current={active === id ? 'location' : undefined}
              onClick={(e) => go(e, id)}
            >
              {label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
