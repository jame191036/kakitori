import { animePath } from '../app/paths';
import { ANIME_DECK } from '../data/anime';
import { PhraseReview } from '../features/phrase/PhraseReview';

/** ทบทวนวลีการ์ตูน (หน้าทบทวนใช้ร่วมกับสายวลีอื่น — features/phrase/PhraseReview) */
export default function AnimeReviewPage() {
  return (
    <PhraseReview
      deck={ANIME_DECK}
      lineTone="anime"
      title="ทบทวนวลีการ์ตูน"
      lineHref={animePath()}
      lineLabel="ไปแผนที่สายการ์ตูน"
    />
  );
}
