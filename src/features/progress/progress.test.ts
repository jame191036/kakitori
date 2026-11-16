import { describe, expect, it } from 'vitest';
import { hiragana } from '../../data/scripts/hiragana';
import { dayKey, dayNumber } from '../../lib/day';
import { addActivity, EMPTY_ACTIVITY, mergeActivity, sanitizeActivity, streakInfo } from './activity';
import { makeBackup, parseBackup } from './backup';
import {
  applyAnswer,
  dueChars,
  EMPTY_PROGRESS,
  MAX_BOX,
  masteryLevel,
  mergeProgress,
  nextReview,
  sanitizeStat,
  weakChars,
  type CharStat,
  type ProgressData,
} from './progressLogic';

/** เที่ยงวัน (เวลาท้องถิ่น) ของวันที่ 13 พ.ย. 2026 + n วัน — ใช้เทียบวันได้ทุก time zone */
const DAY0 = new Date(2026, 10, 13, 12).getTime();
const day = (n: number, hour = 12) => new Date(2026, 10, 13 + n, hour).getTime();

describe('day helpers', () => {
  it('numbers consecutive local days one apart, ignoring the hour', () => {
    expect(dayNumber(day(1, 0)) - dayNumber(day(0, 23))).toBe(1);
    expect(dayNumber(day(0, 1))).toBe(dayNumber(day(0, 23)));
    expect(dayKey(DAY0)).toBe('2026-11-13');
  });
});

describe('progress logic', () => {
  it('moves up at most one box per day and back to zero when wrong', () => {
    let s: CharStat | undefined;
    for (let i = 0; i < 7; i++) s = applyAnswer(s, true, day(0, 8 + i));
    expect(s!.box).toBe(1); // ตอบถูกหลายครั้งในวันเดียว = ขึ้นได้กล่องเดียว
    expect(s!.correct).toBe(7);

    for (let d = 1; d <= MAX_BOX + 1; d++) s = applyAnswer(s, true, day(d));
    expect(s!.box).toBe(MAX_BOX);
    expect(masteryLevel(s)).toBe(3);

    s = applyAnswer(s, false, day(9));
    expect(s).toMatchObject({ box: 0, wrong: 1, lastWrong: day(9), answeredAt: day(9) });
    expect(masteryLevel(s)).toBe(1);
  });

  it('lets a character climb back to box 1 on the same day after a mistake', () => {
    let s = applyAnswer(undefined, true, day(0, 9));
    s = applyAnswer(s, false, day(0, 10));
    s = applyAnswer(s, true, day(0, 11));
    expect(s.box).toBe(1);
    s = applyAnswer(s, true, day(0, 12));
    expect(s.box).toBe(1);
  });

  it('lists characters that were wrong and are still weak, worst first', () => {
    const a = applyAnswer(applyAnswer(undefined, false, day(0)), false, day(0, 13));
    const ka = applyAnswer(undefined, false, day(0, 14));
    let sa = ka;
    for (let d = 1; d <= 4; d++) sa = applyAnswer(sa, true, day(d));
    const weak = weakChars(hiragana, { a, ka, sa });
    expect(weak.map((w) => w.entry.char)).toEqual(['あ', 'か']);
  });

  it('schedules reviews further apart as the box rises', () => {
    const wrong = applyAnswer(undefined, false, day(0)); // กล่อง 0 → ทบทวนได้ทันที
    const box1 = applyAnswer(undefined, true, day(0)); // กล่อง 1 → พรุ่งนี้
    let box3 = box1;
    for (let d = 1; d <= 2; d++) box3 = applyAnswer(box3, true, day(d)); // กล่อง 3 ตอบวันที่ 2 → +4 วัน
    const progress = { a: wrong, i: box1, u: box3, e: { ...box1, answeredAt: null } };

    expect(dueChars(hiragana, progress, day(0)).map((d) => d.entry.char)).toEqual(['あ']);
    expect(dueChars(hiragana, progress, day(1)).map((d) => d.entry.char)).toEqual(['あ', 'い']);
    expect(dueChars(hiragana, progress, day(6)).map((d) => d.entry.char)).toEqual(['あ', 'い', 'う']);
    expect(dueChars(hiragana, progress, day(3)).find((d) => d.entry.char === 'い')?.overdue).toBe(2);

    expect(nextReview(hiragana, progress, day(0))).toEqual({ inDays: 1, count: 1 });
    expect(nextReview(hiragana, progress, day(2))).toEqual({ inDays: 4, count: 1 });
    expect(nextReview(hiragana, progress, day(6))).toBeNull();
  });

  it('upgrades stored stats from the previous version', () => {
    const old = sanitizeStat({ box: 5, correct: 5, wrong: 0, practiced: 2, bestScore: null, lastSeen: DAY0, lastWrong: null });
    expect(old).toMatchObject({ box: 5, answeredAt: DAY0, promotedAt: null });
    const practicedOnly = sanitizeStat({ box: 0, correct: 0, wrong: 0, practiced: 1, lastSeen: DAY0 });
    expect(practicedOnly.answeredAt).toBeNull();
  });
});

describe('daily activity & streak', () => {
  const run = (counts: Record<number, number>, goal: number) => {
    let data = EMPTY_ACTIVITY;
    for (const [d, n] of Object.entries(counts)) {
      for (let i = 0; i < n; i++) data = addActivity(data, day(Number(d)), goal).data;
    }
    return data;
  };

  it('reports reaching the goal exactly once per day', () => {
    let data = EMPTY_ACTIVITY;
    const reached: boolean[] = [];
    for (let i = 0; i < 12; i++) {
      const r = addActivity(data, DAY0, 10);
      data = r.data;
      reached.push(r.reachedGoal);
    }
    expect(reached.filter(Boolean)).toHaveLength(1);
    expect(reached[9]).toBe(true);
  });

  it('counts consecutive days that met the goal', () => {
    const data = run({ 0: 10, 1: 12, 2: 3, 3: 10, 4: 10, 5: 10 }, 10);
    expect(streakInfo(data, day(5), 10)).toMatchObject({ current: 3, best: 3, todayCount: 10, todayMet: true });
    // วันนี้ยังไม่ถึงเป้า → streak ยังไม่ขาด (นับถึงเมื่อวาน)
    const today = addActivity(data, day(6), 10).data;
    expect(streakInfo(today, day(6), 10)).toMatchObject({ current: 3, todayCount: 1, todayMet: false });
    // ข้ามไปหนึ่งวันเต็ม → เริ่มนับใหม่
    expect(streakInfo(data, day(7), 10).current).toBe(0);
    expect(streakInfo(EMPTY_ACTIVITY, DAY0, 10)).toMatchObject({ current: 0, best: 0, hasAny: false });
  });

  it('keeps past days met even if the goal is raised later', () => {
    const data = run({ 0: 5, 1: 5 }, 5);
    expect(streakInfo(data, day(1), 30).current).toBe(2);
    // ลดเป้าวันนี้ลงจนถึงแล้ว → นับวันนี้ทันที
    const partial = run({ 0: 6 }, 10);
    expect(streakInfo(partial, day(0), 5).todayMet).toBe(true);
  });
});

describe('backup file', () => {
  const stat = (lastSeen: number, box: number): CharStat => ({
    ...sanitizeStat({}),
    box,
    correct: 1,
    lastSeen,
    answeredAt: lastSeen,
  });

  it('round-trips through JSON and rejects other files', () => {
    const progress: ProgressData = { version: 1, scripts: { hiragana: { a: stat(DAY0, 2) } } };
    const activity = run1();
    const text = JSON.stringify(makeBackup(progress, activity, DAY0));
    expect(parseBackup(text)).toEqual({ progress, activity });
    expect(parseBackup('not json')).toBeNull();
    expect(parseBackup(JSON.stringify({ app: 'other', kind: 'backup', version: 1 }))).toBeNull();
    expect(parseBackup(JSON.stringify({ ...makeBackup(progress, activity, DAY0), version: 99 }))).toBeNull();
  });

  function run1() {
    return addActivity(EMPTY_ACTIVITY, DAY0, 10).data;
  }

  it('merges by keeping the most recently practiced stat for each character', () => {
    const local: ProgressData = {
      version: 1,
      scripts: { hiragana: { a: stat(day(2), 3), i: stat(day(0), 1) } },
    };
    const incoming: ProgressData = {
      version: 1,
      scripts: { hiragana: { a: stat(day(1), 5), i: stat(day(3), 2) }, katakana: { a: stat(day(1), 1) } },
    };
    const { data, changed } = mergeProgress(local, incoming);
    expect(changed).toBe(2);
    expect(data.scripts.hiragana!.a!.box).toBe(3); // ในเครื่องใหม่กว่า
    expect(data.scripts.hiragana!.i!.box).toBe(2); // จากไฟล์ใหม่กว่า
    expect(data.scripts.katakana!.a!.box).toBe(1);
    // นำเข้าซ้ำ → ไม่มีอะไรเปลี่ยน
    expect(mergeProgress(data, incoming).changed).toBe(0);
    expect(mergeProgress(EMPTY_PROGRESS, EMPTY_PROGRESS).changed).toBe(0);
  });

  it('merges daily activity without double counting', () => {
    const a = sanitizeActivity({ version: 1, days: { '2026-11-13': { count: 4, goalMet: false } } });
    const b = sanitizeActivity({
      version: 1,
      days: { '2026-11-13': { count: 10, goalMet: true }, '2026-11-12': { count: 2, goalMet: false }, bad: {} },
    });
    const once = mergeActivity(a, b);
    expect(once.changed).toBe(2);
    expect(once.data.days['2026-11-13']).toEqual({ count: 10, goalMet: true });
    expect(Object.keys(once.data.days)).toHaveLength(2);
    expect(mergeActivity(once.data, b).changed).toBe(0);
  });
});
