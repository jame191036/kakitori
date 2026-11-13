import { describe, expect, it } from 'vitest';
import { dist, polylineLength, resample, type Point } from './geometry';
import { flattenPath } from './svgPath';
import { matchStroke } from './strokeMatcher';
import { createSession, isComplete, submitStroke, type SessionConfig } from './strokeSession';
import { scoreFreeWrite } from './freeWrite';
import { referenceStrokes } from './refStrokes';
import { allStrokeEntries, hiraganaStrokes, katakanaStrokes, rng, simulateHand } from './testUtils';

// ทดสอบกับข้อมูลจริงทั้งฮิรางานะและคาตาคานะ (142 ตัว)
const allChars = allStrokeEntries;

describe('flattenPath', () => {
  it('handles absolute and relative lines with implicit repeats', () => {
    const pts = flattenPath('M0,0 L10,0 l0,10 5,0 H0 v-5 Z');
    expect(pts.map((p) => [p.x, p.y])).toEqual([
      [0, 0],
      [10, 0],
      [10, 10],
      [15, 10],
      [0, 10],
      [0, 5],
      [0, 0],
    ]);
  });

  it('treats numbers after M as line-to', () => {
    expect(flattenPath('m1,1 2,2').at(-1)).toEqual({ x: 3, y: 3 });
  });

  it('flattens cubic curves through their end points', () => {
    const pts = flattenPath('M0,0c0,10,10,10,10,0', 8);
    expect(pts).toHaveLength(9);
    expect(pts.at(-1)!.x).toBeCloseTo(10);
    expect(pts.at(-1)!.y).toBeCloseTo(0);
    expect(Math.max(...pts.map((p) => p.y))).toBeCloseTo(7.5);
  });

  it('reflects the control point for S', () => {
    const viaS = flattenPath('M0,0C0,10 10,10 10,0S20,-10 20,0', 4);
    const viaC = flattenPath('M0,0C0,10 10,10 10,0C10,-10 20,-10 20,0', 4);
    viaS.forEach((p, i) => {
      expect(p.x).toBeCloseTo(viaC[i]!.x);
      expect(p.y).toBeCloseTo(viaC[i]!.y);
    });
  });

  it('parses compact KanjiVG number syntax', () => {
    const pts = flattenPath('M31.01,33c0.88,0.88,2.75,1.82,5.25,1.75c8.62-0.25,20-2.12,29.5-4.25', 4);
    expect(pts.at(-1)!.x).toBeCloseTo(31.01 + 5.25 + 29.5);
    expect(pts.at(-1)!.y).toBeCloseTo(33 + 1.75 - 4.25);
  });

  it('throws on malformed paths instead of looping', () => {
    expect(() => flattenPath('M0,0Z 5')).toThrow();
    expect(() => flattenPath('10,10')).toThrow();
  });
});

describe('resample', () => {
  it('returns evenly spaced points that keep both end points', () => {
    const line: Point[] = [
      { x: 0, y: 0 },
      { x: 3, y: 0 },
      { x: 10, y: 0 },
    ];
    const r = resample(line, 11);
    expect(r).toHaveLength(11);
    expect(r[0]).toEqual({ x: 0, y: 0 });
    expect(r[10]).toEqual({ x: 10, y: 0 });
    for (let i = 1; i < r.length; i++) expect(dist(r[i - 1]!, r[i]!)).toBeCloseTo(1);
  });

  it('copes with a single point (a tap)', () => {
    expect(resample([{ x: 5, y: 5 }], 4)).toEqual(Array(4).fill({ x: 5, y: 5 }));
  });
});

describe('matchStroke on real hiragana data', () => {
  it('accepts a careful trace (small jitter and offset) for every stroke', () => {
    const random = rng(1);
    for (const [char, data] of allChars) {
      referenceStrokes(data).forEach((ref, i) => {
        const user = simulateHand(ref, random, { jitter: 1.2, wobble: 2.5, dx: 3, dy: -3 });
        const m = matchStroke(user, ref);
        expect(m.ok, `${char} stroke ${i + 1}: ${JSON.stringify(m.comparison)}`).toBe(true);
      });
    }
  });

  it('flags strokes written in the wrong direction', () => {
    const random = rng(2);
    for (const [char, data] of allChars) {
      referenceStrokes(data).forEach((ref, i) => {
        if (polylineLength(ref) < 12) return; // จุดสั้นๆ อย่างเครื่องหมายขุ่น ทิศทางไม่ชัด
        const user = simulateHand([...ref].reverse(), random, { jitter: 1 });
        const m = matchStroke(user, ref);
        expect(m.ok, `${char} stroke ${i + 1}`).toBe(false);
        expect(m.reason, `${char} stroke ${i + 1}`).toBe('direction');
      });
    }
  });

  it('rejects a stroke from a completely different place', () => {
    const [a1, , a3] = referenceStrokes(hiraganaStrokes.chars['あ']!);
    expect(matchStroke(a1!, a3!).ok).toBe(false);
    expect(matchStroke(a3!, a1!).ok).toBe(false);
  });

  it('rejects a tap as too short', () => {
    const ref = referenceStrokes(hiraganaStrokes.chars['し']!)[0]!;
    const m = matchStroke([ref[0]!, { x: ref[0]!.x + 0.5, y: ref[0]!.y }], ref);
    expect(m.reason).toBe('tooShort');
  });
});

describe('stroke session', () => {
  const guided: SessionConfig = { leniency: 1, compensateOffset: false, hintAfter: 3 };
  const unguided: SessionConfig = { leniency: 1.4, compensateOffset: true, hintAfter: 3 };

  it('completes every character when strokes are written in order', () => {
    const random = rng(3);
    for (const [char, data] of allChars) {
      const refs = referenceStrokes(data);
      let s = createSession(refs.length);
      for (const ref of refs) {
        s = submitStroke(s, refs, simulateHand(ref, random, { jitter: 1 }), guided).state;
      }
      expect(isComplete(s), char).toBe(true);
      expect(s.mistakes, char).toBe(0);
    }
  });

  it('tolerates writing the whole character shifted and smaller without a guide', () => {
    const random = rng(4);
    let failures = 0;
    for (const [, data] of allChars) {
      const refs = referenceStrokes(data);
      let s = createSession(refs.length);
      let guard = 0;
      while (!isComplete(s) && guard++ < 20) {
        const user = simulateHand(refs[s.done]!, random, { jitter: 1, dx: 12, dy: 9, scale: 0.85 });
        s = submitStroke(s, refs, user, unguided).state;
      }
      failures += s.mistakes;
    }
    // ยอมให้พลาดได้บ้างในบางตัว แต่ส่วนใหญ่ต้องผ่าน
    expect(failures).toBeLessThan(allChars.length * 0.15);
  });

  it('tells シ from ツ by stroke direction (long stroke up vs down)', () => {
    const shi = referenceStrokes(katakanaStrokes.chars['シ']!);
    const tsu = referenceStrokes(katakanaStrokes.chars['ツ']!);
    // เขียนขีดยาวของ シ (ล่าง→บน) แต่ลากแบบ ツ (บน→ล่าง) = ผิดทิศ
    const m = matchStroke([...shi[2]!].reverse(), shi[2]!);
    expect(m.reason).toBe('direction');
    // ขีดยาวของ ツ ไม่ควรผ่านเป็นขีดยาวของ シ
    expect(matchStroke(tsu[2]!, shi[2]!).ok).toBe(false);
  });

  it('reports the order when a later stroke is written first', () => {
    const refs = referenceStrokes(hiraganaStrokes.chars['け']!);
    const { state, feedback } = submitStroke(createSession(refs.length), refs, refs[1]!, guided);
    expect(state.done).toBe(0);
    expect(feedback).toMatchObject({ kind: 'wrong', reason: 'order', matchedIndex: 1 });
  });

  it('asks for a hint after repeated misses', () => {
    const refs = referenceStrokes(hiraganaStrokes.chars['あ']!);
    const wrong = refs[2]!;
    let s = createSession(refs.length);
    const feedbacks = [1, 2, 3].map(() => {
      const r = submitStroke(s, refs, wrong.map((p) => ({ x: p.x, y: 108 - p.y })), guided);
      s = r.state;
      return r.feedback;
    });
    expect(feedbacks.map((f) => f.kind === 'wrong' && f.showHint)).toEqual([false, false, true]);
    expect(s.hintsUsed).toBe(1);
    expect(s.mistakes).toBe(3);
  });
});

describe('scoreFreeWrite', () => {
  const refs = referenceStrokes(hiraganaStrokes.chars['あ']!);

  it('gives a high score to a good drawing even if small and off-centre', () => {
    const random = rng(5);
    const user = refs.map((r) => simulateHand(r, random, { jitter: 1, scale: 0.5, dx: -20, dy: 15 }));
    const res = scoreFreeWrite(user, refs);
    expect(res.score).toBeGreaterThanOrEqual(85);
    expect(res.stars).toBe(3);
    expect(res.strokes.every((s) => s.status === 'good' || s.status === 'ok')).toBe(true);
  });

  it('penalises missing strokes', () => {
    const res = scoreFreeWrite(refs.slice(0, 2), refs);
    expect(res.strokes[2]!.status).toBe('missing');
    expect(res.score).toBeLessThan(70);
  });

  it('detects wrong stroke order', () => {
    const res = scoreFreeWrite([refs[1]!, refs[0]!, refs[2]!], refs);
    expect(res.strokes[0]!.status).toBe('order');
    expect(res.strokes[1]!.status).toBe('order');
    expect(res.strokes[2]!.status).toMatch(/good|ok/);
  });

  it('detects reversed strokes', () => {
    const res = scoreFreeWrite([refs[0]!, refs[1]!, [...refs[2]!].reverse()], refs);
    expect(res.strokes[2]!.status).toBe('direction');
  });

  it('scores an empty canvas as zero', () => {
    expect(scoreFreeWrite([], refs).score).toBe(0);
  });
});
