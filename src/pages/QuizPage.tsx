import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useScriptPack } from '../app/ScriptContext';
import { charsInGroups, findChar } from '../data/scripts';
import type { CharEntry, ScriptPack } from '../data/types';
import { quizWeight } from '../features/progress/progressLogic';
import { progressStore } from '../features/progress/progressStore';
import { buildQuiz, type QuizQuestion } from '../features/quiz/quizLogic';
import { QuizResult } from '../features/quiz/QuizResult';
import { QuizRunner, type AnswerRecord } from '../features/quiz/QuizRunner';
import { QuizSetup } from '../features/quiz/QuizSetup';
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

function makeQuestions(pack: ScriptPack, config: RunConfig): QuizQuestion[] {
  const progress = progressStore.get().scripts[pack.id];
  return buildQuiz({
    pool: config.pool,
    all: pack.chars,
    types: config.types,
    count: config.count > 0 ? config.count : config.pool.length,
    weightOf: (c) => quizWeight(progress?.[c.id]),
  });
}

/** ทบทวนเฉพาะตัวที่กำหนด: รอบละไม่เกิน 10 ข้อ ให้แต่ละตัวออกอย่างน้อย 1 ครั้ง */
function reviewConfig(pool: CharEntry[], types: QuestionType[]): RunConfig {
  return {
    pool,
    types,
    count: Math.min(Math.max(10, pool.length), pool.length * 2),
    title: `ทบทวน ${pool.length} ตัว`,
  };
}

function QuizFlow({ initialChars }: { initialChars: CharEntry[] }) {
  const pack = useScriptPack();
  const navigate = useNavigate();

  const [phase, setPhase] = useState<Phase>(() => {
    if (initialChars.length === 0) return { kind: 'setup' };
    // ใช้รูปแบบคำถามที่ผู้ใช้ตั้งไว้ล่าสุด (ตัดแบบฟังเสียงออกถ้าเครื่องไม่มีเสียงญี่ปุ่น)
    const saved = getQuizPrefs(settingsStore.get(), pack.id).types.filter(
      (t) => t !== 'audioToChar' || isSpeechAvailable(),
    );
    const config = reviewConfig(initialChars, saved.length ? saved : DEFAULT_QUIZ_PREFS.types);
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
    // ล้าง ?chars= ออกจาก URL เมื่อกลับไปหน้าตั้งค่า
    navigate(`/${pack.id}/quiz`, { replace: true });
    setPhase({ kind: 'setup' });
  };

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
          onStart={({ groups, types, count }) =>
            start({
              pool: charsInGroups(pack, groups),
              types,
              count,
              title: `${charsInGroups(pack, groups).length} ตัวที่เลือก · ${count || 'ทุกตัว'}${count ? ' ข้อ' : ''}`,
            })
          }
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
          onReviewWrong={(chars) => start(reviewConfig(chars, phase.config.types))}
        />
      )}
    </div>
  );
}

export default function QuizPage() {
  const pack = useScriptPack();
  const [params] = useSearchParams();
  const charsParam = params.get('chars') ?? '';
  const initialChars = charsParam
    .split(',')
    .map((id) => findChar(pack, id))
    .filter((c): c is CharEntry => !!c);
  // key: เมื่อลิงก์ทบทวนเปลี่ยน ให้เริ่มใหม่ทั้งหมด
  return <QuizFlow key={charsParam} initialChars={initialChars} />;
}
