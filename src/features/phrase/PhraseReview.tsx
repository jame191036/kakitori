import { LineReviewPage } from '../../components/line/LineReviewPage';
import { faceText } from '../../data/phrase/build';
import type { PhraseDeck } from '../../data/phrase/types';
import type { Tone } from '../../lib/tone';
import { useSpeech } from '../speech/useSpeech';
import { reviewQuestions } from './phraseLogic';
import { PhraseRunner } from './PhraseRunner';

interface PhraseReviewProps {
  deck: PhraseDeck;
  lineTone: Tone;
  title: string;
  lineHref: string;
  lineLabel: string;
}

/** ทบทวนสายวลี: วลีที่ถึงรอบ และวลีที่ผิดบ่อย (เลือกวลีที่ควรพูด / ฟังหรืออ่านแล้วเลือกความหมาย) */
export function PhraseReview({ deck, lineTone, title, lineHref, lineLabel }: PhraseReviewProps) {
  const { available: audio } = useSpeech();
  return (
    <LineReviewPage
      deck={deck}
      lineTone={lineTone}
      glyph="復"
      title={title}
      noun="วลี"
      unit="วลี"
      lineHref={lineHref}
      lineLabel={lineLabel}
      makeQuestions={(items) => reviewQuestions(deck, items, { audio })}
      renderRunner={({ key, questions, onAnswer, onFinish, onQuit }) => (
        <PhraseRunner
          key={key}
          deck={deck}
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
