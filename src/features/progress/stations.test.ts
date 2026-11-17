import { describe, expect, it } from 'vitest';
import { getScript, scriptList } from '../../data/scripts';
import { buildPath, nextStep } from './learningPath';
import { applyAnswer, applyPractice, type ProgressData } from './progressLogic';
import { nextStationOf, packStations, stationName, stationReading, stationStates } from './stations';

const hira = getScript('hiragana')!;
const kata = getScript('katakana')!;

function doneRows(stations: ReturnType<typeof packStations>): ProgressData['scripts'][string] {
  const out: Record<string, ReturnType<typeof applyPractice>> = {};
  for (const st of stations) for (const c of st.chars) out[c.id] = applyAnswer(applyPractice(undefined, 1), true, 2);
  return out;
}

describe('stations (train view of the learning path)', () => {
  it('numbers each script as one line: level 1 rows then level 2 rows', () => {
    const h = packStations(hira);
    expect(h).toHaveLength(28);
    expect(h.map((s) => s.code).slice(0, 3)).toEqual(['H01', 'H02', 'H03']);
    expect(h[2]!.group.head).toBe('さ');
    expect(h[15]!.group.head).toBe('ぱ');
    expect(h[16]!.level).toBe(2);
    expect(h[16]!.code).toBe('H17');
    expect(packStations(kata)[0]!.code).toBe('K01');
  });

  it('labels the small-kana row by its first char', () => {
    const small = packStations(hira).find((s) => s.group.kind === 'small')!;
    expect(stationName(small.group)).toBe('ゃ');
    expect(stationReading(small.group)).toBe('ตัวเล็ก');
    expect(stationReading(packStations(hira)[1]!.group)).toBe('ka');
  });

  it('marks passed rows done and the next step of the path as current', () => {
    const h = packStations(hira);
    const data: ProgressData = { version: 1, scripts: { hiragana: doneRows(h.slice(0, 2)) } };
    const next = nextStep(buildPath(scriptList), data);
    const states = stationStates(h, data, next);
    expect(states.slice(0, 4)).toEqual(['done', 'done', 'current', 'todo']);
    expect(nextStationOf(h, data)?.code).toBe('H03');
    // คาตาคานะยังไม่เริ่ม: ไม่มีสถานีปัจจุบันในสายนี้ (ขั้นถัดไปอยู่สายฮิรางานะ)
    expect(stationStates(packStations(kata), data, next).every((s) => s === 'todo')).toBe(true);
    expect(nextStationOf(packStations(kata), data)?.code).toBe('K01');
  });
});
