import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { SpeakButton } from '../../components/SpeakButton';
import { conjugate } from '../../data/conj/conjugate';
import type { ConjRule } from '../../data/conj/types';
import { verbById } from '../../data/conj/verbs';
import { cx } from '../../lib/cx';
import g from '../grammar/grammar.module.css';
import { Change, FormText } from './ConjText';
import styles from './conj.module.css';

interface ConjCardsProps {
  items: readonly ConjRule[];
  /** ดูครบทุกกฎแล้วกด "ไปฝึก" */
  onDone: () => void;
}

/** กฎที่ใช้ได้กับทุกคำ (ไม่แสดงรายการคำ — ยาวเกินไป) */
const MAX_LIST = 45;

/** แถวตัวอย่าง: คำ → รูปที่ผัน (กฎแยกกลุ่ม = คำ + กลุ่ม) */
function Example({ rule, id }: { rule: ConjRule; id: string }) {
  const v = verbById(id);
  const form = rule.form && conjugate(v, rule.form);
  return (
    <li className={g.example}>
      <span className={styles.exWord}>
        {form ? (
          <Change from={v.kana} to={form} className={styles.exJa} />
        ) : (
          <>
            <FormText prefix={v.prefix} text={v.kana} className={styles.exJa} />
            <span className={styles.groupTag}>กลุ่ม {v.group}</span>
          </>
        )}
      </span>
      <span className={g.exThai}>
        {v.kanji && (
          <span className="kana" lang="ja">
            {v.kanji}{' '}
          </span>
        )}
        {v.thai}
      </span>
      <SpeakButton text={form ? `${v.kana}、${form}` : v.kana} size="sm" label="ฟังคำนี้" />
    </li>
  );
}

/**
 * ขั้น "เรียน" ของบทผันคำ: การ์ดทีละกฎ — หัวกฎ คำอธิบาย ตัวอย่าง (เน้นส่วนที่เปลี่ยน)
 * และรายการคำทั้งหมดที่ใช้กฎนี้ (กดเปิดดู)
 */
export function ConjCards({ items, onDone }: ConjCardsProps) {
  const [index, setIndex] = useState(0);
  const rule = items[index]!;
  const last = index === items.length - 1;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(items.length - 1, i + 1));
      else if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [items.length]);

  const listed = rule.words.length > rule.examples.length && rule.words.length <= MAX_LIST;

  return (
    <div className={g.learn}>
      <section className={cx('card', g.card)} aria-live="polite" aria-label={`กฎข้อที่ ${index + 1} จาก ${items.length}`}>
        <div className={g.cardTop}>
          <span className={g.counter}>
            {index + 1} / {items.length}
          </span>
          <span className="small muted">ใช้กับ {rule.words.length} คำ</span>
        </div>

        <div key={rule.id} className={g.cardBody}>
          <div>
            <p className={cx('kana', g.pattern)} lang="ja">
              {rule.pattern}
            </p>
            <p className={g.title}>{rule.title}</p>
          </div>

          <div className={g.explain}>
            {rule.explain.map((t) => (
              <p key={t}>{t}</p>
            ))}
          </div>

          <p className={g.examplesHead}>ตัวอย่าง</p>
          <ul className={g.examples}>
            {rule.examples.map((id) => (
              <Example key={id} rule={rule} id={id} />
            ))}
          </ul>

          {rule.note && <p className={g.note}>{rule.note}</p>}

          {listed && (
            <details className={styles.allWords}>
              <summary>คำทั้งหมดที่ใช้กฎนี้ ({rule.words.length} คำ)</summary>
              <ul className={styles.wordList}>
                {rule.words.map((id) => {
                  const v = verbById(id);
                  return (
                    <li key={id}>
                      <span className={cx('kana', styles.form)} lang="ja">
                        {v.kana}
                        {rule.form && ` → ${conjugate(v, rule.form)}`}
                      </span>
                      <span className={styles.wordThai}>{v.thai}</span>
                    </li>
                  );
                })}
              </ul>
            </details>
          )}
        </div>

        <div className={g.cardNav}>
          <button
            type="button"
            className="btn"
            onClick={() => setIndex((i) => i - 1)}
            disabled={index === 0}
            aria-label="ข้อก่อนหน้า"
          >
            <ArrowLeft size={18} strokeWidth={1.8} aria-hidden />
          </button>
          <ol className={g.dots} aria-hidden>
            {items.map((x, i) => (
              <li key={x.id} className={cx(i === index && g.dotOn, i < index && g.dotSeen)} />
            ))}
          </ol>
          {last ? (
            <button type="button" className="btn btn-primary" onClick={onDone}>
              ไปฝึก
              <ArrowRight size={18} strokeWidth={2} aria-hidden />
            </button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={() => setIndex((i) => i + 1)}>
              ข้อถัดไป
              <ArrowRight size={18} strokeWidth={2} aria-hidden />
            </button>
          )}
        </div>
      </section>

      {/* ภาพรวมกฎในบท: กดเพื่อไปที่การ์ดนั้น */}
      <ul className={g.list} aria-label="กฎในบทนี้">
        {items.map((x, i) => (
          <li key={x.id}>
            <button
              type="button"
              className={cx(g.chip, i === index && g.chipOn)}
              onClick={() => setIndex(i)}
              aria-current={i === index ? 'true' : undefined}
            >
              <span className={cx('kana', g.chipPattern)} lang="ja">
                {x.pattern}
              </span>
              <span className={g.chipThai}>{x.title}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
