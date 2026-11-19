import { vocabPath } from '../app/paths';
import { LineReviewPage } from '../components/line/LineReviewPage';
import { N5_DECK } from '../data/vocab/n5';
import { useSpeech } from '../features/speech/useSpeech';
import { reviewQuestions } from '../features/vocab/vocabLogic';
import { VocabRunner } from '../features/vocab/VocabRunner';

/** ทบทวนคำศัพท์ N5: คำที่ถึงรอบ และคำที่ผิดบ่อย (หน้าตาและตรรกะร่วมกับสายคันจิ — components/line/LineReviewPage) */
export default function VocabReviewPage() {
  const { available: audio } = useSpeech();
  return (
    <LineReviewPage
      deck={N5_DECK}
      lineTone="n5"
      glyph="復"
      title="ทบทวนคำศัพท์ N5"
      noun="คำ"
      unit="คำ"
      lineHref={vocabPath()}
      lineLabel="ไปแผนที่สายคำศัพท์"
      makeQuestions={(words) => reviewQuestions(N5_DECK, words, { audio })}
      renderRunner={({ key, questions, onAnswer, onFinish, onQuit }) => (
        <VocabRunner
          key={key}
          questions={questions}
          mode="test"
          onAnswer={(word, correct) => onAnswer(word.id, correct)}
          onFinish={(results) => onFinish(results.map((r) => ({ id: r.word.id, correct: r.correct })))}
          onQuit={onQuit}
        />
      )}
      itemLabel={(w) => ({ main: w.kana, sub: w.kanji, thai: w.thai })}
    />
  );
}
