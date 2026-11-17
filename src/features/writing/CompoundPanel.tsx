import { Volume2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { findChar } from '../../data/scripts';
import { useStrokeSet } from '../../data/useStrokes';
import type { CharEntry, ScriptPack } from '../../data/types';
import { useSpeech } from '../speech/useSpeech';
import { CharSvg } from './CharSvg';
import styles from './CompoundPanel.module.css';

interface CompoundPanelProps {
  pack: ScriptPack;
  /** ตัวควบ (มี parts) */
  entry: CharEntry;
  hrefFor: (id: string) => string;
  /** ปุ่มไปต่อ (ทดสอบแถว / ตัวถัดไป) */
  actions?: ReactNode;
}

/**
 * หน้าตัวควบ (きゃ …): ไม่มีกระดานเขียนของตัวเอง
 * - วิธีเขียน: 2 ช่องติดกันแบบกระดาษช่อง (ตัวใหญ่ + ตัวเล็ก) กดแต่ละช่องไปฝึกเขียนตัวนั้น
 * - วิธีอ่าน: อ่านรวบเป็นพยางค์เดียว + ปุ่มฟังเทียบกับการอ่านแยก 2 พยางค์ (きゃ / きや)
 */
export function CompoundPanel({ pack, entry, hrefFor, actions }: CompoundPanelProps) {
  const strokes = useStrokeSet(pack);
  const { available: audioOk, speak } = useSpeech();
  const parts = (entry.parts ?? []).map((ch) => findChar(pack, ch)).filter((c): c is CharEntry => !!c);
  const [head, small] = parts;
  // ตัวใหญ่ของตัวเล็ก (small-ya → ya) ใช้ทำคำเทียบ "อ่านแยก 2 พยางค์" เช่น きや
  const big = small ? findChar(pack, small.id.replace(/^small-/, '')) : undefined;
  const split = head && big ? head.char + big.char : undefined;

  return (
    <div className={styles.panel}>
      <section className={styles.block} aria-labelledby="compound-write">
        <h2 id="compound-write" className={styles.label}>
          วิธีเขียน · 2 ช่อง
        </h2>
        <div className={styles.cells}>
          {parts.map((p, i) => {
            const data = strokes.chars[p.char];
            return (
              <Link key={p.id} to={hrefFor(p.id)} className={styles.cell} aria-label={`ฝึกเขียน ${p.char}`}>
                <span className={styles.pad}>
                  {data && <CharSvg data={data} numbers grid label={p.char} />}
                </span>
                <span className={styles.caption}>
                  <span>
                    {p.romaji}
                    {i > 0 && <span className="muted"> ตัวเล็ก</span>}
                  </span>
                  <span className={styles.go}>ฝึกเขียน →</span>
                </span>
              </Link>
            );
          })}
        </div>
        <p className={styles.note}>
          ตัวเล็กเขียนให้เล็กกว่าปกติและค่อนลงด้านล่างของช่อง · แต่ละตัวใช้ช่องของตัวเอง
        </p>
      </section>

      <section className={styles.block} aria-labelledby="compound-read">
        <h2 id="compound-read" className={styles.label}>
          วิธีอ่าน · 1 พยางค์
        </h2>
        <p className={styles.reading}>
          <span className="kana" lang="ja">
            {entry.char}
          </span>
          <strong>{entry.romaji}</strong>
          <span className="muted">{entry.thai}</span>
        </p>
        {head && small && (
          <p className={styles.explain}>
            {head.romaji} + {small.romaji} อ่านรวบเป็นเสียงเดียว <strong>{entry.romaji}</strong>
            {split && (
              <>
                {' '}
                — ถ้าเป็นตัวใหญ่ <span className="kana">{split}</span> จะอ่านแยก 2 พยางค์ ({head.romaji}-{big!.romaji})
              </>
            )}
          </p>
        )}
        {audioOk && split && (
          <div className={styles.compare} role="group" aria-label="ฟังเทียบ">
            <button type="button" className="btn btn-sm" onClick={() => speak(entry.char)}>
              <Volume2 size={16} strokeWidth={1.6} aria-hidden />
              <span className="kana">{entry.char}</span> {entry.romaji}
            </button>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => speak(split)}>
              <Volume2 size={16} strokeWidth={1.6} aria-hidden />
              <span className="kana">{split}</span> {head!.romaji}-{big!.romaji}
            </button>
          </div>
        )}
      </section>

      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
}
