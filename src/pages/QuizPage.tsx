import { useState } from 'react';
import { scriptPath } from '../app/paths';
import { useNavigate, useSearchParams } from 'react-router';
import { useScriptPack } from '../app/ScriptContext';
import { ContinueCard } from '../components/ContinueCard';
import { charsInGroups, findChar, isCompound, isQuizzable, quizzableChars, scriptList } from '../data/scripts';
import type { CharEntry, ScriptPack } from '../data/types';
import { quizWeight } from '../features/progress/progressLogic';
import { progressStore } from '../features/progress/progressStore';
import { buildQuiz, type QuizQuestion } from '../features/quiz/quizLogic';
import { QuizResult } from '../features/quiz/QuizResult';
import { QuizRunner, type AnswerRecord } from '../features/quiz/QuizRunner';
import { QuizSetup } from '../features/quiz/QuizSetup';
import { isTypeAvailable } from '../features/quiz/quizText';
import {
  DEFAULT_QUIZ_PREFS,
  getQuizPrefs,
  settingsStore,
  type QuestionType,
} from '../features/settings/settings';
import { isSpeechAvailable } from '../features/speech/useSpeech';

interface RunConfig {
  pool: CharEntry[];
  types: QuestionType[];
  count: number;
  title: string;
}

type Phase =
  | { kind: 'setup' }
  | { kind: 'run'; config: RunConfig; questions: QuizQuestion[]; runId: number }
  | { kind: 'result'; config: RunConfig; records: AnswerRecord[] };

/** ตัวที่ออกข้อสอบได้ (ตัดตัวเล็ก/ー ที่ไม่มีเสียงของตัวเองออก) */
const quizPool = (pack: ScriptPack, chars: readonly CharEntry[]) => chars.filter((c) => isQuizzable(pack, c));

function makeQuestions(pack: ScriptPack, config: RunConfig): QuizQuestion[] {
  const progress = progressStore.get().scripts[pack.id];
  return buildQuiz({
    pool: config.pool,
    all: quizzableChars(pack),
    types: config.types,
    count: config.count > 0 ? config.count : config.pool.length,
    weightOf: (c) => quizWeight(progress?.[c.id]),
  });
}

/** สอบเฉพาะตัวที่กำหนด: ให้แต่ละตัวออกอย่างน้อย 1 ครั้ง (ตัวน้อยออกตัวละ 2 ครั้ง) */
function focusedConfig(pool: CharEntry[], types: QuestionType[], title: string): RunConfig {
  return {
    pool,
    types,
    count: Math.min(Math.max(10, pool.length), pool.length * 2),
    title,
  };
}

interface QuickStart {
  chars: CharEntry[];
  title: string;
}

function QuizFlow({ quickStart }: { quickStart: QuickStart | null }) {
  const pack = useScriptPack();
  const navigate = useNavigate();

  const [phase, setPhase] = useState<Phase>(() => {
    if (!quickStart) return { kind: 'setup' };
    // ใช้รูปแบบคำถามที่ผู้ใช้ตั้งไว้ล่าสุด (ตัดแบบที่ใช้ไม่ได้ออก เช่น ฟังเสียงในเครื่องที่ไม่มีเสียงญี่ปุ่น)
    const saved = getQuizPrefs(settingsStore.get(), pack.id).types.filter((t) =>
      isTypeAvailable(t, pack, isSpeechAvailable()),
    );
    // ตัวควบออกข้อแบบเขียนไม่ได้ — ถ้าตั้งไว้แค่แบบเขียนแต่ทดสอบแถวตัวควบ ใช้รูปแบบเริ่มต้นแทน
    const writeOnly = saved.length > 0 && saved.every((t) => t === 'readingToWrite');
    const types =
      !saved.length || (writeOnly && quickStart.chars.every(isCompound)) ? DEFAULT_QUIZ_PREFS.types : saved;
    const config = focusedConfig(quickStart.chars, types, quickStart.title);
    return { kind: 'run', config, questions: makeQuestions(pack, config), runId: 0 };
  });

  const start = (config: RunConfig) =>
    setPhase((p) => ({
      kind: 'run',
      config,
      questions: makeQuestions(pack, config),
      runId: (p.kind === 'run' ? p.runId : 0) + 1,
    }));

  const backToSetup = () => {
    // ล้าง ?chars= / ?groups= ออกจาก URL เมื่อกลับไปหน้าตั้งค่า
    navigate(scriptPath(pack.id, `quiz`), { replace: true });
    setPhase({ kind: 'setup' });
  };

  // ทดสอบแถวจากปุ่ม "เรียนต่อ" เสร็จแล้ว → ให้ปุ่มกลับไปเรียนต่อในหน้าผลสอบ
  const fromPath = !!quickStart && phase.kind === 'result';

  return (
    <div className="container page">
      <header className="stack" style={{ gap: 4 }}>
        <h1 className="page-title">แบบทดสอบ{pack.name}</h1>
        <p className="muted">
          {phase.kind === 'setup'
            ? 'เลือกแถว รูปแบบคำถาม และจำนวนข้อ แล้วเริ่มได้เลย'
            : phase.config.title}
        </p>
      </header>

      {phase.kind === 'setup' && (
        <QuizSetup
          pack={pack}
          onStart={({ groups, types, count }) => {
            const pool = quizPool(pack, charsInGroups(pack, groups));
            start({
              pool,
              types,
              count,
              title: `${pool.length} ตัวที่เลือก · ${count || 'ทุกตัว'}${count ? ' ข้อ' : ''}`,
            });
          }}
        />
      )}

      {phase.kind === 'run' && (
        <QuizRunner
          key={phase.runId}
          pack={pack}
          questions={phase.questions}
          onQuit={backToSetup}
          onFinish={(records) => setPhase({ kind: 'result', config: phase.config, records })}
        />
      )}

      {phase.kind === 'result' && (
        <QuizResult
          pack={pack}
          records={phase.records}
          onRetry={() => start(phase.config)}
          onSetup={backToSetup}
          onReviewWrong={(chars) =>
            start(focusedConfig(chars, phase.config.types, `สอบซ้ำตัวที่ผิด ${chars.length} ตัว`))
          }
        />
      )}

      {fromPath && (
        <div style={{ maxWidth: 640, width: '100%', marginInline: 'auto' }}>
          <ContinueCard packs={scriptList} />
        </div>
      )}
    </div>
  );
}

/**
 * เริ่มสอบทันทีจากลิงก์:
 * - ?chars=a,ka  → ทบทวนตัวที่กำหนด (จากหน้าทบทวน)
 * - ?groups=ka   → ทดสอบเฉพาะแถว (จากปุ่ม "เรียนต่อ")
 */
function quickStartFrom(pack: ScriptPack, params: URLSearchParams): QuickStart | null {
  const groupIds = (params.get('groups') ?? '').split(',').filter(Boolean);
  const groups = pack.groups.filter((g) => groupIds.includes(g.id));
  const groupChars = quizPool(pack, charsInGroups(pack, groups.map((g) => g.id)));
  if (groupChars.length) {
    return {
      chars: groupChars,
      title: `ทดสอบแถว ${groups.map((g) => g.head).join(' ')} — ตอบถูกครบทุกตัวเพื่อผ่านแถวนี้`,
    };
  }
  const chars = quizPool(
    pack,
    (params.get('chars') ?? '')
      .split(',')
      .map((id) => findChar(pack, id))
      .filter((c): c is CharEntry => !!c),
  );
  return chars.length ? { chars, title: `ทบทวน ${chars.length} ตัว` } : null;
}

export default function QuizPage() {
  const pack = useScriptPack();
  const [params] = useSearchParams();
  // key: เมื่อลิงก์เปลี่ยน (เช่นจากปุ่มเรียนต่อ) ให้เริ่มใหม่ทั้งหมด
  const key = `${params.get('chars') ?? ''}|${params.get('groups') ?? ''}`;
  return <QuizFlow key={key} quickStart={quickStartFrom(pack, params)} />;
}
