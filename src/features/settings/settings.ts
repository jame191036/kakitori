import { createPersistentStore, isRecord, useStore } from '../../lib/persistentStore';
import { DEFAULT_GOAL, sanitizeGoal } from '../progress/activity';

export type ThemePref = 'system' | 'light' | 'dark';
export type Strictness = 'easy' | 'normal' | 'strict';
export type QuestionType =
  | 'charToReading'
  | 'readingToChar'
  | 'audioToChar'
  | 'readingToWrite'
  /** ดูตัวในชุดคู่ (เช่น あ) → เลือกตัวในชุดนี้ (ア) */
  | 'pairToChar';

export const QUESTION_TYPES: readonly QuestionType[] = [
  'charToReading',
  'readingToChar',
  'audioToChar',
  'readingToWrite',
  'pairToChar',
];

export interface QuizPrefs {
  /** กลุ่มที่เลือกไว้ล่าสุด (null = ยังไม่เคยเลือก ใช้ค่าเริ่มต้น) */
  groups: string[] | null;
  types: QuestionType[];
  count: number;
}

export interface Settings {
  theme: ThemePref;
  /** ความเข้มงวดในการตรวจลายมือ */
  strictness: Strictness;
  /** ความเร็วแอนิเมชันลำดับขีด */
  animationSpeed: number;
  /** แสดงตัวเลขลำดับขีดบนเส้นนำ */
  showStrokeNumbers: boolean;
  /** ตั้งค่าแบบทดสอบแยกตามชุดตัวอักษร */
  quiz: Record<string, QuizPrefs>;
  /** เคยเปิดหน้า "เริ่มต้นที่นี่" หรือปิดแถบแนะนำแล้ว */
  introSeen: boolean;
  /** เป้ารายวัน (จำนวนครั้งที่ตอบ/เขียน) — ถึงเป้าแล้วนับเป็นวันที่ฝึกต่อเนื่อง */
  dailyGoal: number;
}

export const SETTINGS_KEY = 'jp-learn:settings:v1';

export const STRICTNESS_LENIENCY: Record<Strictness, number> = {
  easy: 1.3,
  normal: 1,
  strict: 0.75,
};

export const STRICTNESS_ORDER: readonly Strictness[] = ['easy', 'normal', 'strict'];

export const STRICTNESS_LABEL: Record<Strictness, string> = {
  easy: 'ง่าย',
  normal: 'ปกติ',
  strict: 'เข้ม',
};

export const ANIMATION_SPEEDS = [0.5, 1, 1.5, 2] as const;

export const DEFAULT_QUIZ_PREFS: QuizPrefs = {
  groups: null,
  types: ['charToReading', 'readingToChar'],
  count: 10,
};

const defaults: Settings = {
  theme: 'system',
  strictness: 'normal',
  animationSpeed: 1,
  showStrokeNumbers: true,
  quiz: {},
  introSeen: false,
  dailyGoal: DEFAULT_GOAL,
};

function sanitizeQuizPrefs(raw: unknown): QuizPrefs {
  if (!isRecord(raw)) return DEFAULT_QUIZ_PREFS;
  const groups = Array.isArray(raw.groups)
    ? raw.groups.filter((g): g is string => typeof g === 'string')
    : null;
  const types = Array.isArray(raw.types)
    ? raw.types.filter((t): t is QuestionType => QUESTION_TYPES.includes(t as QuestionType))
    : [];
  const count = typeof raw.count === 'number' && raw.count > 0 ? Math.round(raw.count) : 10;
  return { groups, types: types.length ? types : DEFAULT_QUIZ_PREFS.types, count };
}

function sanitize(raw: unknown): Settings {
  if (!isRecord(raw)) return defaults;
  const quiz: Record<string, QuizPrefs> = {};
  if (isRecord(raw.quiz)) {
    for (const [k, v] of Object.entries(raw.quiz)) quiz[k] = sanitizeQuizPrefs(v);
  }
  return {
    theme: raw.theme === 'light' || raw.theme === 'dark' ? raw.theme : 'system',
    strictness:
      raw.strictness === 'easy' || raw.strictness === 'strict' ? raw.strictness : 'normal',
    animationSpeed: ANIMATION_SPEEDS.includes(raw.animationSpeed as never)
      ? (raw.animationSpeed as number)
      : 1,
    showStrokeNumbers: raw.showStrokeNumbers !== false,
    quiz,
    introSeen: raw.introSeen === true,
    dailyGoal: sanitizeGoal(raw.dailyGoal),
  };
}

export const settingsStore = createPersistentStore<Settings>(SETTINGS_KEY, defaults, sanitize);

export const useSettings = (): Settings => useStore(settingsStore);

export function updateSettings(patch: Partial<Settings>): void {
  settingsStore.set((prev) => ({ ...prev, ...patch }));
}

export function getQuizPrefs(settings: Settings, scriptId: string): QuizPrefs {
  return settings.quiz[scriptId] ?? DEFAULT_QUIZ_PREFS;
}

export function updateQuizPrefs(scriptId: string, prefs: QuizPrefs): void {
  settingsStore.set((prev) => ({ ...prev, quiz: { ...prev.quiz, [scriptId]: prefs } }));
}
