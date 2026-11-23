import { travelPath } from '../app/paths';
import { LineReviewPage } from '../components/line/LineReviewPage';
import { TRAVEL_DECK } from '../data/travel';
import { faceText } from '../data/travel/build';
import { useSpeech } from '../features/speech/useSpeech';
import { reviewQuestions } from '../features/travel/travelLogic';
import { TravelRunner } from '../features/travel/TravelRunner';

/** ทบทวนวลีท่องเที่ยว: วลีที่ถึงรอบ และวลีที่ผิดบ่อย (เลือกวลีที่ควรพูด / ฟังแล้วเลือกความหมาย) */
export default function TravelReviewPage() {
  const { available: audio } = useSpeech();
  return (
    <LineReviewPage
      deck={TRAVEL_DECK}
      lineTone="travel"
      glyph="復"
      title="ทบทวนวลีท่องเที่ยว"
      noun="วลี"
      unit="วลี"
      lineHref={travelPath()}
      lineLabel="ไปแผนที่สายท่องเที่ยว"
      makeQuestions={(items) => reviewQuestions(TRAVEL_DECK, items, { audio })}
      renderRunner={({ key, questions, onAnswer, onFinish, onQuit }) => (
        <TravelRunner
          key={key}
          deck={TRAVEL_DECK}
          questions={questions}
          mode="test"
          onAnswer={(phrase, correct) => onAnswer(phrase.id, correct)}
          onFinish={(results) => onFinish(results.map((r) => ({ id: r.phrase.id, correct: r.correct })))}
          onQuit={onQuit}
        />
      )}
      itemLabel={(x) => ({ main: faceText(x), thai: x.thai })}
    />
  );
}
