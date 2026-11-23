import { travelPath } from '../app/paths';
import { TRAVEL_DECK } from '../data/travel';
import { PhraseReview } from '../features/phrase/PhraseReview';

/** ทบทวนวลีท่องเที่ยว (หน้าทบทวนใช้ร่วมกับสายวลีอื่น — features/phrase/PhraseReview) */
export default function TravelReviewPage() {
  return (
    <PhraseReview
      deck={TRAVEL_DECK}
      lineTone="travel"
      title="ทบทวนวลีท่องเที่ยว"
      lineHref={travelPath()}
      lineLabel="ไปแผนที่สายท่องเที่ยว"
    />
  );
}
