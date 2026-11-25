import { conjPath } from '../app/paths';
import { LineReviewPage } from '../components/line/LineReviewPage';
import { CONJ_N5 } from '../data/conj/n5';
import { reviewQuestions } from '../features/conj/conjLogic';
import { ConjRunner } from '../features/conj/ConjRunner';

/** ทบทวนผันคำ N5: กฎที่ถึงรอบ และกฎที่ผิดบ่อย (กฎละ 1 ข้อ สุ่มคำใหม่) */
export default function ConjReviewPage() {
  return (
    <LineReviewPage
      deck={CONJ_N5}
      lineTone="n5"
      glyph="復"
      title="ทบทวนผันคำ N5"
      noun="กฎการผัน"
      unit="กฎ"
      lineHref={conjPath()}
      lineLabel="ไปแผนที่สายผันคำ"
      makeQuestions={(items) => reviewQuestions(items)}
      renderRunner={({ key, questions, onAnswer, onFinish, onQuit }) => (
        <ConjRunner
          key={key}
          questions={questions}
          mode="test"
          onRule={(rule, correct) => onAnswer(rule.id, correct)}
          onFinish={(results) => onFinish(results.map((r) => ({ id: r.rule.id, correct: r.correct })))}
          onQuit={onQuit}
        />
      )}
      itemLabel={(r) => ({ main: r.pattern, thai: r.title })}
    />
  );
}
