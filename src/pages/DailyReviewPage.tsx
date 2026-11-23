import { dailyPath } from '../app/paths';
import { DAILY_DECK } from '../data/daily';
import { PhraseReview } from '../features/phrase/PhraseReview';

/** ทบทวนวลีชีวิตประจำวัน (หน้าทบทวนใช้ร่วมกับสายวลีอื่น — features/phrase/PhraseReview) */
export default function DailyReviewPage() {
  return (
    <PhraseReview
      deck={DAILY_DECK}
      lineTone="daily"
      title="ทบทวนวลีชีวิตประจำวัน"
      lineHref={dailyPath()}
      lineLabel="ไปแผนที่สายชีวิตประจำวัน"
    />
  );
}
