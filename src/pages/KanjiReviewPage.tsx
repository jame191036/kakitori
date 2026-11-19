import { kanjiPath } from '../app/paths';
import { LineReviewPage } from '../components/line/LineReviewPage';
import { KANJI_N5 } from '../data/kanji/n5';
import type { KanjiEntry } from '../data/kanji/types';
import { N5_DECK } from '../data/vocab/n5';
import { reviewQuestions } from '../features/kanji/kanjiLogic';
import { KanjiRunner } from '../features/kanji/KanjiRunner';

/** คำอ่านแรกของคันจิ (ใช้แสดงในรายการตัวที่ผิด) เช่น 'ひ・び' → 'ひ' */
const firstReading = (k: KanjiEntry) => k.readings[0]?.kana.split('・')[0];

/** ทบทวนคันจิ N5: ตัวที่ถึงรอบ และตัวที่ผิดบ่อย (ข้อจำตัว/ความหมาย/อ่านคำ — ไม่มีข้อเขียน) */
export default function KanjiReviewPage() {
  return (
    <LineReviewPage
      deck={KANJI_N5}
      lineTone="n5"
      glyph="復"
      title="ทบทวนคันจิ N5"
      noun="คันจิ"
      unit="ตัว"
      lineHref={kanjiPath()}
      lineLabel="ไปแผนที่สายคันจิ"
      makeQuestions={(items) => reviewQuestions(KANJI_N5, items, N5_DECK)}
      renderRunner={({ key, questions, onAnswer, onFinish, onQuit }) => (
        <KanjiRunner
          key={key}
          questions={questions}
          mode="test"
          onAnswer={(kanji, correct) => onAnswer(kanji.id, correct)}
          onFinish={(results) => onFinish(results.map((r) => ({ id: r.kanji.id, correct: r.correct })))}
          onQuit={onQuit}
        />
      )}
      itemLabel={(k) => ({ main: k.char, sub: firstReading(k), thai: k.thai })}
    />
  );
}
