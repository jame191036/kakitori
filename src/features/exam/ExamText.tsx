import { Fragment, type ReactNode } from 'react';
import type { ExamSeg, PassageBlock } from '../../data/exam/text';
import { cx } from '../../lib/cx';
import styles from './exam.module.css';

interface ExamTextProps {
  segs: readonly ExamSeg[];
  /** แสดงคำอ่านเหนือคันจิ (ระหว่างสอบปิด — แบบข้อสอบจริง) */
  furigana: boolean;
  /** ช่อง <n> ในบทความ → เลขข้อจริง */
  refNo?: (ref: number) => number;
  /** ช่อง <n> ของข้อที่เปิดอยู่ (เน้นสี) */
  activeRef?: number;
  className?: string;
}

/** ข้อความข้อสอบ: ขีดเส้นใต้ · ช่องวงเล็บให้เติม · ช่องเรียงประโยค ＿ ★ · ช่องเลขข้อในบทความ */
export function ExamText({ segs, furigana, refNo, activeRef, className }: ExamTextProps) {
  const out: ReactNode[] = [];
  segs.forEach((s, i) => {
    if (s.gap === 'blank') {
      out.push(
        <span key={i} className={cx(styles.blank, s.under && styles.under)} aria-label="ช่องว่าง">
          （<span className={styles.blankIn} />）
        </span>,
      );
      return;
    }
    if (s.gap === 'slot' || s.gap === 'star') {
      out.push(
        <span key={i} className={cx(styles.slot, s.gap === 'star' && styles.star)} aria-label={s.gap === 'star' ? 'ช่องดาว' : 'ช่องว่าง'}>
          {s.gap === 'star' ? '★' : ''}
        </span>,
      );
      return;
    }
    if (s.gap === 'ref') {
      out.push(
        <span
          key={i}
          className={cx(styles.ref, s.ref === activeRef && styles.refOn)}
          aria-label={`ช่องข้อ ${refNo?.(s.ref!) ?? s.ref}`}
        >
          {refNo?.(s.ref!) ?? s.ref}
        </span>,
      );
      return;
    }
    const body =
      furigana && s.ruby ? (
        <ruby>
          {s.text}
          <rt>{s.ruby}</rt>
        </ruby>
      ) : (
        s.text
      );
    out.push(
      s.under || s.hl ? (
        <span key={i} className={cx(s.under && styles.under, s.hl && styles.hl)}>
          {body}
        </span>
      ) : (
        <Fragment key={i}>{body}</Fragment>
      ),
    );
  });
  return (
    <span className={cx('kana', styles.ja, furigana && styles.withFuri, className)} lang="ja">
      {out}
    </span>
  );
}

interface ExamPassageProps {
  blocks: readonly PassageBlock[];
  furigana: boolean;
  refNo?: (ref: number) => number;
  activeRef?: number;
}

/** บทความ / ประกาศ / ตาราง ของข้ออ่าน */
export function ExamPassage({ blocks, furigana, refNo, activeRef }: ExamPassageProps) {
  const text = (segs: Parameters<typeof ExamText>[0]['segs']) => (
    <ExamText segs={segs} furigana={furigana} refNo={refNo} activeRef={activeRef} />
  );
  const out: ReactNode[] = [];
  let rows: Extract<PassageBlock, { type: 'row' }>[] = [];
  const flushRows = (key: number) => {
    if (!rows.length) return;
    const list = rows;
    out.push(
      <div key={`t${key}`} className={styles.tableWrap}>
        <table className={styles.table}>
          <tbody>
            {list.map((r, ri) => (
              <tr key={ri}>
                {r.cells.map((c, ci) => (
                  <td key={ci}>{text(c)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>,
    );
    rows = [];
  };
  blocks.forEach((b, i) => {
    if (b.type === 'row') {
      rows.push(b);
      return;
    }
    flushRows(i);
    if (b.type === 'space') out.push(<div key={i} className={styles.space} />);
    else if (b.type === 'title')
      out.push(
        <p key={i} className={styles.passageTitle}>
          {text(b.segs)}
        </p>,
      );
    else
      out.push(
        <p key={i} className={cx(styles.passageLine, b.right && styles.right)}>
          {text(b.segs)}
        </p>,
      );
  });
  flushRows(blocks.length);
  return <div className={styles.passage}>{out}</div>;
}
