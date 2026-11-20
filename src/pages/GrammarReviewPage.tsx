import { grammarPath } from '../app/paths';
import { LineReviewPage } from '../components/line/LineReviewPage';
import { GRAMMAR_N5 } from '../data/grammar/n5';
import { reviewQuestions } from '../features/grammar/grammarLogic';
import { GrammarRunner } from '../features/grammar/GrammarRunner';

/** ทบทวนไวยากรณ์ N5: รูปที่ถึงรอบ และรูปที่ผิดบ่อย (ข้อเติมคำ/แปลประโยค — ไม่มีข้อเรียง) */
export default function GrammarReviewPage() {
  return (
    <LineReviewPage
      deck={GRAMMAR_N5}
      lineTone="n5"
      glyph="復"
      title="ทบทวนไวยากรณ์ N5"
      noun="ไวยากรณ์"
      unit="รูป"
      lineHref={grammarPath()}
      lineLabel="ไปแผนที่สายไวยากรณ์"
      makeQuestions={(items) => reviewQuestions(GRAMMAR_N5, items)}
      renderRunner={({ key, questions, onAnswer, onFinish, onQuit }) => (
        <GrammarRunner
          key={key}
          questions={questions}
          mode="test"
          onAnswer={(point, correct) => onAnswer(point.id, correct)}
          onFinish={(results) => onFinish(results.map((r) => ({ id: r.point.id, correct: r.correct })))}
          onQuit={onQuit}
        />
      )}
      itemLabel={(p) => ({ main: p.pattern, thai: p.title })}
    />
  );
}
