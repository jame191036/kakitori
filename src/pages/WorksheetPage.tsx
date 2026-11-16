import { useState } from 'react';
import { useScriptPack } from '../app/ScriptContext';
import { GroupSelector } from '../components/GroupSelector';
import { charsInGroups } from '../data/scripts';
import { useStrokeSet } from '../data/useStrokes';
import { CharSvg, GridGuides, VIEWBOX } from '../features/writing/CharSvg';
import { cx } from '../lib/cx';
import styles from './WorksheetPage.module.css';

const CELLS_PER_ROW = 10;

export default function WorksheetPage() {
  const pack = useScriptPack();
  const strokeSet = useStrokeSet(pack);
  const [groups, setGroups] = useState<string[]>([pack.groups[0]!.id]);
  const [traceCount, setTraceCount] = useState(4);
  const [rows, setRows] = useState(2);
  const [showOrder, setShowOrder] = useState(true);
  const [showReading, setShowReading] = useState(true);

  const chars = charsInGroups(pack, groups);
  const groupHeads = pack.groups.filter((g) => groups.includes(g.id)).map((g) => g.head);

  return (
    <div className="container page">
      <header className="stack no-print" style={{ gap: 4 }}>
        <h1 className="page-title">พิมพ์แบบฝึกคัด{pack.name}</h1>
        <p className="muted">
          เลือกแถวและรูปแบบ แล้วกดพิมพ์ (หรือเลือก “บันทึกเป็น PDF” ในหน้าต่างพิมพ์) — เหมาะกับกระดาษ A4
        </p>
      </header>

      {/* จอกว้าง: ตัวเลือก (ซ้าย ติดจอ) | ตัวอย่างกระดาษ (ขวา) — จอแคบเรียงบนลงล่าง */}
      <div className={styles.workspace}>
        <section className={cx('card no-print', styles.controls)}>
          <GroupSelector pack={pack} value={groups} onChange={setGroups} legend="แถวที่จะพิมพ์" />
          <div className={styles.options}>
            <label className={styles.field}>
              <span className="small muted">ช่องเขียนทับ (ตัวจาง)</span>
              <select value={traceCount} onChange={(e) => setTraceCount(Number(e.target.value))}>
                {[0, 1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>
                    {n === 0 ? 'ไม่มี' : `${n} ช่อง`}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span className="small muted">จำนวนแถวต่อตัว</span>
              <select value={rows} onChange={(e) => setRows(Number(e.target.value))}>
                {[1, 2, 3].map((n) => (
                  <option key={n} value={n}>
                    {n} แถว
                  </option>
                ))}
              </select>
            </label>
            <label className="chip">
              <input type="checkbox" checked={showOrder} onChange={(e) => setShowOrder(e.target.checked)} />
              แสดงลำดับขีด
            </label>
            <label className="chip">
              <input type="checkbox" checked={showReading} onChange={(e) => setShowReading(e.target.checked)} />
              แสดงคำอ่าน
            </label>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => window.print()}
              disabled={chars.length === 0}
            >
              พิมพ์ / บันทึก PDF
            </button>
          </div>
        </section>

        {chars.length === 0 ? (
          <p className="muted no-print" style={{ textAlign: 'center' }}>
            เลือกอย่างน้อย 1 แถวเพื่อดูตัวอย่างแบบฝึก
          </p>
        ) : (
          <article className={styles.sheet} aria-label="ตัวอย่างแบบฝึกคัด">
            <header className={styles.sheetHead}>
              <div>
                <h2 className={styles.sheetTitle}>
                  แบบฝึกคัด{pack.name} <span className="kana">{pack.nameJa}</span>
                </h2>
                <p className="small muted">
                  แถว <span className="kana">{groupHeads.join(' ')}</span> · {chars.length} ตัว
                </p>
              </div>
              <div className={styles.nameLines}>
                <span>ชื่อ ______________________</span>
                <span>วันที่ ______________</span>
              </div>
            </header>

            {chars.map((entry) => {
              const data = strokeSet.chars[entry.char]!;
              const n = data.strokes.length;
              return (
                <section key={entry.id} className={styles.block}>
                  <div className={styles.blockHead}>
                    <div className={styles.model}>
                      <CharSvg data={data} numbers grid label={entry.char} />
                    </div>
                    {showReading && (
                      <div className={styles.reading}>
                        <strong>{entry.romaji}</strong>
                        <span className="muted">{entry.thai}</span>
                        <span className="small muted">{n} ขีด</span>
                      </div>
                    )}
                    {showOrder && (
                      <div className={styles.order} aria-hidden>
                        {data.strokes.map((_, i) => (
                          <CharSvg key={i} data={data} upTo={i + 1} highlight={i} ghost className={styles.mini} />
                        ))}
                      </div>
                    )}
                  </div>
                  {Array.from({ length: rows }, (_, r) => (
                    <div key={r} className={styles.cells}>
                      {Array.from({ length: CELLS_PER_ROW }, (_, k) => (
                        <svg key={k} viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`} className={styles.cell} aria-hidden>
                          <GridGuides />
                          {r === 0 && k < traceCount && (
                            <g className={styles.trace}>
                              {data.strokes.map((d, i) => (
                                <path key={i} d={d} />
                              ))}
                            </g>
                          )}
                        </svg>
                      ))}
                    </div>
                  ))}
                </section>
              );
            })}

            <footer className={cx('small muted', styles.sheetFoot)}>
              ข้อมูลลำดับขีด: KanjiVG (CC BY-SA 3.0)
            </footer>
          </article>
        )}
      </div>
    </div>
  );
}
